---
title: "Netty源码分析-EventLoopGroup如何工作"
linkTitle: "Netty源码分析-EventLoopGroup如何工作"
date: 2022-03-04
weight: 202203031740
---

> Netty版本：[netty-4.1.74.Final](https://github.com/netty/netty/releases/tag/netty-4.1.74.Final)

### 1. Reactor 线程模型

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
        EventLoopGroup bossGroup = new NioEventLoopGroup(1); // (1)
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

> Tips: 上面代码来源于官网，(1)位置代码构造函数修改了，增加1参数

从上面代码可以看出来Netty推荐主从Reactor的线程模型。Reactor线程模型运行机制主要有以下四步：

- 连接注册

- 事件轮询

- 事件分发

  I/O事件，Accept、Read、Write

- 事件处理

![Reactor模型](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/Reactor%E6%A8%A1%E5%9E%8B.png)

下面我们就从一下几个方面来说明`EventLoopGroup` 如何工作的

![EventLoopGroup分析思维导图](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/EventLoopGroup%E5%88%86%E6%9E%90%E6%80%9D%E7%BB%B4%E5%AF%BC%E5%9B%BE.png)



### 2. EventLoopGroup创建

以 **NioEventLoopGroup** 为例子通过跟进源码可以知道创建一个**`EventLoopGroup`** 主要的逻辑都在这个 **`MultithreadEventExecutorGroup`** 的构造函数里面。下面来对构造函数代码段进行分析。

#### 2.1 Executor的设置

![image-20220305202457603](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305202457603.png)

没有传入Exector的情况下，创建Netty实现的ThreadPerTaskExecutor，也可以使用Jdk的Executor实现

> Tips: new NioEventLoopGroup(2,Executors.newFixedThreadPool(10))

看一下 `ThreadPerTaskExecutor` 实现：

![image-20220305202632525](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305202632525.png)

直接实现了Executor接口，整个实现比较简单。

> Tips: 想一下如果使用Jdk的Executor实现，NioEventLoopGroup线程数量大于Jdk的Executor实现线程池数量会怎么样？
>
> ```java
> new NioEventLoopGroup(3,Executors.newFixedThreadPool(2))
> ```
>
> 后续的文章会专门讲解整个问题

#### 2.2 EventExecutor的创建

![image-20220305221245700](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305221245700.png)

创建EventExecutor, 上图调用的是一个 `MultithreadEventExecutorGroup#newChild` 的抽象方法。看具体的实现类实现：

![image-20220305221332386](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305221332386.png)

我们就以`NioEventLoopGroup` 为例：

![image-20220305221502196](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305221502196.png)

这里创建了一个 `NioEventLoop` 。

> Tips: 这个和之前说的EventLoopGroup聚合了EventLoop

从上面创建EventExecutor可以看出来，最终创建的是`NioEventLoop` 。从继承关系可以知道 `NioEventLoop` 实现了 EventExecutor。

#### 2.3 EventExecutorChooser选择器创建

![image-20220305232208068](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305232208068.png)

选择器创建根据 `EventExecutor` 的数量。

![image-20220305232443484](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305232443484.png)

2的指数选择`PowerOfTwoEventExecutorChooser` 。 其他的选择 `GenericEventExecutorChooser` 。

![image-20220305232623870](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305232623870.png)

两者的区别就在于2的指数使用的 **`&`** 正常的使用的是 **`%`** 

> Tips: &效率高于%

创建完成EventExecutor后，同时对EventExecutor数组进行处理成不能修改的`Set<EventExecutor>`

### 3. BossGroup如何工作

主从的线程模式下，`BossGroup` 主要负责事件轮询，下面来分析一下如何进行工作的

#### 3.1 BossGroup线程启动

通过服务端的例子，通过研究源码可以知道 **AbstractBootstrap#initAndRegister** 方法主要是创建 **Channel** 

![image-20220305235718388](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220305235718388.png)

上述代码的标号3，BossGroup注册Channel也是启动线程的关键，跟进代码往下看，`ChannelFuture regFuture = config().group().register(channel);` 代码的 `register` 方法调用的是 `MultithreadEventLoopGroup#register` 的方法：

```java
//MultithreadEventLoopGroup#register方法  
@Override
public ChannelFuture register(Channel channel) {
  return next().register(channel);
}
```

但是最终调用的是 `SingleThreadEventLoop#register` ：

```java
@Override
public ChannelFuture register(Channel channel) {
    return register(new DefaultChannelPromise(channel, this));
}

@Override
public ChannelFuture register(final ChannelPromise promise) {
    ObjectUtil.checkNotNull(promise, "promise");
    promise.channel().unsafe().register(this, promise);
    return promise;
}
```

> Tips: MultithreadEventLoopGroup对应EventLoopGroup，SingleThreadEventLoop对应EventLoop

`promise.channel().unsafe().register(this, promise)` 这里的this表示的是 NioEventLoop的实例，也就是把NioEventLoop作为参数传入了。调用的是`AbstractChannel.AbstractUnsafe#register` :

![image-20220306004126148](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306004126148.png)

上图代码段框出来的就是 EventLoop启动，跟进代码看一下具体的实现，execute方法具体执行的是 **`SingleThreadEventExecutor#execute`** 

![image-20220306004449915](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306004449915.png)

> Tips: 通过查看SingleThreadEventExecutor源码你会发现，有一个Thread的属性。所以这里SingleThreadEventExecutor就相当于线程。只是对线程进行包装语义化

在线程没有在EventLoop中，就启动当前线程通过调用`SingleThreadEventExecutor#startThread` 方法。 在这个方法里面又调用了`SingleThreadEventExecutor#doStartThread` 方法。

![image-20220306005257301](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306005257301.png)

1通过了Executor来执行下面的Runable代码，前面的 **`EventLoopGroup`** 创建可以知道，在默认的情况下使用的是 `ThreadPerTaskExecutor` ，而这个`ThreadPerTaskExecutor#execute` 方法的实现：

```java
public final class ThreadPerTaskExecutor implements Executor {
    private final ThreadFactory threadFactory;

    public ThreadPerTaskExecutor(ThreadFactory threadFactory) {
        this.threadFactory = ObjectUtil.checkNotNull(threadFactory, "threadFactory");
    }

    @Override
    public void execute(Runnable command) {
        threadFactory.newThread(command).start();
    }
}
```

直接创建线程然后启动。

**重点：看到这里你就会发现EventLoopGroup中的EventLoop已经启动了。然后在Runable中 `thread = Thread.currentThread();`这段代码将当前的线程设置给了SingleThreadEventExecutor变量**

> Tips:
>
> - Executor如果是JDK的实现，Executor执行Runable其实就是线程池执行
> - 事件轮询方法是一个死循环来实现。以达到不停的轮询的目的

#### 3.2 BossGroup轮询事件

通过上面的分析可以知道Executor执行的Runable中的 **`SingleThreadEventExecutor.this.run()`** 这段代码就是对事件进行轮询。以`NioEventLoopGroup` 为例，那么这方法的实现应该就是在 `NioEventLoop` 下面来分析这个方法。

说到轮询我们应该想到就有循环的过程，下面看一下 `NioEventLoop#run` 方法：

![image-20220306133512844](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306133512844.png)

从代码可以看出来，使用的是一个无条件的for死循环来实现。进入for循环后，通过策略来计算出策略值，根据不同的策略值来做相对应的处理：

![image-20220306133923602](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306133923602.png)

1 计算出策略，第一次进入的时候strategy=0,为什么会是0，下面看一下`SelectStrategy` 的实现类 `DefaultSelectStrategy` 也只有这一个实现

```java
final class DefaultSelectStrategy implements SelectStrategy {
    static final SelectStrategy INSTANCE = new DefaultSelectStrategy();

    private DefaultSelectStrategy() { }

    @Override
    public int calculateStrategy(IntSupplier selectSupplier, boolean hasTasks) throws Exception {
        return hasTasks ? selectSupplier.get() : SelectStrategy.SELECT;
    }
}
```

**selectSupplier.get()** 这个对于 `NioEventLoop` 来说调用的是：

```java
//NioEventLoop
private final IntSupplier selectNowSupplier = new IntSupplier() {
    @Override
    public int get() throws Exception {
        return selectNow();
    }
};

int selectNow() throws IOException {
    return selector.selectNow();
}
```

在Channel初始化的时候Selector注册的感兴趣的值为0。所以selector.selectNow() 返回的也是0。

在队列中没有任务的时候就返回 **`SelectStrategy.SELECT`** 然后执行的就是上图代码标号2的逻辑代码：

```java
private int select(long deadlineNanos) throws IOException {
    if (deadlineNanos == NONE) {
        return selector.select();   //(1)
    }
    // Timeout will only be 0 if deadline is within 5 microsecs
    long timeoutMillis = deadlineToDelayNanos(deadlineNanos + 995000L) / 1000000L;
    return timeoutMillis <= 0 ? selector.selectNow() : selector.select(timeoutMillis);
}
```

在定时队列任务中没有任何任务，那就直接调用 （1）`selector.select()` 如果没有事件触发，就一直阻塞。 如果存在其他的情况就调用 `selector.selectNow()` 或者 `selector.select(timeoutMillis)` ，前一个直接返回，第二个等待一定时间没有事件触发就返回。

**到了这里轮询的过程就已经基本上完成，获取到了策略值strategy，剩下的就是对策略值进行处理，也就是事件的分发**

#### 3.3 EventLoop事件处理

下图这段代码就是 `NioEventLoop#run` 方法中处理I/O事件：

![image-20220306160847456](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306160847456.png)

如上图代码段标号1和标号2两者大体都是处理I/O事件以及执行任务队列中的任务。跟进processSelectedKeys方法看一下：

```java
private void processSelectedKeys() {
    if (selectedKeys != null) {
        processSelectedKeysOptimized();
    } else {
        processSelectedKeysPlain(selector.selectedKeys());
    }
}
```

当中有两个方法，但是最终调用的是NioEventLoop#processSelectedKey方法(其中的一个分支)：

![image-20220306161558506](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306161558506.png)

在这个方法中就有I/O事件的处理：

- 连接处理
- 写处理
- 读处理

**到这里就看到了EventLoop的是如何处理I/O事件**

> Tips: 里面的具体处理细节不去深究

在前面图的标号3的作用是用来做什么的呢？代码后面的注释：不希望唤醒，这里就是JDK的NIO的空轮询的Bug

> Tips: 空轮询的bug可以参看如下链接
>
> - https://bugs.java.com/bugdatabase/view_bug.do?bug_id=6670302
> - https://bugs.java.com/bugdatabase/view_bug.do?bug_id=6403933

![image-20220306162600078](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306162600078.png)

Netty通过计数器来判断是否发生了空轮询，如果发生了那么就重新构建Selector。

### 4. WorkerGroup如何工作

在创建Channel的时候，初始化调用的是`ServerBootstrap#init` 方法：

![image-20220306201837801](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306201837801.png)

然后在`ChannelPipeline` 末尾增加了一个 `ServerBootstrapAcceptor`

![image-20220306202031182](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220306202031182.png)

从代码中看到有这样的一段代码：

```java
childGroup.register(child).addListener(new ChannelFutureListener() {
                    @Override
                    public void operationComplete(ChannelFuture future) throws Exception {
                        if (!future.isSuccess()) {
                            forceClose(child, future.cause());
                        }
                    }
                });
```

childGroup就是前面例子中的workerGroup变量，`childGroup.register` 和 BossGroup的一样，只不过这个是多个线程的。后续的处理和前面分析的一样。

### 5. 总结

- EventLoopGroup组件是一个很重要的组件，代码也很复杂。但是只要抓住一点EventLoopGroup就相当于Netty的Jdk执行器Executor的一个实现就可以了。相当于线程池。
- Netty通过巧妙的设计避免了Jdk的空轮询问题。
- 开发过程中主从线程模型用的比较多。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
