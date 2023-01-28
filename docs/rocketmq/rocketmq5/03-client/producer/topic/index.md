---
title: "生产者Topic"
---

import DocCardList from '@theme/DocCardList';

在RocketMQ生产者启动后发送消息到Broker的时候需要获取到发送消息的Topic的一些基本信息，所以以下就有需要明白的几个点：

- 消息发送之前生产者如何获取更新Topic的信息
- Topic不存在如何创建Topic
- 生产者发送的消息如何根据Topic路由信息选择发送的Broker和队列



<DocCardList />

