---
title: RocketMQ源码解析-NameServer对Broker的管理
date: 2021-05-12
weight: 202105122240
---

> 以下源码基于Rocket MQ 4.8.0

前面的 [RocketMQ源码解析-NameServer启动](https://blog.ljbmxsm.com/middlewares/rocketmq/name-server/rocketmq-analysis-nameserver-start/)已经知道NameServer的两大功能：

- Broker管理
- 路由管理

下面就来结合源码以及项目运行添加打印日志来具体分析一下NameServer是如何对Broker进行管理的。

### 1. Broker元数据

当Broker启动，会向NameServer注册当前broker的信息。在NameServer通过 **`BrokerData`** 来保存Broker的元数据信息：

```java
public class BrokerData implements Comparable<BrokerData> {
    private String cluster;  //broker集群名称
    private String brokerName;  //broker名称
    private HashMap<Long/* brokerId */, String/* broker address */> brokerAddrs; //broker Id和broker地址的映射关系
}
```

我们通过打印日志来看一下这个里面的数据具体包含了那些数据，日志添加在 **`RouteInfoManager#registerBroker`** 方法中：

![](https://github.com/mxsm/picture/blob/main/rocketmq/nameserverborker%E5%85%83%E6%95%B0%E6%8D%AE%E6%B7%BB%E5%8A%A0%E6%97%A5%E5%BF%97.png?raw=true)

添加好后我们配置好broker的配置文件：

![](https://github.com/mxsm/picture/blob/main/rocketmq/brokerconfig%E9%85%8D%E7%BD%AE.png?raw=true)

然后首先启动NameServer，再启动broker如下图：

![](https://github.com/mxsm/picture/blob/main/rocketmq/brokerdata%E5%85%83%E6%95%B0%E6%8D%AE%E6%89%93%E5%8D%B0%E9%AA%8C%E8%AF%81.gif?raw=true)

打印的元数据如下：

```shell
打印BrokerData元数据信息:{"brokerAddrs":{0:"169.254.144.194:10911"},"brokerName":"mxsm-1","cluster":"MxsmClusterName"}
```

