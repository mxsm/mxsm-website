---
title: RocketMQ源码解析-Broker启动
categories:
  - MQ
  - RocketMQ
  - Broker
tags:
  - MQ
  - RocketMQ
  - Broker源码解析
  - Broker工作机制
  - Broker启动
abbrlink: dcc2a75f
date: 2020-03-15 00:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### Broker

消息中转角色，负责存储消息、转发消息。Broker在RocketMQ系统中负责接收从生产者发送来的消息并存储、同时为消费者的拉取请求作准备。代理服务器也存储消息相关的元数据，包括消费者组、消费进度偏移和主题和队列消息等。

### Broker作用

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/Broker%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8%E5%9B%BE.png?raw=true)

主要四个作用：

- 消息存储
- 消息投递
- 消息查询
- 服务的高可用

这四个功能由五个模块来实现。

### Broker启动流程分析

总体的启动流程和NameServer的启动流程差不多但是比NameServer的启动流程复杂：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/BrokerControllerFlowchart.png?raw=true)

这个流程大致分为以下的几个步骤：

1. **BrokerController创建**
   - NettyServer和NettyClient的配置处理
   - 命令行参数的处理
   - Broker角色的处理
   - 创建BrokerController
   - 初始化BrokerController通过调用方法
2. **BrokerController启动**

### BrokerController创建

**`BrokerStartUp.createBrokerController`** 调用方法创建

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/%E8%AE%BE%E7%BD%AE%E5%8F%91%E9%80%81%E5%8C%BA%E6%8E%A5%E6%94%B6%E5%8C%BA%E7%9A%84%E7%BC%93%E5%AD%98.png?raw=true)

上图是设置Netty的发送和接收缓冲区的大小。

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/Broker%E8%A7%92%E8%89%B2%E5%A4%84%E7%90%86.png?raw=true)

上图主要是处理在集群条件小的Broker角色的，从这里看出来brokerId为0的为Mater节点，其他的为Slave节点。

> 角色类型：SYNC_MASTER/ASYNC_MASTER/SLAVE 默认为ASYNC_MASTER，
>
> 官方文档：https://rocketmq.apache.org/docs/rmq-deployment/

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/%E5%91%BD%E4%BB%A4%E8%A1%8C%E5%8F%82%E6%95%B0%E5%A4%84%E7%90%86.png?raw=true)

上图是处理命令行参数

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/%E5%88%9D%E5%A7%8B%E5%8C%96BrokerController.png?raw=true)

初始化BrokerController。然后返回controller。

### BrokerController启动

```java
    public static BrokerController start(BrokerController controller) {
        try {

            controller.start();

            String tip = "The broker[" + controller.getBrokerConfig().getBrokerName() + ", "
                + controller.getBrokerAddr() + "] boot success. serializeType=" + RemotingCommand.getSerializeTypeConfigInThisServer();

            if (null != controller.getBrokerConfig().getNamesrvAddr()) {
                tip += " and name server is " + controller.getBrokerConfig().getNamesrvAddr();
            }

            log.info(tip);
            System.out.printf("%s%n", tip);
            return controller;
        } catch (Throwable e) {
            e.printStackTrace();
            System.exit(-1);
        }

        return null;
    }

```

启动比较简单，调用start方法。

### Broker配置

| Property Name          |           Default value           |                                                      Details |
| :--------------------- | :-------------------------------: | -----------------------------------------------------------: |
| listenPort             |               10911               |                                       listen port for client |
| namesrvAddr            |               null                |                                          name server address |
| brokerIP1              | InetAddress for network interface |            Should be configured if having multiple addresses |
| brokerName             |               null                |                                                  broker name |
| brokerClusterName      |          DefaultCluster           |                         this broker belongs to which cluster |
| brokerId               |                 0                 |      broker id, 0 means master, positive integers mean slave |
| storePathCommitLog     |      $HOME/store/commitlog/       |                                     file path for commit log |
| storePathConsumerQueue |     $HOME/store/consumequeue/     |                                  file path for consume queue |
| mapedFileSizeCommitLog |      1024 * 1024 * 1024(1G)       |                              mapped file size for commit log |
| deleteWhen             |                04                 | When to delete the commitlog which is out of the reserve time |
| fileReserverdTime      |                72                 |   The number of hours to keep a commitlog before deleting it |
| brokerRole             |           ASYNC_MASTER            |                               SYNC_MASTER/ASYNC_MASTER/SLAVE |
| flushDiskType          |            ASYNC_FLUSH            | {SYNC_FLUSH/ASYNC_FLUSH}. Broker of SYNC_FLUSH mode flushes each message onto disk before acknowledging producer. Broker of ASYNC_FLUSH mode, on the other hand, takes advantage of group-committing, achieving better performance. |