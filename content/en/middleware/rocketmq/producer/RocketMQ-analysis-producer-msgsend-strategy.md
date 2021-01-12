---
title: RocketMQ源码解析-生产者投递消息策略
categories:
  - MQ
  - RocketMQ
  - producer
tags:
  - MQ
  - RocketMQ
  - producer
  - 生产者投递消息策略
abbrlink: 544b0df5
date: 2020-03-25 23:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### 消息类型

![RocketMQMessageType.png](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RocketMQMessageType.png?raw=true)

### 基于Queue队列轮询算法投递

####  默认轮询算法

默认情况下，采用了最简单的轮询算法，这种算法有个很好的特性就是，保证每一个Queue队列的消息投递数量尽可能均匀。看一下代码的实现，

```java
//DefaultMQProducerImpl selectOneMessageQueue选择队列
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
        return this.mqFaultStrategy.selectOneMessageQueue(tpInfo, lastBrokerName);
}

//MQFaultStrategy selectOneMessageQueue
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
        if (this.sendLatencyFaultEnable) {
            try {
                int index = tpInfo.getSendWhichQueue().getAndIncrement();
                for (int i = 0; i < tpInfo.getMessageQueueList().size(); i++) {
                    int pos = Math.abs(index++) % tpInfo.getMessageQueueList().size();
                    if (pos < 0)
                        pos = 0;
                    MessageQueue mq = tpInfo.getMessageQueueList().get(pos);
                    if (latencyFaultTolerance.isAvailable(mq.getBrokerName())) {
                        if (null == lastBrokerName || mq.getBrokerName().equals(lastBrokerName))
                            return mq;
                    }
                }

                final String notBestBroker = latencyFaultTolerance.pickOneAtLeast();
                int writeQueueNums = tpInfo.getQueueIdByBroker(notBestBroker);
                if (writeQueueNums > 0) {
                    final MessageQueue mq = tpInfo.selectOneMessageQueue();
                    if (notBestBroker != null) {
                        mq.setBrokerName(notBestBroker);
                        mq.setQueueId(tpInfo.getSendWhichQueue().getAndIncrement() % writeQueueNums);
                    }
                    return mq;
                } else {
                    latencyFaultTolerance.remove(notBestBroker);
                }
            } catch (Exception e) {
                log.error("Error occurred when selecting message queue", e);
            }

            return tpInfo.selectOneMessageQueue();
        }

        return tpInfo.selectOneMessageQueue(lastBrokerName);
    }
```
在默认的情况下 **`sendLatencyFaultEnable=false`** 直接调用的是 **`TopicPublishInfo.selectOneMessageQueue`** 方法:

```java
//发布的对象中TopicPublishInfo
public class TopicPublishInfo {

    //基于线程上下文的计数递增--用于轮询目的
    private volatile ThreadLocalIndex sendWhichQueue = new ThreadLocalIndex();

    public MessageQueue selectOneMessageQueue(final String lastBrokerName) {
        if (lastBrokerName == null) {
            return selectOneMessageQueue();
        } else {
            int index = this.sendWhichQueue.getAndIncrement();
            for (int i = 0; i < this.messageQueueList.size(); i++) {
                //轮询
                int pos = Math.abs(index++) % this.messageQueueList.size();
                if (pos < 0)
                    pos = 0;
                MessageQueue mq = this.messageQueueList.get(pos);
                if (!mq.getBrokerName().equals(lastBrokerName)) {
                    return mq;
                }
            }
            return selectOneMessageQueue();
        }
    }
    
    //获取消费队列
    public MessageQueue selectOneMessageQueue() {
        int index = this.sendWhichQueue.getAndIncrement();
        int pos = Math.abs(index) % this.messageQueueList.size();
        if (pos < 0)
            pos = 0;
        return this.messageQueueList.get(pos);
    }
}
```
#### 默认投递方式的增强
基于Queue队列轮询算法和消息投递延迟最小的策略投递，默认的投递方式比较简单，但是也暴露了一个问题，就是有些Queue队列可能由于自身数量积压等原因，可能在投递的过程比较长，对于这样的Queue队列会影响后续投递的效果。
 基于这种现象，RocketMQ在每发送一个MQ消息后，都会统计一下消息投递的时间延迟，根据这个时间延迟，可以知道往哪些Queue队列投递的速度快。 在这种场景下，会优先使用消息投递延迟最小的策略，如果没有生效，再使用Queue队列轮询的方式。

```java
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
        if (this.sendLatencyFaultEnable) {
            try {
                int index = tpInfo.getSendWhichQueue().getAndIncrement();
                for (int i = 0; i < tpInfo.getMessageQueueList().size(); i++) {
                    int pos = Math.abs(index++) % tpInfo.getMessageQueueList().size();
                    if (pos < 0)
                        pos = 0;
                    //轮询获取
                    MessageQueue mq = tpInfo.getMessageQueueList().get(pos);
                    //第一次返回一定是true
                    if (latencyFaultTolerance.isAvailable(mq.getBrokerName())) {
                        if (null == lastBrokerName || mq.getBrokerName().equals(lastBrokerName))
                            return mq;
                    }
                }

                // 从延迟容错broker列表中挑选一个容错性最好的一个 broker
                final String notBestBroker = latencyFaultTolerance.pickOneAtLeast();
                int writeQueueNums = tpInfo.getQueueIdByBroker(notBestBroker);
                if (writeQueueNums > 0) {
                    final MessageQueue mq = tpInfo.selectOneMessageQueue();
                    if (notBestBroker != null) {
                        // 取余挑选其中一个队列
                        mq.setBrokerName(notBestBroker);
                        mq.setQueueId(tpInfo.getSendWhichQueue().getAndIncrement() % writeQueueNums);
                    }
                    return mq;
                } else {
                    latencyFaultTolerance.remove(notBestBroker);
                }
            } catch (Exception e) {
                log.error("Error occurred when selecting message queue", e);
            }

            return tpInfo.selectOneMessageQueue();
        }

        return tpInfo.selectOneMessageQueue(lastBrokerName);
    }
```
数据的设置在：

```java
private SendResult sendDefaultImpl(
        Message msg,
        final CommunicationMode communicationMode,
        final SendCallback sendCallback,
        final long timeout
    ) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
    //省略代码
    
    //这里就是把发送消息的数据到broker时间
    this.updateFaultItem(mq.getBrokerName(), endTimestamp - beginTimestampPrev, false);
    
    //省略代码
}
```
### 顺序消息的投递
上面的两种消息的投递方式时序性没有要求的场景，这种投递的速度和效率比较高。而在有些场景下，需要保证同类型消息投递和消费的顺序性。通过一定的策略，将其放置在一个 queue队列中。看一下在生产者中如何发送顺序消息：

```java
public class OrderedProducer {
    public static void main(String[] args) throws Exception {
        //Instantiate with a producer group name.
        MQProducer producer = new DefaultMQProducer("example_group_name");
        //Launch the instance.
        producer.start();
        String[] tags = new String[] {"TagA", "TagB", "TagC", "TagD", "TagE"};
        for (int i = 0; i < 100; i++) {
            int orderId = i % 10;
            //Create a message instance, specifying topic, tag and message body.
            Message msg = new Message("TopicTestjjj", tags[i % tags.length], "KEY" + i,
                    ("Hello RocketMQ " + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
            SendResult sendResult = producer.send(msg, new MessageQueueSelector() {
            @Override
            public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
                Integer id = (Integer) arg;
                int index = id % mqs.size();
                return mqs.get(index);
            }
            }, orderId);

            System.out.printf("%s%n", sendResult);
        }
        //server shutdown
        producer.shutdown();
    }
}

```
上面的例子是官网的一个例子。通过ID来选择发送的broker中的某一个写入队列。生产者在消息的投递过程中使用了 **`MessageQueueSelector`** 作为消息队列的选择策略。

```java
public interface MessageQueueSelector {
    MessageQueue select(final List<MessageQueue> mqs, final Message msg, final Object arg);
}
```
在MQ中默认提供了三种实现:

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/MessageQueueSelector.png?raw=true)

SelectMessageQueueByHash的实现：

```java
public class SelectMessageQueueByHash implements MessageQueueSelector {

    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        int value = arg.hashCode();
        if (value < 0) {
            value = Math.abs(value);
        }

        value = value % mqs.size();
        return mqs.get(value);
    }
}
```

SelectMessageQueueByMachineRoom的实现：

```java
public class SelectMessageQueueByMachineRoom implements MessageQueueSelector {
    private Set<String> consumeridcs;

    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        return null;
    }

    public Set<String> getConsumeridcs() {
        return consumeridcs;
    }

    public void setConsumeridcs(Set<String> consumeridcs) {
        this.consumeridcs = consumeridcs;
    }
}
```

SelectMessageQueueByRandom的实现：

```java
public class SelectMessageQueueByRandom implements MessageQueueSelector {
    private Random random = new Random(System.currentTimeMillis());

    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        int value = random.nextInt(mqs.size());
        return mqs.get(value);
    }
}
```

