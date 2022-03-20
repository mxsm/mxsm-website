---
title: "Netty源码解析-ChannelInboundHandler#channelRead参数Object对象到底是什么类型"
linkTitle: "Netty源码解析-ChannelInboundHandler#channelRead参数Object对象到底是什么类型"
date: 2022-03-20
weight: 202203201052

---

> Netty版本：[netty-4.1.75.Final](https://github.com/netty/netty/releases/tag/netty-4.1.75.Final)

### 1. 引言

在之前的文章《[Netty源码分析-ChannelHandler方法执行顺序和如何工作](https://juejin.cn/post/7076731940706975758)》中分析了ChannelHandler的方法执行的顺序问题。在这个过程中细心的人可能会发现`ChannelInboundHandler#channelRead` 方法有个参数是Object:

```java
void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception;
```

刚刚接触的Netty的开发者肯定也很好奇这个Object到底会是什么类型，今天我们就从源码来分析一下这个Object的类型。了解Object的具体类型同时也可以帮助我们更好的开发。

### 2. Netty源码分析ChannelInboundHandler#channelRead参数Object类型

这里我们还是以服务器的代码作为例子讲解

```java
package com.github.mxsm.netty.channelhandler;

import com.github.mxsm.netty.DiscardServerHandler;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.ServerSocketChannel;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;

/**
 * @author mxsm
 * @date 2022/3/13 10:47
 * @Since 1.0.0
 */
public class DiscardServer {
    private int port;

    public DiscardServer(int port) {
        this.port = port;
    }

    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1); // (1)
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap(); // (2)
            b.handler(new ChannelInitializer<ServerSocketChannel>(){
                @Override
                protected void initChannel(ServerSocketChannel ch) throws Exception {
                    ch.pipeline().addLast(new TimeServerBossOutHandler());
                    ch.pipeline().addLast(new TimeServerBossInHandler());
                }
            });
            b.group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class) // (3)
                .childHandler(new ChannelInitializer<SocketChannel>() { // (4)
                    @Override
                    public void initChannel(SocketChannel ch) throws Exception {
                        ch.pipeline().addLast(new TimeServerOutHandler());
                        ch.pipeline().addLast(new TimeServerInHandler());
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

> Tips:代码地址https://github.com/mxsm/spring-sample/tree/master/java-sample/src/main/java/com/github/mxsm/netty/channelhandler

上面代码改自Netty官网，我这里给BossGroup中的ServerSocketChannel也显示加了ChannelHandler。**所以对于ChannelInboundHandler#channelRead参数Object类型我们需要区分是ServerSocketChannel还是SocketChannel。** 下面我们也从这两个方面进行源码分析。

> Tips: 下面讲的会用到ChannelHandler的方法执行顺序的相关知识，不太清楚的可以查看之前的文章 《[Netty源码分析-ChannelHandler方法执行顺序和如何工作](https://juejin.cn/post/7076731940706975758)》

#### 2.1 ServerSocketChannel中ChannelInboundHandler#channelRead参数Object类型

NioServerSocketChannel创建完成后绑定到BossGroup的EvenLoop上面，往EvenLoop提交任务后，NioEventLoop就开始运行EventLoop#run

```java
 @Override
 protected void run() {
     //省略了大量的代码
     
     for (;;) {
         strategy = select(curDeadlineNanos); //select
         
         processSelectedKeys() //处理SelectedKeys
     }
 }
```

上面代码主要看一下`processSelectedKeys()` 这个方法最终调用的是 `NioEventLoop#processSelectedKey(SelectionKey k, AbstractNioChannel ch)` 这个方法。这个方法也是ServerSocketChannel的主要处理逻辑：

![](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320101400589.png)

如上图1位置所示，`unsafe.read()` 这个方法是解析ChannelInboundHandler#channelRead参数Object类型的关键代码。这个unsafe是怎么来的呢，上面有这样一段代码：

![image-20220320102124732](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320102124732.png)

**重点：unsafe.read()，调用那个实现取决于具体的实现，NioServerSocketChannel那么调用的就是AbstractNioMessageChannel.NioMessageUnsafe.read** ：

![image-20220320102542119](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320102542119.png)

这个方法重点关注一下上图的标号位置

- 标号1 的位置调用了`AbstractNioMessageChannel#doReadMessages`的抽象方法，这个案例下调用的是`NioServerSocketChannel#doReadMessages`方法：

  ![image-20220320102645617](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320102645617.png)

  往`List<Object> buf` 列表中添加了`NioSocketChannel`的实例

- 标号2的位置，是触发`ChannelInboundHandler#channelRead` ，将标号1中添加的`NioSocketChannel`作为Object的实际对象传入`ChannelInboundHandler#channelRead`参数Object类型

**总结：ServerSocketChannel中ChannelInboundHandler#channelRead参数Object类型是NioSocketChannel**

> Tips: 使用者可以启动项目进行测试，看一下是不是和上面分析的一样进行验证，上面的关键之处就是在于unsafe.read()这个方法到底是调用哪个实现，同时在触发了ServerSocketChannel的ChannelPipeline后的fireChannelRead如何进行传导到SocketChannel，这个就是我下面要接着分析的。

#### 2.2 ServerSocketChannel中ChannelInboundHandler#channelRead参数Object类型

触发了ServerSocketChannel的ChannelPipeline后的fireChannelRead后，最终调用的是 **`ServerBootstrap#init`** 中的如下图框出来的代码：

![image-20220320104301073](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320104301073.png)

ServerBootstrapAcceptor也是一个ChannelInboundHandlerAdapter，同样会触发ChannelInboundHandler#channelRead

> Tips: 此时触发的ChannelInboundHandler#channelRead还是属于NioServerSocketChannel

![image-20220320104427432](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320104427432.png)

如上图标号1所示此处的Channel实际上是NioSocketChannel实例，也就是NioServerSocketChannel传递过来的。如上图标号2所示这里就是往workGroup中注册NioSocketChannel实例。然后就是workGroup的NioEventLoop就开始运行EventLoop#run，这里的执行和BossGroup中执行的是一样的。唯一不同的就是

**unsafe.read()** 方法，在NioSocketChannel中是执行`AbstractNioByteChannel.NioByteUnsafe#read`

![image-20220320103708124](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/image-20220320103708124.png)

如上图标号1所示，这里同样触发了`ChannelPipeline#fireChannelRead` 这里传入的ChannelInboundHandler#channelRead参数Object类型是ByteBuf的实例。

> Tips: 这里的ChannelPipeline#fireChannelRead触发的是NioSocketChannel的。

**总结：ServerSocketChannel中ChannelInboundHandler#channelRead参数Object类型是ByteBuf**

> Tips: 如果经过解码器后，触发的后续的ChannelInboundHandler#channelRead参数Object的类型就是解码后的消息类型

### 3. 总结

ChannelInboundHandler#channelRead参数Object类型取决于是ServerSocketChannel还是SocketChannel。

- **ServerSocketChannel中ChannelInboundHandler#channelRead参数Object类型是NioSocketChannel**
- **ServerSocketChannel中ChannelInboundHandler#channelRead参数Object类型是ByteBuf**
- **对于Netty的解码器只是对ChannelInboundHandler进行拓展**

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢