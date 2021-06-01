---
title: "RocketMQ Broker"
linkTitle: "RocketMQ Broker"
date: 2021-05-10
weight: 202102102306
---

Broker主要负责消息的存储、投递和查询以及服务高可用保证，为了实现这些功能，Broker包含了以下几个重要子模块:

- **Remoting Module** ：整个Broker的实体，负责处理来自clients端的请求
- **Client Manager**：负责管理客户端(Producer/Consumer)和维护Consumer的Topic订阅信息
- **Store Service** ：提供方便简单的API接口处理消息存储到物理硬盘和查询功能
- **HA Service** ：高可用服务，提供Master Broker 和 Slave Broker之间的数据同步功能
- **Index Service** ：根据特定的Message key对投递到Broker的消息进行索引服务，以提供消息的快速查询



