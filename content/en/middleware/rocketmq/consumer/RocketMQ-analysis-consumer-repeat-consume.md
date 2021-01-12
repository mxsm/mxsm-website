---
title: RocketMQ源码解析-消费者重复消费
categories:
  - MQ
  - RocketMQ
  - consumer
tags:
  - MQ
  - RocketMQ
  - consumer
  - 消费者重复消费
abbrlink: f3dbd8ae
date: 2020-04-23 21:40:00
---

### 重复消费

对于MQ不可避免的要牵涉到消息的重复消费，消息重复消费情况千奇百怪。下面就分析一下一些常见的场景。平时的使用过程中要注意的情况。以及如何避免一些重复消费。

### 重复消费的场景分析

#### 业务处理时候失败

首先借用官网的代码看一下：

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
				//进行业务处理完成-- 操作已经入库
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });

        //Launch the consumer instance.
        consumer.start();

        System.out.printf("Consumer Started.%n");
    }
}
```

- 如面代码所示，已经处理了业务逻辑但是没有自行 **`return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;`** 代码。如果这个时候程序运行失败或者宕机。那么就会存在重复消费。
- 上面代码每次默认取1条消息进行消费，但是为了消费加快，我们可以通过 **`consumer.setConsumeMessageBatchMaxSize();`** 设置大小，如果设置10或者更大，在消费完成没有完全完成抛错。那么就会存现重复消费的情况。

#### 直接结束消费者进程

直接结束消费者进程在Linux中非kill -9的方式结束。在这种情况下就不会调用Hook来持久化。然后在每次消费过程中不是事实去更新消费进度，**`MQClientInstance`** 类中

```java
        this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                try {
                    MQClientInstance.this.persistAllConsumerOffset();
                } catch (Exception e) {
                    log.error("ScheduledTask persistAllConsumerOffset exception", e);
                }
            }
        }, 1000 * 10, this.clientConfig.getPersistConsumerOffsetInterval(), TimeUnit.MILLISECONDS);
```

这里是定期5秒自行一次。所以在五秒内出了问题又没办法自行Hook的情况下就会重新消费。

在并发消费过程中会有这样的一个问题，队列中前面的消息后消费，后面的消息已经消费完成了。这里就会存在这一的一个问题如图所示：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RocketMQ%E6%B6%88%E8%B4%B9%E5%9B%BE.png?raw=true)

如果是最上面的队列全部消费了那么序列化的就是7后面的消息。而对于第二个那么如果此时消费者停止宕机。那么序列化的就是2后面的而不是7这样重新启动消费。那么就会重新消费7。

这种情况下如果也是直接结束进程，那么也会出现重启后的消息重复消费的情况。

