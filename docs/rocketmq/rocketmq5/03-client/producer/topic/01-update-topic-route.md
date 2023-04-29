---
title: "RocketMQ生产者如何更新Topic路由信息"
sidebar_position: 202301282224
description: 分析RocketMQ Producer如何更新Topic路由信息
---

## 1. 更新Topic路由信息的入口

更新Topic路由信息主要有两种方式：

- 定时任务

  在MQClientInstance启动过程中，会启动一个定时任务定时去NameServer更新Topic信息

- 消息发送本地获取不存在更新

  消息发送到Broker的时候，首先从本地缓存获取Topic对应的路由信息。不存在的情况下从NameServer获取Topic对应的路由信息

## 2. Topic更新源码分析

Topic更新主要调用了 `MQClientInstance#updateTopicRouteInfoFromNameServer` 方法

```java jsx title="MQClientInstance#updateTopicRouteInfoFromNameServer"
public boolean updateTopicRouteInfoFromNameServer(final String topic, boolean isDefault,
        DefaultMQProducer defaultMQProducer) {
	//省略代码
}
```

### 2.1 获取默认Topic TBW102 的信息

方法有三个参数: topic、isDefault、defaultMQProducer。当 `isDefault=true` 并且 `defaultMQProducer != null` 的情况下是去获取自动创建Topic的系统默认 **`TBW102`** 的数据。

```java
TopicRouteData topicRouteData;
if (isDefault && defaultMQProducer != null) {
    topicRouteData = this.mQClientAPIImpl.getDefaultTopicRouteInfoFromNameServer(defaultMQProducer.getCreateTopicKey(),
        clientConfig.getMqClientApiTimeout());
    if (topicRouteData != null) {
        for (QueueData data : topicRouteData.getQueueDatas()) {
            int queueNums = Math.min(defaultMQProducer.getDefaultTopicQueueNums(), data.getReadQueueNums());
            data.setReadQueueNums(queueNums);
            data.setWriteQueueNums(queueNums);
        }
    }
}
```

:::caution 注意

**`TBW102`** Topic在启动的时候MQ会自动创建，这个也是MQ自动创建Topic的关键。后续的文章会进行介绍

:::

### 2.2 获取指定Topic的信息

当 `isDefault=false` 或者 `defaultMQProducer == null` 的情况下是去获指定Topic的路由信息。发送一个请求代码为`RequestCode.GET_ROUTEINFO_BY_TOPIC` 的请求到随机选择的一个NameServer获取路由信息。NameServer接收到请求后 **`ClientRequestProcessor`** 负责处理请求。

:::info

在Rocketmq5.0开始，获取路由信息单独使用了一个处理类和线程池来处理。这样的好处就是实现业务的隔离。将最重要要的客户端路由请求单独隔离出来，队列的大小和线程数均是可配置的。线程池之间的请求处理相互隔离，不受影响。

具体参照: [RIP-29](https://github.com/apache/rocketmq/wiki/RIP-29-Optimize-RocketMQ-NameServer)

:::

**`RouteInfoManager#pickupTopicRouteData`** 方法是根据topic获取指定topic对应的路由信息。