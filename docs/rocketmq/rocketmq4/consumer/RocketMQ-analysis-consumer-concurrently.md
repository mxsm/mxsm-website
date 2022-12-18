---
title: RocketMQ源码解析-并发消费消息源码解析
date: 2021-06-14
weight: 202106102133
---

> 以下源码基于RocketMQ 4.8.0

RocketMQ的消费模式有两种分别为：

- 集群消费模式(CLUSTERING)
- 广播消费模式(BROADCASTING)

然而在对于消息的类型分为以下几种：

- 无序消息(并发消息)
- 顺序消息
- 延迟消息
- 事务消息

接下来逐个通过源码来分析这些消息在不同的模式下是如何进行消费的。在客户端在启动的时候 **`DefaultMQPushConsumerImpl#start`** 方法中有这样一个代码片段：

```java
if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
    this.consumeOrderly = true;
    this.consumeMessageService =
        new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
} else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
    this.consumeOrderly = false;
    this.consumeMessageService =
        new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
}
this.consumeMessageService.start();
```

通过判断设置的 **`MessageListener`** 监听器为 **`MessageListenerOrderly`** 还是 **`MessageListenerConcurrently`** 监听器来判断消费消息的服务是用 **`ConsumeMessageOrderlyService`** 还是 **`ConsumeMessageConcurrentlyService`** 。总结一下：

- 无序消息由 **`ConsumeMessageConcurrentlyService`** 处理
- 有序消息由 **`ConsumeMessageOrderlyService`** 处理

### 1. 并发消费服务ConsumeMessageConcurrentlyService启动

在 **`DefaultMQPushConsumerImpl#start`** 方法中调用 **`this.consumeMessageService.start();`** 启动并发服务。下面来看一下并发服务启动做了什么：

```java
public class ConsumeMessageConcurrentlyService implements ConsumeMessageService {
    public void start() {
        this.cleanExpireMsgExecutors.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                cleanExpireMsg();
            }

        }, this.defaultMQPushConsumer.getConsumeTimeout(), this.defaultMQPushConsumer.getConsumeTimeout(), TimeUnit.MINUTES);
    }
}
```

从代码可以看出是定时清除过期的消息。

### 2. 消息拉取

在 **`MQClientInstance#start`** 方法中启动消息的拉取服务：

```java
public void start() throws MQClientException {

    synchronized (this) {
        switch (this.serviceState) {
            case CREATE_JUST:
                this.serviceState = ServiceState.START_FAILED;
                // If not specified,looking address from name server
                if (null == this.clientConfig.getNamesrvAddr()) {
                    this.mQClientAPIImpl.fetchNameServerAddr();
                }
                // Start request-response channel
                this.mQClientAPIImpl.start();
                // Start various schedule tasks
                this.startScheduledTask();
                // 拉取服务启动
                this.pullMessageService.start();
                // Start rebalance service
                this.rebalanceService.start();
                // Start push service
                this.defaultMQProducer.getDefaultMQProducerImpl().start(false);
                log.info("the client factory [{}] start OK", this.clientId);
                this.serviceState = ServiceState.RUNNING;
                break;
            case START_FAILED:
                throw new MQClientException("The Factory object[" + this.getClientId() + "] has been created before, and failed.", null);
            default:
                break;
        }
    }
}
```

下面看一下拉取服务 **`PullMessageService#start`** 方法中做了一些什么事情。 **`PullMessageService`** 本质是一个线程的实现类实现了 **`Runnable`** ，所以调用start方法是调用了 **`Thread#start`** 。最终执行的是 **`PullMessageService#run`** 方法。逻辑在这个里面：

```java
public class PullMessageService extends ServiceThread {
    private final InternalLogger log = ClientLogger.getLog();
    //拉取请求的阻塞队列
    private final LinkedBlockingQueue<PullRequest> pullRequestQueue = new LinkedBlockingQueue<PullRequest>();
    private final MQClientInstance mQClientFactory;
    private final ScheduledExecutorService scheduledExecutorService = Executors
        .newSingleThreadScheduledExecutor(new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "PullMessageServiceScheduledThread");
            }
        });
    
    @Override
    public void run() {
        log.info(this.getServiceName() + " service started");

        while (!this.isStopped()) {
            try {
                //循环的从阻塞队列中获取PullRequest
                PullRequest pullRequest = this.pullRequestQueue.take();
                this.pullMessage(pullRequest);
            } catch (InterruptedException ignored) {
            } catch (Exception e) {
                log.error("Pull Message Service Run Method exception", e);
            }
        }

        log.info(this.getServiceName() + " service end");
    }

}
```

 然后调用了 **`PullMessageService#pullMessage`** 私有方法：

```java
private void pullMessage(final PullRequest pullRequest) {
    final MQConsumerInner consumer = this.mQClientFactory.selectConsumer(pullRequest.getConsumerGroup());
    if (consumer != null) {
        DefaultMQPushConsumerImpl impl = (DefaultMQPushConsumerImpl) consumer;
        impl.pullMessage(pullRequest);
    } else {
        log.warn("No matched consumer for the PullRequest {}, drop it", pullRequest);
    }
}
```

最终请求了 **`DefaultMQPushConsumerImpl#pullMessage`** 方法。这个会在后续进行分析。

分析到这里会发现一个问题，**`PullMessageService`** 类实例化的时候 **`pullRequestQueue`** 队列是空的那么在 **`PullMessageService#run`** 方法中获取 **`PullRequest`** 会阻塞。那么在哪里会将 **`PullRequest`** 加入到队列中。在 **`PullMessageService`** 中还有几个重要的方法，这些方法就是向队列中添加 **`PullRequest`** ：

```java
public class PullMessageService extends ServiceThread {
    
    //延迟加入
	public void executePullRequestLater(final PullRequest pullRequest, final long timeDelay) {
        if (!isStopped()) {
            this.scheduledExecutorService.schedule(new Runnable() {
                @Override
                public void run() {
                    PullMessageService.this.executePullRequestImmediately(pullRequest);
                }
            }, timeDelay, TimeUnit.MILLISECONDS);
        } else {
            log.warn("PullMessageServiceScheduledThread has shutdown");
        }
    }

    //立马加入
    public void executePullRequestImmediately(final PullRequest pullRequest) {
        try {
            this.pullRequestQueue.put(pullRequest);
        } catch (InterruptedException e) {
            log.error("executePullRequestImmediately pullRequestQueue.put", e);
        }
    }

}
```

###  3. PullRequest放入队列

首先我们通过开发工具来看下调用链：

![](https://github.com/mxsm/picture/blob/main/rocketmq/putPullRequest.png?raw=true)

通过分析调用链发现是 **`RebalanceService#run`** 方法。最终将 **`PullRequest`** 存放到队列。

### 4. PullRequest处理

从阻塞队列中取出 **`PullRequest`** ,调用 **`PullMessageService#pullMessage`** 方法。

```java
private void pullMessage(final PullRequest pullRequest) {
    final MQConsumerInner consumer = this.mQClientFactory.selectConsumer(pullRequest.getConsumerGroup());
    if (consumer != null) {
        DefaultMQPushConsumerImpl impl = (DefaultMQPushConsumerImpl) consumer;
        impl.pullMessage(pullRequest);
    } else {
        log.warn("No matched consumer for the PullRequest {}, drop it", pullRequest);
    }
}
```

 通过代码跟踪可以发现最终是通过 **`DefaultMQPushConsumerImpl#pullMessage`** 来处理。

### 5. DefaultMQPushConsumerImpl#pullMessage
这个方法主要用来处理拉取消息和处理，同时在这个方法中还有一些流量控制(专门用一个篇章去分析说明)等等。在
**DefaultMQPushConsumerImpl#pullMessage** 方法中有一个 **PullCallback** 回调接口，里面处理消息拉取成功后回调的处理,下面看一下 **pullResult.getPullStatus()** 为 **FOUND** 的状态(表示拉取到了消息)：

```java
case FOUND:
    long prevRequestOffset = pullRequest.getNextOffset();
    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
    long pullRT = System.currentTimeMillis() - beginTimestamp;
    //消息拉取花费的时间
    DefaultMQPushConsumerImpl.this.getConsumerStatsManager().incPullRT(pullRequest.getConsumerGroup(),
        pullRequest.getMessageQueue().getTopic(), pullRT);

    long firstMsgOffset = Long.MAX_VALUE;
    //拉取结果消息列表为空，将请求重新放入消息拉取请求阻塞队列
    if (pullResult.getMsgFoundList() == null || pullResult.getMsgFoundList().isEmpty()) {
        DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
    } else {
        firstMsgOffset = pullResult.getMsgFoundList().get(0).getQueueOffset();
        //消费者消息增加数量
        DefaultMQPushConsumerImpl.this.getConsumerStatsManager().incPullTPS(pullRequest.getConsumerGroup(),
            pullRequest.getMessageQueue().getTopic(), pullResult.getMsgFoundList().size());
        //是否分配消费--顺序消费处理
        boolean dispatchToConsume = processQueue.putMessage(pullResult.getMsgFoundList());
        //消费消息服务消费消息
        DefaultMQPushConsumerImpl.this.consumeMessageService.submitConsumeRequest(
            pullResult.getMsgFoundList(),
            processQueue,
            pullRequest.getMessageQueue(),
            dispatchToConsume);

        //消费完成将拉取请求重新放入请求队列中
        if (DefaultMQPushConsumerImpl.this.defaultMQPushConsumer.getPullInterval() > 0) {
            DefaultMQPushConsumerImpl.this.executePullRequestLater(pullRequest,
                DefaultMQPushConsumerImpl.this.defaultMQPushConsumer.getPullInterval());
        } else {
            DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
        }
    }

    if (pullResult.getNextBeginOffset() < prevRequestOffset
        || firstMsgOffset < prevRequestOffset) {
        log.warn(
            "[BUG] pull message result maybe data wrong, nextBeginOffset: {} firstMsgOffset: {} prevRequestOffset: {}",
            pullResult.getNextBeginOffset(),
            firstMsgOffset,
            prevRequestOffset);
    }

    break;
```
在拉取成功后状态为 **FOUND**：  
- 统计拉取消息花费的时间
- 判断拉取的消息是否有，没有将PullRequest请求放入请求队列中
- 处理拉取的消费组、Topic消息的增加
- 由ConsumeMessageService服务来消费消息(根据不同的消息类型调用不同的消费者实例)
- 根据是否需要延迟将PullRequest放入队列

### 6. ConsumeMessageConcurrentlyService#submitConsumeRequest
通过判断消费者启动的时候设置的消费最大的消费的数量(默认为1)，

```java
@Override
public void submitConsumeRequest(
    final List<MessageExt> msgs,
    final ProcessQueue processQueue,
    final MessageQueue messageQueue,
    final boolean dispatchToConsume) {
    final int consumeBatchSize = this.defaultMQPushConsumer.getConsumeMessageBatchMaxSize();
    if (msgs.size() <= consumeBatchSize) {
        //构建消费请求
        ConsumeRequest consumeRequest = new ConsumeRequest(msgs, processQueue, messageQueue);
        try {
            //提交线程池执行消费
            this.consumeExecutor.submit(consumeRequest);
        } catch (RejectedExecutionException e) {
            //线程池满了延迟，随后延迟添加
            this.submitConsumeRequestLater(consumeRequest);
        }
    }
    
    //省略部分代码
}
```

构建批量消费的请求：

```java
for (int total = 0; total < msgs.size(); ) {
    List<MessageExt> msgThis = new ArrayList<MessageExt>(consumeBatchSize);
    //构建消息列表
    for (int i = 0; i < consumeBatchSize; i++, total++) {
        if (total < msgs.size()) {
            msgThis.add(msgs.get(total));
        } else {
            break;
        }
    }
    //构建消费请求
    ConsumeRequest consumeRequest = new ConsumeRequest(msgThis, processQueue, messageQueue);
    try {
        this.consumeExecutor.submit(consumeRequest);
    } catch (RejectedExecutionException e) {
        //将所有剩下的数据都加入列表
        for (; total < msgs.size(); total++) {
            msgThis.add(msgs.get(total));
        }
        //延迟提交请求到线程池
        this.submitConsumeRequestLater(consumeRequest);
    }
}
```
submitConsumeRequest方法主要是构建ConsumeRequest提交到消费线程池中对消息进行消费。

### 7. ConsumeRequest源码解析
ConsumeRequest实现了Runnable，所以所有的逻辑都在run方法中，下面来分析一下逻辑：

```java
MessageListenerConcurrently listener = ConsumeMessageConcurrentlyService.this.messageListener;
ConsumeConcurrentlyContext context = new ConsumeConcurrentlyContext(messageQueue);
ConsumeConcurrentlyStatus status = null;
defaultMQPushConsumerImpl.resetRetryAndNamespace(msgs, defaultMQPushConsumer.getConsumerGroup());

ConsumeMessageContext consumeMessageContext = null;
if (ConsumeMessageConcurrentlyService.this.defaultMQPushConsumerImpl.hasHook()) {
    consumeMessageContext = new ConsumeMessageContext();
    consumeMessageContext.setNamespace(defaultMQPushConsumer.getNamespace());
    consumeMessageContext.setConsumerGroup(defaultMQPushConsumer.getConsumerGroup());
    consumeMessageContext.setProps(new HashMap<String, String>());
    consumeMessageContext.setMq(messageQueue);
    consumeMessageContext.setMsgList(msgs);
    consumeMessageContext.setSuccess(false);
    ConsumeMessageConcurrentlyService.this.defaultMQPushConsumerImpl.executeHookBefore(consumeMessageContext);
}
```
对消息拉取进行设置，以及设置Hook执行前执行ConsumeMessageContext，

```java
long beginTimestamp = System.currentTimeMillis();
boolean hasException = false;
ConsumeReturnType returnType = ConsumeReturnType.SUCCESS;
try {
    if (msgs != null && !msgs.isEmpty()) {
        //设置消费开始时间
        for (MessageExt msg : msgs) {
            MessageAccessor.setConsumeStartTimeStamp(msg, String.valueOf(System.currentTimeMillis()));
        }
    }
    //消费消息---也就业务逻辑
    status = listener.consumeMessage(Collections.unmodifiableList(msgs), context);
} catch (Throwable e) {
    log.warn("consumeMessage exception: {} Group: {} Msgs: {} MQ: {}",
        RemotingHelper.exceptionSimpleDesc(e),
        ConsumeMessageConcurrentlyService.this.consumerGroup,
        msgs,
        messageQueue);
    hasException = true;
}
long consumeRT = System.currentTimeMillis() - beginTimestamp;
```
上面的代码主要是我们写在 **MessageListenerConcurrently** 中的消费业务逻辑。通过消费状态来判断消息的后续处理。

> 这里有在消费报错的情况下的处理hasException = true

下面看一下不同状态下返回的returnType:

```java
 long consumeRT = System.currentTimeMillis() - beginTimestamp;
 if (null == status) {
     if (hasException) {
         returnType = ConsumeReturnType.EXCEPTION;
     } else {
         returnType = ConsumeReturnType.RETURNNULL;
     }
 } else if (consumeRT >= defaultMQPushConsumer.getConsumeTimeout() * 60 * 1000) {
     returnType = ConsumeReturnType.TIME_OUT;
 } else if (ConsumeConcurrentlyStatus.RECONSUME_LATER == status) {
     returnType = ConsumeReturnType.FAILED;
 } else if (ConsumeConcurrentlyStatus.CONSUME_SUCCESS == status) {
     returnType = ConsumeReturnType.SUCCESS;
 }

 if (ConsumeMessageConcurrentlyService.this.defaultMQPushConsumerImpl.hasHook()) {
     consumeMessageContext.getProps().put(MixAll.CONSUME_CONTEXT_TYPE, returnType.name());
 }

 if (null == status) {
     log.warn("consumeMessage return null, Group: {} Msgs: {} MQ: {}",
         ConsumeMessageConcurrentlyService.this.consumerGroup,
         msgs,
         messageQueue);
     status = ConsumeConcurrentlyStatus.RECONSUME_LATER;
 }
```
**MessageListenerConcurrently** 监听主要返回 **ConsumeConcurrentlyStatus.CONSUME_SUCCESS** 和 **ConsumeConcurrentlyStatus.RECONSUME_LATER** 两种消费类型。根据不同的状态接下来处理消费后的结果， **ConsumeMessageConcurrentlyService#processConsumeResult** 最终处理消费后的消息。接下来看看结果的处理：

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
第一部分处理消息的ackIdex和处理消息的TPS等。处理完成后接下来处理根据不同的消费类型:
- 集群消费
- 广播消费

两种情况：

```java
switch (this.defaultMQPushConsumer.getMessageModel()) {
    case BROADCASTING: //广播消费
        for (int i = ackIndex + 1; i < consumeRequest.getMsgs().size(); i++) {
            MessageExt msg = consumeRequest.getMsgs().get(i);
            log.warn("BROADCASTING, the message consume failed, drop it, {}", msg.toString());
        }
        break;
    case CLUSTERING: //集群消费--处理消费失败的数据
        List<MessageExt> msgBackFailed = new ArrayList<MessageExt>(consumeRequest.getMsgs().size());
        for (int i = ackIndex + 1; i < consumeRequest.getMsgs().size(); i++) {
            MessageExt msg = consumeRequest.getMsgs().get(i);
            //将消息重新发回
            boolean result = this.sendMessageBack(msg, context);
            if (!result) {
                msg.setReconsumeTimes(msg.getReconsumeTimes() + 1);
                msgBackFailed.add(msg);
            }
        }
        if (!msgBackFailed.isEmpty()) {
            consumeRequest.getMsgs().removeAll(msgBackFailed);
            this.submitConsumeRequestLater(msgBackFailed, consumeRequest.getProcessQueue(), consumeRequest.getMessageQueue());
        }
        break;
    default:
        break;
}
```
在集群消费后将消费失败的消息发送回去Broker。用来给后续的进行重复消费

```java
long offset = consumeRequest.getProcessQueue().removeMessage(consumeRequest.getMsgs());
if (offset >= 0 && !consumeRequest.getProcessQueue().isDropped()) {
    this.defaultMQPushConsumerImpl.getOffsetStore().updateOffset(consumeRequest.getMessageQueue(), offset, true);
}
```
消费进度，通过一个TreeMap将数据的删除消费的消息的偏移量。然后获取第一个key这个就是未消费的最小偏移量。
