---
title: "RocketMQ5.0主备自动切换模式Broker选主详解"
linkTitle: "RocketMQ5.0主备自动切换模式Broker选主详解"
date: 2022-10-19
weight: 202210191648
---

RocketMQ5.0增加了主备自动切换模式，这个模式是基于新开发的模块DLedger Controller(基于Raft组件[DLedger](https://github.com/openmessaging/dledger))。下面结合源码来分析一下RocketMQ主备自动切换模式下的选主的流程。

> Tips: RocketMQ源码版本：5.0.0

## 1. 何时选主Broker

![Broker Elect Master](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Broker%20Elect%20Master.png)

Broker的选主发起主要有三种情况：

- 通过admin命令人为主动发起重新选主

  命令发起具体参照 **`electMaster`** 命令(运维命令由笔者开发完成)，详细使用参照命令的说明

- RocketMQ集群刚搭建Broker启动注册Broker到DLedger Controller，DLedger Controller还没有选主，然后触发选主操作。

- RocketMQ Broker Master下线或者因为其他情况不能正常提供服务与DLedger Controller服务不能正常连接或者心跳失效，会触发DLedger Controller选主Broker

## 2. 如何选主Broker

文章上面有提到触发选主的三种情况，下面我们就把这三种情况一一进行分析

### 2.1 Broker启动注册触发选主

![Broker Master elect process](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/Broker%20Master%20elect%20process.png)

主备自主切换模式下Broker启动时候到底是Master还是Slave需要通过DLedger Controller服务通过选主的方式来确定。

**Broker启动注册到DLedger Controller**

Broker启动后，将Broker的元数据：

- clusterName
- brokerName
- address
- epoch
- maxOffset

注册到DLedger Controller,由 **`BrokerOuterAPI#registerBrokerToController`** 提供注册的服务：

![image-20221019180858462](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019180858462.png)

**DLedger Controller触发选主**

**DLedger Controller** 模块的主要逻辑在ReplicasInfoManager中。当DLedger Controller接收到Broker发送的  **`CONTROLLER_REGISTER_BROKER`** 消息后就处理选主，由ReplicasInfoManager#registerBroker处理逻辑：

![image-20221019182903186](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019182903186.png)

**Broker Change Role**

Broker注册后收到DLedger Controller返回的数据，根据返回数据的Master Address和Broker的IP进行对比来判断当前Broker是设置为Master还是Slave。

![image-20221019190349777](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019190349777.png)

到这里就实现了Broker的选主。

### 2.2 Broker Master Inactive触发选主

Broker Master下线或者Broker Master和DLedger Controller心跳失效触发选主，DLedger Controller有一个定时任务执行 `DefaultBrokerHeartbeatManager#scanNotActiveBroker` ：

![image-20221019191416688](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019191416688.png)

通知最终会触发 `ControllerManager#onBrokerInactive` 方法：

![image-20221019191744705](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019191744705.png)

**`ReplicasInfoManager#electMaster`** 负责选主：

![image-20221019195612264](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019195612264.png)

> Tips: 笔者领了一个开发一个Preferred Master 的功能任务，可以优先选择某个 Broker 作为 master。还在代码研究和设计阶段。后续会提交PR

**参与选主的Broker是从SyncStateSet选取的。**

然后选举的结果通知Broker, **`AdminBrokerProcessor#notifyBrokerRoleChanged`** 处理改变：

![image-20221019200415384](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019200415384.png)

![image-20221019200445279](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/broker/ha/image-20221019200445279.png)

### 2.3 Admin命令触发选主

首先看一下命令的说明：

```shell
usage: mqadmin electMaster -a <arg> -b <arg> -c <arg> [-h] -n <arg>
 -a,--controllerAddress <arg>   The address of controller
 -b,--brokerAddress <arg>       The address of the broker which requires to become master
 -c,--clusterName <arg>         the clusterName of broker
 -h,--help                      Print help
 -n,--brokerName <arg>          The broker name of the replicas that require to be manipulated
```

指定一个Broker作为Master。后端DLedger Controller的实现也是通过 **`ReplicasInfoManager#electMaster`** 实现。

对于代码的详细细节大家可以去研究一下RocketMQ5.0的代码细节，以及DLedger相关的代码。

## 3. 总结

Master ID由DLedger Controller设置，Slave的ID也是。选举发起方可能是由Broker发起或者由DLedger Controller发起，也有可能手动通过 **`Admin electMaster`**命令发起。Broker主备自主切换的主要依赖DLedger Controller。

> 我是蚂蚁背大象(GitHub:mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!