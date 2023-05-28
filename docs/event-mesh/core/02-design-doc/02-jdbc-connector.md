---
title: "EventMesh JDBC Connector 技术调研"
linkTitle: "EventMesh JDBC Connector 技术调研"
weight: 202305271613
description: EventMesh JDBC Connector 技术调研
---

## 1. 背景

Apache EventMesh需要开发ETL的功能，增加一个JDBC Connetor的模块来实现JDBC的ETL功能。

## 2. 功能分析

Connector主要分成两个部分Source和Sink。

- Source负责从数据源头抽取数据发送给EventMesh
- Sink负责从EventMesh获取数据存储到目标源

从整体上来说就通过JDBC获取源目标的数据然后通过EventMesh，由Sink订阅EventMesh的数据将数据转换以JDBC存入目标数据源。

### 2.1 Source需要解决的问题

**如何动态获取数据库的数据改变(CDC)？**

- Source动态的捕获数据源的数据变动是一个必须解决的问题，同时需要解决如果Source服务宕机了再次启动如何实现数据变动的不重复捕获。
- 不同的数据库动态获取数据库的数据改变实现方式可能不一样。针对不同的数据库进行不同的实现

#### 2.2 Sink需要解决的问题

不同的支持JDBC数据库的支持

### 3.CDC实现方案

通过调研现有技术CDC的实现方案大致有两类：

- 自己重新开始实现一套

  优点：限制相对较少比较灵活

  缺点：开发量大，需要重新造轮子。稳定性得不到保证。

- 基于RedHat的debezium实现

  优点： 社区活跃，技术相对比较成熟，支持的数据库也相对较多

  缺点： 需要支持其他的数据库需要社区进行开发然后集成，基于Kafka Connector实现