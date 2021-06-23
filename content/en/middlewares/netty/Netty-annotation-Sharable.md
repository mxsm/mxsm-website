---
title: Netty-@Sharable注解含义
date: 2021-06-22
weight: 202106222351
---

在研究 **`Apache RocketMQ`** 源码中发现有的 **`Handler`** 被 **`@Sharable`** 修饰的。有的又没有。下面结合实际的例子来分析一下作用

### 1. @Sharable的真正含义

表示可以将带注释的 ChannelHandler 的同一个实例多次添加到一个或多个 ChannelPipelines 中，而不会出现竞争条件。
如果未指定此注解，则每次将其添加到管道时都必须创建一个新的处理程序实例，因为它具有成员变量等非共享状态。
提供此注释用于文档目的，就像 JCIP 注释一样。(这段话翻译来自注解的解释)。

在Netty中添加 **`ChannelHandler`** 的代码如下(代码来源[Netty官网](https://netty.io/wiki/user-guide-for-4.x.html))：

```java
ServerBootstrap b = new ServerBootstrap(); // (2)
b.group(bossGroup, workerGroup)
 .channel(NioServerSocketChannel.class) // (3)
 .childHandler(new ChannelInitializer<SocketChannel>() { // (4)
     @Override
     public void initChannel(SocketChannel ch) throws Exception {
         ch.pipeline().addLast(new DiscardServerHandler()); //添加ChannelHandler
     }
 })
 .option(ChannelOption.SO_BACKLOG, 128)          // (5)
 .childOption(ChannelOption.SO_KEEPALIVE, true); // (6)
```

当往多个 **`Channel`** 的 **`ChannelPipeline`** 中添加同一个 **`ChannelHandler`** 的时候，就会判断该实例是否增加了 **`@Sharable`** 注解。如果没有就会抛出错误：

```shell
io.netty.channel.ChannelPipelineException: com.github.mxsm.netty.TimeServerHandler is not a @Sharable handler, so can't be added or removed multiple times.
```

> 上面的错误是代码演示抛出来的，下面会根据代码分析

所以从上面的分析可以知道：

- 添加的不是单例，加不加@Sharable注解并没有什么关系
- 如果你添加的是单例，并且会被添加到多个Channel的 ChannelPipelines中，就必须加上@Sharable。否则就会报错

> 在 **`initChannel`** 方法中ChannelHandler是否单例和Netty没关系，也和@Sharable修饰ChannelHandler是否单例化没有关系。这个是否单例与使用者有关。如果是一上面的 new 的形式。那么 **`DiscardServerHandler`** 就不是单例。与有么有加@Sharable没关系。

