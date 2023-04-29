---
title: "MQPushConsumer源码分析"
linkTitle: "MQPushConsumer源码分析"
sidebar_position: 202303092156
description: MQPushConsumer源码分析
---

## 1. 概述

MQPushConsumer的实现类DefaultMQPushConsumer，DefaultMQPushConsumer是RocketMQ中的一种消费者，用于接收并处理消息。

DefaultMQPushConsumer可以按照一定的规则自动从消息队列中获取消息并进行消费。支持两种消息消费模式：并发消费和顺序消费。并发消费是指多个消费者同时消费同一个消息队列中的消息，而顺序消费则是指按照消息的顺序依次进行消费。

使用DefaultMQPushConsumer时，需要先设置消费者组、消息模式、主题订阅信息以及消息监听器等相关信息。然后，启动消费者即可自动获取并消费消息。消费者还支持暂停和恢复消费、增加或删除订阅主题等操作。

DefaultMQPushConsumer的底层实现使用了MQClientInstance和ConsumeMessageService等组件，以及消息队列的负载均衡和重平衡算法。其整体架构清晰、模块化，易于扩展和定制化。

```java
public class Consumer {

    public static final String CONSUMER_GROUP = "please_rename_unique_group_name_4";
    public static final String DEFAULT_NAMESRVADDR = "127.0.0.1:9876";
    public static final String TOPIC = "TopicTest";

    public static void main(String[] args) throws MQClientException {
        
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer(CONSUMER_GROUP);
        consumer.setNamesrvAddr(DEFAULT_NAMESRVADDR);
        consumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_FIRST_OFFSET);
        consumer.subscribe(TOPIC, "*");
        consumer.registerMessageListener((MessageListenerConcurrently) (msg, context) -> {
            System.out.printf("%s Receive New Messages: %s %n", Thread.currentThread().getName(), msg);
            return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
        });
        consumer.start();
        System.out.printf("Consumer Started.%n");
    }
}

```

上述代码来自官网，上述代码实现了如何消费MQ的消息。下面就来源码分析一下DefaultMQPushConsumer的消费过程。

### 2. 初始化DefaultMQPushConsumer

初始化DefaultMQPushConsumer：在初始化DefaultMQPushConsumer时，需要设置消费者组名、NameServer地址以及消息监听器。

- 设置消费者组名

- 设置NameServer地址

  获取消费者消费的Topic的信息

- 设置监听器

  消息监听器用于处理消息的具体消费逻辑。

同时设置消费者消费的起始位置，现在在用的有三种：

- **CONSUME_FROM_LAST_OFFSET**
- **CONSUME_FROM_FIRST_OFFSET**
- **CONSUME_FROM_TIMESTAMP**

告诉消费者应该从何处开始消费消息。

注册消费者监听器：DefaultMQPushConsumer会根据消费者的订阅关系，从指定的Topic中拉取消息，并将消息推送到消费者监听器中进行处理。消费者监听器需要实现ConsumeMessageListener接口，实现onMessage方法来处理消息。

设置消费者消费的主题Topic以及需要的Tag

:::info

消息过滤：在DefaultMQPushConsumer中，可以通过设置MessageSelector来实现消息过滤。消息过滤可以通过表达式来实现，表达式中可以使用消息属性和SQL表达式。

:::

## 3. 启动DefaultMQPushConsumer

`DefaultMQPushConsumer`启动消费实际上是启动`DefaultMQPushConsumerImpl` 的实例。所有的逻辑也是在这里下面我们来进行分析。

### 3.1 配置检查

![image-20230309222802155](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20230309222802155.png)

- 检查一些必须的配置是否符合规则
- 拷贝订阅的信息。

### 3.2 实例化对象

![image-20230309223828739](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20230309223828739.png)

- 实例化MQClientInstance
- RebalanceImpl对象设置一些参数，例如消费者组，消息模式等等

### 3.3 设置消费进度存储方式

![image-20230309224210708](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20230309224210708.png)

- 广播消费存在本地
- 集群消费，消费进度存在Broker

同时启动的时候会将消费进度加载。

### 3.4 创建消费服务

![image-20230309224603476](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20230309224603476.png)

根据监听器是 **MessageListenerOrderly** 还是 **MessageListenerConcurrently** 来判断创建的创建消费消息的服务类型。

### 3.5 启动服务

![image-20230309225942533](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20230309225942533.png)

启动MQClientInstance实例，然后去后续的操作例如：

- 检查Broker是否有效
- 发送心跳给Broker
- 触发再平衡

到这里整个消费者就已经启动。

## 4. 总结

首先会检查配置信息并拷贝订阅信息，然后根据消费者的消息模式设置消费者组。接着，创建MQClientFactory实例，用于管理MQClientInstance和网络连接。然后，将消费者注册到MQClientFactory中，并设置AllocateMessageQueueStrategy、RebalanceImpl、MessageListener等相关信息。

接下来，根据是否顺序消费来创建对应的ConsumeMessageService。ConsumeMessageService是消费消息的核心组件，用于从消息队列中获取消息并进行消费。如果是顺序消费，则创建ConsumeMessageOrderlyService实例；否则，创建ConsumeMessageConcurrentlyService实例。

最后，启动ConsumeMessageService和MQClientFactory，并更新主题订阅信息，发送心跳检。
