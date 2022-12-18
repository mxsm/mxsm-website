---
title: "Netty源码分析-Channel如何从主线程切换到从线程"
linkTitle: "Netty源码分析-Channel如何从主线程切换到从线程"
date: 2022-03-22
weight: 202203221019
---

### 1. 前言

在Netty的主从Reactor线程模型，如下图(图片来自网络)：

![线程模型](https://github.com/mxsm/document/blob/master/image/netty/NettyServer%E5%A4%84%E7%90%86%E8%BF%9E%E6%8E%A5%E7%9A%84%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

那么Channel如何从bossGroup处理完成 ACCETP后切换到workerGroup进行读写处理。下面就通过Netty的源码来告诉你Netty是如何进行切换的。

> Tips: 下面源码解析以Nio为例子

### 2. 源码分析

首先在服务端的服务绑定的过程中：

```java
ChannelFuture f = b.bind(port).sync()
```

实例化的NioServerSocketChannel的对象会注册到bossGroup的线程上面，这个注册的过程在**`AbstractBootstrap#initAndRegister`** 方法如下图框出来的部分：

![image-20220322103757962](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhanlder/image-20220322103757962.png)

注册完成后，此时注册了当前NioServerSocketChannel实例的EventLoop也启动了。

> Tips: EventLoop何时启动不清楚的可以看一下之前的文章《[Netty源码解析-EventLoop什么时候启动运行](https://juejin.cn/post/7077562070715088926)》

启动后会运行**NioEventLoop#run**方法，主要是处理NioServerSocketChannel的select()。然后获取到SelectedKeys进行处理。这些key的处理是由**`NioEventLoop#processSelectedKey`** 方法处理：

![image-20220322104625856](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhanlder/image-20220322104625856.png)

当有连接接入的时候就会调用上图框出来的部分代码，对于NioServerSocketChannel来说实际调用的**`AbstractNioMessageChannel.NioMessageUnsafe#read`**方法：

![image-20220322105033192](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhanlder/image-20220322105033192.png)

上图标号1是将接受的Channel包装成NioSocketChannel存入List\<Object\> readBuf列表中。标号2就是触发了NioServerSocketChannel所属ChannelPipeline的channelRead方法。

**重点：这个触发NioServerSocketChannel的所属ChannelPipeline的channelRead方法就是从BossGroup转到WorkGroup处理读写的关键。**下面分析为什么？

在调用 **`ChannelFuture f = b.bind(port).sync()`** 这段代码的时候，跟进bind的代码会发现ServerBootstrap#init方法中有这样的一段代码：

![image-20220322110133556](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhanlder/image-20220322110133556.png)

我们就来分析一下这段标号①的代码。大致的意思就是：**给NioServerSocketChannel所属ChannelPipeline中增加一个ChannelInitializer，在ChannelInitializer同时有增加一个ServerBootstrapAcceptor实例对象(ServerBootstrapAcceptor其实就是ChannelInboundHandler)** 。  那么这段代码何时触发呢？ 

通过研究代码发现**`ChannelInitializer#initChannel`** 是一个抽象方法，在**`ChannelInitializer#channelRegistered`** 中触发：

![image-20220322111138952](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhanlder/image-20220322111138952.png)

当NioServerSocketChannel所属ChannelPipeline触发channelRegistered，然后往ChannelPipeline中添加ServerBootstrapAcceptor。接下来就是看一下ServerBootstrapAcceptor的代码：

![image-20220322111803750](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhanlder/image-20220322111803750.png)

从上面图片标号①可以看出来ServerBootstrapAcceptor其实是一个ChannelInboundHandler。所以在当NioServerSocketChannel所属ChannelPipeline触发channelRead的时候也会触发ServerBootstrapAcceptor#channelRead方法，而在标号③的位置就是将NioSocketChannel对象实例注册到workerGroup上面进行后续的读写处理。

**到这里就完成了整个有BossGroup线程到WorkGroup线程处理的转换**

### 3. 总结

BossGroup线程到WorkGroup线程处理的转换是通过ChannelPipeline和ChannelHandler的巧妙运用进行转换的。通过NioServerSocketChannel所属ChannelPipeline触发channelRead，在ChannelPipeline上触发所有的ChannelInboundHandler的channelRead方法，最终调用到ServerBootstrapAcceptor#channelRead方法。这个方法里面实现了将ServerSocketChannel交由workGroup处理后续的读写操作的转换工作。也和前面说的Netty的主从模型对应上了。



> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

