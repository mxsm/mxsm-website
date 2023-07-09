---
title: "EventMesh JDBC MySQL Connector的实现"
linkTitle: "EventMesh JDBC MySQL Connector的实现"
weight: 202305271613
description: EventMesh JDBC MySQL Connector的实现
---

## 1. 背景

Apache EventMesh需要开发ETL的功能，增加一个JDBC Mysql Connetor的模块来实现MySQL的ETL功能。

## 2. 功能分析

Connector主要分成两个部分Source和Sink。

- Source负责MySQL数据源头抽取数据发送给EventMesh
- Sink负责从EventMesh获取数据存储到目标源(这里可以是MySQL，ES， Redis等)

从整体上来说就通过JDBC获取源目标的数据然后通过EventMesh，由Sink订阅EventMesh的数据将数据转换以JDBC存入目标数据源。

### 2.1 Source需要解决的问题

**如何动态获取数据库的数据改变(CDC)？**

- MySQL Source动态的捕获数据源的数据变动是一个必须解决的问题，
- Source服务宕机了再次启动如何实现数据变动的不重复捕获。
- Source HA高可用的实现

#### 2.2 Sink需要解决的问题

不同的支持JDBC数据库的支持

### 3. 架构

![Mysql Binlog Event Handler](E:\download\Mysql Binlog Event Handler.png)

MySQL Connector通过模拟MySQL Slave从MySQL master获取binlog文件。解析binlog文件的Binlog Event然后将数据发送到EventMesh。Sink订阅相对于的Topic从EventMesh获取数据存储到对应的数据源。