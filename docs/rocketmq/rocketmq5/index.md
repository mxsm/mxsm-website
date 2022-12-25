---
title: RocketMQ5.0
sidebar_label: Overview
hide_table_of_contents: true
slug: /rocketmq/rocketmq5
---

<head>
  <title>RocketMQ5.0</title>
  <meta
    name="description"
    content="Ionic Framework is an open-source UI toolkit to create your own mobile apps using web technologies with integrations for popular frameworks."
  />
  <link rel="canonical" href="https://ionicframework.com/docs" />
  <link rel="alternate" href="https://ionicframework.com/docs" hreflang="x-default" />
  <link rel="alternate" href="https://ionicframework.com/docs" hreflang="en" />
  <meta property="og:url" content="https://ionicframework.com/docs" />
</head>


## 1. RocketMQ路由中心NameServer

### 1.1 NameServer架构设计

### 1.2 NameServer启动流程

### 1.3 NameServer路由注册、故障剔除

#### 1.3.1 路由元信息

#### 1.3.2 路由注册

#### 1.3.3 路由删除

#### 1.3.4 路由发现

## 2. RocketMQ消息发送MQProducer

### 2.1 聊聊RocketMQ消息发送

### 2.2 初步了解RocketMQ消息

### 2.3 生产者启动过程

#### 2.3.1 了解DefaultMQProducer与TransactionMQProducer消息发送

#### 2.3.2 生产者的启动流程分析

### 2.4 消息发送的流程分析(单条消息)

#### 2.4.1 消息长度验证

#### 2.4.2 查找主题和路由信息

#### 2.4.3 选择消息队列-队列选择策略

#### 2.3.4 发送消息

### 3.5批量消息发送

## 3. RocketMQ数据存储Broker

### 3.1 存储概要设计

### 3.2 消息存储和索引存储

### 3.3 消息发送到Broker存储的流程

### 3.4 存储文件组织和内存映射关系

#### 3.4.1 MappedFileQueue映射文件队列

#### 3.4.2 MappedFile内存映射文件

#### 3.4.3 TransientStorePool-暂存池

### 3.5 RocketMQ的存储文件

#### 3.5.1 Commitlog-消息存储文件

#### 3.5.2 ConsumeQueue-消费队列存储文件

#### 3.5.3 Index-索引文件

#### 3.5.4 checkpoint文件

#### 3.5.5 epochFileCheckpoint文件

#### 3.5.6 timerwheel文件

#### 3.5.7 config的文件

### 3.6 消息文件与索引文件的恢复

#### 3.6.1 Broker正常停止文件恢复

#### 3.6.2 Broke异常停止文件恢复

### 3.7 文件刷盘机制

#### 3.7.1 同步刷盘

#### 3.7.2 异步刷盘

### 3.8 过期文件的处理机制

## 4 RocketMQ消息消费MQConsumer

### 4.1 消息消费概述

### 4.2 消费者启动流程

### 4.3 消息拉取

#### 4.3.1 PullMessageService实现机制

#### 4.3.2 ProcessQueue实现机制

#### 4.3.3 消息拉取基本流程-图文详解

### 4.4　消息队列负载与重新分布机制

### 4.5 消息消费过程

#### 4.5.1 消息消费

#### 4.5.2  消息确认(ACK)

#### 4.5.3 消费进度管理

### 4.6 定时消息机制

#### 4.6.1 定时调度逻辑

### 4.7 延迟消息机制

### 4.8 顺序消息

#### 4.8.1消息队列负载

#### 4.8.2 消息拉取

#### 4.8.3 消息消费

#### 4.8.4 消息队列锁实现

### 4.9 事务消息

#### 4.9.1 事务消息实现思想

#### 4.9.2 事务消息发送流程

#### 4.9.3 提交或回滚事务

#### 4.9.4 事务消息回查事务状态

## 5 消息过滤

### 5.1 消息过滤机制

#### 5.1.1 TAG模式过滤

#### 5.1.2 SQL表达模式过滤

### 5.2 消息过滤FilterServer

#### 5.2.1ClassFilter运行机制

#### 5.2.2 FilterServer注册剖析

#### 5.2.3 类过滤模式订阅机制

#### 5.2.4 消息拉取

### 6. RocketMQ HA机制

### 6.1 RocketMQ主从复制原理

### 6.2 RocketMQ主从同步(HA)机制

#### 6.2.1 HAService整体工作机制

#### 6.2.2AcceptSocketService实现原理

#### 6.2.3 GroupTransferService实现原理

#### 6.2.4 HAClient实现原理

#### 6.2.4 HAConnection实现原理

### 6.3  RocketMQ主从同步(AutoSwitchHA)自动切换机制

#### 6.3.1 AutoSwitchHAService整体工作机制

#### 6.3.2 AutoSwitchHAConnection实现原理

#### 6.3.2 AutoSwitchHAClient实现原理

# 7 其他

### 7.1 运维命令

### 7.2 RocketMQ Console
