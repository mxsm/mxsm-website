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

### 1. 并发消费

#### 1.1 并发消费服务ConsumeMessageConcurrentlyService启动

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

#### 1.2 消息拉取

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

下面看一下拉取服务 **`PullMessageService#start`** 方法中做了一些什么事情。 **`PullMessageService`** 本质是一个线程的实现类实现了 **`Runnable`** ，所以调用start方法是调用了**`Thread#start`** 。最终执行的是 **`PullMessageService#run`** 方法。逻辑在这个里面：

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

####  1.3 PullRequest放入队列

首先我们通过开发工具来看下调用链：

![](https://github.com/mxsm/picture/blob/main/rocketmq/putPullRequest.png?raw=true)

通过分析调用链发现是 **`RebalanceService#run`** 方法。最终将 **`PullRequest`** 存放到队列。

#### 1.4 PullRequest处理

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

