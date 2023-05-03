---
title: "MQPushConsumer源码分析-消息拉取"
linkTitle: "MQPushConsumer源码分析-消息拉取"
sidebar_position: 202303092156
description: MQPushConsumer源码分析消费者消息拉取
---

消费者启动后就是开始要对消息进行消费，在消费之前消息是如何从Broker中被拉取到本地的，接下来分一下拉取的整个过程和拉取过程中的

## 1. 消息拉取何时启动

`DefaultMQPushConsumerImpl#start` 启动方法里面有一个`MQClientInstance#start` 的启动，从这个方法里面可以看到：

```java
public void start() throws MQClientException {

    synchronized (this) {
        switch (this.serviceState) {
            case CREATE_JUST:
				//删除了部分代码
                // Start pull service
                this.pullMessageService.start();
                break;
            default:
                break;
        }
    }
}
```

这里有一个`PullMessageService`类的实例， 这个实例就是一个用于从拉取Broker的消息。

分析`PullMessageService`类可以发现实现了`ServiceThread`，那么可以知道`PullMessageService`是一个线程。了解到这个后我们分析一下run方法：

```java
@Override
public void run() {
    while (!this.isStopped()) {
        try {
            MessageRequest messageRequest = this.messageRequestQueue.take();
            if (messageRequest.getMessageRequestMode() == MessageRequestMode.POP) {
                this.popMessage((PopRequest) messageRequest);
            } else {
                this.pullMessage((PullRequest) messageRequest);
            }
        } catch (InterruptedException ignored) {
        } catch (Exception e) {
            logger.error("Pull Message Service Run Method exception", e);
        }
    }
}
```

从这里可以看出线程不断的从阻塞队列`messageRequestQueue`中获取实现了`MessageRequest` 接口的请求。从上面可以知道消息拉取请求有两种：

*   **PopRequest**
*   **PullRequest**

到这里我们已经了解了`PullMessageService` 是负责处理拉取请求。在启动的时候`messageRequestQueue` 阻塞队列中应该是空的那么阻塞队列的数据是何时放入进去的。

在`MQClientInstance#start`的时候有一个 `RebalanceService#start` 方法，RebalanceService也是实现ServiceThread所以说白了也是一个线程。从名称可以看出来这个线程池主要负责负载均衡。

```java
    @Override
    public void run() {
        while (!this.isStopped()) {
            this.waitForRunning(waitInterval);
            this.mqClientFactory.doRebalance();
        }
    }
```

负载均衡主要是通过`MQClientInstance#doRebalance` 实现。

```java
    public void doRebalance() {
        for (Map.Entry<String, MQConsumerInner> entry : this.consumerTable.entrySet()) {
            MQConsumerInner impl = entry.getValue();
            if (impl != null) {
                try {
                    impl.doRebalance();
                } catch (Throwable e) {
                    
                }
            }
        }
    }
```

从消费映射表中获取实现了MQConsumerInner接口的类。这个实现有三个：

*   **DefaultLitePullConsumerImpl**
*   **DefaultMQPullConsumerImpl(标记已经过期)**
*   **DefaultMQPushConsumerImpl**

以DefaultMQPushConsumerImpl为例子，通过分析代码可以知道最终调用的是 **`RebalanceImpl#rebalanceByTopic`** 的方法，这里处理两种模式分别是：

*   **BROADCASTING**
*   **CLUSTERING**

**`RebalanceImpl#rebalanceByTopic`** 这个方法里面包含了分配消息队列的策略， 然后调用 **`RebalanceImpl#updateProcessQueueTableInRebalance`**

创建 **`PullRequest`** 列表，最终调用`RebalanceImpl#dispatchPullRequest`抽象方法。 这个根据具体的实现来处理。

## 2. 消息如何拉取

消息的拉取请求 **`PullRequest`** 会插入\*\*`PullMessageService.messageRequestQueue`\*\* 的阻塞队列中。然后\*\*`PullMessageService`\*\* 服务会从中获取请求。

```java
@Override
public void run() {
    while (!this.isStopped()) {
        try {
            //省略部分无关紧要的代码
            MessageRequest messageRequest = this.messageRequestQueue.take();
            if (messageRequest.getMessageRequestMode() == MessageRequestMode.POP) {
                this.popMessage((PopRequest) messageRequest);
            } else {
                this.pullMessage((PullRequest) messageRequest);
            }
        } catch (InterruptedException ignored) {
        } catch (Exception e) {
        }
    }
}
```

通过跟踪代码可以发现最终是调用了 **`DefaultMQPushConsumerImpl#pullMessage`** 拉取消息。步骤如下：

*   确定DefaultMQPushConsumerImpl服务的状态，如果是不正常的状态就将请求重新放入请求队列
*   DefaultMQPushConsumerImpl暂停的情况下，将请求放入请求队列
*   判断本地缓存的消息数量和消息大小，如果数量超过1000条(默认值)和缓存的消息大小超过100M，等待消费者处理完部分消息后拉取，此时也会将请求放入阻塞队列
*   创建一个回调函数，发送一个请求编码为 **`LITE_PULL_MESSAGE`** 或者 **`PULL_MESSAGE`** 的到Broker。

## 3. Broker如何处理消息拉取请求

**`PullMessageProcessor`** 处理器用来处理\*\*`LITE_PULL_MESSAGE`\*\* 和 **`PULL_MESSAGE`** 两类请求编码的请求。从请求数据中解析出来请求头：

*   判断当前的Broker是否具有读的权限，如果没有返回 **ResponseCode.NO\_PERMISSION**
*   判断是否支持 LITE\_PULL\_MESSAGE，这个是配置在配置文件中的litePullMessageEnable字段，默认为true
*   从订阅管理中获取消费者组对应SubscriptionGroupConfig配置，对于内置的一些Topic在Broker启动的时候已经设置进去了，对于新的消费者组会根据 **SubscriptionGroupManager#findSubscriptionGroupConfig** 这个方法的逻辑进行处理， 当判断不允许消费的时候返回 **`ResponseCode.NO_PERMISSION`** 给客户端。
*   从**TopicConfigManager** 中获取消费Topic对应的配置，然后判断是否有对Topic的读权限，如果没有返回