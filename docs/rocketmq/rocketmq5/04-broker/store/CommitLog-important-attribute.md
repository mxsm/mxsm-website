---
title: "RocketMQ5.0源码解析-CommitLog设计与几个重要的属性关系图文解析"
linkTitle: "RocketMQ5.0源码解析-CommitLog设计与几个重要的属性关系图文解析"
date: 2022-10-15
sidebar_position: 202210151603
---

如果把RocketMQ看做应用系统CommitLog就相当于应用的系统中的存储层也就是数据库的功能。下面就来聊一聊CommitLog的设计以及CommitLog包含的组件中的一些重要属性字段wrotePosition、committedPosition、flushedPosition、fileFromOffset、flushedWhere、committedWhere之间的关系。

## 1.CommitLog的组成

`CommitLog` 是MQ对存储层的抽象，整体的架构设计如下：

![CommitLog architecture](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/CommitLog%20architecture.png)

从上图可以看出来整个分为了三层：

- **MappedFile**

  作为底层的数据存储，默认情况下单个文件大小1G。MappedFile提供了一些对文件元数据以及可用性的一些操作以及添加消息数据到文件中的接口。

- **MappedFileQueue**

  讲底层的单个数据文件以队列的形式组织起来，主要提供获取单个MappedFile的一些操作。例如：获取第一个或者最后一个数据文件，以及文件属性的相关操作都是由**MappedFileQueue** 提供。

- **CommitLog**

  整个对外提供服务的封装，同时一些数据刷盘操作都是在CommitLog中实现的。

MappedFile文件列表组成了MappedFileQueue，然后通过增加相关的对外操作于MappedFileQueue组成了CommitLog。

## 2. 组件重要位置属性说明

在**CommitLog、MappedFileQueue、MappedFile** 这三个组件中都有几个重要的属性，来标记日志的waterline,如下图：

![CommitLog attribute relation](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/CommitLog%20attribute%20relation.png)

下面来一一分析不同情况下这些属性之间的关系，在RocketMQ中很多地方都有用到这些waterline的关系特别是在处理日志恢复以及HA的时候有用到。

### 2.1 MappedFile waterline 说明

在MappedFile的默认实现中有如下的几个属性：

- **wrotePosition**
- **committedPosition**
- **flushedPosition**
- **fileFromOffset**

这几个属性指向的文件的位置决定了日志的数据是否丢失和新增的日志应该从哪个位置写入。下面会根据不同的情况来进行分析

![MappedFile Waterline](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/MappedFile%20Waterline.png)

上图说明上述四个变量之间的关系

> Tips: 上述图是从生产者的角度来看的，也就是生产者收到Broker的确认ACK。

**字段说明：**

| 字段              | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| wrotePosition     | 初始化值0，当有消息append的时候wrotePosition会增加，一个消息发送到Broker,wrotePosition指针就会往前移动 |
| committedPosition | 初始化值0，表示从TransientStorePool中Commit了多少数据到File Channel中的指针，当暂存池为空的时候使用的是wrotePosition |
| flushedPosition   | 初始值为0，flushedPosition指针表示的是已经落盘的持久化数据。这个指针之前的数据表示已经落盘就算服务异常退出只要不删除本地文件就不会丢失 |
| fileFromOffset    | 数据文件的开始值，也就是数据文件的名称。例如：文件大小默认为1G的来说，那么第二个文件的fileFromOffset=1024 * 1024 * 1024,文件创建该值的大小就不会变 |

**大小关系：wrotePosition >= committedPosition >= flushedPosition >= fileFromOffset**

### 2.2 MappedFileQueue waterline说明

在MappedFileQueue存在这样的两个属性：

- **flushedWhere**
- **committedWhere**

看到这两个属性你会发现和MappedFile中的两个属性committedPosition和flushedPosition属性比较相似。通过下图看一下两者之间的关系：

![MappedFileQueue字段关系](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/MappedFileQueue%E5%AD%97%E6%AE%B5%E5%85%B3%E7%B3%BB.png)

**flushedWhere** 、**committedWhere** 这两个字段主要是从MappedFileQueue的角度去看的。从源码进行分析：

![image-20221015161021289](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20221015161021289.png)

**committedWhere：**  当前MappedFile的fileFromOffset + 当前MappedFile的committedPosition

![image-20221015161105559](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/image-20221015161105559.png)

**flushedWhere ：**  当前MappedFile的fileFromOffset + 当前MappedFile的flushedPosition

### 2.3 CommitLog

CommitLog主要是提供对外的接口服务，这里包括：

- 消息的插入操作
- 消息的刷盘任务(同步和异步)
- 暂存池的数据提交到FileChannel中的任务

## 3. CommitLog消息处理流程

![CommitLog handle message flow](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/store/commitlog/CommitLog%20handle%20message%20flow.png)

CommitLog启动后同时会启动相对应的线程来处理Commit和Flush Disk。

- **FlushManager处理Commit指针和Flush Disk指针的推进**
- **MappedFile#appendMessage处理writePosition指针**

Producer发送消息给Broker后，首先就是推动wrotePosition往前(不管是使用FileChannel还是暂存池)，然后根据配置的是否启用暂存池来确定是否需要CommitRealTimeService线程池去处理将暂存池的数据提交到FileChannel中，这个会推动committedPosition指针往前移动。然后就是根据刷盘策略是异步刷盘还是同步刷盘来启动不同的线程去处理刷盘来推动MappedFile和MappedFileQueue 提交相关的指针往前。

## 4. 总结

**MappedFile字段：**

- fileFromOffset其实就是日志数据存储文件的名称，初始值为0，每增加增加一个文件默认情况下增加1024 * 1024 * 1024
- wrotePosition表示写入FileChannel的数据，这些数据可能还存在内存中不应落盘。每次增加日志wrotePosition就会往后移动
- committedPosition在暂存池启动的时候才会使用到，暂存池提价的FileChannel中的数据位置，这个字段只有启用了暂存池才会用到，要不然就是使用的wrotePosition
- flushedPosition表示就落盘的位置，在小于flushedPosition位置的数据都已经持久化到了磁盘

**MappedFileQueue字段: **

- flushedWhere整个文件队列的刷盘的位置，异步刷盘由 `FlushRealTimeService` 线程处理，同步刷盘由 `GroupCommitService` 处理
- committedWhere暂存池的提交位置，由CommitRealTimeService线程处理

> 我是蚂蚁背大象(GitHub:mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!