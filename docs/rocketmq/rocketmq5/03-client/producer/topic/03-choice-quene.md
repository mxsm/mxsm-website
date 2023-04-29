---
title: "生产者发送的消息如何根据Topic路由信息选择发送的Broker和队列"
linkTitle: "生产者发送的消息如何根据Topic路由信息选择发送的Broker和队列"
sidebar_position: 202303072143
description: 生产者发送的消息如何根据Topic路由信息选择发送的Broker和队列
---

## 1. 引言

在前面的几篇文章中阐述了RocketMQ生产者是如何更新Topic路由信息以及从生产者角度Topic如何创建的。下面就来详细分析RocketMQ生产者是如何根据Topic的路由信息来选择发送的Broker以及Broker发送的队列。

## 2. 消息发送过程分析

下面分析一下消息发送到Broker的整个过程。以官方的生产者为例子：

```java
public class Producer {

    public static final int MESSAGE_COUNT = 1000;
    public static final String PRODUCER_GROUP = "please_rename_unique_group_name";
    public static final String DEFAULT_NAMESRVADDR = "127.0.0.1:9876";
    public static final String TOPIC = "TopicTest";
    public static final String TAG = "TagA";

    public static void main(String[] args) throws MQClientException, InterruptedException {
        DefaultMQProducer producer = new DefaultMQProducer(PRODUCER_GROUP);
        producer.setNamesrvAddr(DEFAULT_NAMESRVADDR);
        producer.start();

        for (int i = 0; i < MESSAGE_COUNT; i++) {
            try {
                Message msg = new Message(TOPIC /* Topic */,
                    TAG /* Tag */,
                    ("Hello RocketMQ " + i).getBytes(RemotingHelper.DEFAULT_CHARSET) /* Message body */
                );
                SendResult sendResult = producer.send(msg);

                System.out.printf("%s%n", sendResult);
            } catch (Exception e) {
                e.printStackTrace();
                Thread.sleep(1000);
            }
        }
        producer.shutdown();
    }
}

```

:::info
用发送单条普通消息为例子来讲解，中间会掺杂降到顺序消息以及批量消息
:::

### 2.1 DefaultMQProducerImpl#sendDefaultImpl

通过跟进消息送的代码可以发现最终是进入到了 `DefaultMQProducerImpl#sendDefaultImpl` 方法。整个消息发送的主要逻辑也在这个方法中，主要分成了一下几个大的模块：

1.  **根据发送消息的Topic获取Topic的路由信息**
2.  **根据模式来确定发送失败重试的次数**
    *   **CommunicationMode.SYNC默认重试2次，一共执行三次**
    *   **CommunicationMode.ASYNC和CommunicationMode.ONEWAY，无重试。发送消息**
3.  **选择消息发送的Broker以及Broker对应的消息队列**
4.  **调用DefaultMQProducerImpl#sendKernelImpl方法发送消息到Broker**
5.  **根据CommunicationMode模式来判断在发送失败的情况下是否需要进行重试操作**

上面的方法就包含了整个消息发送的过程。下面就来讲一下其中最重要的部分消息队列的选择也就是生产者的负载均衡。

## 3. 负载均衡策略

消息队列的选择主要是在 **`DefaultMQProducerImpl#sendDefaultImpl`**方法中下面这一段代码实现的：

```java
MessageQueue mqSelected = this.selectOneMessageQueue(topicPublishInfo, lastBrokerName);
```

最终调用的是`MQFaultStrategy#selectOneMessageQueue`方法：

```java jxs title="MQFaultStrategy#selectOneMessageQueue"
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
    if (this.sendLatencyFaultEnable) {
		//省略部分代码-故障延迟机制代码
    }

    return tpInfo.selectOneMessageQueue(lastBrokerName);
}
```

`sendLatencyFaultEnable` 在默认的情况下是false。

:::info

sendLatencyFaultEnable表示是否开启故障延迟机制来规避故障Broker

:::

### 3.1 选择队列的方式

默认机制即`sendLatencyFaultEnable=false`，此时调用的方法是 `TopicPublishInfo#selectOneMessageQueue`

```java jxs title="TopicPublishInfo#selectOneMessageQueue"
public MessageQueue selectOneMessageQueue(final String lastBrokerName) {
    //第一次发送消息的时候为null
    if (lastBrokerName == null) {
        return selectOneMessageQueue();
    } else {
        for (int i = 0; i < this.messageQueueList.size(); i++) {
            int index = this.sendWhichQueue.incrementAndGet();
            int pos = index % this.messageQueueList.size();
            MessageQueue mq = this.messageQueueList.get(pos);
            if (!mq.getBrokerName().equals(lastBrokerName)) {
                return mq;
            }
        }
        return selectOneMessageQueue();
    }
}
```

这里的lastBrokerName指的是上一次执行消息发送时选择失败的broker，在重试机制下，第一次执行消息发送时，lastBrokerName=null，直接选择以下方法：

`TopicPublishInfo#selectOneMessageQueue` 这个是不带参数的

```java jxs title="TopicPublishInfo#selectOneMessageQueue"
public MessageQueue selectOneMessageQueue() {
    int index = this.sendWhichQueue.incrementAndGet();
    int pos = index % this.messageQueueList.size();

    return this.messageQueueList.get(pos);
}
```

sendWhichQueue是一个利用ThreadLocal本地线程存储自增值的一个类，自增值第一次使用Random类随机取值，此后如果消息发送出发或者重试机制，那么每次自增取值。此方法直接用sendWhichQueue自增获取值，再与消息队列的长度进行取模运算，取模目的是为了循环选择消息队列。

此时选择的队列发送消息失败了，此时重试机制在再次选择队列时lastBrokerName不为空，回到最开始的那个方法执行elsef分支，还是利用sendWhichQueue自增获取值，但这里多了一个步骤，与消息队列的长度进行取模运算后，如果此时选择的队列所在的broker还是上一次选择失败的broker，则继续选择下一个队列。

:::info

我们可以试想一下，如果此时有broker宕机了，在默认机制下很可能下一次选择的队列还是在已经宕机的broker，没有办法规避故障的broker，因此消息发送很可能会再次失败，重试发送造成了不必要的性能损失。所以通过sendLatencyFaultEnable参数来开启rocketmq采用Broker故障延迟机制来规避故障的broker

:::

### 3.2 Broker故障延迟机制

#### 3.2.1 故障延迟机制分析

`sendLatencyFaultEnable=true`，消息发送选择队列调用以下方法：**`MQFaultStrategy#selectOneMessageQueue`** 的if分支，

```java jxs title="MQFaultStrategy#selectOneMessageQueue"
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
    if (this.sendLatencyFaultEnable) {
        try {
            int index = tpInfo.getSendWhichQueue().incrementAndGet();
            for (int i = 0; i < tpInfo.getMessageQueueList().size(); i++) {
                int pos = index++ % tpInfo.getMessageQueueList().size();
                MessageQueue mq = tpInfo.getMessageQueueList().get(pos);
                if (latencyFaultTolerance.isAvailable(mq.getBrokerName()))
                    return mq;
            }

            final String notBestBroker = latencyFaultTolerance.pickOneAtLeast();
            int writeQueueNums = tpInfo.getWriteQueueIdByBroker(notBestBroker);
            if (writeQueueNums > 0) {
                final MessageQueue mq = tpInfo.selectOneMessageQueue();
                if (notBestBroker != null) {
                    mq.setBrokerName(notBestBroker);
                    mq.setQueueId(tpInfo.getSendWhichQueue().incrementAndGet() % writeQueueNums);
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
	//省略部分代码
}
```

这个主要做了一下几个事情：

- 获取本地线程变量中的值然后和队列长度进行取模选择出来一个消息队列
- 去LatencyFaultTolerance中判断队列所在的Broker是否可用，如果不可用继续寻找。
- 如果不存在可用的，从故障延迟的Broker中选择一个，然后获取写队列大于0的Broker。如果没有将故障延迟Broker删除掉。

**Broker故障延迟机制的作用：**

1. 根据是失败还是网络延迟发送消息缓慢将Broker分成两类：需要隔离，不需要隔离的Broker。对于需要隔离Broker是没办法选择发送的，而对于不需要隔离的是可以选择发送消息的。
2. 在出现发送失败的情况下通过延迟机制来规避性能不好的Broker。

#### 3.2.2 故障延迟机制何时触发

以DefaultMQProducerImpl#sendDefaultImpl为例子，主要有以下几个地方：

- 正常的发送成功会触发(这里只有sendLatencyFaultEnable来控制，本人觉得还可以增加一个发送耗时)
- 在发送抛RemotingException、MQClientException、MQBrokerException的情况下触发，与此同时此时的Broker是被隔离的
- 抛InterruptedException错误的时候也会触发，与此同时此时的Broker是不被隔离的

## 4. 总结

- 客户端从NameServer获取到对应Topic的路由信息
- 本地线程变量通过自增来和消息队列信息来选择消息要发送的队列
- 为了解决发送失败和发送消息到Broker出现较长的延迟从而提供了Broker故障延迟机制来解决。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)~谢谢!