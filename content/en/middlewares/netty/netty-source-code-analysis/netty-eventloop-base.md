---
title: "Netty组件-EventLoop"
linkTitle: "Netty组件-EventLoop"
date: 2022-03-03
weight: 202203032358
---

> Netty版本：[netty-4.1.74.Final](https://github.com/netty/netty/releases/tag/netty-4.1.74.Final)

### 1. 引言

 `EventLoop` 作为Netty一个重要的组件，与Reactor的线程模型相对应。要了解什么是  `EventLoop` 同时需要了解 `EventLoopGroup、EventExecutor、EventExecutorGroup、SingleThreadEventLoop` 。 这些类之间有什么关系呢？研究过代码的会发现这个这些类之间错综复杂，看的头有点晕。下面我们来看下这些类之间的关系。

![NioEventLoopGroup](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/NioEventLoopGroup.png)

### 2. EventExecutor和EventExecutorGroup

事件执行器用来执行处理事件

```java
public interface EventExecutorGroup extends ScheduledExecutorService, Iterable<EventExecutor> {
    //省略代码
}
```

继承了 `ScheduledExecutorService` 说明是一个标准的JDK `Executor` 同时提供定时服务功能(Netty定时心跳实现)。

```java
public interface EventExecutor extends EventExecutorGroup {
    //省略代码
    @Override
    EventExecutor next();
}
```

EventExecutorGroup管理了多个EventExecutor，EventExecutorGroup由多个EventExecutor聚合而成的。EventExecutor是一个特殊的EventExecutorGroup，它带有一些方便的方法来查看线程是否在事件循环中执行。除此之外，它还扩展了EventExecutorGroup，允许使用通用的方式来访问方法。

### 3. EventLoop和EventLoopGroup

代码实现上来看首先 `EventLoop` 继承了 `EventLoopGroup` ，`EventLoop` 是 `EventLoopGroup` 的一种特殊存在。单个线程的叫 `EventLoop` 。多个线程的叫`EventLoopGroup`   其次都继承了JDK的 `ScheduledExecutorService` ，所以 `EventLoop和EventLoopGroup`  可以看成一个JDK的标准 `Executor` 同时支持定时执行。也可以理解为Netty自己实现的线程池。 EventLoop的相当于线程池只有一个线程，EventLoopGroup的是多个线程的线程池。`EventLoopGroup` 可以看做是由 `EventLoop` 组成。一旦注册，将处理一个Channel的所有I/O操作。一个EventLoop实例通常会处理多个Channel，但这可能取决于实现细节和内部。

![image-20220304001607454](https://raw.githubusercontent.com/mxsm/picture/main/netty/eventloop/image-20220304001607454.png)

### 4.SingleThreadEventLoop

`SingleThreadEventLoop` 作为Event处理的底层处理类，从源代码可以看出来：

```java
public abstract class SingleThreadEventLoop extends SingleThreadEventExecutor implements EventLoop {
    //省略代码
}

public abstract class SingleThreadEventExecutor extends 
    AbstractScheduledEventExecutor implements OrderedEventExecutor {
     //省略代码
     private volatile Thread thread;
}
```

`SingleThreadEventExecutor` 类中有一个线程变量，这个就是用来处理Event的。

### 5. EventLoop到底是什么？

功能主要用来处理Event的执行器，这个执行器符合JDK的执行器标准，同时具备定时执行任务的功能。也可以看做是JDK的 `Executor` 实现，相当于Netty版本线程池的实现。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢