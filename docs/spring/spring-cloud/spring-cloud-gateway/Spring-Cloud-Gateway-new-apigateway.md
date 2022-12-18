---
title: Spring Cloud Gateway-新一代API网关服务
date: 2020-11-22
weight: 1
---

### 1 Spring Cloud Gateway简介

SpringCloud Gateway 是 Spring Cloud 的一个全新项目，该项目是基于 Spring 5.0，Spring Boot 2.0 和 Project Reactor 等技术开发的网关，它旨在为微服务架构提供一种简单有效的统一的 API 路由管理方式。主要目标是替代 Zuul。Netflix对Zuul停止了维护和更新。所以在Spring Boot2.0没办法集成。Spring Cloud Gateway旨在提供一种简单而有效的方法来路由到API，并为它们提供跨领域的关注，例如：安全性，监视/指标和弹性。 

### 2 Spring Cloud Gateway特点

- 基于 Spring Framework 5，Project Reactor 和 Spring Boot 2.0
- 路由能够匹配请求的任何属性
- Predicates 和 Filters 作用于特定路由
- 断路器集成
- 集成 Spring Cloud DiscoveryClient
-  Predicates 和Filters易于编写
- 限流
- 路径重写

### 3 Spring Cloud Gateway的三个概念

- **Route(路由)**

  构建网关的基本模块，由ID、一个目的URI、断言的集合以及过滤器的集合组成。如果断言为True则路由被匹配

- **Predicate(断言)**

  来源于Java8的 [Function Predicate](https://docs.oracle.com/javase/8/docs/api/java/util/function/Predicate.html) ，输入的是 [Spring Framework `ServerWebExchange`](https://docs.spring.io/spring-framework/docs/5.0.x/javadoc-api/org/springframework/web/server/ServerWebExchange.html) 。这个能让你匹配任何来自HTTP请求。例如：headers、parameters。

- **Filter(过滤器)**

  过滤器是 [Spring Framework `GatewayFilter`](https://docs.spring.io/spring/docs/5.0.x/javadoc-api/org/springframework/web/server/GatewayFilter.html)  的实例，能修改requests和responses  在发送之前或者之后。

### 4 Spring Cloud Gateway如何工作

下图从总体上概述了Spring Cloud Gateway的工作方式

![](https://github.com/mxsm/document/blob/master/image/Spring/SpringCloud/SpringCloudGateway/Spring-Cloud-GatewayHowToWork.png?raw=true)



客户端向Spring Cloud Gateway发出请求。如果网关处理程序映射确定请求与路由匹配，则将其发送到网关Web处理程序。该处理程序通过特定于请求的过滤器链运行请求。筛选器由虚线分隔的原因是，筛选器可以在发送代理请求之前和之后运行逻辑。所有“前置”过滤器逻辑均被执行。然后发出代理请求。发出代理请求后，将运行“后”过滤器逻辑。