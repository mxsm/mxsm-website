---
title: RocketMQ源码解析-consumer消费策略
categories:
  - MQ
  - RocketMQ
  - consumer
tags:
  - MQ
  - RocketMQ
  - consumer
  - consumer消费策略
abbrlink: e9cd8ffa
date: 2020-03-27 21:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### 消费者的两种消费方式
1. **Push消费--底层通过长轮询来实现(DefaultMQPushConsumer来实现的)**
2. **Pull消费--(4.7.0中代码已经用Deprecated标记了DefaultMQPullConsumer的实现)**

### 消费者消费模型

![](https://raw.githubusercontent.com/mxsm/document/master/image/MQ/RocketMQ/Cosume%E6%B6%88%E8%B4%B9%E6%9E%B6%E6%9E%84.png)


### 消费者并发消费数据

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
代码来自官网的例子，这个就是并发消费MQ消息。通过设置MessageListenerConcurrently并发的监听器来实现监听消费的消息然后做后续的处理。通过调用 **`DefaultMQPushConsumer.start`** 方法来启动消费者消费。 

```java
public class DefaultMQPushConsumer extends ClientConfig implements MQPushConsumer {
    
    //消费实现类
    protected final transient DefaultMQPushConsumerImpl defaultMQPushConsumerImpl;
    
    //消费组
    private String consumerGroup;
    
    //消费模式--默认为集群消费，还有一种BROADCASTING 广播消费
    private MessageModel messageModel = MessageModel.CLUSTERING;
    
    //消费的起始位置--默认为末尾的offset
    private ConsumeFromWhere consumeFromWhere = ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET;
    
    //消息队列分配策略
    private AllocateMessageQueueStrategy allocateMessageQueueStrategy;
    
    //topic和订阅关系 
    private Map<String /* topic */, String /* sub expression */> subscription = new HashMap<String, String>();
    
    //消息监听器--并发消费和顺序消费 
    private MessageListener messageListener;
    
    //消费offset存储实现 
    private OffsetStore offsetStore;
    
    //最小消费线程数  
    private int consumeThreadMin = 20;

    //最大消费线程数
    private int consumeThreadMax = 20;

    //用于动态调整线程池数目的阈值
    private long adjustThreadPoolNumsThreshold = 100000;

    //并发同时最大跨度偏移。它对顺序消费没有影响
    private int consumeConcurrentlyMaxSpan = 2000;

    //流控制阈值在队列级别，每个消息队列默认最多缓存1000条消息
    private int pullThresholdForQueue = 1000;

    //在队列级别限制缓存的消息大小，默认情况下每个消息队列最多缓存100 MiB消息
    private int pullThresholdSizeForQueue = 100;
    
    //拉Topic的阈值--无限制
    private int pullThresholdForTopic = -1;

    限制主题级别上缓存的消息大小，默认值为-1 MiB(无限制)
    private int pullThresholdSizeForTopic = -1;

    //消息拉取间隔
    private long pullInterval = 0;

    //批量消费规模
    private int consumeMessageBatchMaxSize = 1;

    //批处理拉取大小
    private int pullBatchSize = 32;

    //是否每次拉取的时候更新订阅关系
    private boolean postSubscriptionWhenPull = false;


    private boolean unitMode = false;

    //最大重复消费次数- -1-16
    private int maxReconsumeTimes = -1;

    //对于需要缓慢拉动的情况，如流量控制情况，暂停拉动时间。
    private long suspendCurrentQueueTimeMillis = 1000;

    //以分钟为单位的最大时间量可能会阻塞正在使用的线程。
    private long consumeTimeout = 15;

    //异步传输数据的接口
    private TraceDispatcher traceDispatcher = null;
    
    //.........省略部分代码
}
```

```java
@Override
public void start() throws MQClientException {
        setConsumerGroup(NamespaceUtil.wrapNamespace(this.getNamespace(), this.consumerGroup));
        this.defaultMQPushConsumerImpl.start();
        if (null != traceDispatcher) {
            try {
                traceDispatcher.start(this.getNamesrvAddr(), this.getAccessChannel());
            } catch (MQClientException e) {
                log.warn("trace dispatcher start failed ", e);
            }
        }
    }
```
通过调用 **`DefaultMQPushConsumerImpl.start`** 方法来启动消费。看一下DefaultMQPushConsumerImpl的创建

```java
 // this 为DefaultMQPushConsumer的实例
 defaultMQPushConsumerImpl = new DefaultMQPushConsumerImpl(this, rpcHook);
```
接下来看一下 start方法：

```java
public synchronized void start() throws MQClientException {
        switch (this.serviceState) {
            case CREATE_JUST:
                log.info("the consumer [{}] start beginning. messageModel={}, isUnitMode={}", this.defaultMQPushConsumer.getConsumerGroup(),
                    this.defaultMQPushConsumer.getMessageModel(), this.defaultMQPushConsumer.isUnitMode());
                this.serviceState = ServiceState.START_FAILED;

                //检查配置信息包括 是否设置了消费组，消费模式等等
                this.checkConfig();

                //拷贝订阅关系到RebalanceImpl中
                this.copySubscription();

                if (this.defaultMQPushConsumer.getMessageModel() == MessageModel.CLUSTERING) {
                    this.defaultMQPushConsumer.changeInstanceNameToPID();
                }

                //获取MQClientInstance
                this.mQClientFactory = MQClientManager.getInstance().getOrCreateMQClientInstance(this.defaultMQPushConsumer, this.rpcHook);

                //设置rebalanceImpl配置
                this.rebalanceImpl.setConsumerGroup(this.defaultMQPushConsumer.getConsumerGroup());
                this.rebalanceImpl.setMessageModel(this.defaultMQPushConsumer.getMessageModel());
                this.rebalanceImpl.setAllocateMessageQueueStrategy(this.defaultMQPushConsumer.getAllocateMessageQueueStrategy());
                this.rebalanceImpl.setmQClientFactory(this.mQClientFactory);
                                //创建PullAPIWrapper--pull的api的包装类
                this.pullAPIWrapper = new PullAPIWrapper(
                    mQClientFactory,
                    this.defaultMQPushConsumer.getConsumerGroup(), isUnitMode());
                this.pullAPIWrapper.registerFilterMessageHook(filterMessageHookList);

                //处理offerSet的存储
                if (this.defaultMQPushConsumer.getOffsetStore() != null) {
                    this.offsetStore = this.defaultMQPushConsumer.getOffsetStore();
                } else {
                    switch (this.defaultMQPushConsumer.getMessageModel()) {
                        case BROADCASTING:
                            this.offsetStore = new LocalFileOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                            break;
                        case CLUSTERING:
                            this.offsetStore = new RemoteBrokerOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                            break;
                        default:
                            break;
                    }
                    this.defaultMQPushConsumer.setOffsetStore(this.offsetStore);
                }
                this.offsetStore.load();
                               //根据不的监听器创建不同的消息消费服务
                if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
                    this.consumeOrderly = true;
                    this.consumeMessageService =
                        new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
                } else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
                    this.consumeOrderly = false;
                    this.consumeMessageService =
                        new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
                }

                //启动消费服务--定时清理过期的消息
                this.consumeMessageService.start();

                boolean registerOK = mQClientFactory.registerConsumer(this.defaultMQPushConsumer.getConsumerGroup(), this);
                if (!registerOK) {
                    this.serviceState = ServiceState.CREATE_JUST;
                    this.consumeMessageService.shutdown();
                    throw new MQClientException("The consumer group[" + this.defaultMQPushConsumer.getConsumerGroup()
                        + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
                        null);
                }
                               //MQClientInstance启动
                mQClientFactory.start();
                log.info("the consumer [{}] start OK.", this.defaultMQPushConsumer.getConsumerGroup());
                this.serviceState = ServiceState.RUNNING;
                break;
            case RUNNING:
            case START_FAILED:
            case SHUTDOWN_ALREADY:
                throw new MQClientException("The PushConsumer service state not OK, maybe started once, "
                    + this.serviceState
                    + FAQUrl.suggestTodo(FAQUrl.CLIENT_SERVICE_NOT_OK),
                    null);
            default:
                break;
        }

        this.updateTopicSubscribeInfoWhenSubscriptionChanged();
        this.mQClientFactory.checkClientInBroker();
        this.mQClientFactory.sendHeartbeatToAllBrokerWithLock();
        //正在开始消费数据启动
        this.mQClientFactory.rebalanceImmediately();
    }
```
在启动MQClientInstance的过程中，对消息拉取线程进行了start()。消息拉取线程开始运行，看下代码实现：

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
                    // 启动客户端通讯
                    this.mQClientAPIImpl.start();
                    // 启动定时任务
                    this.startScheduledTask();
                    // 启动拉取消息
                    this.pullMessageService.start();
                    // 启动负载均衡
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
启动负载均衡是消费者消费Message的入口，接下来入手分析RebalanceService.start。

```java
public class RebalanceService extends ServiceThread {
    private static long waitInterval =
        Long.parseLong(System.getProperty(
            "rocketmq.client.rebalance.waitInterval", "20000"));
    private final InternalLogger log = ClientLogger.getLog();
    private final MQClientInstance mqClientFactory;

    public RebalanceService(MQClientInstance mqClientFactory) {
        this.mqClientFactory = mqClientFactory;
    }

    @Override
    public void run() {
        log.info(this.getServiceName() + " service started");

        while (!this.isStopped()) {
            this.waitForRunning(waitInterval);
            this.mqClientFactory.doRebalance();
        }

        log.info(this.getServiceName() + " service end");
    }

    @Override
    public String getServiceName() {
        return RebalanceService.class.getSimpleName();
    }
}

```
**RebalanceService** 是一个服务线程，继承了ServiceThread，调用start方法最终是执行 **RebalanceService.run** 方法。

```java
@Override
    public void run() {
        log.info(this.getServiceName() + " service started");

        while (!this.isStopped()) {
            this.waitForRunning(waitInterval);
            //负载处理
            this.mqClientFactory.doRebalance();
        }

        log.info(this.getServiceName() + " service end");
    }
```
在 **RebalanceService.run** 方法中主要通过 **MQClientInstance.doRebalance** 来实现消费者的负载均衡。

```java
    public void doRebalance() {
        for (Map.Entry<String, MQConsumerInner> entry : this.consumerTable.entrySet()) {
            MQConsumerInner impl = entry.getValue();
            if (impl != null) {
                try {
                    impl.doRebalance();
                } catch (Throwable e) {
                    log.error("doRebalance exception", e);
                }
            }
        }
    }
```
通过从消费列表 ** consumerTable中** 中获取保存的 **MQConsumerInner** 调用 **MQConsumerInner.doRebalance** 方法。那么 **consumerTable** 中保存的是什么？什么时候保存的。在 DefaultMQPushConsumerImpl.start方法中有这样一段代码：

```java
 boolean registerOK = mQClientFactory.registerConsumer(this.defaultMQPushConsumer.getConsumerGroup(), this);
```
这里就是往consumerTable中注入消费者。

```java
public boolean registerConsumer(final String group, final MQConsumerInner consumer) {
        if (null == group || null == consumer) {
            return false;
        }

        MQConsumerInner prev = this.consumerTable.putIfAbsent(group, consumer);
        if (prev != null) {
            log.warn("the consumer group[" + group + "] exist already.");
            return false;
        }

        return true;
    }
```
所以consumerTable中保存的是消费组和消费者的关系，consumerTable中的value为DefaultMQPushConsumerImpl的实例，因为该类实现了MQConsumerInner接口。
那么在 **MQClientInstance.doRebalance** 方法中调用的 **MQConsumerInner. doRebalance** 方法实际上调用的是 **DefaultMQPushConsumerImpl.doRebalance** 方法。下面来看一下 **DefaultMQPushConsumerImpl.doRebalance** 方法的实现。

```java
    @Override
    public void doRebalance() {
        if (!this.pause) {
            //参数为是否为顺序消费
            this.rebalanceImpl.doRebalance(this.isConsumeOrderly());
        }
    }
```
最终的负载均衡是由 **RebalanceImpl** 的实现类 **RebalancePushImpl** 来处理。先看一下 **RebalanceImpl.doRebalance** 这个方法：

```java
    public void doRebalance(final boolean isOrder) {
        //获取topic和订阅关系--之前在启动时候有copy
        Map<String, SubscriptionData> subTable = this.getSubscriptionInner();
        if (subTable != null) {
            for (final Map.Entry<String, SubscriptionData> entry : subTable.entrySet()) {
                final String topic = entry.getKey();
                try {
                    //按topic来进行负载均衡
                    this.rebalanceByTopic(topic, isOrder);
                } catch (Throwable e) {
                    if (!topic.startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX)) {
                        log.warn("rebalanceByTopic Exception", e);
                    }
                }
            }
        }

        this.truncateMessageQueueNotMyTopic();
    }
```
通调用 **RebalanceImpl.rebalanceByTopic** 私有方法来处理Topic的消费的负载均衡问题。这个方法了两大类处理
1. 广播消费


```java
        switch (messageModel) {
            case BROADCASTING: {
                Set<MessageQueue> mqSet = this.topicSubscribeInfoTable.get(topic);
                if (mqSet != null) {
                    boolean changed = this.updateProcessQueueTableInRebalance(topic, mqSet, isOrder);
                    if (changed) {
                        this.messageQueueChanged(topic, mqSet, mqSet);
                        log.info("messageQueueChanged {} {} {} {}",
                            consumerGroup,
                            topic,
                            mqSet,
                            mqSet);
                    }
                } else {
                    log.warn("doRebalance, {}, but the topic[{}] not exist.", consumerGroup, topic);
                }
                break;
            }
```

广播消费暂时不分析

2. 集群消费

```java
            case CLUSTERING: {
                //根据topic获取订阅消息队列
                Set<MessageQueue> mqSet = this.topicSubscribeInfoTable.get(topic);
                //获取消费者ID列表
                List<String> cidAll = this.mQClientFactory.findConsumerIdList(topic, consumerGroup);
                if (null == mqSet) {
                    if (!topic.startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX)) {
                        log.warn("doRebalance, {}, but the topic[{}] not exist.", consumerGroup, topic);
                    }
                }

                if (null == cidAll) {
                    log.warn("doRebalance, {} {}, get consumer id list failed", consumerGroup, topic);
                }

                if (mqSet != null && cidAll != null) {
                    List<MessageQueue> mqAll = new ArrayList<MessageQueue>();
                    mqAll.addAll(mqSet);

                    Collections.sort(mqAll);
                    Collections.sort(cidAll);
                    //分配消息队列的策略
                    AllocateMessageQueueStrategy strategy = this.allocateMessageQueueStrategy;

                    List<MessageQueue> allocateResult = null;
                    try {
                        allocateResult = strategy.allocate(
                            this.consumerGroup,
                            this.mQClientFactory.getClientId(),
                            mqAll,
                            cidAll);
                    } catch (Throwable e) {
                        log.error("AllocateMessageQueueStrategy.allocate Exception. allocateMessageQueueStrategyName={}", strategy.getName(),
                            e);
                        return;
                    }

                    Set<MessageQueue> allocateResultSet = new HashSet<MessageQueue>();
                    if (allocateResult != null) {
                        allocateResultSet.addAll(allocateResult);
                    }
                    //更新处理队列
                    boolean changed = this.updateProcessQueueTableInRebalance(topic, allocateResultSet, isOrder);
                    if (changed) {
                        log.info(
                            "rebalanced result changed. allocateMessageQueueStrategyName={}, group={}, topic={}, clientId={}, mqAllSize={}, cidAllSize={}, rebalanceResultSize={}, rebalanceResultSet={}",
                            strategy.getName(), consumerGroup, topic, this.mQClientFactory.getClientId(), mqSet.size(), cidAll.size(),
                            allocateResultSet.size(), allocateResultSet);
                        this.messageQueueChanged(topic, mqSet, allocateResultSet);
                    }
                }
                break;
            }
```
通过 **RebalanceImpl.updateProcessQueueTableInRebalance** 处理消息队列。

```java
private boolean updateProcessQueueTableInRebalance(final String topic, final Set<MessageQueue> mqSet,
        final boolean isOrder) {
            
        List<PullRequest> pullRequestList = new ArrayList<PullRequest>();
        //将MessageQueue变成PullRequest
        for (MessageQueue mq : mqSet) {
            if (!this.processQueueTable.containsKey(mq)) {
                if (isOrder && !this.lock(mq)) {
                    log.warn("doRebalance, {}, add a new mq failed, {}, because lock failed", consumerGroup, mq);
                    continue;
                }

                this.removeDirtyOffset(mq);
                ProcessQueue pq = new ProcessQueue();
                long nextOffset = this.computePullFromWhere(mq);
                if (nextOffset >= 0) {
                    ProcessQueue pre = this.processQueueTable.putIfAbsent(mq, pq);
                    if (pre != null) {
                        log.info("doRebalance, {}, mq already exists, {}", consumerGroup, mq);
                    } else {
                        log.info("doRebalance, {}, add a new mq, {}", consumerGroup, mq);
                        PullRequest pullRequest = new PullRequest();
                        pullRequest.setConsumerGroup(consumerGroup);
                        pullRequest.setNextOffset(nextOffset);
                        pullRequest.setMessageQueue(mq);
                        pullRequest.setProcessQueue(pq);
                        pullRequestList.add(pullRequest);
                        changed = true;
                    }
                } else {
                    log.warn("doRebalance, {}, add new mq failed, {}", consumerGroup, mq);
                }
            }
        }
        
        //分派PullRequest
        this.dispatchPullRequest(pullRequestList);

        return changed;
            
            
}
```
通过 **RebalanceImpl.dispatchPullRequest** 来处理。在RebalanceImpl中方法dispatchPullRequest是一个抽象方法。具体实现看RebalanceImpl的实现。下面来看一下RebalancePushImpl.dispatchPullRequest

```java
@Override
    public void dispatchPullRequest(List<PullRequest> pullRequestList) {
        for (PullRequest pullRequest : pullRequestList) {
            this.defaultMQPushConsumerImpl.executePullRequestImmediately(pullRequest);
            log.info("doRebalance, {}, add a new pull request {}", consumerGroup, pullRequest);
        }
    }
```
然后通过 **DefaultMQPushConsumerImpl.executePullRequestImmediately** 来处理PullRequest数据：

```java
public void executePullRequestImmediately(final PullRequest pullRequest) {
    this.mQClientFactory.getPullMessageService().executePullRequestImmediately(pullRequest);
}
```
通过获取 **MQClientInstance** 实例中的 **PullMessageService** 消息拉取服务(线程)。下面来看一下 **PullMessageService.executePullRequestImmediately** 方法：

```java
public void executePullRequestImmediately(final PullRequest pullRequest) {
        try {
            this.pullRequestQueue.put(pullRequest);
        } catch (InterruptedException e) {
            log.error("executePullRequestImmediately pullRequestQueue.put", e);
        }
    }
```
将 **PullRequest** 请求放入阻塞队列中。然后通过获取队列中的PullRequest来拉取Broker中的Message。在 **PullMessageService.run** 方法中获取队列中的PullRequest来进行处理：

```java
    @Override
    public void run() {
        log.info(this.getServiceName() + " service started");

        while (!this.isStopped()) {
            try {
                //获取队列中的数据
                PullRequest pullRequest = this.pullRequestQueue.take();
                //处理数据
                this.pullMessage(pullRequest);
            } catch (InterruptedException ignored) {
            } catch (Exception e) {
                log.error("Pull Message Service Run Method exception", e);
            }
        }

        log.info(this.getServiceName() + " service end");
    }
```
> PullMessageService的服务启动在MQClientInstance类的start方法中启动

**PullMessageService.pullMessage** 方法中的处理逻辑：

```java
    private void pullMessage(final PullRequest pullRequest) {
        //获取DefaultMQPushConsumerImpl实例根据消费组
        final MQConsumerInner consumer = this.mQClientFactory.selectConsumer(pullRequest.getConsumerGroup());
        if (consumer != null) {
            DefaultMQPushConsumerImpl impl = (DefaultMQPushConsumerImpl) consumer;
            //拉取消息
            impl.pullMessage(pullRequest);
        } else {
            log.warn("No matched consumer for the PullRequest {}, drop it", pullRequest);
        }
    }
```
看一下 **DefaultMQPushConsumerImpl.pullMessage** 是如何处理拉取消息请求的这个方法中的代码有点多，这里分开来进行分析：

```java
        final ProcessQueue processQueue = pullRequest.getProcessQueue();
        if (processQueue.isDropped()) {
            log.info("the pull request[{}] is dropped.", pullRequest.toString());
            return;
        }

        pullRequest.getProcessQueue().setLastPullTimestamp(System.currentTimeMillis());
```

上面代码主要是判断处理队列的 **`ProcessQueue`** 一些状态，然后就是判断 **`DefaultMQPushConsumerImpl`** 的状态：

```java
        try {
            //状态是否为ServiceState.RUNNING
            this.makeSureStateOK();
        } catch (MQClientException e) {
            log.warn("pullMessage exception, consumer state not ok", e);
            this.executePullRequestLater(pullRequest, pullTimeDelayMillsWhenException);
            return;
        }

        if (this.isPause()) {
            log.warn("consumer was paused, execute pull request later. instanceName={}, group={}", this.defaultMQPushConsumer.getInstanceName(), this.defaultMQPushConsumer.getConsumerGroup());
            this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_SUSPEND);
            return;
        }
```

然后就是一些限流的操作，这里包括一下几个方面：

- 从消息的条数进行限流（大于1000条）

  ```java
          if (cachedMessageCount > this.defaultMQPushConsumer.getPullThresholdForQueue()) {
              this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
              if ((queueFlowControlTimes++ % 1000) == 0) {
                  log.warn(
                      "the cached message count exceeds the threshold {}, so do flow control, minOffset={}, maxOffset={}, count={}, size={} MiB, pullRequest={}, flowControlTimes={}",
                      this.defaultMQPushConsumer.getPullThresholdForQueue(), processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), cachedMessageCount, cachedMessageSizeInMiB, pullRequest, queueFlowControlTimes);
              }
              return;
          }
  ```

- 从缓存消息的大小(大于100M)

  ```java
          if (cachedMessageSizeInMiB > this.defaultMQPushConsumer.getPullThresholdSizeForQueue()) {
              this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
              if ((queueFlowControlTimes++ % 1000) == 0) {
                  log.warn(
                      "the cached message size exceeds the threshold {} MiB, so do flow control, minOffset={}, maxOffset={}, count={}, size={} MiB, pullRequest={}, flowControlTimes={}",
                      this.defaultMQPushConsumer.getPullThresholdSizeForQueue(), processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), cachedMessageCount, cachedMessageSizeInMiB, pullRequest, queueFlowControlTimes);
              }
      
  ```

- 非顺序消息的跨度(不能大于2000)

  ```java
  if (!this.consumeOrderly) {
              if (processQueue.getMaxSpan() > this.defaultMQPushConsumer.getConsumeConcurrentlyMaxSpan()) {
                  //延迟50毫秒消费
                  this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
                  if ((queueMaxSpanFlowControlTimes++ % 1000) == 0) {
                      log.warn(
                          "the queue's messages, span too long, so do flow control, minOffset={}, maxOffset={}, maxSpan={}, pullRequest={}, flowControlTimes={}",
                          processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), processQueue.getMaxSpan(),
                          pullRequest, queueMaxSpanFlowControlTimes);
                  }
                  return;
              }
          } else {
              if (processQueue.isLocked()) {
                  if (!pullRequest.isLockedFirst()) {
                      final long offset = this.rebalanceImpl.computePullFromWhere(pullRequest.getMessageQueue());
                      boolean brokerBusy = offset < pullRequest.getNextOffset();
                      log.info("the first time to pull message, so fix offset from broker. pullRequest: {} NewOffset: {} brokerBusy: {}",
                          pullRequest, offset, brokerBusy);
                      if (brokerBusy) {
                          log.info("[NOTIFYME]the first time to pull message, but pull request offset larger than broker consume offset. pullRequest: {} NewOffset: {}",
                              pullRequest, offset);
                      }
  
                      pullRequest.setLockedFirst(true);
                      pullRequest.setNextOffset(offset);
                  }
              } else {
                  this.executePullRequestLater(pullRequest, pullTimeDelayMillsWhenException);
                  log.info("pull message later because not locked in broker, {}", pullRequest);
                  return;
              }
          }
  ```

然后获取topic的订阅关系数据SubscriptionData：

```java
final SubscriptionData subscriptionData = this.rebalanceImpl.getSubscriptionInner().get(pullRequest.getMessageQueue().getTopic());
        if (null == subscriptionData) {
            this.executePullRequestLater(pullRequest, pullTimeDelayMillsWhenException);
            log.warn("find the consumer's subscription failed, {}", pullRequest);
            return;
        }
```

创建一个 **`PullCallback`** 对象，用于回调这个回到函数的创建会在调用的地方进行分析。然后根据消费模式是否为集群消费（CLUSTERING）获取消费的偏移量：

```java
 boolean commitOffsetEnable = false;
        long commitOffsetValue = 0L;
        if (MessageModel.CLUSTERING == this.defaultMQPushConsumer.getMessageModel()) {
            commitOffsetValue = this.offsetStore.readOffset(pullRequest.getMessageQueue(), ReadOffsetType.READ_FROM_MEMORY);
            if (commitOffsetValue > 0) {
                commitOffsetEnable = true;
            }
        }
```

接下来的代码都是处理和偏移量相关的数据：

```java
String subExpression = null;
        boolean classFilter = false;
        SubscriptionData sd = this.rebalanceImpl.getSubscriptionInner().get(pullRequest.getMessageQueue().getTopic());
        if (sd != null) {
            if (this.defaultMQPushConsumer.isPostSubscriptionWhenPull() && !sd.isClassFilterMode()) {
                subExpression = sd.getSubString();
            }

            classFilter = sd.isClassFilterMode();
        }
		//同步标记
        int sysFlag = PullSysFlag.buildSysFlag(
            commitOffsetEnable, // commitOffset
            true, // suspend
            subExpression != null, // subscription
            classFilter // class filter
        );
```

然后通过 **`PullAPIWrapper.pullKernelImpl`** 拉去消息进行消费。接着就来分析当前这个：

```java
public PullResult pullKernelImpl(
        final MessageQueue mq,
        final String subExpression,
        final String expressionType,
        final long subVersion,
        final long offset,
        final int maxNums,
        final int sysFlag,
        final long commitOffset,
        final long brokerSuspendMaxTimeMillis,
        final long timeoutMillis,
        final CommunicationMode communicationMode,  // CommunicationMode.ASYNC
        final PullCallback pullCallback
    ) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
        FindBrokerResult findBrokerResult =
            this.mQClientFactory.findBrokerAddressInSubscribe(mq.getBrokerName(),
                this.recalculatePullFromWhichNode(mq), false);
        if (null == findBrokerResult) {
            this.mQClientFactory.updateTopicRouteInfoFromNameServer(mq.getTopic());
            findBrokerResult =
                this.mQClientFactory.findBrokerAddressInSubscribe(mq.getBrokerName(),
                    this.recalculatePullFromWhichNode(mq), false);
        }

        if (findBrokerResult != null) {
            {
                // check version
                if (!ExpressionType.isTagType(expressionType)
                    && findBrokerResult.getBrokerVersion() < MQVersion.Version.V4_1_0_SNAPSHOT.ordinal()) {
                    throw new MQClientException("The broker[" + mq.getBrokerName() + ", "
                        + findBrokerResult.getBrokerVersion() + "] does not upgrade to support for filter message by " + expressionType, null);
                }
            }
            int sysFlagInner = sysFlag;

            if (findBrokerResult.isSlave()) {
                sysFlagInner = PullSysFlag.clearCommitOffsetFlag(sysFlagInner);
            }
			
            //组装请求参数
            PullMessageRequestHeader requestHeader = new PullMessageRequestHeader();
            requestHeader.setConsumerGroup(this.consumerGroup);
            requestHeader.setTopic(mq.getTopic());
            requestHeader.setQueueId(mq.getQueueId());
            requestHeader.setQueueOffset(offset);
            requestHeader.setMaxMsgNums(maxNums);
            requestHeader.setSysFlag(sysFlagInner);
            requestHeader.setCommitOffset(commitOffset);
            requestHeader.setSuspendTimeoutMillis(brokerSuspendMaxTimeMillis);
            requestHeader.setSubscription(subExpression);
            requestHeader.setSubVersion(subVersion);
            requestHeader.setExpressionType(expressionType);

            String brokerAddr = findBrokerResult.getBrokerAddr();
            if (PullSysFlag.hasClassFilterFlag(sysFlagInner)) {
                brokerAddr = computPullFromWhichFilterServer(mq.getTopic(), brokerAddr);
            }
			
            //拉取消息
            PullResult pullResult = this.mQClientFactory.getMQClientAPIImpl().pullMessage(
                brokerAddr,
                requestHeader,
                timeoutMillis,
                communicationMode,
                pullCallback);

            return pullResult;
        }

        throw new MQClientException("The broker[" + mq.getBrokerName() + "] not exist", null);
    }
```

然后调用 **`MQClientAPIImpl.pullMessage`** 方法获取数据:

```java
public PullResult pullMessage(
        final String addr,
        final PullMessageRequestHeader requestHeader,
        final long timeoutMillis,
        final CommunicationMode communicationMode,
        final PullCallback pullCallback
    ) throws RemotingException, MQBrokerException, InterruptedException {
        RemotingCommand request = RemotingCommand.createRequestCommand(RequestCode.PULL_MESSAGE, requestHeader);

        switch (communicationMode) {
            case ONEWAY:
                assert false;
                return null;
            case ASYNC:
                this.pullMessageAsync(addr, request, timeoutMillis, pullCallback);
                return null;
            case SYNC:
                return this.pullMessageSync(addr, request, timeoutMillis);
            default:
                assert false;
                break;
        }

        return null;
    }
```

默认获取消息是异步的方式获取数据。

### 消费策略

RocketMQ定义了策略接口`AllocateMessageQueueStrategy`，对于给定的`消费者分组`,和`消息队列列表`、`消费者列表`，`当前消费者`应当被分配到哪些`queue队列`，定义如下：

```java
//消息队列分配策略接口
public interface AllocateMessageQueueStrategy {

    /**
     * Allocating by consumer id
     *
     * @param consumerGroup 当前消费组
     * @param currentCID 当前消费ID
     * @param mqAll 当前Topic的所有消息队列
     * @param cidAll consumer群组下所有的consumer id set集合
     * @return 根据策略给当前consumer分配的queue列表
     */
    List<MessageQueue> allocate(
        final String consumerGroup,
        final String currentCID,
        final List<MessageQueue> mqAll,
        final List<String> cidAll
    );

    /**
     * 算法名称
     *
     * @return 返回策略名称
     */
    String getName();
}

```

实现继承图：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/AllocateMessageQueueStrategy.png?raw=true)

| 算法名称                              | 含义                 |
| :------------------------------------ | :------------------- |
| AllocateMessageQueueAveragely         | 平均分配算法         |
| AllocateMessageQueueAveragelyByCircle | 基于环形平均分配算法 |
| AllocateMachineRoomNearby             | 基于机房临近原则算法 |
| AllocateMessageQueueByMachineRoom     | 基于机房分配算法     |
| AllocateMessageQueueConsistentHash    | 基于一致性hash算法   |
| AllocateMessageQueueByConfig          | 基于配置分配算法     |

#### AllocateMessageQueueAveragely-平均分配算法

这里所谓的平均分配算法，并不是指的严格意义上的完全平均，如上面的例子中，10个queue，而消费者只有4个，无法是整除关系，除了整除之外的多出来的queue,将依次根据消费者的顺序均摊。 按照上述例子来看，`10/4=2`，即表示每个`消费者`平均均摊2个queue；而`10%4=2`，即除了均摊之外，多出来2个`queue`还没有分配，那么，根据消费者的顺序`consumer-1`、`consumer-2`、`consumer-3`、`consumer-4`,则多出来的2个`queue`将分别给`consumer-1`和`consumer-2`。最终，分摊关系如下： `consumer-1`:`3个`;`consumer-2`:`3个`;`consumer-3`:`2个`;`consumer-4`:`2个`,如下图所示：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/%E5%B9%B3%E5%9D%87%E5%88%86%E9%85%8D%E7%AE%97%E6%B3%95.png?raw=true)

看一下代码实现：

```java
package org.apache.rocketmq.client.consumer.rebalance;

import java.util.ArrayList;
import java.util.List;
import org.apache.rocketmq.client.consumer.AllocateMessageQueueStrategy;
import org.apache.rocketmq.client.log.ClientLogger;
import org.apache.rocketmq.logging.InternalLogger;
import org.apache.rocketmq.common.message.MessageQueue;

/**
 * Average Hashing queue algorithm
 */
public class AllocateMessageQueueAveragely implements AllocateMessageQueueStrategy {
    private final InternalLogger log = ClientLogger.getLog();

    @Override
    public List<MessageQueue> allocate(String consumerGroup, String currentCID, List<MessageQueue> mqAll,
        List<String> cidAll) {

        //常规数据校验
        if (currentCID == null || currentCID.length() < 1) {
            throw new IllegalArgumentException("currentCID is empty");
        }
        if (mqAll == null || mqAll.isEmpty()) {
            throw new IllegalArgumentException("mqAll is null or mqAll empty");
        }
        if (cidAll == null || cidAll.isEmpty()) {
            throw new IllegalArgumentException("cidAll is null or cidAll empty");
        }

        List<MessageQueue> result = new ArrayList<MessageQueue>();
        if (!cidAll.contains(currentCID)) {
            log.info("[BUG] ConsumerGroup: {} The consumerId: {} not in cidAll: {}",
                consumerGroup,
                currentCID,
                cidAll);
            return result;
        }

        int index = cidAll.indexOf(currentCID);
        int mod = mqAll.size() % cidAll.size();
        int averageSize =
            mqAll.size() <= cidAll.size() ? 1 : (mod > 0 && index < mod ? mqAll.size() / cidAll.size()
                + 1 : mqAll.size() / cidAll.size());
        int startIndex = (mod > 0 && index < mod) ? index * averageSize : index * averageSize + mod;
        int range = Math.min(averageSize, mqAll.size() - startIndex);
        for (int i = 0; i < range; i++) {
            result.add(mqAll.get((startIndex + i) % mqAll.size()));
        }
        return result;
    }

    @Override
    public String getName() {
        return "AVG";
    }
}
```

#### AllocateMessageQueueAveragelyByCircle -基于环形平均算法

环形平均算法，是指根据消费者的顺序，依次在由`queue队列`组成的环形图中逐个分配。具体流程如下所示:

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/%E5%9F%BA%E4%BA%8E%E7%8E%AF%E5%BD%A2%E5%B9%B3%E5%9D%87%E7%AE%97%E6%B3%95.png?raw=true)

代码实现如下：

```java
package org.apache.rocketmq.client.consumer.rebalance;

import java.util.ArrayList;
import java.util.List;
import org.apache.rocketmq.client.consumer.AllocateMessageQueueStrategy;
import org.apache.rocketmq.client.log.ClientLogger;
import org.apache.rocketmq.logging.InternalLogger;
import org.apache.rocketmq.common.message.MessageQueue;

/**
 * Cycle average Hashing queue algorithm
 */
public class AllocateMessageQueueAveragelyByCircle implements AllocateMessageQueueStrategy {
    private final InternalLogger log = ClientLogger.getLog();

    @Override
    public List<MessageQueue> allocate(String consumerGroup, String currentCID, List<MessageQueue> mqAll,
        List<String> cidAll) {
        if (currentCID == null || currentCID.length() < 1) {
            throw new IllegalArgumentException("currentCID is empty");
        }
        if (mqAll == null || mqAll.isEmpty()) {
            throw new IllegalArgumentException("mqAll is null or mqAll empty");
        }
        if (cidAll == null || cidAll.isEmpty()) {
            throw new IllegalArgumentException("cidAll is null or cidAll empty");
        }

        List<MessageQueue> result = new ArrayList<MessageQueue>();
        if (!cidAll.contains(currentCID)) {
            log.info("[BUG] ConsumerGroup: {} The consumerId: {} not in cidAll: {}",
                consumerGroup,
                currentCID,
                cidAll);
            return result;
        }
		
        int index = cidAll.indexOf(currentCID);
        for (int i = index; i < mqAll.size(); i++) {
            if (i % cidAll.size() == index) {
                result.add(mqAll.get(i));
            }
        }
        return result;
    }

    @Override
    public String getName() {
        return "AVG_BY_CIRCLE";
    }
}

```

#### AllocateMessageQueueConsistentHash-基于一致性hash算法

> **什么是一致性hash 算法** ? 一致性hash算法用于在分布式系统中，保证数据的一致性而提出的一种基于hash环实现的算法，限于文章篇幅，不在这里展开描述，有兴趣的同学可以参考下 别人的博文：[一致性哈希算法原理](https://www.cnblogs.com/lpfuture/p/5796398.html)

看一下代码实现：

```java
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.rocketmq.client.consumer.rebalance;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.apache.rocketmq.client.consumer.AllocateMessageQueueStrategy;
import org.apache.rocketmq.client.log.ClientLogger;
import org.apache.rocketmq.common.consistenthash.ConsistentHashRouter;
import org.apache.rocketmq.common.consistenthash.HashFunction;
import org.apache.rocketmq.common.consistenthash.Node;
import org.apache.rocketmq.logging.InternalLogger;
import org.apache.rocketmq.common.message.MessageQueue;

/**
 * Consistent Hashing queue algorithm
 */
public class AllocateMessageQueueConsistentHash implements AllocateMessageQueueStrategy {
    private final InternalLogger log = ClientLogger.getLog();

    private final int virtualNodeCnt;
    private final HashFunction customHashFunction;

    public AllocateMessageQueueConsistentHash() {
        this(10);
    }

    public AllocateMessageQueueConsistentHash(int virtualNodeCnt) {
        this(virtualNodeCnt, null);
    }

    public AllocateMessageQueueConsistentHash(int virtualNodeCnt, HashFunction customHashFunction) {
        if (virtualNodeCnt < 0) {
            throw new IllegalArgumentException("illegal virtualNodeCnt :" + virtualNodeCnt);
        }
        this.virtualNodeCnt = virtualNodeCnt;
        this.customHashFunction = customHashFunction;
    }

    @Override
    public List<MessageQueue> allocate(String consumerGroup, String currentCID, List<MessageQueue> mqAll,
        List<String> cidAll) {

        if (currentCID == null || currentCID.length() < 1) {
            throw new IllegalArgumentException("currentCID is empty");
        }
        if (mqAll == null || mqAll.isEmpty()) {
            throw new IllegalArgumentException("mqAll is null or mqAll empty");
        }
        if (cidAll == null || cidAll.isEmpty()) {
            throw new IllegalArgumentException("cidAll is null or cidAll empty");
        }

        List<MessageQueue> result = new ArrayList<MessageQueue>();
        if (!cidAll.contains(currentCID)) {
            log.info("[BUG] ConsumerGroup: {} The consumerId: {} not in cidAll: {}",
                consumerGroup,
                currentCID,
                cidAll);
            return result;
        }

        Collection<ClientNode> cidNodes = new ArrayList<ClientNode>();
        for (String cid : cidAll) {
            cidNodes.add(new ClientNode(cid));
        }

        final ConsistentHashRouter<ClientNode> router; //for building hash ring
        if (customHashFunction != null) {
            router = new ConsistentHashRouter<ClientNode>(cidNodes, virtualNodeCnt, customHashFunction);
        } else {
            router = new ConsistentHashRouter<ClientNode>(cidNodes, virtualNodeCnt);
        }

        List<MessageQueue> results = new ArrayList<MessageQueue>();
        for (MessageQueue mq : mqAll) {
            ClientNode clientNode = router.routeNode(mq.toString());
            if (clientNode != null && currentCID.equals(clientNode.getKey())) {
                results.add(mq);
            }
        }

        return results;

    }

    @Override
    public String getName() {
        return "CONSISTENT_HASH";
    }

    private static class ClientNode implements Node {
        private final String clientID;

        public ClientNode(String clientID) {
            this.clientID = clientID;
        }

        @Override
        public String getKey() {
            return clientID;
        }
    }

}

```

其他的就不分析了用的少。默认为 **`AllocateMessageQueueAveragely`** 