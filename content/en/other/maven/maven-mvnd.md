---
title: "maven-mvnd比maven更快的maven"
linkTitle: "maven-mvnd比maven更快的mave"
date: 2021-12-26
weight: 202112262112
---

### 1. 前言

对于Java开发者而言，Maven和Gradle是使用的比较多的两个打包构建项目的工具。以前使用Java后端开发使用Maven的比较多，安卓开发使用Gradle。这两年Gradle开始慢慢的蚕食Maven。随着Spring-Boot项目由Maven迁移到了Gradle(太惨了Maven,我个人比价喜欢Maven)。在github上无意间看到了apache 下面有一个项目叫 Mavan-mvnd(开始还以为是一个插件)。下面来看一下这个工具

### 2. 什么是maven-mvnd?

maven-mvnd全称：Apache Maven Daemon。主要借鉴了Gradle和Takari所知的技术提供更快的Maven构建。

maven-mvnd架构：

- mvnd内嵌Maven(所以不需要单独安装Maven)
- 实际的构建发生在一个长期存在的后台进程中(守护进程)
- 一个守护进程实例可以服务于来自mvnd客户端的多个连续请求
- mvnd客户端是一个使用GraalVM构建的本地可执行文件。与启动传统JVM相比，它启动得更快，占用的内存更少
- 没有空闲守护进程来服务一个构建请求，可以并行地生成多个守护进程

架构带来的好处：

- 用于运行实际构建的JVM不需要每次构建都重新启动
- 持有Maven插件类的类加载器在多个构建中被缓存。因此，插件jar文件只被读取和解析一次。快照版本(SNAPSHOT)的Maven插件不会被缓存。
- JVM中即时(JIT)编译器生成的本地代码也被保留。与常规Maven相比，JIT编译所花费的时间更少。在重复构建期间，jit优化的代码立即可用。这不仅适用于来自Maven插件和Maven Core的代码，也适用于所有来自JDK本身的代码。

> GraalVM的核心就是Graal编译器，一款优秀的JIT编译器.

在官方网站还给了一个测试的动态图来说明：

![](https://user-images.githubusercontent.com/1826249/103917178-94ee4500-510d-11eb-9abb-f52dae58a544.gif)

### 3. Linux如何安装mvnd

```shell
wget https://github.com/apache/maven-mvnd/releases/download/0.7.1/mvnd-0.7.1-linux-amd64.zip
```

下载然后解压

```shell
unzip mvnd-0.7.1-linux-amd64.zip
```

将bin添加到PATH。

![](https://raw.githubusercontent.com/mxsm/picture/main/maven/mvndversion.png)

到这里就按照完成了。

### 4. mvn和mvnd打包rocketmq的时间对比

```shell
mvn -Prelease-all -DskipTests clean install -U
```

![](https://raw.githubusercontent.com/mxsm/picture/main/maven/mvn%E6%89%93%E5%8C%85.png)

```shell
mvnd -T 4 -Prelease-all -DskipTests clean install -U -Dquickly -Dmvnd.serial=4 
```

![](https://raw.githubusercontent.com/mxsm/picture/main/maven/mvnd%E6%89%93%E5%8C%85.png)

从上面对比可以看出来打包时间明显缩短很多。

### 5. 总结

从使用来说打包时间有较大的缩短。还是有很大的提升。但是现在这个项目估计还在测试阶段和发展阶段。后续还需要开发工具的支持等等。可以观望一下，但是如果在服务器自己使用我感觉完全可以。还有一个问题现在这个项目的资料比较少。主要都来自Github项目介绍，遇到问题就需要自己去摸索，使用也需要自己探索。

参考文档：

- https://github.com/apache/maven-mvnd