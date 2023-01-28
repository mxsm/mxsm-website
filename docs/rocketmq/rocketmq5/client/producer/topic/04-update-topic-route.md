---
title: "RocketMQ生产者如何更新Topic路由信息"
sidebar_position: 202301282224
description: 分析RocketMQ Producer如何更新Topic路由信息
---

## 1. 概述

在RocketMQ生产者启动后发送消息到Broker的时候需要获取到发送消息的Topic的一些基本信息，所以以下就有需要明白的几个点：

- 消息发送之前