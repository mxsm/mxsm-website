---
title: "Rocketmq生产者启动流程分析"
sidebar_position: 202301251540
description: 分析Rocketmq生产者启动流程以及启动过程的细节
---

## 1. 消息发送

```java
package org.apache.rocketmq.example.quickstart;

import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.remoting.common.RemotingHelper;
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

:::info 信息

例子代码来自[RocketMQ官方](https://github.com/apache/rocketmq/blob/develop/example/src/main/java/org/apache/rocketmq/example/quickstart/Producer.java)

:::

从上面的例子可以分析出来发送消息的几个步骤：

1. 构建DefaultMQProducer实例
2. 设置NameServer地址
3. 启动Producer
4. 构建需要发送消息
5. 发送数据到Broker，等待返回结果(同步发送)
6. 生产者shutdown

1、2、3步骤是Rocketmq生产者启动流程。接下来就分析启动流程

## 2. 生产者类继承关系

![image-20230126131919957](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/client/producer/image-20230126131919957.png)

类的继承关系如上图。接下分析生长着启动的过程。

## 3. DefaultMQProducer#start

```java jxs title="DefaultMQProducer#start"
@Override
public void start() throws MQClientException {
    //设置生产者组
    this.setProducerGroup(withNamespace(this.producerGroup));
    //启动服务
    this.defaultMQProducerImpl.start();
    if (null != traceDispatcher) {
        try {
            traceDispatcher.start(this.getNamesrvAddr(), this.getAccessChannel());
        } catch (MQClientException e) {
            logger.warn("trace dispatcher start failed ", e);
        }
    }
}
```

主要的方法 **`DefaultMQProducerImpl#start`** 

```java jxs title="DefaultMQProducerImpl#start"
public void start(final boolean startFactory) throws MQClientException {
    switch (this.serviceState) {
        case CREATE_JUST: //初次serviceState默认值CREATE_JUST
            this.serviceState = ServiceState.START_FAILED;

            this.checkConfig();

            if (!this.defaultMQProducer.getProducerGroup().equals(MixAll.CLIENT_INNER_PRODUCER_GROUP)) {
                this.defaultMQProducer.changeInstanceNameToPID();
            }
            //创建获取ClientFactory
            this.mQClientFactory = MQClientManager.getInstance().getOrCreateMQClientInstance(this.defaultMQProducer, rpcHook);

            //往ClientFactory注册当前生产者
            boolean registerOK = mQClientFactory.registerProducer(this.defaultMQProducer.getProducerGroup(), this);
            if (!registerOK) {
                this.serviceState = ServiceState.CREATE_JUST;
                throw new MQClientException("The producer group[" + this.defaultMQProducer.getProducerGroup()
                    + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
                    null);
            }

            //初始化当前生产者主题和主题发布的映射关系
            this.topicPublishInfoTable.put(this.defaultMQProducer.getCreateTopicKey(), new TopicPublishInfo());

            //启动工厂类
            if (startFactory) {
                mQClientFactory.start();
            }

            log.info("the producer [{}] start OK. sendMessageWithVIPChannel={}", this.defaultMQProducer.getProducerGroup(),
                this.defaultMQProducer.isSendMessageWithVIPChannel());
            this.serviceState = ServiceState.RUNNING;
            break;
        case RUNNING:
        case START_FAILED:
        case SHUTDOWN_ALREADY:
            throw new MQClientException("The producer service state not OK, maybe started once, "
                + this.serviceState
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_SERVICE_NOT_OK),
                null);
        default:
            break;
    }
    //发送心跳给所有的Broker
    this.mQClientFactory.sendHeartbeatToAllBrokerWithLock();

    //启动定时任务
    RequestFutureHolder.getInstance().startScheduledTask(this);
}
```

上述方法主要可以分成一下几个步骤：

1. 生产者启动必要参数的校验
2. 创建或者从缓存中根据生产者ID获取MQClientInstance实例
3. MQClientInstance实例中注册当前生产者
4. 初始化当前生产者主题和主题发布信息映射关系
5. 启动MQClientInstance
6. 发送心跳给所有的Broker
7. 启动定时任务

解析来就分析上述的几个步骤看看具体做了什么。

## 4. 生产者启动流程详解

### 4.1 必要参数校验

主要校验了 **`DefaultMQProducer.producerGroup`** 字段是否符合要求。

### 4.2 创建或者从缓存中根据生产者ID获取MQClientInstance实例

```java jxs title="MQClientManager"
public class MQClientManager {
    private final static Logger log = LoggerFactory.getLogger(MQClientManager.class);
    private static MQClientManager instance = new MQClientManager();
    private AtomicInteger factoryIndexGenerator = new AtomicInteger();
    //保存客户端ID和MQClientInstance实例的映射关系
    private ConcurrentMap<String/* clientId */, MQClientInstance> factoryTable =
        new ConcurrentHashMap<>();

    private MQClientManager() {

    }
	//省略部分代码
}
```

**`MQClientManager`** 主要管理客户端和MQClientInstance实例之间的映射关系。`MQClientManager#getOrCreateMQClientInstance` 方法获取MQClientInstance实例如果缓存中存在直接获取，缓存中不存在直接创建。

:::info 信息

MQClientInstance的创建在启动的时候进行分析

:::

### 4.3 MQClientInstance实例中注册当前生产者

将生产者组和生产者缓存到MQClientInstance实例中：

```java jxs title="MQClientInstance#registerProducer"
public synchronized boolean registerProducer(final String group, final DefaultMQProducerImpl producer) {
    if (null == group || null == producer) {
        return false;
    }

    MQProducerInner prev = this.producerTable.putIfAbsent(group, producer);
    if (prev != null) {
        log.warn("the producer group[{}] exist already.", group);
        return false;
    }

    return true;
}
```

### 4.4 初始化当前生产者主题和主题发布信息映射关系

将当前生产者的主题和主题发布的映射关系先初始化，当前没有去NameServer拉取对应的Topic的相关数据信息。

### 4.5 启动MQClientInstance

启动MQClientInstance是重点，从代码一一来分析：

```java jxs title="MQClientInstance#start"
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
                // Start pull service
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

#### 4.5.1 建立生产者和配置的NameServer的Channel通道

**`MQClientAPIImpl`** 实例化后在 `ClientConfig#getNamesrvAddr` 方法获取的NameServer地址不为空的情况下会更新MQClientAPIImpl实例中的NameServer地址。随后在启动MQClientAPIImpl的时候与地址对应的NameServer建立Channel通道。

![image-20230127205711836](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/client/producer/image-20230127205711836.png)

#### 4.5.2 启动MQClientInstance定时任务

一共有五个定时任务启动，有一个不是必须启动。

1. 定时更新NameServer地址

   每120秒更新一次(配置的NameServer为空的情况下启动)，可以自己通过SPI实现TopAddressing接口。

2. 定时更新Topic的路由信息

   每30秒更新一次，将当前的应用中的生产者和消费者对应的Topic全部缓存下来，然后去NameServer更新TopicRouteData的数据。

3. 定时清理离线Broker和给Broker发送心跳

   每30秒执行一次

4. 定时持久化消费进度

   每5秒钟持久一次消费进的，但是这样消费进度的持久化需要分为两种情况：

   - 广播消息

     广播消息消费进度直接持久化在消费者本地

   - 集群消息

     集群消息消费进度持久化Broker

5. 调整线程池

   每一分钟执行一次，但是具体是没有实现

#### 4.5.3 启动PullMessageService

PullMessageService的本质是一个线程，继承了`ServiceThread` 。 从消息阻塞队列中获取消息请求`MessageRequest` 然后判断请求是 `PopReques` 还是 `PullRequest`  执行不同的数据拉取。

```java jxs title="PullMessageService#run"
@Override
public void run() {
    //省略日志打印代码
    while (!this.isStopped()) {
        try {
            MessageRequest messageRequest = this.messageRequestQueue.take();
            if (messageRequest.getMessageRequestMode() == MessageRequestMode.POP) {
                this.popMessage((PopRequest)messageRequest);
            } else {
                this.pullMessage((PullRequest)messageRequest);
            }
        } catch (InterruptedException ignored) {
        } catch (Exception e) {
      
        }
    }
}
```

#### 4.5.4 启动RebalanceService服务

RebalanceService的本质是一个线程，继承了`ServiceThread` 。 

```java jxs title="RebalanceService#run"
@Override
public void run() {
    while (!this.isStopped()) {
        this.waitForRunning(waitInterval);
        this.mqClientFactory.doRebalance();
    }
}
```

作用是默认情况下每20S调用一次 **`MQClientInstance#doRebalance`** 方法来完成Consumer **`负载均衡`** 将重新分配的MessageQueue构建PullRequest请求并将其放到PullMessageService服务中的pullRequestQueue队列中。

:::tip 说明

负载均衡、PopRequest、PullRequest的分析都会在后续文章中进行

:::

#### 4.5.6 启动MQClientInstance内部的DefaultMQProducer

启动MQClientInstance内部的DefaultMQProducer这个，这个DefaultMQProducer的作用是用于将回调失败的信息重新发送到Broker。

### 4.6 发送心跳给所有的Broker

生产者发送心跳给Broker，与Broker建立连接。

### 4.7 启动定时任务

这里启动的定时任务是用于扫描处理超时的请求。

## 5. 总结

待定。。
