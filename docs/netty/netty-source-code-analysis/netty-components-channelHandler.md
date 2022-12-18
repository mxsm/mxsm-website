---
title: "Netty组件-ChannelHandler(图文并茂)"
linkTitle: "Netty组件-ChannelHandler"
date: 2022-03-11
weight: 202203112125
---

> Netty版本：[netty-4.1.74.Final](https://github.com/netty/netty/releases/tag/netty-4.1.74.Final)

### 1. ChannelHandler介绍

官方给出的解释ChannelHandler的作用主要有两点：

- 处理I/O事件，拦截I/O操作，主要用来处理Channel
- 在ChannelPipeline中从当前一个ChannelHandler传递调用到下一个ChannelHandler

ChannelHandler的继承关系图如下：

![ChannelHandler的继承关系](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/ChannelHandler%E7%9A%84%E7%BB%A7%E6%89%BF%E5%85%B3%E7%B3%BB.png)

从上面可以看出来主要分为两类：

- ChannelInboundHandler

  接收I/O入站的操作通知

- ChannelOutboundHandler

  接收I/O出站操作通知

涉及的ChannelOutboundHandlerAdapter和ChannelInboundHandlerAdapter适配器主要是提供了方法的默认实现。

> Tips: ChannelDuplexHandler是双工处理器，具有ChannelInboundHandler和ChannelOutboundHandler的功能

### 2.ChannelHandler的生命周期

从ChannelHandler的源码来看：

```java
public interface ChannelHandler {
    
    void handlerAdded(ChannelHandlerContext ctx) throws Exception;

    void handlerRemoved(ChannelHandlerContext ctx) throws Exception;
    
    @Deprecated
    void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception;

    @Inherited
    @Documented
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @interface Sharable {
        // no value
    }
}
```

只有三个方法：

- **ChannelHandler#handlerAdded**

  被添加到上线文中触发

- **ChannelHandler#handlerRemoved**

  在上下文中被移除触发

- **ChannelHandler#exceptionCaught**

  有Throwable错误抛错触发

> Tips:ChannelHandler#exceptionCaught方法已经被标记为过期，可以实现 ChannelInboundHandler#exceptionCaught的方法

![ChannelHandler生周期](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/ChannelHandler%E7%94%9F%E5%91%A8%E6%9C%9F.png)

用一个服务端的例子来讲解整个过程：

```java
package io.netty.example.discard;
    
import io.netty.bootstrap.ServerBootstrap;

import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
    
/**
 * Discards any incoming data.
 */
public class DiscardServer {
    
    private int port;
    
    public DiscardServer(int port) {
        this.port = port;
    }
    
    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(); // (1)
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap(); // (2)
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class) // (3)
             .childHandler(new ChannelInitializer<SocketChannel>() { // (4)
                 @Override
                 public void initChannel(SocketChannel ch) throws Exception {
                     ch.pipeline().addLast(new DiscardServerHandler());
                 }
             })
             .option(ChannelOption.SO_BACKLOG, 128)          // (5)
             .childOption(ChannelOption.SO_KEEPALIVE, true); // (6)
    
            // Bind and start to accept incoming connections.
            ChannelFuture f = b.bind(port).sync(); // (7)
    
            // Wait until the server socket is closed.
            // In this example, this does not happen, but you can do that to gracefully
            // shut down your server.
            f.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }
    
    public static void main(String[] args) throws Exception {
        int port = 8080;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        }

        new DiscardServer(port).run();
    }
}
```

> Tips: 代码来源Netty官网https://netty.io/wiki/user-guide-for-4.x.html#wiki-h3-6

上述代码其实分为两个部分一个部分是 `NioServerSocketChannel` 以及 `SocketChannel` 。 首先分析NioServerSocketChannel中的ChannelHandler。

通过代码可以知道NioServerSocketChannel创建后会调用`ServerBootstrap#init`方法。在该方法中有这样一段代码：

![image-20220311214033108](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220311214033108.png)

创建一个ChannelHandler的实例也就是ChannelInitializer添加到NioServerSocketChannel的ChannelPipeline中。通过跟踪ChannelPipeline#addLast方法，最终调用的是`DefaultChannelPipeline#addLast`方法：

![image-20220311214725357](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220311214725357.png)

然后在`DefaultChannelPipeline#callHandlerAdded0` 方法中调用的是`AbstractChannelHandlerContext#callHandlerAdded` 方法：

![image-20220311214916716](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220311214916716.png)

然后获取到ChannelHandler实例调用handlerAdded方法。也就是调用**ChannelHandler#handlerAdded** 方法。到这里就完成了从ChannelHandler创建到调用`ChannelHandler#handlerAdded` 方法。

如果调用`DefaultChannelPipeline#remove` 方法，最终调用的就是`AbstractChannelHandlerContext#callHandlerRemoved`在这个方法中：

![image-20220311215453340](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220311215453340.png)

调用了`ChannelHandler#handlerRemoved`

对于`ChannelHandler#exceptionCaught` 在所有的ChannelHandler以及子类方法执行的时候都会有`try catch` 对异常进行捕获然后执行`AbstractChannelHandlerContext#invokeExceptionCaught` 方法

![image-20220311220153445](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220311220153445.png)

这个方法中都是调用了`ChannelHandler#exceptionCaught`

> Tips: ChannelHandler#exceptionCaught方法标记为过期了，可以关注ChannelInboundHandler#exceptionCaught方法。同时还会在ChannelInitializer#initChannel中可能被执行

**总结：ChannelHandler#handlerAdded方法主要发生在往ChannelPipeline添加ChannelHandler的时候，ChannelHandler#handlerRemoved主要发生在从ChannelPipeline删除ChannelHandler的时候，而ChannelHandler#exceptionCaught主要发生在执行ChannelInboundHandler和ChannelOutboundHandler方法的时候发生错误执行**

### 3.ChannelHandler的方法执行顺序

这里所说的ChannelHandler方法指的是ChannelHandler本身的方法以及ChannelInboundHandler和ChannelOutboundHandler方法的顺序。看一下这个三个类中分别有什么方法：

**ChannelHandler接口**

| 类型            | 描述                                                  |
| --------------- | ----------------------------------------------------- |
| handlerAdded    | 当把 ChannelHandler 添加到 ChannelPipeline 中时被调用 |
| handlerRemoved  | 当从 ChannelPipeline 中移除 ChannelHandler 时被调用   |
| exceptionCaught | 当处理过程中在 ChannelPipeline 中有错误产生时被调用   |

**`Netty`** 定义了下面两个重要的 **`ChannelHandler`**  子接口：

- **ChannelInboundHandler** — 处理 **入站** 数据以及各种状态变化
- **ChannelOutboundHandler** — 处理 **出站** 数据并且允许拦截所有的操作

**ChannelInboundHandler 接口**

| 类型                      | 描述                                                         |
| ------------------------- | ------------------------------------------------------------ |
| channelRegistered         | 当 Channel 已经注册到它的 EventLoop 并且能够处理 I/O 时被调用 |
| channelUnregistered       | 当 Channel 从它的 EventLoop 注销并且无法处理任何 I/O 时被调用 |
| channelActive             | 当 Channel 处于活动状态时被调用;Channel 已经连接/绑定并且已经就绪 |
| channelInactive           | 当 Channel 离开活动状态并且不再连接它的远程节点时被调用      |
| channelReadComplete       | 当Channel上的一个读操作完成时被调用                          |
| channelRead               | 当从 Channel 读取数据时被调用                                |
| ChannelWritabilityChanged | 当Channel的可写状态发生改变时被调用。用户可以确保写操作不会完成得太快(以避免发生 OutOfMemoryError)或者可以在 Channel 变为再次可写时恢复写入。可以通过调用Channel的isWritable()方法来检测Channel 的可写性。与可写性相关的阈值可以通过Channel.config().setWriteHighWaterMark()和 Channel.config().setWriteLowWaterMark()方法来设置 |
| userEventTriggered        | 当 ChannelnboundHandler.fireUserEventTriggered()方法被调用时被调用，因为一个 POJO 被传经了 ChannelPipeline |

**ChannelOutboundHandler 接口**

| 类型                                                         | 描述                                                |
| ------------------------------------------------------------ | --------------------------------------------------- |
| bind(ChannelHandlerContext,SocketAddress,ChannelPromise)     | 当请求将 Channel 绑定到本地地址时被调用             |
| connect(ChannelHandlerContext,SocketAddress,SocketAddress,ChannelPromise) | 当请求将 Channel 连接到远程节点时被调用             |
| disconnect(ChannelHandlerContext,ChannelPromise)             | 当请求将 Channel 从远程节点断开时被调用             |
| close(ChannelHandlerContext,ChannelPromise)                  | 当请求关闭 Channel 时被调用                         |
| deregister(ChannelHandlerContext,ChannelPromise)             | 当请求将 Channel 从它的 EventLoop 注销时被调用      |
| read(ChannelHandlerContext)                                  | 当请求从 Channel 读取更多的数据时被调用             |
| flush(ChannelHandlerContext)                                 | 当请求通过 Channel 将入队数据冲刷到远程节点时被调用 |
| write(ChannelHandlerContext,Object,ChannelPromise)           | 当请求通过 Channel 将数据写到远程节点时被调用       |

#### 3.2 从源码解析ChannelHandler方法执行顺序

这个需要较长的篇幅来说明，我在文章《Netty源码解析-ChannelHandler方法执行顺序》进行详细的讲解。

### 4.ChannelHandler的分类说明

![ChannelHandler分类](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/ChannelHandler%E5%88%86%E7%B1%BB.png)

ChannelHandler的实现主要有三个：

- ChannelInboundHandler ：处理**入站**数据以及各种变化，简单理解就是：客户端或者服务器端接收其他端的数据进行处理。
- ChannelOutboundHandler ：处理 **出站** 数据并且允许拦截所有的操作，简单理解就是：客户端或者服务器端发送数据给其他端的数据处理，同时还可以拦截读写操作
- ChannelDuplexHandler： 包含了ChannelInboundHandler 和ChannelOutboundHandler 的功能。

从上面衍生出来就是解码器和编码器：

- XXXXDecoder： 主要负责将网络中的数据解码成端需要的数据，例如：ProtobufDecoder
- XXXXEncoder： 主要负责将端结构化的数据编码成网络中传输的数据格式，例如：ProtobufEncoder

解码器和编码器也是Netty中重要的组件。

### 5.总结

- ChannelHandler是和Channel进行绑定的，通过ChannelHandlerContext进行触发。
- ChannelHandler主要用于拦截I/O操作和I/O事件，同时通过ChannelPipeline将多个ChannelHandler串联在一起，形成一个调用链
- ChannelHandler分为出站和入栈两种处理器，同时衍生出了编码器和解码器。



> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢