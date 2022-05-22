---
title: "RocketMQ保证消息不丢失"
linkTitle: "RocketMQ保证消息不丢失"
date: 2022-05-14
weight: 202205141648
---

### 1 背景

在金融系统中MQ消息的消息丢失是不允许的，消息的丢失会导致支付状态订单状态出现混乱。接下来聊一下如何保证MQ消息不丢失,以笔者公司使用的RocketMQ为例。

### 2 RokectMQ消息什么情况下会丢失？

MQ的消息生成到消费主要经历三个阶段：MQ消息生产、RocketMQ Broker存储消息、消费者消息对应的消息。如下图：

![RocketMQ消息流经的几个关键节点](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/RocketMQ%E6%B6%88%E6%81%AF%E6%B5%81%E7%BB%8F%E7%9A%84%E5%87%A0%E4%B8%AA%E5%85%B3%E9%94%AE%E8%8A%82%E7%82%B9.png)

从上图可以知道消息丢失主要会发生在下面几个地方：

- 消息生产者将消息发送到RocketMQ Broker的这个过程可能出现消息丢失。
- RocketMQ Broker接收到生产者发送的消息存储的过程消息可能丢失。
- 消费者处理失败，但是将错误进行捕捉，导致消息出现虚假的消费成功。实际上没有消费，但是在MQ看来消费完成了消费。

### 3 如何解决RokectMQ消息丢失

解决消息丢失从消息丢失的地方入手。

#### 3.1 消息生产防止消息丢失

RocketMQ消息生产方式有三种：同步发送消息、异步发送消息、One-Way发送消息。不同的发送方式试用不同的场景：

**`同步发送消息：`** 重要的通知(订单状态的更新)、短信系统。

**`异步发送消息：`** 通常用于响应时间敏感的业务场景。

**`One-way：`** 主要用于对可靠性要求不高的场景，在金融的场景下不适用。一般是用于日志收集。

根据上面三种发送方式的特点， **`one-way`** 的消息发送模式本身就是不对消息的不丢失无法保证。所有如果你的系统对消息丢失零容忍不能使用 **`one-way`** 的方式发送。**`同步发送消息和异步发送消息`** 都可以判断消息的发送状态判断消息是否已经发送到Broker。这里是选择同步发送还是异步发送消息看业务的需要，同步发送比较关心发送后返回的结果对时间的要求不是那么敏感。异步发送对消息返回时间敏感。

![RocketMQ发送消息不丢失流程](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/RocketMQ%E5%8F%91%E9%80%81%E6%B6%88%E6%81%AF%E4%B8%8D%E4%B8%A2%E5%A4%B1%E6%B5%81%E7%A8%8B.png)

SendResult定义说明(**[来自RocketMQ官方](https://github.com/apache/rocketmq/blob/develop/docs/cn/best_practice.md)**)

- **SEND_OK**

  消息发送成功。要注意的是消息发送成功也不意味着它是可靠的。要确保不会丢失任何消息，还应启用同步Master服务器或同步刷盘，即SYNC_MASTER或SYNC_FLUSH。

- **FLUSH_DISK_TIMEOUT**

  消息发送成功但是服务器刷盘超时。此时消息已经进入服务器队列（内存），只有服务器宕机，消息才会丢失。消息存储配置参数中可以设置刷盘方式和同步刷盘时间长度，如果Broker服务器设置了刷盘方式为同步刷盘，即FlushDiskType=SYNC_FLUSH（默认为异步刷盘方式），当Broker服务器未在同步刷盘时间内（默认为5s）完成刷盘，则将返回该状态——刷盘超时。

- **FLUSH_SLAVE_TIMEOUT**

  消息发送成功，但是服务器同步到Slave时超时。此时消息已经进入服务器队列，只有服务器宕机，消息才会丢失。如果Broker服务器的角色是同步Master，即SYNC_MASTER（默认是异步Master即ASYNC_MASTER），并且从Broker服务器未在同步刷盘时间（默认为5秒）内完成与主服务器的同步，则将返回该状态——数据同步到Slave服务器超时。

- **SLAVE_NOT_AVAILABLE**

  消息发送成功，但是此时Slave不可用。如果Broker服务器的角色是同步Master，即SYNC_MASTER（默认是异步Master服务器即ASYNC_MASTER），但没有配置slave Broker服务器，则将返回该状态——无Slave服务器可用。

#### 3.2 RocketMQ Broker防丢失消息

首先了解一下Broker集群部署模式([官方方案](https://github.com/apache/rocketmq/blob/develop/docs/cn/operation.md))。

**单Master模式**

这种方式风险较大，一旦Broker重启或者宕机时，会导致整个服务不可用。不建议线上环境使用,可以用于本地测试。

**多Master模式**

 一个集群无Slave，全是Master，例如2个Master或者3个Master，这种模式的优缺点如下

- 优点：配置简单，单个Master宕机或重启维护对应用无影响，在磁盘配置为RAID10时，即使机器宕机不可恢复情况下，由于RAID10磁盘非常可靠，消息也不会丢（异步刷盘丢失少量消息，同步刷盘一条不丢），性能最高；
- 缺点：单台机器宕机期间，这台机器上未被消费的消息在机器恢复之前不可订阅，消息实时性会受到影响。

 **多Master多Slave模式-异步复制**

每个Master配置一个Slave，有多对Master-Slave，HA采用异步复制方式，主备有短暂消息延迟（毫秒级），这种模式的优缺点如下

- 优点：即使磁盘损坏，消息丢失的非常少，且消息实时性不会受影响，同时Master宕机后，消费者仍然可以从Slave消费，而且此过程对应用透明，不需要人工干预，性能同多Master模式几乎一样；
- 缺点：Master宕机，磁盘损坏情况下会丢失少量消息(非同步刷盘的情况下)

**多Master多Slave模式-同步双写** 

每个Master配置一个Slave，有多对Master-Slave，HA采用同步双写方式，即只有主备都写成功，才向应用返回成功，这种模式的优缺点如下：

- 优点：数据与服务都无单点故障，Master宕机情况下，消息无延迟，服务可用性与数据可用性都非常高；
- 缺点：性能比异步复制模式略低（大约低10%左右），发送单个消息的RT会略高，且目前版本在主节点宕机后，备机不能自动切换为主机

如果是想不存在消息丢失的情况，那么在多Master的情况下要配置消息同步刷盘，而在 **多Master多Slave模式-同步双写**  的情况下配置同步刷盘。

#### 3.3 消费端处理消息

消息消费示例代码如下：

```java
public class Consumer {

    public static void main(String[] args) throws InterruptedException, MQClientException {

        // Instantiate with specified consumer group name.
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("please_rename_unique_group_name");
         
        // Specify name server addresses.
        consumer.setNamesrvAddr("localhost:9876");
        
        // Subscribe one more more topics to consume.
        consumer.subscribe("TopicTest", "*");
        // Register callback to execute on arrival of messages fetched from brokers.
        consumer.registerMessageListener(new MessageListenerConcurrently() {

            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs,
                ConsumeConcurrentlyContext context) {
                //处理消息
                System.out.printf("%s Receive New Messages: %s %n", Thread.currentThread().getName(), msgs);
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });

        //Launch the consumer instance.
        consumer.start();

        System.out.printf("Consumer Started.%n");
    }
}
```

在处理消息的时候，如果消息处理失败返回的状态不应该是 **`ConsumeConcurrentlyStatus.CONSUME_SUCCESS`** 。如果消息处理失败返回的是 **`ConsumeConcurrentlyStatus.CONSUME_SUCCESS`** 消息就不能再次被消息。在Broker看来就是已经消费完成。

### 4 总结

MQ消息的丢失主要发生在发送、存储、消费消息的三个阶段，所以需要防止消息丢失也要从这三个方面着手。

- 发送消息使用同步或者异步的方式，然后根据返回的 **`SendResult`** 来判断是否发送成功
- Broker的刷盘方式配置成同步刷盘
- 消息消息失败根据业务需要来判断是否需要重新消费消息。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！