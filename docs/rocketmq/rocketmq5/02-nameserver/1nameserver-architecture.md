---
title: "RocketMQ5.0 NameServer架构设计"
linkTitle: "RocketMQ5.0 NameServer架构设计"
date: 2022-12-18
weight: 202212181625
---

## 1. 架构设计

![NameServer-architecture](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/nameserver/NameServer-architecture.png)

NameServer是一个非常简单的Topic路由注册中心，其角色类似Dubbo中的zookeeper，支持Broker的动态注册与发现。主要包括两个功能：

1. Broker管理，NameServer接受Broker集群的注册信息并且保存下来作为路由信息的基本数据。然后提供心跳检测机制，检查Broker是否还存活；
2. 路由信息管理，每个NameServer将保存关于Broker集群的整个路由信息和用于客户端查询的队列信息。然后Producer和Consumer通过NameServer就可以知道整个Broker集群的路由信息，从而进行消息的投递和消费。

NameServer通常也是集群的方式部署，各实例间相互不进行信息通讯(如上图所示),彼此之间相互独立。Broker是向每一台NameServer注册自己的路由信息，所以每一个NameServer实例上面都保存一份完整的路由信息。当某个NameServer因某种原因下线了，Broker仍然可以向其它NameServer同步其路由信息，Producer和Consumer仍然可以动态感知Broker的路由的信息。

:::info

RocketMQ5.0版本后NameServer同时也可以作为Controller模块的一个容器，Controller模块内嵌到NameServer中。

::: 


## 2. 优点与缺点

#### 2.1 优点

NameServer集群各实例不通讯的设计好处：

1. 实现简单，在复杂的网络环境中NameServer实现简单，无需引入大量的分布式系统的理论去提供数据一致性的支持
2. NameServer的横向拓展更好，因为NameServer的各实例之间没有通讯，当Consume和Producer从NameServer拉取数据导致NameServer压力过大的时候。此时可以通过横向拓展新增加新的NameServer来减轻压力。

#### 2.2 缺点

当Broker的数量较多，连接数过多的时候会对NameServer造成一定的压力。

## 3. MQ5相对于MQ4的改进

NameServer在RocketMQ5.0的版本做了很多的优化工作：

1. broker注册线程池和客户端路由获取线程池隔离

   当前NameServer会用同一个线程池和队列去处理所有的客户端路由请求，服务端注册请求等，并且队列的大小和线程数都是不可配置的，如果其中一个类型的请求打爆线程池，将会影响到所有请求。将线程池进行了隔离，将最重要要的客户端路由请求单独隔离出来，队列的大小和线程数均是可配置的。线程池之间的请求处理相互隔离，不受影响。

2. Topic 路由缓存的优化

   当前NameServer当客户端发送路由请求时，会利用topicQueueTable和brokerAddrTable来构造出最终的路由信息TopicRouteData，这里涉及了在读锁中遍历 broker，有一定的cpu耗费。通过构造TopicRoute的缓存topicRouteDataMap，直接在客户端请求时返回TopicRoute，而额外的代价是在broker请求、下线，删除topic等行为时同时操作topicRouteDataMap。

3. 批量注销Broker

   增加BatchUnRegisterService，异步化批量处理broker下线，加速broker下线流程。

:::info

[RIP-29](https://github.com/apache/rocketmq/wiki/RIP-29-Optimize-RocketMQ-NameServer) 是NameServer的改进增强

:::

## 4.优化联想-（提交ISSUE#5698讨论是否有必要）

生产者和消费者连接NameServer获取路由信息都是随机的，从给定的NameServer列表中打散列表随机选择一个NameServer进行连接获取数据。这种情况存在如下弊端：

1. NameServer部署的较好的机器无法发挥机器的所有性能，而性能较差的机器可能连接很多导致服务宕机。
2. 不能够指定NameServer进行连接(只配置一个NameServer地址除外)。

所以考虑在客户端(生产者和消费者)增加选择连接NameServer的策略模式，由开发者自己选择或者实现策略来选择NameServer进行连接。可以考虑一下策略模式：

1. 随机策略：随机一个NameServer进行连接(当前的模式)。
2. 指定策略：指定一个特定的NameServer进行连接。
3. 轮询策略：当前应用中的客户端自行在给定的NameServer。
4. NameServer最小客户端连接数策略：获取当前NameServer中客户端连接数最小的进行连接。

后续还可以增加其他的策略。

