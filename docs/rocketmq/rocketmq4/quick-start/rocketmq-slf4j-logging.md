---
title: "当SLF4J遇上RocketMQ"
linkTitle: "当SLF4J遇上RocketMQ"
date: 2021-12-31
weight: 202112311011
---

> RocketMQ版本: 4.9.2
>
> SpringBoot版本：2.6.2
>
> 日志工具： logback

在平时Java项目的开发中，日志是一个很长见来纪录项目运行过程中的一些关键节点以及业务数据的搜集的一种方式。SLF4J在Java的日志中又有着举足轻重的地位。绝大部分的项目中都有用到。只是可能实现的方式不一样：

![日志收集](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/%E6%97%A5%E5%BF%97%E6%94%B6%E9%9B%86.png)

从上图可以看出来，在日志的实现中列举了一些常见的。**`logback`** **`log4j`** 是我们比较常见也常用的。然后存储上我们基本上都是把日志输出到应用所在的本地文件上进行保存。

> 上图的日志存储，Socket和MQ严格意义上说起来不算是日志存储，是一个日志转存的方式。最终日志落地就是落地到 **`ES、文件、数据库(非ES)`**

这里我们着重讲一下日志对接MQ,让你的项目高大上起来。不要只会把日志数据放在文件了。

### 1. 环境准备

#### 1.1 RocketMQ的环境搭建

MQ的环境搭建建议直接使用Docker搭建，快速方便有省心，后续的使用也更加的方便。搭建的教程参照 [《RocketMQ Docker部署》](https://blog.ljbmxsm.com/middlewares/rocketmq/rocketmq-docker/)。

#### 1.2 开发环境搭建

这里我们使用的是SpringBoot的web项目来进行实现的。这里推荐两个Spring项目初始化器的网站

- https://start.spring.io/

  Spring官网的一个脚手架，上面可以用最新的相关Spring Boot的项目。

- https://start.aliyun.com/bootstrap.html

  阿里的一个脚手架网站，这个Spring Boot版本相对比较落后。没有更新到最新的。

项目生成了接下来就是导入项目开发

### 2. 日志接入RocketMQ

#### 2.1 pom文件导入RockerMQ LoggerAppender

将在上面的脚手架网站生成的项目导入IDEA，然后在pom.xml文件中增加

```xml
<dependency>
	<groupId>org.apache.rocketmq</groupId>
	<artifactId>rocketmq-logappender</artifactId>
	<version>4.9.2</version>
</dependency>
```

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/%E5%AF%BC%E5%85%A5logappender.png)

#### 2.2 logback配置文件增加Appender

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false">
    <!--
    Base logback configuration provided for compatibility with Spring Boot 1.1
    -->

    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    <include resource="org/springframework/boot/logging/logback/console-appender.xml"/>

    <appender name="rocketMQAppender" class="org.apache.rocketmq.logappender.logback.RocketmqLogbackAppender">
        <tag>mxsm-log</tag>
        <topic>mxsm</topic>
        <producerGroup>mxsm</producerGroup>
            <!--这里地址是我本地Docker容器部署的RockerMQ地址-->
        <nameServerAddress>192.168.43.128:9876</nameServerAddress>
        <layout>
            <pattern>%date %p %t - %m%n</pattern>
        </layout>
    </appender>

    <appender name="rocketMQAsyncAppender" class="ch.qos.logback.classic.AsyncAppender">
        <queueSize>1024</queueSize>
        <discardingThreshold>80</discardingThreshold>
        <maxFlushTime>2000</maxFlushTime>
        <neverBlock>true</neverBlock>
        <appender-ref ref="rocketMQAppender"/>
    </appender>

    <logger name="rocketMQAsyncLogger">
        <appender-ref ref="rocketMQAsyncAppender"/>
    </logger>

    <logger name="rocketMQLogger">
        <appender-ref ref="rocketMQAppender"/>
    </logger>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>

</configuration>
```

> 为了IDAE启动打印和SpringBoot原有的保持一致，我这里应用了Spring原有的。

增加了两个logger: **`rocketMQAsyncLogger`** 和 **`rocketMQLogger`** 。

#### 2.3 测试代码

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/rockermqappender%E6%B5%8B%E8%AF%95%E4%BB%A3%E7%A0%81.png)

运行项目然去RockerMQ的消息查询web控制台查看：

![image-20211231120226707](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/image-20211231120226707.png)

![image-20211231120246443](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/image-20211231120246443.png)

从查询的数据可以看出来已经将日志发送到了RocketMQ。

### 3. 总结

上面的例子是一个简单的如何使用将RocketMQ和项目中的日志进行对接的一个小的例子。相对于将对接MQ和日志存在本地文件有以下几个好处：

- 降低了项目服务的本地磁盘的IO,同时也减少了本地磁盘的使用。(如果是本地文件也可以使用定时任务进行清理，压测环境磁盘被日志撑爆过)
- 可以通过一个消费服务或者消费集群服务来对MQ的消息进行处理，而文件就需要对数据进行处理就需要在每个应用服务上再部署一个文件处理服务来对文件进行处理。



参考文档：

- https://rocketmq.apache.org/docs/logappender-example/
