---
title: "RocketMQ5.0 Controller DLedger模式"
linkTitle: "RocketMQ5.0 Controller DLedger模式"
date: 2022-10-07
weight: 202210071404
---

RocketMQ5.0已经发布，在RocketMQ5.0新增了一个新的高可用模式 **DLedger Controller** 模式。下面就来聊一下RocketMQ5.0新增的这个模式。

### 1. 背景

首先我们需要知道**DLedger Controller** 是为了解决什么问题，先来看一下之前版本的DLedger模式架构图：

![raft-modle](E:\download\raft-modle.png)

在 DLedger 模式下，利用 Raft Commitlog 代替了原来的 Commitlog 了，使得 Commmitlog 具备了选举的能力，当 Master Broker 故障后，通过内部协商，从其他的 Slave Broker 中选出新的 Master，完成主备切换，同时 Raft 的算法也保证了 Commitlog 的一致性。但是存在一些缺点：

- 想要具备选举切换的能力，单组 Broker 内的副本数必须 3 副本及以上(Raft协议决定)
- 副本 ACK 需要严格遵循 Raft 协议多数派的限制，3 副本需要 2 副本 ACK 后才能返回，5 副本需要 3 副本 ACK 后才能返回，副本越多可能耗时也可能越长。(这个也是最重要的一点)
- DLedger 模式下，由于存储库使用了 OpenMessaging DLedger 存储，因此无法复用 RocketMQ 原生的存储和复制的能力（比如 transientStorePool 和零拷贝能力），且对维护造成了困难。

在RocketMQ5.0版本新增了DLedger Controller模式来解决上面对的痛点。

### 2. DLedger Controller模式架构

DLedger Controller模式的核心思想：将其作为一个选主组件，并且是一个 **可选择、松耦合** 的组件。当部署 DLedger Controller 组件后，原本 Master-Slave 部署模式下 Broker 组就拥有 Failover 能力。

DLedger Controller的部署有两种模式：

- **内嵌NameSrv**

- **单独部署DLedger Controller**

### 3. DLedger Controller部署

`DLedger Controller` 有两种模式，分别看一下这两种模式的部署。

#### 3.1 DLedger Controller内嵌NameServer部署

`DLedger Controller` 以插件的模式内嵌到NameServer进行部署。部署的示意图如下：

![Controller as plugin](E:\download\Controller as plugin.png)

嵌入 NameServer 部署时只需要在 NameServer 的配置文件中设置 **`enableControllerInNamesrv=true`**，并填上 **`DLedger Controller`** 的配置即可。

```properties
enableControllerInNamesrv = true 
controllerDLegerGroup = group1
controllerDLegerPeers = n0-127.0.0.1:9877;n1-127.0.0.1:9878;n2-127.0.0.1:9879
controllerDLegerSelfId = n0
controllerStorePath = /home/admin/DledgerController
enableElectUncleanMaster = false
notifyBrokerRoleChanged = true
```

参数说明：

- enableControllerInNamesrv：Nameserver 中是否开启 controller，默认 false。
- controllerDLegerGroup：DLedger Raft Group 的名字，同一个 DLedger Raft Group 保持一致即可。
- controllerDLegerPeers：DLedger Group 内各节点的端口信息，同一个 Group 内的各个节点配置必须要保证一致。
- controllerDLegerSelfId：节点 id，必须属于 controllerDLegerPeers 中的一个；同 Group 内各个节点要唯一。
- controllerStorePath：controller 日志存储位置。controller 是有状态的，controller 重启或宕机需要依靠日志来恢复数据，该目录非常重要，不可以轻易删除。
- enableElectUncleanMaster：是否可以从 SyncStateSet 以外选举 Master，若为 true，可能会选取数据落后的副本作为 Master 而丢失消息，默认为 false。
- notifyBrokerRoleChanged：当 Broker 副本组上角色发生变化时是否主动通知，默认为 true。

以上参数都是RocketMQ5.0新增的。

> Tips: enableControllerInNamesrv=true配置是内嵌NameServer的开关。如上配置需要配置3个 controllerDLegerSelfId需要做相应的修改n0、n1、n2

使用NameServer的启动方式启动。

#### 3.2 DLedger Controller独立部署

独立部署示意图如下：

![Controller deploy indepdent](E:\download\Controller deploy indepdent.png)

独立部署的配置和内嵌配置的区别就是无需配置 **`enableControllerInNamesrv=true`** 。 具体配置可以参照内嵌部署的配置。启动可以使用如下命令：

**单例模式：**

```shell
$ sh bin/mqcontroller -c conf/controller/controller-standalone.conf
```

**集群模式：**

```shell
$ nohup bin/mqcontroller -c ./conf/controller/cluster-3n-independent/controller-n0.conf &
$ nohup bin/mqcontroller -c ./conf/controller/cluster-3n-independent/controller-n1.conf &
$ nohup bin/mqcontroller -c ./conf/controller/cluster-3n-independent/controller-n2.conf &
```

#### 3.3 快速启动DLedger Controller

在RocketMQ中提供了快速启动的脚本

```shell
#内嵌NameServer快速启动
$ sh bin/controller/fast-try-namesrv-plugin.sh start

#独立部署快速启动
$ sh bin/controller/fast-try-independent-deployment.sh start
```

### 4. Broker Controller DLedger模式

Broker搭配Controller DLedger模式可以实现高可用以及主备自动切换。 Broker的部署和之前的版本相同只是增加了一些与Controller DLedger相关配置：

- enableControllerMode：Broker controller 模式的总开关，只有该值为 true，自动主从切换模式才会打开。默认为 false。
- controllerAddr：controller 的地址，多个 controller 中间用分号隔开。例如`controllerAddr = 127.0.0.1:9877;127.0.0.1:9878;127.0.0.1:9879`
- syncBrokerMetadataPeriod：向 controller 同步 Broker 副本信息的时间间隔。默认 5000（5s）。
- checkSyncStateSetPeriod：检查 SyncStateSet 的时间间隔，检查 SyncStateSet 可能会 shrink SyncState。默认5000（5s）。
- syncControllerMetadataPeriod：同步 controller 元数据的时间间隔，主要是获取 active controller 的地址。默认10000（10s）。
- haMaxTimeSlaveNotCatchup：表示 Slave 没有跟上 Master 的最大时间间隔，若在 SyncStateSet 中的 slave 超过该时间间隔会将其从 SyncStateSet 移除。默认为 15000（15s）。
- storePathEpochFile：存储 epoch 文件的位置。epoch 文件非常重要，不可以随意删除。默认在 store 目录下。
- allAckInSyncStateSet：若该值为 true，则一条消息需要复制到 SyncStateSet 中的每一个副本才会向客户端返回成功，可以保证消息不丢失。默认为 false。
- syncFromLastFile：若 slave 是空盘启动，是否从最后一个文件进行复制。默认为 false。
- asyncLearner：若该值为 true，则该副本不会进入 SyncStateSet，也就是不会被选举成 Master，而是一直作为一个 learner 副本进行异步复制。默认为false。
- inSyncReplicas：需保持同步的副本组数量，默认为1，allAckInSyncStateSet=true 时该参数无效。
- minInSyncReplicas：最小需保持同步的副本组数量，若 SyncStateSet 中副本个数小于 minInSyncReplicas 则 putMessage 直接返回 PutMessageStatus.IN_SYNC_REPLICAS_NOT_ENOUGH，默认为1。

> Tips: 
>
> - Controller DLedger模式下enableControllerMode必须为true,默认为false
> - 实现消息不丢失allAckInSyncStateSet设置为true

### 5. 总结

- 若需要保证Controller具备容错能力，Controller部署需要三副本及以上（遵循Raft的多数派协议）
- Controller部署配置文件中配置参数`controllerDLegerPeers` 中的IP地址配置成其他节点能够访问的IP,在多机器部署的时候尤为重要。例子仅供参考需要根据实际情况进行修改调整。
- 要想实现消息不丢失需要Broker进行相对应的配置进行配合使用。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢! 大家可以Follow我的[**GitHub mxsm**](https://github.com/mxsm)

参考资料：

- https://github.com/apache/rocketmq/wiki/RIP-44-Support-DLedger-Controller