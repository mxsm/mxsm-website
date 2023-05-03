---
title: "EventMesh快速开始"
linkTitle: "EventMesh 快速开始"
weight: 202305022214
description: EventMesh 如何快速开始
---

## 1. Apache EventMesh介绍

Apache EventMesh是一个开源的、分布式的、跨语言的、消息中间件，主要用于异构系统之间的消息传递和协作。EventMesh的设计目标是提供高吞吐、低延迟、高可靠性和灵活性的消息传递，支持多种消息协议，如HTTP和MQTT。

**Apache EventMesh**有以下特点：

*   基于 [CloudEvents](https://cloudevents.io/) 规范构建。
*   使用插件化的方式来加载各个功能模块的实现，例如消息存储，传输协议，指标等等都可以通过插件配置来加载不同的实现
*   至少一次的可靠性投递，以及在多个EventMesh部署之间传递事件
*   分布式：EventMesh可以部署在多个节点上，实现分布式部署和消息传递，提高了可靠性和吞吐量。
*   跨语言：EventMesh支持多种编程语言，如Java、Go、C++等，可以适应不同系统和应用的需要。
*   高吞吐、低延迟：EventMesh采用异步非阻塞的IO模型和零拷贝技术，提供高吞吐、低延迟的消息传递。
*   高可靠性：EventMesh提供多种消息传递模式，如点对点、广播、顺序消息等，保证消息传递的可靠性。
*   灵活性：EventMesh提供多种消息协议和扩展点，支持自定义协议和扩展，适应不同场景的需求。

**Apache EventMesh架构(来自官网)**

![](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/eventmesh-architecture-3.png)

## 2. Apache EventMesh快速开始

这里从一个开发者的角度来说明如何快速开始和上手Apache EventMesh这个项目。

### 2.1 准备工作

首先将项目下载到本地

```shell
git clone https://github.com/apache/eventmesh.git
```

下载到本地后，进入项目的跟目录运行编译命令打成压缩包（这里以Linux为例）

```shell
./gradlew clean jar dist -x test -x checkstyleMain -x javaDoc && ./gradlew installPlugin && ./gradlew tar
```

然后找到根目录下面的build文件

![image-20230502224309233](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/image-20230502224309233.png)

对应的tar.gz压缩包。

### 2.2 启动服务

解压压缩包到build文件

```shell
tar -zxvf eventmesh-1.8.0-release.tar.gz
```

已单机模式启动服务

```shell
bash bin/start.sh
```

单机模式下存储使用的EventMesh实现的存储。运行结果

![image-20230502224911751](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/image-20230502224911751.png)

### 2.3 Docker运行

Apache EventMesh当前Docker镜像支持1.4.0版本所以Docker镜像需要自己修改项目的Dockerfile文件打本地镜像

```shell
FROM openjdk:8-jdk as builder
WORKDIR /build
COPY . .
RUN ./gradlew clean build jar dist --parallel --daemon
RUN ./gradlew installPlugin

FROM openjdk:8-jdk
RUN apt-get update && apt-get install -y locales
RUN localedef -i en_US -f UTF-8 en_US.UTF-8 --quiet
WORKDIR /data/app/eventmesh
COPY --from=builder /build/dist ./

EXPOSE 10106 
EXPOSE 10205 10105 10002

ENV DOCKER true
ENV EVENTMESH_HOME /data/app/eventmesh
ENV EVENTMESH_LOG_HOME /data/app/eventmesh/logs
ENV CONFPATH /data/app/eventmesh/conf

CMD ["bash", "bin/start.sh"]
```

打包完成后就直接放到直接运行

## 3. 运行例子

例子可以将EventMesh项目导入IDEA。找到eventmesh-examples模块。这个里面有样例

![image-20230502225351299](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/image-20230502225351299.png)

首先修改EventMesh的IP地址根据你当前部署的地址：

![image-20230502225653114](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/image-20230502225653114.png)

然后运行结果如下：

![eventmesh-example](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/eventmesh-example.gif)

完成了整个启动和运行。

## 4. 总结

Apache EventMesh，这是一个轻量级、分布式的消息中间件。它基于事件驱动的编程模型，支持多种编程语言和通信协议，提供高可靠性、高吞吐量的消息传递服务。

EventMesh采用了Pulsar的架构，可以实现Pub/Sub、点对点通信、广播等多种消息传递模式。它支持消息的持久化和重复消费，保证了消息的可靠性和一致性。

EventMesh的使用也非常简单。首先，你需要安装和配置EventMesh的运行环境。然后，你可以使用提供的API来发送和接收消息，或者使用EventMesh提供的控制台来管理你的消息队列。

总的来说，如果你正在寻找一款高可靠性、高吞吐量的消息中间件，那么Apache EventMesh绝对是一个值得尝试的选择。