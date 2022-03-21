---
title: "Netty源码解析-EventLoop什么时候启动运行"
linkTitle: "Netty源码解析-EventLoop什么时候启动运行"
date: 2022-03-21
weight: 202203211547
---

Offer 驾到，掘友接招！我正在参与2022春招打卡活动，点击查看[活动详情](https://juejin.cn/post/7069661622012215309/)。

### 1.引言

Netty中EventLoopGroup其实就相当于线程池，而EventLoop就相当于线程池中的线程。既然说是线程但是我们在开发的过程中没有看到类似于线程的启动start或者run方法的调用。那么Netty的EventLoop什么时候启动运行的呢？下面来通过源码分析一下这个问题。在分析这个问题之前需要明确一个事情：Netty的执行器可以使用用户自定义的或者用Netty默认实现的。下面讲的是使用Netty默认的执行器 **`ThreadPerTaskExecutor`**。

> Tips: 用户自定义的可以用户自己实现Executor接口或者使用JDK实现的线程池。这两种情况都可以归类为用户自定义。

### 2.EventLoop启动源码分析

已NioEventLoop为例，NioEventLoop创建是在创建NioEventLoopGroup的时候创建。

![image-20220321223154151](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220321223154151.png)

上图标注的部分代码就是创建NioEventLoop。整个方法是一个抽象方法，看具体的实现，我们这里的实现就在NioEventLoopGroup中

![image-20220321223324109](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220321223324109.png)

NioEventLoop,将执行器作为构造函数的参数。这里就完成NioEventLoop创建。

ServerBootstrap绑定本地端口的时候会进行NioServerSocketChannel初始化的工作，然后将NioServerSocketChannel对象注册到NioEventLoop：

```java
//AbstractBootstrap#initAndRegister
final ChannelFuture initAndRegister() {
    //省略部分代码
     ChannelFuture regFuture = config().group().register(channel);
 }
```

跟进register方法的代码，发现最终调用的是**`AbstractChannel#AbstractUnsafe.register`** 方法：

```java
@Override
public final void register(EventLoop eventLoop, final ChannelPromise promise) {

	//省略部分无关代码
    AbstractChannel.this.eventLoop = eventLoop;

    if (eventLoop.inEventLoop()) {
        register0(promise);
    } else {
        try {
            eventLoop.execute(new Runnable() { //(1)
                @Override
                public void run() {
                    register0(promise);
                }
            });
        } catch (Throwable t) {
        }
    }
}
```

在首次注册的时候上述代码肯定走得是else分支。

**标号（1）位置的就是 EventLoop启动的关键代码**。跟进EventLoop#execute方法，调用的是SingleThreadEventExecutor#execute：

```java
@Override
public void execute(Runnable task) {
    ObjectUtil.checkNotNull(task, "task");
    execute(task, !(task instanceof LazyRunnable) && wakesUpForTask(task));
}

private void execute(Runnable task, boolean immediate) {
    boolean inEventLoop = inEventLoop();
    addTask(task); //(1)
    if (!inEventLoop) {
        startThread(); //(2)
        if (isShutdown()) {
            boolean reject = false;
            try {
                if (removeTask(task)) {
                    reject = true;
                }
            } catch (UnsupportedOperationException e) {
            }
            if (reject) {
                reject();
            }
        }
    }

    if (!addTaskWakesUp && immediate) {
        wakeup(inEventLoop);
    }
}
```

如上述代码SingleThreadEventExecutor#execute方法中调用的是SingleThreadEventExecutor#execute的私有方法。

标号（1）：将提交的任务加入队列，然后判断运行线程是否已经在当前EventLoop，不在就启动线程调用**`startThread();`** 。然后跟进代码发现调用的是SingleThreadEventExecutor#doStartThread方法：

![image-20220321223555039](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220321223555039.png)

调用的是 **`executor.execute`**方法.也就是Executor#execute方法，对于Netty默认真的执行器来说就是调用 **`ThreadPerTaskExecutor#execute`** 方法：

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

从代码中可以看到创建线程然后启动，运行的内容就是上图标号为1的内容，实际就是**`SingleThreadEventExecutor.this.run()`** 的内容，具体看实现，例如NioEventLoop的实现：

![image-20220321223639743](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220321223639743.png)

**重点：EventLoop是在Channel注册到EventLoop的时候，通过执行器提交任务启动线程的**

### 3. 总结

EventLoop是在Channel注册到EventLoop的时候通过执行器启动。任务会被添加到队列中。待EventLoop启动后从队列中获取任务进行处理。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢