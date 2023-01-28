持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第7天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

RocketMQ5.0实现了主备自主切换其中AutoSwitchHAService作为其中一个重要的组件实现了当中的很多功能：

![AutoSwitchHAService](E:\download\AutoSwitchHAService.png)

下面就来分析这些功能的实现。

## 1. AutoSwitchHAService工作流程

首先来看一下AutoSwitchHAService的工作流程，图如下：

![AutoSwitchHAService work flow](E:\download\AutoSwitchHAService work flow.png)

主要分为几块：

- AutoSwitchHAService初始化
- AutoSwitchHAService启动，包括：AutoSwitchAcceptSocketService、GroupTransferService、HAConnectionStateNotificationService服务。
- Broker启动等待注册到DLedger Controller的返回结果，根据结果来判断Broker change role。
- Broker角色为Master的时候主要是将Master的CommitLog数据传输到Slave, Slave主要的功能就是通过HAClient处理Master传输的数据。

Broker Master和Slave的分工合作从而实现了Broker的CommitLog数据传输到Slave的功能。从而达到高可用和主备切换的目的。

## 2. AutoSwitchHAService初始化和启动

**`AutoSwitchHAService`** 实现了 **`DefaultHAService`** ，也就是在RocketMQ4.x的高可用基础上实现了主备切换的功能。初始化在**`AutoSwitchHAService#init`** 方法中：

![image-20221021230106244](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221021230106244.png)

启动的过程主要在**`DefaultHAService#start`** 方法中，干了一下几件事情：

- **AutoSwitchAcceptSocketService服务的启动**

  这个服务的作用是用来监听Slave Client的链接，当Slave的Client连接到Master后，会将连接包装成AutoSwitchHAConnection存入列表中。这个服务主要是Broker Master会用到

- **GroupTransferService服务启动**

  判断CommitLog是否已经同步到Slave，这个也只有Master会用到

- **HAConnectionStateNotificationService服务启动**

![image-20221021230424825](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221021230424825.png)

## 3. AutoSwitchHAService change role

Broker的角色是Master还是Slave是由选主组件 **`DLedger Controller（controller模块)）`** 决定。接收到选主通知的Broker会根据master address和自身的address进行判断来决定是调用 **`AutoSwitchHAService #changeToMaster`** 还是 **`AutoSwitchHAService#changeToSlave`** 。

> Tips: Broker的选主可以参照[《RocketMQ5.0主备自动切换模式Broker选主详解》](https://juejin.cn/post/7156202204104392717)

### 3.1  Change to Master

**`ReplicasManager#changeToMaster`** 是接收DLedger Controller选主后返回的一个入口：

![image-20221021224605394](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221021224605394.png)

下面看一下 **`AutoSwitchHAService#changeToMaster`** 的处理流程：

![Broker Change to Master](E:\download\Broker Change to Master.png)

从Broker Change to Master的流程图可以看出来整个过程分为一下几个步骤：

- DLedger Controller负责选主，然后通知对应的Broker,Borker将角色设置为Master
- 设置为Master的时候首先要删除原先Broker持有的Slave client(Slave 是没有持有AutoSwitchHAConnection)，与此同时如果AutoSwitchHAClient不为空的情况shutdown。
- Broker本地脏数据清理：CommitLog的脏数据、consume queue 的脏数据，也就是本地数据对齐
- 根据Master Epoch对齐本地的Epoch数据，同时将新增的Epoch数据写入Checkpoint文件中
- 等待Consume queue dispatch完成， 恢复Consume Queue到内存

通过以上的几个步骤就完成了Broker的Role设置。

> Tips: 设置Broker的角色一定是 **SYNC_MASTER** 主要是因为需要实现高可用减少消息丢失

### 3.2  Change to Slave

Broker设置为Slave的流程和设置为Master的流程大体上都差不多：

![image-20221021225018262](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221021225018262.png)

功能的实现都是通过**`AutoSwitchHAService`**

![image-20221021225341031](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221021225341031.png)

对于 **`AutoSwitchHAClient`** 是如何与 Master进行建立连接和工作的大家可以参照 [《RocketMQ5.0源码分析-高可用组件AutoSwitchHAClient图文详解》](https://juejin.cn/post/7155374918983483422) 。

## 4 Transfer CommitLog Data

将Master Broker的数据传输到Slave Broker这个重要也是最主要的目的。与此同时来实现Broker的高可用。从上面可以知道当Slave和Master完成HANDSHAKE后。Master就进入了TRANSFER状态也就是数据传输的状态，此时Master会将数据通过 **`AutoSwitchHAConnection`** 传输给 Slave。传输格式:

![Transfer Message](E:\download\Transfer Message.png)

> Note: 每一次数据的传输不能跨Epoch进行传输，每一次传输的数据epoch都是相同的。

## 5. 总结

RocketMQ5.0主备自主切换是在RocketMQ4.x的基础上增加了epoch等一些设计，同时依赖DLedger实现选主。 **`ReplicasManager`** 主要负责接口对外，**`AutoSwitchHAService`** 提供实际的服务编排，将不同的服务编排起来实现整个功能。

> 我是蚂蚁背大象(GitHub:mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!