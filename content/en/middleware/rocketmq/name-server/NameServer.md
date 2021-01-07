---
title: NameServer
categories:
  - MQ
  - RocketMQ
  - NameServer
tags:
  - MQ
  - RocketMQ
  - NameServer
abbrlink: 56826dc9
date: 2019-12-07 09:18:16
---
### 1. 什么是NameServer?

![图解](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RocketMQ%E7%89%A9%E7%90%86%E9%83%A8%E7%BD%B2%E5%9B%BE.jpg?raw=true)

**`NameServer`** 就是一个保存Broker状态的一个服务和Broker管理。

**NameServer 的特点：**

- **NameServer 和 每一台Broker 服务器保持长连接，并间隔30s检测一次Broker是否存活。**
- **检测到 Broker右机 ， 则从路由注册表中将其移除 。 但是路由变化不会马上通知消息生产者。— 降低 NameServer实现的复杂性，在消息发送端提供容错机制来保证消息发送的高可用性**。
- **NameServer本身的高可用可通过部 署多台 NameServerr服务器来实现，但彼此之间互不通信，也就是 NameServer服务器之间在某一时刻的数据并不会完全相同**

**作用**：

- **消息生产者 和 消息消费者提供关 于主题 Topic 的路由信息**
- **NameServer存储路由 的基础信息**
- **管理 Broker节点，包括路由 注册、路由删除等功能** 

### 2. NameServer 路由注册、故障剔除

#### 2.1 NameServer 存储了哪些信息

-  Topic 消息队列路由信息。消息发送时根据路由表进行负 载均衡。
-  Broker 基础信息， 包含 brokerName、 所属集群名称 、 主备 Broker 地址
- Broker 集群信息，存储集群中所有 Broker 名称
- Broker 状态信息 。NameServer 每次收到心跳包时会替换该信息 
- Broker上的 FilterServer列表，用于类模式消息过滤

> RocketMQ 基于订阅发布机制 ， 一个Topic拥有多个消息队列 ，一个Broker为每一主题默认创建 4 个读队列 4 个写队列。多个Broker组成一个集群， BrokerName由相同的多台Broker组成Master-Slave架构。brokerId 为0代表 Master， 大于0表示Slave。 BrokerLivelnfo中的lastUpdateTimestamp 存储上次收到 Broker 心跳包的时间

#### 2.2 路由注册

路由注册的步骤：

- **Broker发送心跳包**
  - Header
    - Broker地址
    - BrokerId, 0:Master; 大于0:slave
    - Broker名称
    - 集群名称
    - master地址，初次请求时为空，slave向NameServer注册后返回
  - Body
    - 消息过滤服务器列表
    - 主题的配置
- **NameServer 心跳包处理**
  - 路由 注册需要加写锁 ，防止并发修改 RoutelnfoManager 中的路由 表 。Broker 所属 集群是否存在， 如果不存在，则创 建，然 后将 broker 名加入到集群Broker集合中
  - 维护 BrokerData信息。
  - 如果Broker为Master，并且BrokerTopic配置信息发生变化或者是初次注册，则需要创建或更新 Topic路由元数据，填充 topicQueueTable， 其实就是为默认主题自动注册路由信息，其中包含 MixAII.DEFAULT TOPIC 的路由信息。 当消息生产者发送主题时，如果该主题未创建并且BrokerConfig 的autoCreateTopicEnable为true时， 将返回MixAII.DEFAULT TOPIC的路由信息。
  - 更新 BrokerLivelnfo，存活 Broker信息表， BrokeLivelnfo是执行路由删除的重要依据 
  - 注册 Broker 的过滤器 Server地址列表 ，一个 Broker上会关联多个 FilterServer消息过滤服务器

> NameServer和Broker保持长连接，Broker状态存储在brokerLiveTable中，NameServer收到每一个心跳包将更新brokerLiveTable中关于Broker的状态信息以及路由表(topicQueueTable、brokerAddrTable、
> brokerLiveTable、filterServerTable)

#### 2.3 路由删除

对于Broker来说每隔30秒想NameServer发送一个心跳包来维持Broker在NameServer中的状态。

对于NameServer来说会每隔10秒扫描一次brokerLiveTable状态表，如果发现Broker的lastUpdateTimestamp的时间戳距当前超过120S，这样认为Broker已经失效，移除Broker,关闭与Broker的连接。同时更新对应的信息。

**触发路由删除：**

- **NameServer定时扫描 brokerLiveTable检测上次心跳包与 当前系统时间的时间差如果时间戳大于 120s，则需要移除该 Broker 信息 。**
- **Broker在正常被关闭的情况下，会执行 unregisterBroker指令。**

#### 2.4 路由发现

RocketMQ 路由发现是非实时的，NameServer不会主动推送给客户端。而是由客户端定时拉去主题最新的路由。

### 3. 总结

![图解](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/NameServer%E8%B7%AF%E7%94%B1%E6%B3%A8%E5%86%8C%E5%88%A0%E9%99%A4%E5%8F%91%E7%8E%B0%E6%9C%BA%E5%88%B6.jpg?raw=true)

NameServer路由发现与删除机制就介绍到这里了，我们会发现这种设计会存在这样一种情况: NameServer需要等 Broker失效至少 120s才能将该 Broker从路由表中移除掉，那如果在 Broker故障期间，消息生产者 Producer根据主题获取到的路由信息包含已经看机的Broker，会导致消息发送失败，那这种情况 怎么办。