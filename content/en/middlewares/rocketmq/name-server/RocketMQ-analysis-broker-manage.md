---
title: RocketMQ源码解析-NameServer对Broker的管理
date: 2021-05-12
weight: 202105122240
---

> 以下源码基于Rocket MQ 4.8.0

前面的 [RocketMQ源码解析-NameServer启动](https://blog.ljbmxsm.com/middlewares/rocketmq/name-server/rocketmq-analysis-nameserver-start/)已经知道NameServer的两大功能：

- Broker管理
- 路由管理

NameServer可以部署多个，相互之间独立，其他角色同时向多个NameServer上报状态信息，从而达到热备份的目的。NameServer本身是无状态的，也就是说NameServer中的Broker、Topic等信息都不会持久化，都是由各个角色定时上报并存储到内存中的（NameServer支持参数的持久化，一般用不到）。

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

### 2. Broker存活状态管理

Broker的存活状态管理分为两种：

- **Broker正常下线**

  Broker正常下线会给NameServer发送一个 **`RequestCode.UNREGISTER_BROKER`** 。然后调用最终调用 **`RouteInfoManager#unregisterBroker`** 方法来注销

- **Broker异常下线，NameServer通过定时任务扫描**

  定时任务在NameServer启动的时候创建

  ```java
  this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
      @Override
      public void run() {
          NamesrvController.this.routeInfoManager.scanNotActiveBroker();
      }
  }, 5, 10, TimeUnit.SECONDS);
  ```

  每10秒执行一次。调用 **`RouteInfoManager#scanNotActiveBroker`**

  ```java
  public void scanNotActiveBroker() {
      Iterator<Entry<String, BrokerLiveInfo>> it = this.brokerLiveTable.entrySet().iterator();
      while (it.hasNext()) {
          Entry<String, BrokerLiveInfo> next = it.next();
          long last = next.getValue().getLastUpdateTimestamp();
          //private final static long BROKER_CHANNEL_EXPIRED_TIME = 1000 * 60 * 2;
          if ((last + BROKER_CHANNEL_EXPIRED_TIME) < System.currentTimeMillis()) {
              RemotingUtil.closeChannel(next.getValue().getChannel());
              it.remove();
              log.warn("The broker channel expired, {} {}ms", next.getKey(), BROKER_CHANNEL_EXPIRED_TIME);
              this.onChannelDestroy(next.getKey(), next.getValue().getChannel());
          }
      }
  }
  ```

  通过上面的代码可以发现120秒没有更新NameServer中当Broker的状态。后将连接关闭，同时需要清除这些已关闭连接的 broker 的路由信息。这部分则是在`onChannelDestroy`方法中

### 3. Topic的信息

在 **`RouteInfoManager`** 类中有一个变量 **`topicQueueTable`** 这个变量用来保存Topic和Broker之间的读写队列数和权限。

```java
private final HashMap<String/* topic */, List<QueueData>> topicQueueTable;
public class QueueData implements Comparable<QueueData> {
    //broker名称
    private String brokerName;
    //读的队列数
    private int readQueueNums;
    //写的队列数
    private int writeQueueNums;
    //读写权限
    private int perm;
    private int topicSynFlag;
}
```

