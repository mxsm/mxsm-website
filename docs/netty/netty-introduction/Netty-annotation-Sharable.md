---
title: Netty @Sharable到底是干什么用的
date: 2021-06-22
weight: 202106222351
---

在研究 **`Apache RocketMQ`** 源码中发现有的 **`Handler`** 被 **`@Sharable`** 修饰的。有的又没有。下面结合实际的例子来分析一下作用

### 1. @Sharable概述

表示可以将带注释的 ChannelHandler 的同一个实例多次添加到一个或多个 ChannelPipelines 中，而不会出现竞争条件。如果未指定此注解，则每次将其添加到管道时都必须创建一个新的处理程序实例，因为它具有成员变量等非共享状态。这个是Netty的官方给的说明。

简单的理解：

- @Sharable是用来修饰ChannelHandler的
- ChannelHandler单例模式下需要添加多个ChannelPipelines 也就是要拦截多个Channel，就需要使用到@Sharable来修饰ChannelHandler

### 2.示例验证

在Netty中添加 **`ChannelHandler`** 的代码如下(代码来源[Netty官网](https://netty.io/wiki/user-guide-for-4.x.html))：

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
                     ch.pipeline().addLast(new DiscardServerHandler());  //（8）
                 }
             })
             .option(ChannelOption.SO_BACKLOG, 128)          // (5)
             .childOption(ChannelOption.SO_KEEPALIVE, true); // (6)
            ChannelFuture f = b.bind(port).sync(); // (7)
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

把上面代码稍微做一点修改，将（8）位置代码修改成如下：

```java
//在DiscardServer定义一个变量
private DiscardServerHandler handler = new DiscardServerHandler();

//（8位置改成如下）
ch.pipeline().addLast(handler);
```

当往多个 **`Channel`** 的 **`ChannelPipeline`** 中添加同一个 **`ChannelHandler`** 的时候，就会判断该实例是否增加了 **`@Sharable`** 注解。如果没有就会抛出错误：

```shell
io.netty.channel.ChannelPipelineException: com.github.mxsm.netty.TimeServerHandler is not a @Sharable handler, so can't be added or removed multiple times.
```

> Tips: 上面的错误是代码演示抛出来的，下面会根据代码分析

**原因分析：**

- 以官网的例子进行运行，添加的不是单例，加不加@Sharable注解并没有什么关系。
- 如果你添加的是单例，并且会被添加到多个Channel的 ChannelPipelines中，就必须加上@Sharable。否则就会报错

> Tips: 在 **`initChannel`** 方法中ChannelHandler是否单例和Netty没关系，也和@Sharable修饰ChannelHandler是否单例化没有关系。这个是否单例与使用者有关。如果是一上面的 new 的形式。那么 **`DiscardServerHandler`** 就不是单例。与有没有加@Sharable没关系。

### 3. 总结

- 网上很多说这个@Sharable跟ChannelHandler是单例有关，其实没有什么关系。ChannelHandler是否为单例取决于使用者添加的是否为单例。和开发者的行为有关。但是如果你想使用单例的ChannelHandler添加到ChannelPipeline中那么就需要用@Sharable进行修饰。
- ChannelHandler可以作为一个全局的统计，例如用户连接数量的统计就可以注册一个单例ChannelHandler来实现。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
