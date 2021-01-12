---
title: RocketMQ源码解析-RocketMQ消息ACK机制及消费进度管理
categories:
  - MQ
  - RocketMQ
  - consumer
tags:
  - MQ
  - RocketMQ
  - consumer
  - RocketMQ消息ACK机制
  - 消费进度管理
  - RocketMQ消息ACK机制及消费进度管理
abbrlink: fa30b572
date: 2020-04-21 00:02:00
---

> 以下源码基于Rocket MQ 4.7.0

### 消息的ACK机制
consumer的每个实例是靠AllocateMessageQueueStrategy队列分配来决定如何消费消息的。那么消费进度具体是如何管理的，又是如何保证消息成功消费的?（RocketMQ有保证消息肯定消费成功的特性,失败则重试）？由于以上工作所有的机制都实现在PushConsumer中，所以本文的原理均只适用于RocketMQ中的PushConsumer即Java客户端中的DefaultPushConsumer。 若使用了PullConsumer模式，类似的工作如何ack，如何保证消费等均需要使用方自己实现。
### 消费进度管理
在创建消费者添加了一个消费回调监听器：

```java
//并发消费监听器
consumer.registerMessageListener(new MessageListenerConcurrently() {

    @Override
    public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs,ConsumeConcurrentlyContext context) {
        //用户自定义业务处理
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    }
});
```

```java
//顺序消费监听器
consumer.registerMessageListener(new MessageListenerOrderly() {

    AtomicLong consumeTimes = new AtomicLong(0);
    @Override
    public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs,ConsumeOrderlyContext context) {
        
		//用户业务处理
  
        return ConsumeOrderlyStatus.SUCCESS;

    }
});
```
在执行完成监听器的业务逻辑后根据返回的状态客户端做后续的处理，这里分为两种：
1. ConsumeOrderlyStatus(SUCCESS,SUSPEND_CURRENT_QUEUE_A_MOMENT 其他的被Deprecated标记)
2. ConsumeConcurrentlyStatus(CONSUME_SUCCESS,RECONSUME_LATER)


#### 并发消费进度管理
并发消费主要通过ConsumeMessageConcurrentlyService来处理。ConsumeMessageConcurrentlyService#processConsumeResult处理消费的。第一部分根据消费状态统计消费成功和消费失败的TPS信息：
```java
switch (status) {
    case CONSUME_SUCCESS:
        if (ackIndex >= consumeRequest.getMsgs().size()) {
            ackIndex = consumeRequest.getMsgs().size() - 1;
        }
        int ok = ackIndex + 1;
        int failed = consumeRequest.getMsgs().size() - ok;
        this.getConsumerStatsManager().incConsumeOKTPS(consumerGroup, consumeRequest.getMessageQueue().getTopic(), ok);
        this.getConsumerStatsManager().incConsumeFailedTPS(consumerGroup, consumeRequest.getMessageQueue().getTopic(), failed);
        break;
    case RECONSUME_LATER:
        ackIndex = -1;
        this.getConsumerStatsManager().incConsumeFailedTPS(consumerGroup, consumeRequest.getMessageQueue().getTopic(),
            consumeRequest.getMsgs().size());
        break;
    default:
        break;
}
```
接着根据不同的消费模式来处理消费掉的信息和为消费的信息，对于为消费的信息重新提交延迟消费。

```java
switch (this.defaultMQPushConsumer.getMessageModel()) {
    case BROADCASTING:
        for (int i = ackIndex + 1; i < consumeRequest.getMsgs().size(); i++) {
            MessageExt msg = consumeRequest.getMsgs().get(i);
            log.warn("BROADCASTING, the message consume failed, drop it, {}", msg.toString());
        }
        break;
    case CLUSTERING:
        //延迟消费处理
        List<MessageExt> msgBackFailed = new ArrayList<MessageExt>(consumeRequest.getMsgs().size());
        for (int i = ackIndex + 1; i < consumeRequest.getMsgs().size(); i++) {
            MessageExt msg = consumeRequest.getMsgs().get(i);
            boolean result = this.sendMessageBack(msg, context);
            if (!result) {
                msg.setReconsumeTimes(msg.getReconsumeTimes() + 1);
                msgBackFailed.add(msg);
            }
        }

        if (!msgBackFailed.isEmpty()) {
            consumeRequest.getMsgs().removeAll(msgBackFailed);
			//消费失败的重新延迟消费
            this.submitConsumeRequestLater(msgBackFailed, consumeRequest.getProcessQueue(), consumeRequest.getMessageQueue());
        }
        break;
    default:
        break;
}
```
处理完成失败的消息后接着处理更新消费进度：

```java
//每次获取第一个TreeMap中的offset(这里出来的就是当前队列的消费指针所在)
long offset = consumeRequest.getProcessQueue().removeMessage(consumeRequest.getMsgs());
if (offset >= 0 && !consumeRequest.getProcessQueue().isDropped()) {
	//更新消费进度
    this.defaultMQPushConsumerImpl.getOffsetStore().updateOffset(consumeRequest.getMessageQueue(), offset, true);
}
```
上面的代码

```java
long offset = consumeRequest.getProcessQueue().removeMessage(consumeRequest.getMsgs());
```

这段代码获取的是 **`msgTreeMap`** 中的第一个。这里就会存在这一的一个问题如图所示：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RocketMQ%E6%B6%88%E8%B4%B9%E5%9B%BE.png?raw=true)

如果是最上面的队列全部消费了那么序列化的就是7后面的消息。而对于第二个那么如果此时消费者停止宕机。那么序列化的就是2后面的而不是7这样重新启动消费。那么就会重新消费7

下面来看一下如何更新消费进度的。从代码可以看出来是通过调用接口 **OffsetStore#updateOffset** 方法来处理，对于集群消费模式OffsetStore的实现类为RemoteBrokerOffsetStore(另一个实现LocalFileOffsetStore)。创建代码在 DefaultMQPushConsumerImpl#start方法中。那么看一下：

```java
@Override
public void updateOffset(MessageQueue mq, long offset, boolean increaseOnly) {
    if (mq != null) {
        AtomicLong offsetOld = this.offsetTable.get(mq);
        if (null == offsetOld) {
            offsetOld = this.offsetTable.putIfAbsent(mq, new AtomicLong(offset));
        }

        if (null != offsetOld) {
            if (increaseOnly) {
                MixAll.compareAndIncreaseOnly(offsetOld, offset);
            } else {
                offsetOld.set(offset);
            }
        }
    }
}
```
这里就是把数据更新到一个offsetTable中，这个table包含了消息队列和消费进度的对应关系。
这里的消费数据保存在客户端消费集群的内存中，这样就会带来一些问题：

- 消费者宕机了怎么处理消费进度
- 正常情况下如何处理消费进度

上面两个问题的本质归结到一个那就是如何把这些数据持久化，在哪里持久化的问题。如何持久化这个就是说到持久化策略和持久化的时机。持久化的位置这就确定了这些数据加载的位置。接下分析这两个问题。 
OffsetStore 接口主要负责持久化，这里分析的集群消费。RemoteBrokerOffsetStore的实现中看一下 persistAll 这个方法(持久化所有的)

```java
//RemoteBrokerOffsetStore#persistAll 方法
@Override
public void persistAll(Set<MessageQueue> mqs) {
    if (null == mqs || mqs.isEmpty())
        return;

    final HashSet<MessageQueue> unusedMQ = new HashSet<MessageQueue>();

    for (Map.Entry<MessageQueue, AtomicLong> entry : this.offsetTable.entrySet()) {
        MessageQueue mq = entry.getKey();
        AtomicLong offset = entry.getValue();
        if (offset != null) {
            if (mqs.contains(mq)) {
                try {
					//更新消费进度到Broker
                    this.updateConsumeOffsetToBroker(mq, offset.get());
                } catch (Exception e) {
                    log.error("updateConsumeOffsetToBroker exception, " + mq.toString(), e);
                }
            } else {
                unusedMQ.add(mq);
            }
        }
    }

    if (!unusedMQ.isEmpty()) {
        for (MessageQueue mq : unusedMQ) {
            this.offsetTable.remove(mq);
            log.info("remove unused mq, {}, {}", mq, this.groupName);
        }
    }
}
```
调用这个方法主要在两个地方：
- DefaultMQPushConsumerImpl#shutdown ()

```java
public synchronized void shutdown() {
        switch (this.serviceState) {
            case CREATE_JUST:
                break;
            case RUNNING:
                this.consumeMessageService.shutdown();
                this.persistConsumerOffset();
                this.mQClientFactory.unregisterConsumer(this.defaultMQPushConsumer.getConsumerGroup());
                this.mQClientFactory.shutdown();
                log.info("the consumer [{}] shutdown OK", this.defaultMQPushConsumer.getConsumerGroup());
                this.rebalanceImpl.destroy();
                this.serviceState = ServiceState.SHUTDOWN_ALREADY;
                break;
            case SHUTDOWN_ALREADY:
                break;
            default:
                break;
        }
    }
```
- MQClientInstance中的定时任务(会在创客户端的时候启动)
  
```java
//默认是每五秒触发一次
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
通过代码分析可以发现：  **在消费者shutdown的时候会去持久化，然后就在运行过程中每5秒定时去持久化一次消费进度。消费的进度保存在Broker。** 

