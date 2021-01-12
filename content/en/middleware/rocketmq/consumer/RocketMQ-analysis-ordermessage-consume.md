---
title: RocketMQ源码解析-RocketMQ顺序消息的投递与消费
categories:
  - MQ
  - RocketMQ
  - consumer
tags:
  - MQ
  - RocketMQ
  - consumer
  - consumer消费策略
  - RocketMQ顺序消息的投递与消费
abbrlink: 96edbe8
date: 2020-04-19 21:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### 生产顺序消息

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
官网的顺序消息的投递例子，之前也在消息投递策略中分析过， [RocketMQ源码解析-生产者投递消息策略](https://blog.ljbmxsm.com/pages/544b0df5/)。主要是通过 **`MessageQueueSelector`** 选择器来选择投递的消息队列。

```java
public interface MessageQueueSelector {
    MessageQueue select(final List<MessageQueue> mqs, final Message msg, final Object arg);
}
```
接口中的 **`arg`** 的数据是 **`MQProducer#send`** 中Object传入的。比如上面的例子中的send传入orderId那么，select中就是orderId。  
通过MessageQueueSelector选择对应的消息队列，比如订单ID相同的这样就分配到了同一条消息队列中，在同一条消息队列中是有序的，这样消息就实现了有序。接下来如何消费。
### 消费顺序消息
首先看一下官网的顺序消费的例子：

```java
public class OrderedConsumer {
    public static void main(String[] args) throws Exception {
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("example_group_name");

        consumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_FIRST_OFFSET);

        consumer.subscribe("TopicTest", "TagA || TagC || TagD");

        consumer.registerMessageListener(new MessageListenerOrderly() {

            AtomicLong consumeTimes = new AtomicLong(0);
            @Override
            public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs,
                                                       ConsumeOrderlyContext context) {
                context.setAutoCommit(false);
                System.out.printf(Thread.currentThread().getName() + " Receive New Messages: " + msgs + "%n");
                this.consumeTimes.incrementAndGet();
                if ((this.consumeTimes.get() % 2) == 0) {
                    return ConsumeOrderlyStatus.SUCCESS;
                } else if ((this.consumeTimes.get() % 3) == 0) {
                    return ConsumeOrderlyStatus.ROLLBACK;
                } else if ((this.consumeTimes.get() % 4) == 0) {
                    return ConsumeOrderlyStatus.COMMIT;
                } else if ((this.consumeTimes.get() % 5) == 0) {
                    context.setSuspendCurrentQueueTimeMillis(3000);
                    return ConsumeOrderlyStatus.SUSPEND_CURRENT_QUEUE_A_MOMENT;
                }
                return ConsumeOrderlyStatus.SUCCESS;

            }
        });

        consumer.start();

        System.out.printf("Consumer Started.%n");
    }
}

```
这里一个关键的接口就是 **`MessageListenerOrderly`** (并发消费为MessageListenerConcurrently) 来处理顺序消费的消息。接下来从源码来分析如何选择线程来处理顺序消非。  
在创建 **`DefaultMQPushConsumer`** 根据不同的不同的监听器   **`MessageListenerOrderly`** 和 **`MessageListenerConcurrently`** 来创建不同的消费服务：

```java
//DefaultMQPushConsumerImpl#start 方法
if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
    this.consumeOrderly = true;
    this.consumeMessageService =
        new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
} else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
    this.consumeOrderly = false;
    this.consumeMessageService =
        new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
}
```
对于消息的拉取和并发消费没有什么区别，区别在于消费处理的类不一样；
- 并发处理类---ConsumeMessageConcurrentlyService
- 顺序处理类---ConsumeMessageOrderlyService

那么看一下是如何处理 **`ConsumeMessageOrderlyService#submitConsumeRequest`** (所有的消息都是包装成了ConsumeRequest然后提交给线程池这里和并发处理没有区别)

```java
//ConsumeMessageOrderlyService#submitConsumeRequest
    @Override
    public void submitConsumeRequest(
        final List<MessageExt> msgs,
        final ProcessQueue processQueue,
        final MessageQueue messageQueue,
        final boolean dispathToConsume) {
        if (dispathToConsume) {
            ConsumeRequest consumeRequest = new ConsumeRequest(processQueue, messageQueue);
            this.consumeExecutor.submit(consumeRequest);
        }
    }
```
那么看一下 **`ConsumeMessageOrderlyService`** 内部类 **`ConsumeRequest`** 。看一下在这个内部类是如何处理数据的。  
这里有一个消息队列锁的东西,作用： **严格的确保在同一消费时间内有且仅有一个线程消费该消息队列** 。 下面看一下队列锁的实现：

```java
public class MessageQueueLock {
    private ConcurrentMap<MessageQueue, Object> mqLockTable =
        new ConcurrentHashMap<MessageQueue, Object>();

    public Object fetchLockObject(final MessageQueue mq) {
        Object objLock = this.mqLockTable.get(mq);
        if (null == objLock) {
            objLock = new Object();
            Object prevLock = this.mqLockTable.putIfAbsent(mq, objLock);
            if (prevLock != null) {
                objLock = prevLock;
            }
        }

        return objLock;
    }
}

```
分析完成消息队列锁接着分析消费队列的处理，既然提交给了线程来处理说明 ConsumeRequest继承了Runnable接口，直接就分析run方法就可以了。

```java
if (this.processQueue.isDropped()) {
                log.warn("run, the message queue not be able to consume, because it's dropped. {}", this.messageQueue);
                return;
            }
 final Object objLock = messageQueueLock.fetchLockObject(this.messageQueue);
 synchronized (objLock) {
     //省略代码
 }
```
首先判断当前ProcessQueue的状态，然后从消息队列锁中获取当前的消费队列对应的对象锁，然后用synchronized进行同步。  
接下来就是执行同步代码块的代码，这里的代码只能由获取当前对象锁的线程(Thread)执行：

```java
if (MessageModel.BROADCASTING.equals(ConsumeMessageOrderlyService.this.defaultMQPushConsumerImpl.messageModel())
                    || (this.processQueue.isLocked() && !this.processQueue.isLockExpired())) {
 //省略代码                       
}else{
    if (this.processQueue.isDropped()) {
                        log.warn("the message queue not be able to consume, because it's dropped. {}", this.messageQueue);
                        return;
                    }
    ConsumeMessageOrderlyService.this.tryLockLaterAndReconsume(this.messageQueue, this.processQueue, 100);
}
```
真正处理的时候这里有两块逻辑：
1. 广播消费或者ProcessQueue状态正常，这种状态下就是正常消费
2. 延迟消费

分析正常状态下的是如何消费的。

```java
//判断消费前的processQueue状态
if (this.processQueue.isDropped()) {
    log.warn("the message queue not be able to consume, because it's dropped. {}", this.messageQueue);
    break;
}

if (MessageModel.CLUSTERING.equals(ConsumeMessageOrderlyService.this.defaultMQPushConsumerImpl.messageModel())
    && !this.processQueue.isLocked()) {
    log.warn("the message queue not locked, so consume later, {}", this.messageQueue);
    ConsumeMessageOrderlyService.this.tryLockLaterAndReconsume(this.messageQueue, this.processQueue, 10);
    break;
}

if (MessageModel.CLUSTERING.equals(ConsumeMessageOrderlyService.this.defaultMQPushConsumerImpl.messageModel())
    && this.processQueue.isLockExpired()) {
    log.warn("the message queue lock expired, so consume later, {}", this.messageQueue);
    ConsumeMessageOrderlyService.this.tryLockLaterAndReconsume(this.messageQueue, this.processQueue, 10);
    break;
}
long interval = System.currentTimeMillis() - beginTime;
if (interval > MAX_TIME_CONSUME_CONTINUOUSLY) {
    ConsumeMessageOrderlyService.this.submitConsumeRequestLater(processQueue, messageQueue, 10);
    break;
}
```
在集群消费和ProcessQueue状态不正确的情况下会进行尝试延迟重新消费的操作(ProcessQueue没有锁定和过期的情况)。

```java
//获取消息
final int consumeBatchSize =
    ConsumeMessageOrderlyService.this.defaultMQPushConsumer.getConsumeMessageBatchMaxSize();

List<MessageExt> msgs = this.processQueue.takeMessags(consumeBatchSize);
defaultMQPushConsumerImpl.resetRetryAndNamespace(msgs, defaultMQPushConsumer.getConsumerGroup());
```
获取ProcessQueue队列中的消息数量，最大值为consumeBatchSize(默认值1)。然后判断消息是否为空。

```java
long beginTimestamp = System.currentTimeMillis();
ConsumeReturnType returnType = ConsumeReturnType.SUCCESS;
boolean hasException = false;
try {
    //消费队列加锁
    this.processQueue.getLockConsume().lock();
    if (this.processQueue.isDropped()) {
        log.warn("consumeMessage, the message queue not be able to consume, because it's dropped. {}",
            this.messageQueue);
        break;
    }
	//消费处理--这里也是创建的时候的MessageListenerOrderly实现类
    status = messageListener.consumeMessage(Collections.unmodifiableList(msgs), context);
} catch (Throwable e) {
    log.warn("consumeMessage exception: {} Group: {} Msgs: {} MQ: {}",
        RemotingHelper.exceptionSimpleDesc(e),
        ConsumeMessageOrderlyService.this.consumerGroup,
        msgs,
        messageQueue);
    hasException = true;
} finally {
	//取消锁
    this.processQueue.getLockConsume().unlock();
}
```
上面代码主要是处理消息。然后返回处理后的状态 **`ConsumeOrderlyStatus`** 。然后就对于返回的状态进行处理：

```java
//返回ConsumeOrderlyStatus处理
long consumeRT = System.currentTimeMillis() - beginTimestamp;
if (null == status) {
    if (hasException) {
        returnType = ConsumeReturnType.EXCEPTION;
    } else {
        returnType = ConsumeReturnType.RETURNNULL;
    }
} else if (consumeRT >= defaultMQPushConsumer.getConsumeTimeout() * 60 * 1000) {
    returnType = ConsumeReturnType.TIME_OUT;
} else if (ConsumeOrderlyStatus.SUSPEND_CURRENT_QUEUE_A_MOMENT == status) {
    returnType = ConsumeReturnType.FAILED;
} else if (ConsumeOrderlyStatus.SUCCESS == status) {
    returnType = ConsumeReturnType.SUCCESS;
}

if (ConsumeMessageOrderlyService.this.defaultMQPushConsumerImpl.hasHook()) {
    consumeMessageContext.getProps().put(MixAll.CONSUME_CONTEXT_TYPE, returnType.name());
}

if (null == status) {
    status = ConsumeOrderlyStatus.SUSPEND_CURRENT_QUEUE_A_MOMENT;
}

if (ConsumeMessageOrderlyService.this.defaultMQPushConsumerImpl.hasHook()) {
    consumeMessageContext.setStatus(status.toString());
    consumeMessageContext
        .setSuccess(ConsumeOrderlyStatus.SUCCESS == status || ConsumeOrderlyStatus.COMMIT == status);
    ConsumeMessageOrderlyService.this.defaultMQPushConsumerImpl.executeHookAfter(consumeMessageContext);
}

ConsumeMessageOrderlyService.this.getConsumerStatsManager()
    .incConsumeRT(ConsumeMessageOrderlyService.this.consumerGroup, messageQueue.getTopic(), consumeRT);
//结果处理
continueConsume = ConsumeMessageOrderlyService.this.processConsumeResult(msgs, status, context, this);
```
最后根据 **ConsumeOrderlyStatus** 调用 **ConsumeMessageOrderlyService#processConsumeResult** 方法来处理。