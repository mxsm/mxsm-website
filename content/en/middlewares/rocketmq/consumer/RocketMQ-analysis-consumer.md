---
title: RocketMQ源码解析-消费者启动源码解析
date: 2021-06-13
weight: 202106102130
---

> 以下源码基于RocketMQ 4.8.0

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

以上代码来自官网，下面基于上面的消费源码来分析消费者的源码，看一下消费者如何进行消费的。

### 1.  消费接口继承关系

![](https://github.com/mxsm/picture/blob/main/rocketmq/MQConsumerExtends.png?raw=true)

通过继承关系可以发现消费分为两中：

- **Push消费**

  在启动后，Consumer客户端会主动循环发送Pull请求到broker，如果没有消息，broker会把请求放入等待队列，新消息到达后返回response

- **Pull消费**

  由用户主动调用pull方法来获取消息，没有则返回。从上面继承关系发现Pull的实现已经被弃用了。(暂时也不分析)

### 2. DefaultMQPushConsumer常用设置

|             字段             |                    说明                     |                             备注                             |
| :--------------------------: | :-----------------------------------------: | :----------------------------------------------------------: |
|        consumerGroup         |                  消费者组                   |                                                              |
|         messageModel         |    消费模式(默认MessageModel.CLUSTERING)    |      消费集群模式(CLUSTERING)和广播播模式(BROADCASTING)      |
| allocateMessageQueueStrategy | 消费策略(默认AllocateMessageQueueAveragely) |      AllocateMessageQueueStrategy接口有五个实现在MQ里面      |
|       messageListener        |                 消息监听器                  | MessageListenerConcurrently和MessageListenerOrderly<br />消息监听器对于无序消息用第一个，有序消息用第二个 |
|       consumeThreadMin       |           消费最小线程池(默认20)            |                                                              |
|       consumeThreadMax       |           消费最大线程池(默认20)            |                                                              |
|  consumeMessageBatchMaxSize  |           批量消费消息数量(默认1)           |                                                              |
|        pullBatchSize         |      批量拉取的消息数量的大小(默认32)       |                                                              |

### 3. 消费者启动

启动流程图：

![](https://github.com/mxsm/picture/blob/main/rocketmq/MQ%E6%B6%88%E8%B4%B9%E8%80%85%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true)

消费者启动最终是调用 **`DefaultMQPushConsumerImpl#start`** 方法：

#### 3.1 基础配置和前期实例化

```java
public synchronized void start() throws MQClientException {
    
    //检查一些必须要的配置
    this.checkConfig();
	//拷贝订阅关系到RebalancePushImpl负载实现中
    this.copySubscription();
	//集群模式将实例名称改为JVM PID
    if (this.defaultMQPushConsumer.getMessageModel() == MessageModel.CLUSTERING) {
        this.defaultMQPushConsumer.changeInstanceNameToPID();
    }
	//创建MQClientInstance
    this.mQClientFactory = MQClientManager.getInstance().getOrCreateMQClientInstance(this.defaultMQPushConsumer, this.rpcHook);

    this.rebalanceImpl.setConsumerGroup(this.defaultMQPushConsumer.getConsumerGroup());
    this.rebalanceImpl.setMessageModel(this.defaultMQPushConsumer.getMessageModel());
    this.rebalanceImpl.setAllocateMessageQueueStrategy(this.defaultMQPushConsumer.getAllocateMessageQueueStrategy());
    this.rebalanceImpl.setmQClientFactory(this.mQClientFactory);
	//创建PullAPIWrapper
    this.pullAPIWrapper = new PullAPIWrapper(
        mQClientFactory,
        this.defaultMQPushConsumer.getConsumerGroup(), isUnitMode());
    this.pullAPIWrapper.registerFilterMessageHook(filterMessageHookList);
} 

```

- 检查启动的消费者的必备参数
- 创建MQClientInstance实例
- 创建PullAPIWrapper

### 3.2  消费类型和消息类型不同的设置

```java
public synchronized void start() throws MQClientException {
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
}
```

- 根据消费模式不同创建不同的消费进度加载情况。广播消费从本地加载，集群消费从Broker端进行加载
- 根据消息类型的不同创建不同的消费消息服务。 无序消息创建并发消费服务，有序消息创建有序消息消费服务

> 注意：集群消费消息的消费进度保存在Broker端，广播消费消息的进度保存在消费组本地

#### 3.3 消费启动

```java
mQClientFactory.start();
```

### 4. MQClientInstance#start 启动

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
                // 启动客户端channel
                this.mQClientAPIImpl.start();
                // 启动多个定时任务
                this.startScheduledTask();
                // 启动拉取消息服务
                this.pullMessageService.start();
                // 启动负载均衡服务
                this.rebalanceService.start();
                // 启动push服务(显示过期方法这个不关注)
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

到这里消费者客户端就启动完成了。可以对MQ消息进行消费了。

### 5. 总结与思考

在分析过程中有几个比较重要的地方：

- **消费模式**

  集群消费模式和广播消费模式，不同的消费模式模式下获取消费者的消费进度地方不一样。

- **消息类型**

  不同的消息类型处理消息类型的服务也不一样，无序消息类型处理消息类型的类为：ConsumeMessageConcurrentlyService， 而有序消费类型处理消费的服务为：ConsumeMessageOrderlyService

- **消费端的定时任务**

  消费者启动后，客户端还有好几个定时任务在本地跑。

- **分配消息队列的消费策略**

  通过选择不同的消费策略来实现不同的消费者对消息的消费

- **消费的负载均衡**

  负载均衡的实现

- **消费者消息流量控制**

  如何消息进行流量控制
