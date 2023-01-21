---
title: "聊聊RocketMQ5消息发送"
linkTitle: "聊聊RocketMQ5消息发送"
sidebar_position: 202301202006
description: RocketMQ消息的发送方式和RocketMQ消息发送消息类型
---

## 1. RocketMQ消息发送模式

![RocketMQ消息发送方式](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/client/producerRocketMQ%E6%B6%88%E6%81%AF%E5%8F%91%E9%80%81%E6%96%B9%E5%BC%8F.png)
消息的发送是由消息生产者发送给Broker,经过Broker处理后的消息才能给到消费者进行消费。消息发送有三种模式：

1. 同步消息：生产者将消息发送给RocketMQ Broker，生产者收到Broker的ACK后才是标明消息发送成功。
2. 异步消息： 生产者发送消息给Broker后不会一直等待Broker的ACK,但是会通过回调来处理消息的ACK。
3. 单向消息：生产者只管往Broker发送消息完全不理会Broker是否正常保存。

## 2. RocketMQ消息发送消息类型

发送消息类型:

1. 普通消息，这个也是平时使用最多的消息类型。只是包含了业务数据
2. 顺序消息，可以按照消息的发送顺序来消费(FIFO)。RocketMQ可以严格的保证消息有序，可以分为分区有序或者全局有序。
3. 延时消息，延时消息就是消息定时延后，延时消息分为两种:
   1. 等级延时
   2. 任意延时(5.0新增)
4. 事务消息
5. 批量消息，多条消息一次性发送到Broker