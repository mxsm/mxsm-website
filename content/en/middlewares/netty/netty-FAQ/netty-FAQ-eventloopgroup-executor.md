---
title: "Netty答疑解惑-EventLoopGroup执行器线程数小于nThreads会怎么样?"
linkTitle: "Netty答疑解惑-EventLoopGroup执行器线程数小于nThreads会怎么样?"
date: 2022-03-14
weight: 202203142136
---

Offer 驾到，掘友接招！我正在参与2022春招打卡活动，点击查看[活动详情](https://juejin.cn/post/7069661622012215309/)

### 1. 引言

Java中网络开发Netty肯定绕不开，之前在研究Netty源码过程中发现当你创建 `EventLoopGroup`的时候可以自定义执行器，环境话说就是可以用Jdk实现的执行器也就是通常所说的线程池。其中有这样的一个构造函数：

```java
public NioEventLoopGroup(int nThreads, Executor executor) {
    this(nThreads, executor, SelectorProvider.provider());
}
```

- nThreads：表示EventLoopGroup线程数量
- executor：表示用户自定义的执行器

执行器我们用JDK实现的线程池作为执行器。

**问题：当nThreads的值大于线程池中线程的最大数会怎么样？**

下面就通过代码来看一下这种问题下会发生什么，同时应该怎么去解决这个问题。

### 2. 案例代码

服务端代码

```java
public class DiscardServer {
    private int port;

    public DiscardServer(int port) {
        this.port = port;
    }

    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1); // (1)
        EventLoopGroup workerGroup = new NioEventLoopGroup(3, Executors.newFixedThreadPool(2, new ThreadFactory() {
            private AtomicInteger threadNumber = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "Thread-mxsm-"+threadNumber.incrementAndGet());
            }
        }));
        try {
            ServerBootstrap b = new ServerBootstrap(); // (2)
            b.group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class) // (3)
                .childHandler(new ChannelInitializer<SocketChannel>() { // (4)
                    @Override
                    public void initChannel(SocketChannel ch) throws Exception {
                        ch.pipeline().addLast(new TimeServerInHandler());
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

@Sharable
public class TimeServerInHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        System.out.println(this.getClass().getSimpleName()+"--channelRead");
        final ByteBuf time = ctx.alloc().buffer(4); // (2)
        time.writeInt((int) (System.currentTimeMillis() / 1000L + 2208988800L));
        ctx.writeAndFlush(time); // (3)
    }
}
```

客户端代码：

```java
public class TimeClient {
    public static void main(String[] args) throws Exception {

        for(int i = 0; i < 100; ++i){
            new Thread(new Runnable(){
                @Override
                public void run() {
                    try {
                        new TimeClient().test();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }

    }

    public  void test() throws Exception{
        String host = "127.0.0.1";
        int port = Integer.parseInt("8080");
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            Bootstrap b = new Bootstrap(); // (1)
            b.group(workerGroup); // (2)
            b.channel(NioSocketChannel.class); // (3)
            b.option(ChannelOption.SO_KEEPALIVE, true); // (4)
            b.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                public void initChannel(SocketChannel ch) throws Exception {
                    // ch.pipeline().addLast(new TimeClientOutHandler());
                    ch.pipeline().addLast(new TimeClientInHandler());
                }
            });

            // Start the client.
            ChannelFuture f = b.connect(host, port).sync(); // (5)
            ByteBuf byteBuf = Unpooled.buffer();
            // Wait until the connection is closed.
            byteBuf.writeBytes("1111".getBytes(StandardCharsets.UTF_8));
            f.channel().writeAndFlush(byteBuf);

            f.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
        }
    }
}

public class TimeClientInHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        System.out.println(this.getClass().getSimpleName()+"--channelRead");
        ByteBuf m = (ByteBuf) msg; // (1)
        try {
            long currentTimeMillis = (m.readUnsignedInt() - 2208988800L) * 1000L;
            System.out.println(new Date(currentTimeMillis));
            //ctx.close();
        } finally {
            m.release();
        }
    }
    
}
```

分别运行服务端代码和客户端代码，然后运行命令：

```shell
jps
```

![image-20220314214433827](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220314214433827.png)

然后找到服务端的的pid,接着运行命令

```shell
jstack -l <pid>
```

运行结果：

![image-20220314214549647](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220314214549647.png)

### 3. 结果分析

从上面的线程可以发现workerGroup中只是创建了两个线程，也就是说在这种情况下线程数量是由线程池决定的。下面我们从源码来分析一下为什么会是这样的情况：

创建NioEventLoopGroup的构造函数调用了MultithreadEventExecutorGroup的构造函数。

![image-20220314214751486](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220314214751486.png)

标号1位置是Executor为空的情况下使用的就是Netty自定义的：

![image-20220314214903403](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220314214903403.png)

Netty实现的Executor如上图，是每次执行一个提交的任务创建一个线程，然后线程和EventLoop进行绑定。如果使用者传入进来Executor不为空就使用的是传入的。

使用自定义和Netty自定义实现的Executor的区别如下图所示：

![自定义和Netty自定义实现的Executor的区别](E:\download\自定义和Netty自定义实现的Executor的区别.png)

**总结： 在使用的时候如果使用自定义的Executor最好让线程数量和NioEventLoopGroup构造函数的nThreads数量一样，如果数量不一样相当于降低了workGroup的吞吐量**

> Tips: 通过上面分析NioEventLoopGroup构造函数的nThreads数量其实指的是EventLoop的数量，但是在Netty中没有严格的要求说一个Thread必须对应一个EventLoop

### 4. 总结

- Netty创建NioEventLoopGroup建议直接使用Netty默认的Executor实现。这样能够避免上述问题
- 在处理Channel的数据的时候，可以使用JDK的线程池作为业务线程池进行业务处理
- 使用过程中，遇到这种问题不清楚就尽量直接使用Netty本身的，或者设置成相同的。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢