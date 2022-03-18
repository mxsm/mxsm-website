---
title: "Netty源码分析-ChannelHandler方法执行顺序和如何工作"
linkTitle: "Netty源码分析-ChannelHandler方法执行顺序和如何工作"
date: 2022-03-13
weight: 202203131018
---

> Netty版本：Netty版本：[netty-4.1.75.Final](https://github.com/netty/netty/releases/tag/netty-4.1.75.Final)

### 1. 前言

在之前的文章《[Netty组件-ChannelHandler(图文并茂)](https://juejin.cn/post/7074394630678134791/) 》中了解了ChannelHandler同时对其两个继承接口ChannelInboundHandler和ChannelOutboundHandler都有了一定的了解，从如下几个方面来对ChannelHandler通过源码进一步解析：

![ChannelHandler解析点](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/ChannelHandler%E8%A7%A3%E6%9E%90%E7%82%B9.png)

### 2. ChannelHandler方法执行顺序

ChannelHandler方法执行顺序执行顺序其实说的是三个类：`ChannelHandler、ChannelInboundHandler、ChannelOutboundHandler` 这三个类的方法执行顺序。通过一个简答的Netty例子来打印一下执行的顺序。代码比较多这里就不直接粘贴出来了，已经上传到github仓库，可以下载到本地运行。

![image-20220313142535666](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313142535666.png)

> 代码github地址：https://github.com/mxsm/spring-sample/tree/master/java-sample/src/main/java/com/github/mxsm/netty/channelhandler

运行结果分为两个部分：

- 服务端结果

  ![image-20220313143016219](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313143016219.png)

- 客户端结果

  ![image-20220313143110607](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313143110607.png)

接下来对运行结果结合源码进行分析。客户端和服务器端ChannelHandler的执行大部分相同，只有细小出的区别。我们会在有区别的地方进行说明

> Tips: 服务端线程模型是主从模型，所以我们会分别分析Boss线程中的ChannelHandler以及Work线程中的ChannelHandler。

大致流程：

![ChannelHandler方法执行分析流程](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/ChannelHandler%E6%96%B9%E6%B3%95%E6%89%A7%E8%A1%8C%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.png)

下面分析如果没有特别说明都是以服务端为例进行源码分析。

#### 2.1 ChannelHandler#handlerAdded

![image-20220313144554334](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313144554334.png)

> Tips：代码地址https://github.com/mxsm/spring-sample/blob/master/java-sample/src/main/java/com/github/mxsm/netty/channelhandler/DiscardServer.java

主要关注上图红框部分的代码，通过跟进代码会发现 `ServerBootstrap` 创建后会创建一个 `NioServerSocketChannel` 实例，然后调用 `ServerBootstrap#init` 方法进行初始化，如下图所示：

![image-20220313145719703](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313145719703.png)

如上图代码所示，我这边把这里圈成了三个部分：

> Tips: ChannelInitializer其实就是一个ChannelInboundHandlerAdapter

1.  NioServerSocketChannel的实例的ChannelPipeline中添加ChannelInitializer，那么**ChannelInitializer#initChannel** 什么时候触发，如下代码：

   ![image-20220313150218471](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313150218471.png)

   在触发 `channelRegistered` 方法后调用了 **ChannelInitializer#initChannel** 这个私有方法，私有方法又调用了 **ChannelInitializer#initChannel**  抽象方法。

2. NioServerSocketChannel的实例的ChannelPipeline添加**ServerBootstrap#handler**方法设置的ChannelHandler。对应上面的例子就是这段代码里面的ChannelHandler，如下图标号1位置所示：

   ![image-20220313150751020](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313150751020.png)

3. 将数据处理交给Worker线程，也是通过这个地方进行的。(后续会专门写一篇文章来说主负线程如何配合工作)

**总结：从上面的分析可以看出来ChannelHandler#handlerAdded方法的触发，主要是通过ChannelPipeline的add类型方法来触发，底层是通过AbstractChannelHandlerContext#callHandlerAdded调用来实现。**

#### 2.2 ChannelInboundHandler#channelRegistered

在调用`ServerBootstrap#bind`方法当中，ServerSocketChannel初始化后，将ServerSocketChannel注册到BossGroup上，如下图所示：

![image-20220313152322696](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313152322696.png)

上图标号1所示位置就是将ServerSocketChannel注册到BossGroup。跟进代码最终调用的是`AbstractChannel#register0` 方法，如下图所示：

![image-20220313152757422](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313152757422.png)

如上图标号2位置就是触发`ChannelInboundHandler#channelRegistered`方法。

**总结：ChannelInboundHandler#channelRegistered方法触发是在往EventLoopGroup中添加Channel的时候触发**

> Tips: 上面说的都是触发NioServerSocketChannel实例中的ChannelHandler，也就是BossGroup中。workGroup中的ChannelHandler触发在哪里触发呢？之前ChannelHandler#handlerAdded章节分析图中有个标号3的位置中的代码就是触发childHandler的channelRegistered方法的：
>
> ![image-20220313153504750](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313153504750.png)

#### 2.3 ChannelOutboundHandler#bind

当NioServerSocketChannel创建、初始化、注册到EventLoopGroup完成后，接下来就进行绑定，与本地端口进行绑定以便接收数据,绑定的工作通过代码分析发现最后调用的是 `AbstractBootstrap#doBind0` 方法，如下图所示：

![image-20220313154352156](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313154352156.png)

> Tips: 这个地方的channel变量其实就是NioServerSocketChannel的实例。

通过跟进bind方法的代码可以发现最终调用的是 **AbstractChannelHandlerContext#invokeBind** 

![image-20220313154614406](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313154614406.png)

**总结：ChannelOutboundHandler#bind调用是服务端的Channel绑定本地地址触发，如NioServerSocketChannel绑定本地地址端口准备接受客户端数据 **

> Tips: ChannelOutboundHandler#bind是BossGroup的Channel所特有，在childHandler中不会执行。

#### 2.4 ChannelInboundHandler#channelActive

ChannelInboundHandler#channelActive的触发需要分两种情况：

1. BossGroup中的ServerSocketChannel触发
2. WorkerGroup中的SocketChannel触发

首先看一下BossGroup中的ServerSocketChannel触发中的触发，在执行`NioServerSocketChannel#bind` ，触发了自定义的`TimeServerBossOutHandler#bind`：

![image-20220313202937928](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313202937928.png)

上图标号1又调用了父类的bind方法，最终调用了`AbstractChannel.AbstractUnsafe#bind`：

![image-20220313203458047](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313203458047.png)

上图1位置就是触发ChannelInboundHandler#channelActive。

> Tips: TimeServerBossOutHandler#bind代码中去掉 `super.bind(ctx, localAddress, promise);` 这段代码，你用客户端链接发现连不上。这就是因为NioServerSocketChannel没有绑定。

WorkerGroup中的SocketChannel触发如何触发？服务端接收到连接请求处理由BossGroup处理，读写操作是由WorkGroup处理，那么这个转换就是在`ServerBootstrap#init` 方法中完成,如下图代码所示：

![image-20220313205348929](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313205348929.png)

上图框出来的代码 `ServerBootstrapAcceptor` 其实也是一个`ChannelInboundHandler` ：

![image-20220313205548252](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313205548252.png)

上图框出来的就是往WorkGroup中注册Channel。所有这里会触发 **ChannelInboundHandler#channelRegistered** 。

> Tips: BossGroup注册NioServerSocketChannel和WorkGroup注册SocketChannel两者触发**ChannelInboundHandler#channelRegistered** 的逻辑没有区别。

注册最终也是调用了`AbstractChannel.AbstractUnsafe#register0` :

![image-20220313210108887](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313210108887.png)

 BossGroup注册NioServerSocketChannel和WorkGroup注册NioSocketChannel区别在于上图标号1的`isActive()` 方法，这个方法是一个抽象方法。根据不同的类似实现。

- NioServerSocketChannel实现isActive()

  ![image-20220313210426171](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313210426171.png)

- NioSocketChannel实现isActive()

  ![image-20220313210603668](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313210603668.png)

所以会进入if条件语句中，加上又是第一次注册，最终会触发标号为2的方法。

**总结：NioServerSocketChannel和NioSocketChannel触发ChannelInboundHandler#channelActive不一样，但是都是当Channel可用的时候触发**

#### 2.5 ChannelOutboundHandler#read

`AbstractChannelHandlerContext#invokeChannelActive`方法主要触发channelActive如下图：

![image-20220313213615164](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313213615164.png)

然后通过调用AbstractChannelHandlerContext#invokeChannelActive方法：

![image-20220313214123319](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313214123319.png)

通过上图可以知道最终调用的是`DefaultChannelPipeline.HeadContext#channelActive`方法

![image-20220313214354015](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313214354015.png)

然后调用`DefaultChannelPipeline.HeadContext#readIfIsAutoRead`

![image-20220313214604152](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220313214604152.png)

然后调用`AbstractChannel#read`方法，这个方法中调用了`ChannelPipeline#read` 方法触发ChannelOutboundHandler#read。

**总结：ChannelOutboundHandler#read的触发都是在ChannelInboundHandler#channelActive，通过DefaultChannelPipeline.HeadContext#readIfIsAutoRead方法实现。**