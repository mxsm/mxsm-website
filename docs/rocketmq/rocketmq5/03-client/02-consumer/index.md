---
title: Consumer(消费者)
---

import DocCardList from '@theme/DocCardList';

<DocCardList />

### 1. Consumer类型

RocketMQ Consumer有两种类型：PushConsumer和PullConsumer。PushConsumer是一种高级API，它能够实现自动从Broker拉取消息，并进行消息消费。而PullConsumer则是一种低级API，它需要手动从Broker拉取消息，适用于一些特殊场景下的消费。

### 2. 消费模式

RocketMQ Consumer支持三种消费模式：集群模式、广播模式和失败重试模式。集群模式下，同一个Consumer Group内的多个Consumer共同消费一个Topic中的消息；广播模式下，同一个Consumer Group内的每个Consumer都能消费到全部的消息；而失败重试模式则是在消费失败后，自动进行消息重试。

### 3. 消息顺序保证

RocketMQ支持顺序消息消费，即消息的消费顺序和发送顺序一致。为了实现顺序消息消费，RocketMQ提供了一种特殊的消费模式：顺序消费模式。在顺序消费模式下，同一个队列内的消息将会按照发送顺序被同一个Consumer消费。

### 4. 消息过滤

RocketMQ支持通过SQL表达式对消息进行过滤，即只消费符合条件的消息。这个功能可以通过配置Consumer的消息过滤表达式来实现。

### 5. 消费进度管理

RocketMQ提供了消费进度管理功能，可以记录每个Consumer已经消费到的消息的位置，以便在Consumer宕机或重启后，可以从上一次消费的位置继续消费消息。这个功能可以通过配置消费者的offset来实现。

### 6.消费者重平衡

消费者重平衡：RocketMQ Consumer支持消费者重平衡机制，在新增或者删除消费者时，可以自动进行消费者负载均衡。