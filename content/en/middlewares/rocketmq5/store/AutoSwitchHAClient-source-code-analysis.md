---
title: "RocketMQ5.0源码分析-AutoSwitchHAClient"
linkTitle: "RocketMQ5.0源码分析-AutoSwitchHAClient"
date: 2022-10-07
weight: 202210071655
---

在RocketMQ5.0的HA模式中，`AutoSwitchHAClient` 是一个重要的组件，主要作用Broker Slave中用来处理Broker Master发来的CommitLog数据。RocketMQ5.0对`AutoSwitchHAClient`进行了增强来适应RocketMQ5.0的DLedger Controller的模式。

> Tips: RocketMQ版本：5.0.0

## 1. RocketMQ4.x和RocketMQ5.0版本协议对比

在RocketMQ4.x版本中只有一个CommitLog数据传输的协议，而RocketMQ5.0为了适配DLedger Controller的模式增加了新的握手和连接协议以及对原有的CommitLog传输协议进行了增强。

- **HANDSHAKE(新增协议)**
- **TRANSFER(对4.x版本进行了增强)**

### 1.1 HANDSHAKE协议

**Slave发送给Master协议格式：**

![Handshake header](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Handshake%20header.png)

**作用：将Slave的状态告诉Master。** 

这个协议是RocketMQ5.0新增的协议。

> Tips: 在Broker Slave给Broker Master发了HANDSHAKE后，Broker Master处理完成后会给Broker Slave回一个ACK

**Master给Slave回复的ACK协议格式：**

![Master Handshare Message ACK](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Master%20Handshare%20Message%20ACK.png)

**作用：用于对齐Slave和Master的数据**

### 1.2 TRANSFER协议

**RocketMQ4.x协议格式：**

![transfer protocol](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/transfer%20protocol.png)

分为头部和数据两大部分，头部包含了offSet和数据大小

**RocketMQ5.0协议格式：**

![Transfer Message](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Transfer%20Message.png)

由于是RocketMQ4.x的协议增强，除了包含offSet和数据大小以外还包含了DLedger Controller模式的一些Broker的元数据信息。

## 2. RocketMQ5.0 AutoSwitchHAClient处理流程

**`AutoSwitchHAClient`** 处理流程示意图如下：

![AutoSwitchHAClient Handle flow](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/AutoSwitchHAClient%20Handle%20flow.png)

> Tips: 从源码可以知道AutoSwitchHAClient继承了ServiceThread，所以本质上AutoSwitchHAClient是一个线程。线程的循环执行来处理Master Broker发送过来的CommitLog。

`AutoSwitchHAClient` 主要通过不同的状态来控制不同的流程：

![AutoSwitchHAClient-status-change](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/AutoSwitchHAClient-status-change.png)

**状态有以下几种：**

- **SHUTDOWN**
- **READY**
- **HANDSHAKE**
- **TRANSFER**
- **SUSPEND(暂时没用到)**

AutoSwitchHAClient主要是Broker Slave用来处理Broker Master发送的数据，以及Broker Slave自身的一些内部

### 2.1 READY

**`READY`** 状态也是初始化状态，当AutoSwitchHAClient被初始化，AutoSwitchHAClient的状态会被设置为READY状态。在READY状态下主要做两件事：

- **Truncate Invalid message(截断无效的message)**
- **Connect Broker Master（与Master建立TCP链接）**

接下来我们就来分析这两种情况。

#### 2.1.1 Truncate Invalid message(截断无效的message)

什么情况下需要进行消息进行截断？当Broker分发的数据存在落后的情况也就是从Producer生成的消息发送到Broker后还存在有没有dispatch的数据这种情况下可能需要进行消息截断。然后对未dispatch的消息数据进行预处理校验。然后将预处理完成后的值后面的日志进行截断(也有可能不存在，这里是处理无效数据)

![image-20221012214111881](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221012214111881.png)

**通过分析代码发现 AutoSwitchHAClient READY 状态下截断本质上是做的处理Slave Broker的无效日志和消费者队列的数据。也就是首先对齐自身的数据这里包括：CommitLog和Consumer Queue**

#### 2.1.1  Connect Broker Master（与Master建立TCP链接）

![image-20221012215935051](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221012215935051.png)

如果与Broker Master建立了TCP连接，然后会将状态设置为**`HANDSHAKE`**

### 2.2 HANDSHAKE

AutoSwitchHAClient在HANDSHAKE状态下会发送握手信息给Master，信息格式如下：

![Handshake header](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Handshake%20header.png)

也就是上文提到的HANDSHAKE协议数据。这里包括：

- **Slave的状态**
- 同步开始的文件位置，以及是否为Learner角色
- slave的地址(通过长度来判断是否为IPV4还是IPV6)

在Master收到Slave的发送的HANDSHAKE数据后会对数据进行处理：

![image-20221012221841662](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221012221841662.png)

主要是将Slave的状态数据以及角色和IP地址记录到Master，同时master会构建一个HANDSHAKE的ACK给到Slave。那么Master给Slave返回的数据HANDSHAKE ACK数据格式：

![Master Handshare Message ACK](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Master%20Handshare%20Message%20ACK.png)

Master给Slave回的ACK包含了Master的一些元数据信息。源码代码构建如下：

![image-20221016094054892](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221016094054892.png)

> Tips: 在5.0.0的代码中为了和发送日志数据的头统一，Master在给Slave回复 HANDSHAKE ACK状态的时候请求头也增加了EpochStartOffset和Additional info 字段。设置为0，为了减少数据传输笔者进行了优化去除了这两个字段传输具体可以参照 [ISSUE#5157](https://github.com/apache/rocketmq/issues/5157) 对应的PR，社区已经approved等待代码合并。这个优化主要是处于两个考虑：
>
> - 和文档中的设计统一
> - 减少传输过程中的数据传输

Slave收到Master的HANDSHAKE ACK后获取数据

![image-20221016103311015](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221016103311015.png)

**主要是作用是Slave和Master对齐数据**

![image-20221016103809712](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221016103809712.png)

到这里为止就完成整个传输数据的前期准备工作。

> 总结：前期的准备工作主要做了两件事情
>
> - Slave自身的数据对齐，删除一些无效的数据(如果有的情况下)，这些无效的数据包括日志数据、cq数据
> - Slave和Master的数据对齐，当Slave的数据在Master前面的时候也就是数据多于Master，此时会对数据进行删除。与此同时会对齐

### 2.3 TRANSFER

Slave  AutoSwitchHAClient状态变成TRANSFER后就开始处理Master的发送过来的日志数据，处理完成后报告Slave的maxOffSet。

![image-20221016121849931](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221016121849931.png)

> Tips: 日志数据传输不能跨Epoch传输。

## 3. 协议优化思考

### 3.1 HANDSHAKE协议优化

**Slave发送给Master协议格式优化:**

![Handshake header](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Handshake%20header.png)

协议可以发现，用了4个字节来表示状态。这里的设计是和枚举的int类型进行了对应，其实我们可以用1btye来表示。地位到高位每一个bit表示状态，例如地位第一位1表示READY状态。同时Flags也可以进行优化用同样的1byte就可以表示状态。这样8byte的数据用2个byte就可以表示。

**Master发送给Slave的协议格式优化：**

![Master Handshare Message ACK](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Master%20Handshare%20Message%20ACK.png)

这个优化同样也是优化state字段，优化的思路和上面的一致。

### 3.2 TRANSFER协议优化

![Transfer Message](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Transfer%20Message.png)

这个优化同样也是优化state字段，优化的思路和上面的一致。

> Tips: 后续笔者会在社区创建ISSUE进行社区讨论然后确定是否进行协议优化，如果确定进行协议优化提交对应的PR

## 4. 总结

AutoSwitchHAClient作为RocketMQ5.0高可用的重要一个主键，其功能主要是Slave Broker和Master进行通讯同时处理来自Master传输的日志数据。搭配其他的组件使用来确保DLedger Controller模式下的自主切换和RocketMQ的高可用。后续会有文章接着分析其他DLedger Controller模式高可用的其他组件。

> 我是蚂蚁背大象(GitHub:mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!
