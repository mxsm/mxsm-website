---
title: "图说RocketMQ5.0的Broker的主备自动切换的设计与实现"
linkTitle: "图说RocketMQ5.0的Broker的主备自动切换的设计与实现"
date: 2022-10-23
weight: 202210231435
---

持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第9天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

RocketMQ5.0用新开发的 **DLedger Controller** 模式增强了以前的 **DLedger** 模式，下面就来从设计聊一下 **DLedger Controller** 模式是如何来实现Broker的主备自动切换。我们从以下几个方面来分析：

- RocketMQ5.0 整体的架构改动
- DLedger Controller如何实现Broker选主(主备自动切换关键)
- 参与Broker选主的扩容和缩容(哪些Broker有资格参加选主)

> Tips: RocketMQ 源码版本5.0.0

## 1. RocketMQ5.0 主备自动切换架构

![RocketMQ5.0 architecture](E:\download\RocketMQ5.0 architecture.png)

相比之前的高可用架构，增加了一个DLedger Controller用来实现Broker主备的自主切换和高可用。RocketMQ5.0的主备模式解决RocketMQ4.x哪些问题：

- 想要具备选举切换的能力，单组 Broker 内的副本数必须 3 副本及以上
- 副本 ACK 需要严格遵循 Raft 协议多数派的限制，3 副本需要 2 副本 ACK 后才能返回，5 副本需要 3 副本 ACK 后才能返回，副本越多返回ACK的时间越长。这会导致性能下降
- DLedger 模式下，由于存储库使用了 OpenMessaging DLedger 存储，因此无法复用 RocketMQ 原生的存储和复制的能力（比如 transientStorePool 和零拷贝能力），且对维护造成了困难。

在RocketMQ5.0版本新增了DLedger Controller模式来解决上面对的痛点。

DLedger Controller的部署模式有两种：

- **独立部署**

  单独部署DLedger Controller集群

- **内嵌NameServer部署(推荐)**

  RocketMQ5.0在默认情况下是不会开启内嵌Controller的，通过设置配置：**`enableControllerInNamesrv=true`**

DLedger Controller主要用于Broker的选主，而数据的存储能力还是依靠RocketMQ Broker。 这里可以很好使用到MQ原生的存储能力便于维护。

## 2. DLedger Controller如何实现Broker选主

![Broker Elect Master -2](E:\download\Broker Elect Master -2.png)

Broker的选主发起主要有三种情况：

- **通过admin命令人为主动发起重新选主(运维命令)**
- **RocketMQ集群刚搭建Broker启动注册Broker到DLedger Controller，DLedger Controller还没有选主，然后触发选主操作。(系统初始化)**
- **RocketMQ Broker Master Inactive，会触发DLedger Controller选主Broker**

Broker 组第一次上线时，调用该方法也没有 Master，此时会让调用的 broker 试着成为 Master，形成 ElectMasterEvent 事件日志并提交提案，副本组中第一个成功应用 ElectMasterEvent 事件日志的 Broker 会成为 Master，并形成只有自己的 SyncStateSet 列表。

### 2.1 选主的元数据

选主Broker注册到 **DLedger Controller** 的元数据：

- clusterName
- brokerName
- address
- epoch
- maxOffset

这些元数据主要用来选主判断。

### 2.2 选主的流程

ELectMaster 主要是在某 Broker 副本组的 Master 下线或不可访问时，重新从 SyncStateSet 列表里面选出一个新的 Master，该事件由 Controller 自身发起。 这里主要是利用了心跳机制, Broker 定期会和 Controller 上报心跳, Controller 也会定期扫描超时的 Broker (scanNotActiveBroker)。如果某个 Broker 心跳超时, Controller 会判断是否为 Master (BrokerId = 0), 如果是 Master, 则会发起 ElectMaster, 选举新的 Broker Master。 选举 Master 的方式比较简单，我们只需要在该组 Broker 所对应的 SyncStateSet 列表中，挑选一个仍然存活的副本(心跳未超时)出来成为新的 Master 即可，选举出来生成 ElectMaster 事件，通过 DLedger 共识后应用到内存元数据，并将结果通知对应的 Broker 副本组（Broker 本身也会有有轮询机制来获取自身副本组的 Master 信息（getReplicaInfo）做进一步保证，防止通知丢失）。 此外, Controller 增加 enableElectUnCleanMaster 参数，这时如果 SyncStateSet 没有符合要求的副本，可以在当前所有的存活的副本中选，但可能大量消息丢失。

> Tips: 具体可以参照[《RocketMQ5.0主备自动切换模式Broker选主详解》](https://juejin.cn/post/7156202204104392717)

## 3. 参与Broker选主的扩容和缩容

哪些Broker能够参加选主这个是有规则的，同时这里也涉及到了我们要说道的Broker的选主范围的缩容和扩容。

### 3.1 扩容

在DLedger Controller中保存了这样的一个集合 **SyncStateSet** ：

SyncStateSet表示⼀个 broker 副本组中跟上 Master 的 Slave 副本数加上 Master 的集合, 主要判断标准是 Master 和 Slave 之间的差距。当 Master 下线时 我们会从 SyncStateSet 列表中选出新的主。Master broker 会定期的检测是否需要扩容和缩容 SyncStateSet, 并通过 api 上报 SyncStateSet 列表信息，DLedger Controller 会根据上述信息维护强一致性的 Broker 副本组的 SyncStateSet 列表。

如果⼀个 Slave 副本追赶上了 Master，Master 需要及时向Controller Alter SyncStateSet 。加⼊SyncStateSet 的条件是 slaveAckOffset >= ConfirmOffset（当前 SyncStateSet 中所有副本的 MaxOffset 的最⼩值）。

### 3.2 缩容

Broker新增了配置：

- haMaxTimeSlaveNotCatchup

  表示slave没有跟上Master的最大时间间隔，若在SyncStateSet中的slave超过该时间间隔会将其从SyncStateSet移除。默认为15000（15s）

- HaConnection 中记录 Slave 上⼀次跟上 Master 的时间戳 lastCaughtUpTimeMs，该时间戳含义是：每次Master 向 Slave 发送数据（transferData）时记录⾃⼰当前的 MaxOffset 为 lastMasterMaxOffset 以及当前时间戳 lastTransferTimeMs。
- ReadSocketService 接收到 slaveAckOffset 时若 slaveAckOffset >= lastMasterMaxOffset 则将lastCaughtUpTimeMs 更新为 lastTransferTimeMs。
- Master 端通过定时任务扫描每一个 HaConnection，如果 (cur_time - connection.lastCaughtUpTimeMs) > haMaxTimeSlaveNotCatchUp，则该 Slave 是 Out-of-sync 的。
- 如果检测到 Slave out of sync ，master 会立刻向 Controller 上报SyncStateSet，从而 Shrink SyncStateSet。

## 4. 消息不丢失配置

首先就是启用DLedger Controller模式，部署DLedger Controller 不管是内嵌NameServer还是独立部署都可以。

其次就是Broker开启Broker controller模式(enableControllerMode=true,默认值为false关闭状态)，配置allAckInSyncStateSet=true，副本之间的复制为同步复。这样就能实现消息不丢失。

## 5. 总结

DLedger Controller模式能够在最大限度利用RocketMQ原有的存储能力的基础上提供主备自动切换和消息不丢失的方案。

> 我是蚂蚁背大象(GitHub:mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!