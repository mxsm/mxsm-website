---
title: "Netty源码解析-服务端启动流程详解"
linkTitle: "Netty源码解析-服务端启动流程详解"
date: 2022-03-21
weight: 202203211014
---

之前讲了很多关于Netty的组件相关的知识以及Netty启动过程中的一些调用关系。下面通过一个官网的例子(稍微增加了修改)来说明整个启动过程的每一步到底做了什么。

### 1. 官网示例

下述例子是在官网的例子上做了一些修改，增加了NioServerSocketChannel设置ChannelHandler。也就是标号5的位置。

```java
public class DiscardServer {

    private int port;

    public DiscardServer(int port) {
        this.port = port;
    }

    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1); // (1)
        EventLoopGroup workerGroup = new NioEventLoopGroup();// (2)
        try {
            ServerBootstrap b = new ServerBootstrap(); // (3)
            b.group(bossGroup, workerGroup) // (3)
                .channel(NioServerSocketChannel.class) // (4)
                .handler(new ChannelInitializer<ServerSocketChannel>() {
                    @Override
                    protected void initChannel(ServerSocketChannel ch) {
                        ch.pipeline().addLast(new TimeServerBossOutHandler());
                        ch.pipeline().addLast(new TimeServerBossInHandler());
                    }
                })// (5)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    public void initChannel(SocketChannel ch) throws Exception {
                        ch.pipeline().addLast(new TimeServerOutHandler());
                        ch.pipeline().addLast(new TimeServerInHandler());
                    }
                })// (6)
                .option(ChannelOption.SO_BACKLOG, 128)          // (7)
                .childOption(ChannelOption.SO_KEEPALIVE, true); // (8)

            // Bind and start to accept incoming connections.
            ChannelFuture f = b.bind(port).sync(); // (9)

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

上述代码地址：https://github.com/mxsm/spring-sample/blob/master/java-sample/src/main/java/com/github/mxsm/netty/channelhandler/DiscardServer.java

### 2.服务端启动流程详解分析

上述代码被分成了9个步骤，基本上涵盖了Netty的服务端基本开发。我们就一个个步骤分析，分析过程中两个将近的步骤会放在一起进行分析

#### 2.1 EventLoopGroup的创建

步骤(1)、(2)创建**`EventLoopGroup`**，上述代码创建的是**`NioEventLoopGroup`**。那么做了一些什么事情呢？

> Tips: EventLoopGroup还有 DefaultEventLoopGroup 、EpollEventLoopGroup(这个只能运行在Linux上面)

- 创建EventExecutor，也就是NioEventLoop。
- 创建Java NIO 的Selector, 这个是创建NioEventLoop的时候创建。

#### 2.2 创建服务端的启动类

步骤（3）就是创建服务端的启动类，这个没什么好介绍的。创建完成后将bossGroup和workGroup分别设置到服务端启动服务类中。作用：

- bossGroup负责监听来自客户端的连接，以及将连接转交给workGroup处理
- workGroup主要负责客户端连接Channel的数据读写操作

#### 2.3 设置创建的Channel的类型

对于服务端的设置Channel，其实有两类：ServerSocketChannel和SocketChannel，BossGroup创建的是ServerSocketChannel，而workGroup创建的是SocketChannel(这个会在下面讲到)。（4）这里设置的是boss的ChannelServerSocketChannel。

#### 2.4 为ServerSocketChannel设置ChannelHandler

步骤（5）设置的ChannelServerSocketChannel的ChannelHandler，在不设置的情况下，其中有默认的添加 **`ChannelInitializer`** 在ServerBootstrap#init方法中：

```java
@Override
void init(Channel channel) {
    setChannelOptions(channel, newOptionsArray(), logger);
    setAttributes(channel, newAttributesArray());

    ChannelPipeline p = channel.pipeline();

    final EventLoopGroup currentChildGroup = childGroup;
    final ChannelHandler currentChildHandler = childHandler;
    final Entry<ChannelOption<?>, Object>[] currentChildOptions = newOptionsArray(childOptions);
    final Entry<AttributeKey<?>, Object>[] currentChildAttrs = newAttributesArray(childAttrs);

    p.addLast(new ChannelInitializer<Channel>() {
        @Override
        public void initChannel(final Channel ch) {
            final ChannelPipeline pipeline = ch.pipeline();
            ChannelHandler handler = config.handler();
            if (handler != null) {
                pipeline.addLast(handler); //(1)
            }

            ch.eventLoop().execute(new Runnable() {
                @Override
                public void run() {
                    pipeline.addLast(new ServerBootstrapAcceptor(
                            ch, currentChildGroup, currentChildHandler, currentChildOptions, currentChildAttrs));
                }
            });
        }
    });
}
```

上面代码标号1的位置就是将步骤（5）设置的ChannelHandler添加到ChannelServerSocketChannel所绑定的ChannelPipeline中。

#### 2.5 为SocketChannel设置ChannelHandler

步骤（6）为SocketChannel设置ChannelHandler，这个和步骤5相似但是注意下ChannelInitializer中的泛型类C是不一样的，步骤（5）是ServerSocketChannel，而步骤（6）是SocketChannel。

#### 2.6 ServerSocketChannel和SocketChannel的设置

步骤（7）、（8）分别设置ServerSocketChannel和SocketChannel的TCP以及其他相关的参数设置。

> Tips: 以上的步骤，主要是创建启动服务类以及设置ChannelHandler和Channel的配置。

#### 2.7 绑定端口启动服务

步骤（9）主要是绑定端口，然后将之前步骤的设置串连起来。将服务启动。

```java
private ChannelFuture doBind(final SocketAddress localAddress) {
    final ChannelFuture regFuture = initAndRegister();
    final Channel channel = regFuture.channel();
    if (regFuture.cause() != null) {
        return regFuture;
    }

    if (regFuture.isDone()) {
        ChannelPromise promise = channel.newPromise();
        doBind0(regFuture, channel, localAddress, promise);
        return promise;
    } else {
        final PendingRegistrationPromise promise = new PendingRegistrationPromise(channel);
        regFuture.addListener(new ChannelFutureListener() {
            @Override
            public void operationComplete(ChannelFuture future) throws Exception {
                Throwable cause = future.cause();
                if (cause != null) {
                    promise.setFailure(cause);
                } else {
                    promise.registered();
                    doBind0(regFuture, channel, localAddress, promise);
                }
            }
        });
        return promise;
    }
}
```

- 创建NioServerSocketChannel的实例，在创建NioServerSocketChannel实例的同时也创建了当前NioServerSocketChannel的ID,内部接口Unsafe的实例对象，以及当前NioServerSocketChannel说绑定的ChannelPipeline。
- 对NioServerSocketChannel的实例进行初始化, 初始化做了哪些工作?
  - NioServerSocketChannel设置之前设置的options配置
  - NioServerSocketChannel属性
  - 给NioServerSocketChannel的ChannelPipeline中添加ChannelInitializer，这里添加的ChannelInitializer会将之前案例代码中步骤（5）添加的ChannelHandler添加到NioServerSocketChannel的ChannelInitializer中，同时还添加了ServerBootstrapAcceptor(这个类的作用后面会讲到)
- 将NioServerSocketChannel的实例注册到BossGroup的EventLoop上面，对于Nio来说就是注册到NioEventLoop上面。
- 绑定启动服务器的本地端口，等待客户端连接

到这里就完成整个服务的启动工作。

### 3. 总结

netty服务端的启动和Java NIO的启动和工作的流程一致，只是将接收连接和处理连接的读写分开了。也就是Netty的Reactor的主从模型（图片来源网上）

![](https://github.com/mxsm/document/blob/master/image/netty/NettyServer%E5%A4%84%E7%90%86%E8%BF%9E%E6%8E%A5%E7%9A%84%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢