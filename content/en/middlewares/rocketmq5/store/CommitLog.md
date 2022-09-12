---
title: "RocketMQ5.0-CommitLog设计与源码解析"
linkTitle: "RocketMQ55.0-CommitLog设计与源码解析"
date: 2022-09-10
weight: 202209101745
---

我报名参加金石计划1期挑战——瓜分10万奖池，这是我的第3篇文章，[点击查看活动详情](https://s.juejin.cn/ds/jooSN7t)

RocketMQ4.x设RocketMQ5.0在CommitLog的设计上面基本上没有太多调整，还是沿用了之前的设计。下面来对CommitLog的设计思想和源码进行分析。

### 1. CommitLog示意图

CommitLog是对RocketMQ的存储的抽象，示意图如下：

![CommitLog示意图](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/CommitLog%E7%A4%BA%E6%84%8F%E5%9B%BE.png)

**`CommitLog`** 主要由几部分组成：

- **MappedFileQueue：** 主要用来操作相关数据存储文件。将一系列的MappedFile抽象成一个队列。
- **FlushManager：** 数据落地磁盘的管理，主要分为两类：实时数据刷盘(FlushRealTimeService),以及异步刷盘(GroupCommitService)
- **FlushDiskWatcher：** 刷盘观察者，处理队列中的刷盘请求，对于规定时间内没有刷盘成功的进行处理。

> Tips: 多目录存储参照[RIP-7](https://github.com/apache/rocketmq/wiki/RIP-7-Multiple-Directories-Storage-Support)

**`CommitLog`** 底层主要是通过FileChannel来实现。其中还有一些RocketMQ的自身优化，例如： TransientStorePool。

### 2. MappedFileQueue

**`MappedFileQueue`** 是对数据存储文件的一个抽象，将多个数据文件抽象成为一个文件队列。通过这个文件队列对文件进行操作操作。同时保存一些 **`CommitLog`** 的属性。来看一下MappedFileQueue中的几个重要的属性：

- **storePath：** 数据文件存储的位置
- **mappedFileSize：** 单个数据文件的大小
- **mappedFiles：** 数据文件列表
- **allocateMappedFileService：** 分配文件服务
- **`flushedWhere`： 当前刷盘指针，表示该指针之前所有的数据全部持久化到了硬盘上面**
- **`committedWhere` ：当前数据提交指针，内存中byteBuffer当前的写指针，该值大于等于flushedWhere**

> Tips: 同步刷盘的过程中flushedWhere等于committedWhere

**`MappedFileQueue`** 同时提供了一些操作例如：

- 刷新文件(更新flushedWhere) MappedFileQueue#flush
- 提交文件(更新committedWhere)MappedFileQueue#commit
- 以及一些文件的操作，获取最新文件和第一个文件等等。

#### 2.1 MappedFile

**`MappedFile`** 是对文件的抽象，包含了对RocketMQ数据文件的整个操作。例如获取文件名称、文件大小、判断文件是否可用、是否已经满了等等的操作。

单个数据文件默认是 **1G** 。然后按照顺序存储Producer发送的消息。数据格式如下图所示：

![RocketMQ 消息数据格式](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/RocketMQ%20%E6%B6%88%E6%81%AF%E6%95%B0%E6%8D%AE%E6%A0%BC%E5%BC%8F.png)

数据文件就是由上图所示的一条条的数据组成。通过观察你可能会发现存储Topic的长度只占用了一个字节。这个也是在使用RocketMQ需要注意的一点就是：

**`由于只用了一个字节保存Topic的长度所以Topic的最大长度是127字符,如果使用中文长度会更短。`** 在RocketMQ5.0的版本中增加 **`PutMessageHook`** 会在Put Message之前去Check一些必要的数据和参数。例如Topic的长度就其中之一。具体可以参照 **`HookUtils`** 工具类。

### 3. CommitLog消息处理流程

![CommitLog工作流程](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/CommitLog%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B.png)

#### 3.1 消息校验

生产者发送消息到 **`Broker Master`** 后，在存入 **`CommitLog`** 之前首先会经过一个 **`PutMessageHook`** 的处理接口类，这个有不同的实现，主要用于校验一些消息的数据如：Message Topic 大小、Message Body大小、以及MessageStore的一些状态等等。

> Tips: 通过实现PutMessageHook可以做到更多校验以及一些其他的事情。

#### 3.2 消息处理

**`CommitLog#asyncPutMessage`** 在CommitLog有两个分别用来处理单个消息和批量消息。下面以单个消息处理为例

- **消息的一些属性设置**

  消息体的CRC、设置消息生产者的IP地址是否为IPV6、设置存储Broker IP地址是否为IPV6

- **HA处理设置**

  根据服务的设置判断是否需要处理HA. RocketMQ5.0 HA有两种模式：

  - **Controller Model模式：** DLedger模式的进阶版本，对原有的DLedger模式进行优化
  - **SlaveActingMaster模式**

  这两个模式主要目的是根据返回ACK的Slave数量来判断消息是否同步到Slave成功

- **Append Message 到 MappedByteBuffer**

- **处理Append的Result**

- **根据Broker的配置进行刷盘**

  刷盘是根据在启动Broker的时候配置的刷盘模式进行不同的刷盘策略。

  - **SYNC_FLUSH：** GroupCommitService线程进行实时刷盘
  - **ASYNC_FLUSH：** FlushRealTimeService线程进行异步刷盘

- **处理HA**

  HA的处理不是必须的，这个看RocketMQ是否配置了HA模式。只有配置了才需要进行处理。

### 4. 刷盘解析

刷盘主要有两种模式：同步刷盘和异步刷盘。刷盘主要由 **`FlushManager`** 进行管理。刷盘接口关系：

![刷盘接口关系图](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/%E5%88%B7%E7%9B%98%E6%8E%A5%E5%8F%A3%E5%85%B3%E7%B3%BB%E5%9B%BE.png)

#### 4.1 同步刷盘解析

同步刷盘是由 **`GroupCommitService`** 来处理，同步刷盘的详细流程如下：

![同步刷盘的详细流程](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/%E5%90%8C%E6%AD%A5%E5%88%B7%E7%9B%98%E7%9A%84%E8%AF%A6%E7%BB%86%E6%B5%81%E7%A8%8B.png)

在刷盘过程中使用到的两个类：**`GroupCommitService`** 和 **`FlushDiskWatcher`** 从本质上看都是一个Thread。

GroupCommitService处理主要分为三步：

1. 往链表中写入GroupCommitRequest请求

   ![image-20220912140817889](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20220912140817889.png)

2. GroupCommitService执行doCommit方法

   ![image-20220912140929356](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20220912140929356.png)

3. 执行刷盘操作，将结果写入GroupCommitRequest

   ![image-20220912141357835](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20220912141357835.png)

到这里就已经基本上完成整个同步的刷盘步骤。细心的可能会发现还有一个 **`FlushDiskWatcher`** 这个类。它的功能主要是：处理在规定时间内还没有刷盘成功的请求。

#### 4.2 异步刷盘解析

异步刷盘的服务是**`FlushRealTimeService`** ，不过当内存缓存池 **`TransientStorePool`** 可用时，消息会先提交到TransientStorePool中的WriteBuffer内部，再提交到MappedFile的FileChannel中，此时异步刷盘服务就是CommitRealTimeService。下面看一下 **FlushRealTimeService** ：

![image-20220912145045587](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20220912145045587.png)

![image-20220912145109156](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20220912145109156.png)

而在启用了暂存池的情况下使用的是 **`CommitRealTimeService`** 进行刷盘：

![image-20220912151020859](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20220912151020859.png)

### 5. 总结

- CommitLog在RocketMQ中充当一个存储的抽象，所有的存储操作都是通过CommitLog对外暴露。底层包含了很多其他组件来支持
- 刷盘的模式可以通过配置文件的 **flushDiskType** 字段来配置，SYNC_FLUSH表示同步刷盘、ASYNC_FLUSH表示异步刷盘
- 刷盘的服务主要是由三个服务：FlushRealTimeService、GroupCommitService、CommitRealTimeService来实现刷盘，以及FlushDiskWatcher来处理一些特殊的刷盘情况。这些服务本质上都是线程。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考资料：

- https://github.com/apache/rocketmq/wiki/RIP-7-Multiple-Directories-Storage-Support

