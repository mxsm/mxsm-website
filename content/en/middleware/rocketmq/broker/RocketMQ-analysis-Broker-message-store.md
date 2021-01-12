---
title: RocketMQ源码解析-Broker消息存储设计与实现
categories:
  - MQ
  - RocketMQ
  - Broker
tags:
  - MQ
  - RocketMQ
  - Broker源码解析
  - 消息存储机制
  - Broker消息存储设计与实现
abbrlink: ed7631aa
date: 2020-03-18 23:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### 1 消息存储图解

![](https://github.com/apache/rocketmq/raw/master/docs/cn/image/rocketmq_design_1.png)

消息存储是RocketMQ中最为复杂和最为重要的一部分，本节将分别从RocketMQ的消息存储整体架构、PageCache与Mmap内存映射以及RocketMQ中两种不同的刷盘方式三方面来分别展开叙述。

- **消息存储整体架构**
- **页缓存与内存映射**
- **消息刷盘**

### 2 消息存储整体架构

跟消息存储的主要有三个相关的文件组成：

- **CommitLog**

  消息主体以及元数据的存储主体，存储Producer端写入的消息主体内容,消息内容不是定长的。单个文件大小默认1G ，文件名长度为20位，左边补零，剩余为起始偏移量，比如00000000000000000000代表了第一个文件，起始偏移量为0，文件大小为1G=1073741824；当第一个文件写满了，第二个文件为00000000001073741824，起始偏移量为1073741824，以此类推。消息主要是顺序写入日志文件，当文件满了，写入下一个文件

- **ConsumeQueue**

  消息消费队列，引入的目的主要是提高消息消费的性能，由于RocketMQ是基于主题topic的订阅模式，消息消费是针对主题进行的，如果要遍历commitlog文件中根据topic检索消息是非常低效的。Consumer即可根据ConsumeQueue来查找待消费的消息。其中，ConsumeQueue（逻辑消费队列）作为消费消息的索引，保存了指定Topic下的队列消息在CommitLog中的起始物理偏移量offset，消息大小size和消息Tag的HashCode值。consumequeue文件可以看成是基于topic的commitlog索引文件，故consumequeue文件夹的组织方式如下：topic/queue/file三层组织结构，具体存储路径为：$HOME/store/consumequeue/{topic}/{queueId}/{fileName}。同样consumequeue文件采取定长设计，每一个条目共20个字节，分别为8字节的commitlog物理偏移量、4字节的消息长度、8字节tag hashcode，单个文件由30W个条目组成，可以像数组一样随机访问每一个条目，每个ConsumeQueue文件大小约5.72M；

- **IndexFile**

  IndexFile（索引文件）提供了一种可以通过key或时间区间来查询消息的方法。Index文件的存储位置是：$HOME \store\index${fileName}，文件名fileName是以创建时的时间戳命名的，固定的单个IndexFile文件大小约为400M，一个IndexFile可以保存 2000W个索引，IndexFile的底层存储设计为在文件系统中实现HashMap结构，故rocketmq的索引文件其底层实现为hash索引。

在上面的RocketMQ的消息存储整体架构图中可以看出，RocketMQ采用的是混合型的存储结构，即为Broker单个实例下所有的队列共用一个日志数据文件（即为CommitLog）来存储。RocketMQ的混合型存储结构(多个Topic的消息实体内容都存储于一个CommitLog中)针对Producer和Consumer分别采用了数据和索引部分相分离的存储结构，Producer发送消息至Broker端，然后Broker端使用同步或者异步的方式对消息刷盘持久化，保存至CommitLog中。只要消息被刷盘持久化至磁盘文件CommitLog中，那么Producer发送的消息就不会丢失。正因为如此，Consumer也就肯定有机会去消费这条消息。当无法拉取到消息后，可以等下一次消息拉取，同时服务端也支持长轮询模式，如果一个消息拉取请求未拉取到消息，Broker允许等待30s的时间，只要这段时间内有新消息到达，将直接返回给消费端。这里，RocketMQ的具体做法是，使用Broker端的后台服务线程—ReputMessageService不停地分发请求并异步构建ConsumeQueue（逻辑消费队列）和IndexFile（索引文件）数据。下面从代码的角度来分析这三个文件的生成。

#### 2.1 CommitLog

在代码中 **CommitLog** 对应一个 **`CommitLog`** 的Java类。

```java
public class CommitLog {
    // 消息的 MAGIC CODE daa320a7
    public final static int MESSAGE_MAGIC_CODE = -626843481;
    protected static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    // 文件结尾空的 MAGIC CODE cbd43194
    protected final static int BLANK_MAGIC_CODE = -875286124;
    protected final MappedFileQueue mappedFileQueue;
    protected final DefaultMessageStore defaultMessageStore;
    private final FlushCommitLogService flushCommitLogService;
    private final FlushCommitLogService commitLogService;
    private final AppendMessageCallback appendMessageCallback;
    private final ThreadLocal<MessageExtBatchEncoder> batchEncoderThreadLocal;
    protected HashMap<String/* topic-queueid */, Long/* offset */> topicQueueTable = new HashMap<String, Long>(1024);
    protected volatile long confirmOffset = -1L;
    private volatile long beginTimeInLock = 0;

    //..............
}
```

RocketMQ 以如下图所示存储格式将消息顺序写入 CommitLog，除了记录消息本身的属性（消息长度、消息体、Topic 长度、Topic、消息属性长度和消息属性），CommitLog 同时记录了消息所在消费队列的信息（消费队列 ID 和偏移量）。由于存储条目具备不定长的特性，当 CommitLog 剩余空间无法满足消息时，CommitLog 在尾部追加一个 MAGIC CODE 等于 BLANK_MAGIC_CODE 的存储条目作为结束标记，并将消息存储至下一个 CommitLog 文件。

> BLANK_MAGIC_CODE 的作用就是作为标记当前文件存储CommitLog纪录满了，接下来要用下一个文件存储。
>
> **存储的位置：${user.home}/store/commitlog** 

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/CommitLog%E8%AE%B0%E5%BD%95%E6%A0%BC%E5%BC%8F.png?raw=true)

那么我们在代码中哪里可以看出来下面我们可以看一下 **`CommitLog.calMsgLength`** 的这个方法：

```java
protected static int calMsgLength(int sysFlag, int bodyLength, int topicLength, int propertiesLength) {
        int bornhostLength = (sysFlag & MessageSysFlag.BORNHOST_V6_FLAG) == 0 ? 8 : 20;
        int storehostAddressLength = (sysFlag & MessageSysFlag.STOREHOSTADDRESS_V6_FLAG) == 0 ? 8 : 20;
        final int msgLen = 4 //TOTALSIZE
            + 4 //MAGICCODE
            + 4 //BODYCRC
            + 4 //QUEUEID
            + 4 //FLAG
            + 8 //QUEUEOFFSET
            + 8 //PHYSICALOFFSET
            + 4 //SYSFLAG
            + 8 //BORNTIMESTAMP
            + bornhostLength //BORNHOST
            + 8 //STORETIMESTAMP
            + storehostAddressLength //STOREHOSTADDRESS
            + 4 //RECONSUMETIMES
            + 8 //PREPARED TRANSACTION OFFSET
            + 4 + (bodyLength > 0 ? bodyLength : 0) //BODY
            + 1 + topicLength //TOPIC
            + 2 + (propertiesLength > 0 ? propertiesLength : 0) //propertieslength
            + 0;
        return msgLen;
    }
```

所以地址字段有IPV4和IPV6的区分所以长度会是8或者20字段。

> 地址IPV4或者IPV6本来可以用4个字节和16个字节完成表示，这里为啥加了四个字节首先看MessageExt.socketAddress2ByteBuffer方法代码：
>
> ```java
>     public static ByteBuffer socketAddress2ByteBuffer(final SocketAddress socketAddress, final ByteBuffer byteBuffer) {
>         InetSocketAddress inetSocketAddress = (InetSocketAddress) socketAddress;
>         InetAddress address = inetSocketAddress.getAddress();
>         if (address instanceof Inet4Address) {
>             byteBuffer.put(inetSocketAddress.getAddress().getAddress(), 0, 4);
>         } else {
>             byteBuffer.put(inetSocketAddress.getAddress().getAddress(), 0, 16);
>         }
>         byteBuffer.putInt(inetSocketAddress.getPort());
>         byteBuffer.flip();
>         return byteBuffer;
>     }
> ```
>
> 因为加入了端口，4个字节来表示端口所以这里用的8和20个字节来表示。

#### 2.2 ConsumeQueue

**`ConsumeQueue`** 在代码中对应的 **ConsumeQueue** 类：

```java
public class ConsumeQueue {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
	//消费队列存储单元大小
    public static final int CQ_STORE_UNIT_SIZE = 20;
    private static final InternalLogger LOG_ERROR = InternalLoggerFactory.getLogger(LoggerName.STORE_ERROR_LOGGER_NAME);

    private final DefaultMessageStore defaultMessageStore;

    private final MappedFileQueue mappedFileQueue;
    private final String topic;
    private final int queueId;
    private final ByteBuffer byteBufferIndex;

    private final String storePath;
    private final int mappedFileSize;
    private long maxPhysicOffset = -1;
    private volatile long minLogicOffset = 0;
    private ConsumeQueueExt consumeQueueExt = null;
}
```

从代码中可以看到 **`CQ_STORE_UNIT_SIZE`** 是一个固定值20，如下图所示。为了实现定长存储，ConsumeQueue 存储了消息 Tag 的 Hash Code，在进行 Broker 端消息过滤时，通过比较 Consumer 订阅 Tag 的 HashCode 和存储条目中的 Tag Hash Code 是否一致来决定是否消费消息。

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/ConsumeQueue.png?raw=true)

> **存储的位置：${user.home}/store/consumequeue/${topicName}/${queueId}/${fileName}** 
>
> 每一个文件存储30w条数据

#### IndexFile

```java
public class IndexFile {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    private static int hashSlotSize = 4;
    private static int indexSize = 20;
    private static int invalidIndex = 0;
    private final int hashSlotNum; //500w
    private final int indexNum; //2000w
    private final MappedFile mappedFile;
    private final FileChannel fileChannel;
    private final MappedByteBuffer mappedByteBuffer;
    private final IndexHeader indexHeader;
    //..........
    }
```

下面来看一下IndexFile的存储结构：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/IndexFile.png?raw=true)

