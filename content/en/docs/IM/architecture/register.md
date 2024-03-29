---
title: "注册中心(Register)"
linkTitle: "注册中心(Register)"
date: 2022-02-13
weight: 202202132021
---

### 1.概述

整个IM系统，注册中心提供服务注册发现的功能，同时为监控提供数据。客户端接入服务、消息处理服务的服务注册发现都是由注册中心提供。当两个服务有服务上线就会往注册中心注册相对应的服务信息，同时对于客户端的接入服务会定时的讲接入的客户端信息(定时器)同步到注册中心，以便监控服务的查看同时也为后续的客户端接入服务。

### 2. 架构

![注册中心架构](https://raw.githubusercontent.com/mxsm/picture/main/IM/register/%E6%B3%A8%E5%86%8C%E4%B8%AD%E5%BF%83%E6%9E%B6%E6%9E%84.png)

- 注册中心设定一个域名(register.mxsm.local),当注册中心集群有服务上线，就在DNS服务中注册IP与域名的绑定关系。
- 客户端接入服务集群和消息处理集群，定时拉取DNS服务中的新增的注册中心集群IP,将客户端接入服务集群和消息处理集群信息注册到新上线的注册中心的服务。
- 客户端通过去注册中心通过某种策略获取到客户端接入服务的IP地址，连接服务。

### 3. CoreDNS组件

CoreDNS组件引入搭建内部换件的DNS服务，主要提供服务发现。使得客户端接入服务集群和消息处理集群的服务只需要配置注册中心集群的域名地址，就能动态感知注册中心新上线的服务的IP地址，然后将两个集群的服务数据同步到新上线的注册中心。

### 4. 注册中心高可用保障

注册中心的高可用注意项，以集群节点数为N（N>=1）：

- 对于一个注册中心集群包含N个节点允许最大N-1个服务发生故障
- 当注册中心全部的N个节点都发生故障，会影响发生故障后的新的要接入的客户端，之前接入的不影响。客户端会保存上一次客户端接入服务的IP,在注册中心全部不可用的情况下使用原有的本地缓存
- 只要存在一个节点可以用,整个注册中心都可用。同时注册中心集群都不可用也不会影响已经接入的过的服务。

注册中心集群服务之间是没有任何通讯的。那么整个注册中心的高可用如何保障？

注册中心集群中的每一个节点都包含了所有的客户端接入服务和消息处理集群的元数据，同时也包含了客户端接入服务的客户端的信息，以及消息处理服务接入的客户端接入服务的信息。只要有一台注册中心能够使用就能够提供接入服务。

### 5. 注册中心的功能

![注册中心功能](https://raw.githubusercontent.com/mxsm/picture/main/IM/register/%E6%B3%A8%E5%86%8C%E4%B8%AD%E5%BF%83%E5%8A%9F%E8%83%BD.png)

主要的功能：

- 服务注册与发现(DNS)
- 为客户端选择客户端接入服务
- 提供监控的底层数据
- 注册中心启动自动注册IP到CoreDNS
