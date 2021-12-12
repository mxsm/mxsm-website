---
title: "Java中的那些顶级类库"
linkTitle: "Java中的那些顶级类库"
date: 2021-12-12
weight: 202112121756
---

### 1. Netty

> GitHub地址：https://github.com/netty/netty

![](https://netty.io/images/components.png)

Netty作为Java网络通信的开发类库排在榜首没有什么问题吧。以前还是[Mina](https://mina.apache.org/) 和 [Netty](https://netty.io/) 二分天下的时候，现在完全以及被Netty所压制。成为了目前Java网络编程中最受欢迎的框架

### 2. Spring系列框架

![](https://spring.io/images/spring-logo-9146a4d3298760c2e7e49595184e1975.svg)

#### 2.1 Spring-framework

> Github地址：https://github.com/spring-projects/spring-framework

Spring-framework作为现在Java生态圈的最火的编程框架，社区以及相关衍生的框架都非常至多。在公司中也是用的最多的框架之一。

#### 2.2 Spring Boot

> Github地址：https://github.com/spring-projects/spring-boot

Spring boot作为基于Spring framework的一个后起之秀框架，给开发者提供了很多的便利。屏蔽了很多繁琐的配置和底层的一些复杂的逻辑实现。只要让用户关注自己的业务代码实现。

#### 2.3 Spring Cloud

> Github地址：https://github.com/spring-projects/spring-cloud

Spring Cloud因为微服务以及现在的云原生的崛起，Spring Cloud项目也在公司中用的越来越多。 比如阿里有：**[ spring-cloud-alibaba](https://github.com/alibaba/spring-cloud-alibaba)** 等等相关实现

### 3. SLF4J

![](http://www.slf4j.org/images/logos/slf4j-logo.jpg)

> Github地址：https://github.com/qos-ch/slf4j

slf4j作为一个比较出名的日志标准，基于slf4j又有很多的实现。作为Java的日志记录框架是使用最广的。

#### 3.1 logback

> Github地址：https://github.com/qos-ch/logback

现在主流的日志框架，spring 的默认日志框架。

#### 3.2 log4j/log4j2

> Github地址：https://github.com/apache/logging-log4j2

apache实现的log4j，前几年还是用的很多的。近几年新的项目都被logback所取代。加上最近爆出的惊天漏洞(程序员心里苦啊)

### 4. 单元测试Junit

![](https://camo.githubusercontent.com/abbaedce4b226ea68b0fd43521472b0b146d5ed57956116f69752f43e7ddd7d8/68747470733a2f2f6a756e69742e6f72672f6a756e6974352f6173736574732f696d672f6a756e6974352d6c6f676f2e706e67)

> Github地址：https://github.com/junit-team/junit4
>
> Github地址：https://github.com/junit-team/junit5

在Java单元测试方面Junit有着无可撼动的地位,从Junit4到现在的最近版本Junit5。在很多的著名框架中都是使用的Junit作为单元测试框架

### 6. Hibernate-validator

> Github地址：https://github.com/hibernate/hibernate-validator

hibernate留下了一个很棒的遗产，那就是它的验证框架，它是Bean Validation 的参考实现，被广泛的应用于数据库模型校验、参数校验等领域。

![](https://hibernate.org/images/hibernate-logo.svg)

hibernate框架现在用的比较少，总说太笨重了。

### 7. okhttp

> Github地址：https://github.com/square/okhttp

最新的JDK已经内置了HTTP的功能。okhttp用在安卓比较多。在很长一段时间里，Apache 的HttpClient统治了后端世界。像SpringCloud这样的组件，在底层是可以选择切换成HttpClient还是OkHTTP的。

### 8. 工具类库

工具类库常用并且用的比较多的有两大类

#### 8.1 apache-commons

![](https://commons.apache.org/images/commons-logo.png)

> 官网地址：https://commons.apache.org/

从官网的地址可以看得出来这个是包含了众多的工具类组。比如lang3、beanutils、collections、codec。

### 8.2 guava

> Github地址：https://github.com/google/guava

在很多有名气的开源框架中都使用的是谷歌的这个guava，话说回来谷歌很多工具还是做的不错的。

