---
title: broker busy问题
categories:
  - MQ
  - RocketMQ
  - producer
tags:
  - MQ
  - RocketMQ
  - producer
  - broker busy问题
abbrlink: b194cb57
date: 2020-04-05 21:40:00
---



### 问题描述

在生产者不停的往Broker发送消息报broker busy

```shell
org.apache.rocketmq.client.exception.MQBrokerException: CODE: 2  DESC: [TIMEOUT_CLEAN_QUEUE]broker busy, start flow control for a while, period in queue: 240ms, size of queue: 9
For more information, please visit the url, http://rocketmq.apache.org/docs/faq/
	at org.apache.rocketmq.client.impl.MQClientAPIImpl.processSendResponse(MQClientAPIImpl.java:711)
	at org.apache.rocketmq.client.impl.MQClientAPIImpl.sendMessageSync(MQClientAPIImpl.java:505)
	at org.apache.rocketmq.client.impl.MQClientAPIImpl.sendMessage(MQClientAPIImpl.java:487)
	at org.apache.rocketmq.client.impl.MQClientAPIImpl.sendMessage(MQClientAPIImpl.java:431)
	at org.apache.rocketmq.client.impl.producer.DefaultMQProducerImpl.sendKernelImpl(DefaultMQProducerImpl.java:853)
	at org.apache.rocketmq.client.impl.producer.DefaultMQProducerImpl.sendDefaultImpl(DefaultMQProducerImpl.java:583)
	at org.apache.rocketmq.client.impl.producer.DefaultMQProducerImpl.send(DefaultMQProducerImpl.java:1342)
	at org.apache.rocketmq.client.impl.producer.DefaultMQProducerImpl.send(DefaultMQProducerImpl.java:1288)
	at org.apache.rocketmq.client.producer.DefaultMQProducer.send(DefaultMQProducer.java:324)
	at com.github.mxsm.MQProducer.lambda$main$0(MQProducer.java:50)
	at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
	at java.util.concurrent.FutureTask.run$$$capture(FutureTask.java:266)
	at java.util.concurrent.FutureTask.run(FutureTask.java)
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
	at java.lang.Thread.run(Thread.java:748)
```

### 源码分析问题

通过搜索错误信息可以定位到错误是从 **`BrokerFastFailure`** 类抛出来的。

```java
    void cleanExpiredRequestInQueue(final BlockingQueue<Runnable> blockingQueue, final long maxWaitTimeMillsInQueue) {
        while (true) {
            try {
                if (!blockingQueue.isEmpty()) {
                    final Runnable runnable = blockingQueue.peek();
                    if (null == runnable) {
                        break;
                    }
                    final RequestTask rt = castRunnable(runnable);
                    if (rt == null || rt.isStopRun()) {
                        break;
                    }

                    final long behind = System.currentTimeMillis() - rt.getCreateTimestamp();
                    if (behind >= maxWaitTimeMillsInQueue) {
                        if (blockingQueue.remove(runnable)) {
                            rt.setStopRun(true);
                            rt.returnResponse(RemotingSysResponseCode.SYSTEM_BUSY, String.format("[TIMEOUT_CLEAN_QUEUE]broker busy, start flow control for a while, period in queue: %sms, size of queue: %d", behind, blockingQueue.size()));
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } catch (Throwable ignored) {
            }
        }
    }
```

那么这个 **`BrokerFastFailure#cleanExpiredRequestInQueue`**  主要用于清理阻塞队列中的过期的 

**`RequestTask`** 。这个方法在 **`BrokerFastFailure#cleanExpiredRequest`** 中被调用：

```java
    private void cleanExpiredRequest() {
        
        //系统页忙抛错
        while (this.brokerController.getMessageStore().isOSPageCacheBusy()) {
            try {
                if (!this.brokerController.getSendThreadPoolQueue().isEmpty()) {
                    final Runnable runnable = this.brokerController.getSendThreadPoolQueue().poll(0, TimeUnit.SECONDS);
                    if (null == runnable) {
                        break;
                    }

                    final RequestTask rt = castRunnable(runnable);
                    rt.returnResponse(RemotingSysResponseCode.SYSTEM_BUSY, String.format("[PCBUSY_CLEAN_QUEUE]broker busy, start flow control for a while, period in queue: %sms, size of queue: %d", System.currentTimeMillis() - rt.getCreateTimestamp(), this.brokerController.getSendThreadPoolQueue().size()));
                } else {
                    break;
                }
            } catch (Throwable ignored) {
            }
        }
		//清理过期发送消息队列请求
        cleanExpiredRequestInQueue(this.brokerController.getSendThreadPoolQueue(),
            this.brokerController.getBrokerConfig().getWaitTimeMillsInSendQueue());
		//清理过期拉取消息的请求
        cleanExpiredRequestInQueue(this.brokerController.getPullThreadPoolQueue(),
            this.brokerController.getBrokerConfig().getWaitTimeMillsInPullQueue());
		//清理过期心跳的请求
        cleanExpiredRequestInQueue(this.brokerController.getHeartbeatThreadPoolQueue(),
            this.brokerController.getBrokerConfig().getWaitTimeMillsInHeartbeatQueue());
//清理过期事务请求
        cleanExpiredRequestInQueue(this.brokerController.getEndTransactionThreadPoolQueue(), this
            .brokerController.getBrokerConfig().getWaitTimeMillsInTransactionQueue());
    }
```

**由于是之前在不停的往MQ发送消息消息，所以判断是由于清理过期的发送处理请求导致的。** 那么如何解决问题，通过代码可以看一出来通过增加等待时间来解决这个问题。

> waitTimeMillsInSendQueue=200 （默认值）--修改这个值

