---
title: "Netty五大组件之Channel"
linkTitle: "Netty五大组件之Channel"
date: 2022-01-16
weight: 202201162039
---

> Netty版本：4.1.72.Final

### 1. Channel概述

#### 1.1 Channel介绍

**`Channel`** 一种连接到网络套接字或能够进行读、写、连接和绑定等I/O操作的组件。有如下特点：

- 所有的I/O操作都是异步
- Channel是分层的
- 向下转换以访问特定传输的操作
- 释放资源

看一下继承关系：

![image-20220116220623351](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220116220623351.png)

上图可以看出来可以从两个纬度来划分：

- 服务端还是客户端

  比如：NioSocketChannel和EpollSocketChannel用于客户端， NioServerSocketChannel和EpollServerSocketChannel用于服务端

- Nio实现还是Epoll实现

  NioSocketChannel，NioServerSocketChannel是NIO实现， EpollSocketChannel和EpollServerSocketChannel是Epoll实现

> Tips: Epoll实现参照 https://netty.io/wiki/native-transports.html

- NioSocketChannel(EpollSocketChannel)：代表异步的客户端 TCP Socket 连接
- NioServerSocketChannel（EpollServerSocketChannel）：异步的服务器端 TCP Socket 连接
- NioDatagramChannel：异步的 UDP 连接
- NioSctpChannel：异步的客户端 Sctp 连接
- NioSctpServerChannel：异步的 Sctp 服务器端连接
- ~~OioSocketChannel（OioSocketChannel）：同步的客户端 TCP Socket 连接~~
- ~~OioServerSocketChannel(Deprecated)：同步的服务器端 TCP Socket 连接~~
- ~~OioDatagramChannel(Deprecated)：同步的 UDP 连接~~
- ~~OioSctpChannel(Deprecated)：同步的 Sctp 服务器端连接~~
- ~~OioSctpServerChannel(Deprecated)：同步的客户端 TCP Socket 连接~~

> Tips: 同步在源码中都已经标记为@Deprecated

#### 1.2 Channel API

```java
public interface Channel extends AttributeMap, ChannelOutboundInvoker, Comparable<Channel> {
    
    ChannelId id();

    EventLoop eventLoop();

    Channel parent();

    ChannelConfig config();

    boolean isOpen();

    boolean isRegistered();

    boolean isActive();

    ChannelMetadata metadata();

    SocketAddress localAddress();

    SocketAddress remoteAddress();

    ChannelFuture closeFuture();

    boolean isWritable();

    long bytesBeforeUnwritable();

    long bytesBeforeWritable();

    Unsafe unsafe();

    ChannelPipeline pipeline();

    ByteBufAllocator alloc();

    @Override
    Channel read();

    @Override
    Channel flush();
}
```

常用的说明如下：

| 接口名                        | 描述                                                         |
| :---------------------------- | :----------------------------------------------------------- |
| eventLoop()                   | Channel需要注册到EventLoop的多路复用器上，用于处理I/O事件，通过eventLoop()方法可以获取到Channel注册EventLoop。 |
| pipeline()                    | 返回channel分配的ChannelPipeline                             |
| isActive()                    | 判断channel是否激活。激活的意义取决于底层的传输类型。        |
| localAddress()                | 返回本地的socket地址                                         |
| remoteAddress()               | 返回远程的socket地址                                         |
| flush()                       | 将之前已写的数据冲刷到底层Channel上去                        |
| write(Object msg)             | 请求将当前的msg通过ChannelPipeline写入到目标Channel中。注意，write操作只是将消息存入到消息发送环形数组中，并没有真正被发送，只有调用flush操作才会被写入到Channel中，发送给对方。 |
| writeAndFlush()               | 等同于调用write()并接着调用flush()                           |
| metadate()                    | 当创建Socket的时候需要指定TCP参数，例如接收和发送的TCP缓冲区大小，TCP的超时时间。是否重用地址等。在Netty中，每个Channel对应一个物理链接，每个连接都有自己的TCP参数配置。所以，Channel会聚合一个ChannelMetadata用来对TCP参数提供元数据描述信息，通过metadata()方法就可以获取当前Channel的TCP参数配置。 |
| read()                        | 从当前的Channel中读取数据到第一个inbound缓冲区中，如果数据被成功读取，触发ChannelHandler.channelRead(ChannelHandlerContext,Object)事件。读取操作API调用完成后，紧接着会触发ChannelHander.channelReadComplete（ChannelHandlerContext）事件，这样业务的ChannelHandler可以决定是否需要继续读取数据。如果已经有操作请求被挂起，则后续的读操作会被忽略。 |
| close(ChannelPromise promise) | 主动关闭当前连接，通过ChannelPromise设置操作结果并进行结果通知，无论操作是否成功，都可以通过ChannelPromise获取操作结果。该操作会级联触发ChannelPipeline中所有ChannelHandler的ChannelHandler.close(ChannelHandlerContext，ChannelPromise)事件。 |
| parent()                      | 对于服务端Channel而言，它的父Channel为空；对于客户端Channel，它的父Channel就是创建它的ServerSocketChannel。 |
| id()                          | 返回ChannelId对象，ChannelId是Channel的唯一标识。            |

接下来已Channel在服务端创建为例子，看一下Netty启动Channel创建的整个过程。创建分成了四个过程：

- Channel 创建
- Channel 初始化
- Channel 注册 EventLoop
- Channel 绑定 ChannelPipeline

### 2 Channel 创建

首先看一下例子(来自官网：https://netty.io/wiki/user-guide-for-4.x.html#wiki-h3-6)：

```java
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
}
```

（3）中设置了**`NioServerSocketChannel`**，在 (7) 以上都是对 **`ServerBootstrap`** 进行设置，**`ChannelFuture f = b.bind(port).sync();`** 绑定端口，所以这里也是对 **Channel** 进行了创建。通过跟进代码发现最终是调用了 **`AbstractBootstrap#doBind`** 方法进行绑定，然后 调用**`AbstractBootstrap#initAndRegister`** 方法创建Channel同时初始化Channel。

```java
    final ChannelFuture initAndRegister() {
        Channel channel = null;
        try {
            channel = channelFactory.newChannel();
            init(channel);
        } catch (Throwable t) {
            if (channel != null) {
                // channel can be null if newChannel crashed (eg SocketException("too many open files"))
                channel.unsafe().closeForcibly();
                // as the Channel is not registered yet we need to force the usage of the GlobalEventExecutor
                return new DefaultChannelPromise(channel, GlobalEventExecutor.INSTANCE).setFailure(t);
            }
            // as the Channel is not registered yet we need to force the usage of the GlobalEventExecutor
            return new DefaultChannelPromise(new FailedChannel(), GlobalEventExecutor.INSTANCE).setFailure(t);
        }

        ChannelFuture regFuture = config().group().register(channel);
        if (regFuture.cause() != null) {
            if (channel.isRegistered()) {
                channel.close();
            } else {
                channel.unsafe().closeForcibly();
            }
        }
        return regFuture;
    }
```

从代码中可以发现， Channel的创建是通过ChannelFactory创建。那么在(3)步的时候就是调用的 **`AbstractBootstrap#channel`** 方法：

```java
public B channel(Class<? extends C> channelClass) {
    return channelFactory(new ReflectiveChannelFactory<C>(
            ObjectUtil.checkNotNull(channelClass, "channelClass")
    ));
}

public class ReflectiveChannelFactory<T extends Channel> implements ChannelFactory<T> {

    private final Constructor<? extends T> constructor;

    public ReflectiveChannelFactory(Class<? extends T> clazz) {
        ObjectUtil.checkNotNull(clazz, "clazz");
        try {
            this.constructor = clazz.getConstructor();
        } catch (NoSuchMethodException e) {
            throw new IllegalArgumentException("Class " + StringUtil.simpleClassName(clazz) +
                    " does not have a public non-arg constructor", e);
        }
    }

    @Override
    public T newChannel() {
        try {
            return constructor.newInstance();
        } catch (Throwable t) {
            throw new ChannelException("Unable to create Channel from class " + constructor.getDeclaringClass(), t);
        }
    }

    @Override
    public String toString() {
        return StringUtil.simpleClassName(ReflectiveChannelFactory.class) +
                '(' + StringUtil.simpleClassName(constructor.getDeclaringClass()) + ".class)";
    }
}
```

**`最终是通过 NioServerSocketChannel的默认构造函数创建了对象`**

### 3. Channel初始化

**`AbstractBootstrap#initAndRegister`** 代码中创建了Channel上面代码已经分析了创建过程，在创建完成后调用了**`AbstractBootstrap#init`** 方法，在AbstractBootstrap中是一个抽象方法，也就是说具体有实现来确定，这个方法实现有两个类：

- **Bootstrap**
- **ServerBootstrap**

这里只讲ServerBootstrap的实现(前面也是针对Server部分来说明的，Client部分大同小异)，下面看一下 **`ServerBootstrap#init`** :

```java

```

