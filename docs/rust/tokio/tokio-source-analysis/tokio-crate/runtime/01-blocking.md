---
title: "Tokio runtime Blockingpool源码解析"
sidebar_label: Tokio runtime Blockingpool源码解析
linkTitle: Tokio runtime Blockingpool源码解析
weight: 202403190004
description: Tokio runtime Blockingpool源码解析
---

## 1. 代码结构

BlockingPool的代码结构如下图所示：

![Runtime-BlockingPool](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimeRuntime-BlockingPool.png)

接下来我们来分析代码

## 2. 线程如何创建

**`Spawner`** 是创建线程的入口：

![spawn_blocking_inner](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimespawn_blocking_inner.png)

**`Spawner#spawn_blocking_inner`** 内部方法负责转换将func变量转换成 Task然后进行包装：

![spawn_blocking_inner](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimespawn_blocking_inner4.png)

然后通过 **`Spawner#spawn_task`** 方法来创建线程。 这个方法也是BlockingPool的主要逻辑：

![spawn_task](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimespawn_task.png)

上面的方法主要有两块：

- 线程池中存在空闲线程，如果存在空闲的线程会从条件变量中等待的线程队列中唤醒线程来处理任务。
- 线程池中不存在空闲线程，这种情况下分为两种情况：
  1. 线程池达到了最大的线程数量，那么这种情况下Task只需要存入任务队列即可
  2. 线程池的线程没有达到最大数量，那么就是创建线程也就是调用spawn_thread方法来创建

**创建线程：**

![spawn_thread](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimespawn_thread.png)

到了这里就已经揭秘了整个线程池中的线程创建过程。分析倒底层发现线程创建还是调用Rust最初的的方法。

## 3. 任务如何被线程池中的线程执行

线程创建中有这样的一段代码：**`rt.inner.blocking_spawner().inner.run(id)`** 接下来分析这段代码，我们可以将这个方法中的代码分为三部分：

1. 线程执行任务之前
2. 线程执行任务
3. 任务队列中没有任务执行，也就是执行任务退出后

### 3.1 线程执行任务之前

![run1](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimerun1.png)

执行线程启动后的Callback回调函数。

### 3.2 线程执行任务

![loop](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimeloop.png)

通过一个loop循环以及线程在条件上面等待的配合来实现线程池中线程的处理任务。

1. 线处理线程池队列中的任务
2. 当任务处理完成，那么此时线程池中的空闲线程增加
3. 线程池在没有shutdown的情况下将此线程挂起来，设置对应的挂起时间。如果此时来了Task会有等待的线程唤醒。
4. 当没有任务此时就会判断线程池是否shutdown以及超时，此时会重新进入loop
5. 当线程池shutdown的时候将任务队列中的任务处理，然后退出loop

> 这个和Java中线程池的实现差不多。整体的实现思路都一样。

**线程池中的线程如何保持？**

loop的循环让线程一直运行，同时配合线程的等待挂起来防止一直的空轮训。

### 3.3.执行任务退出后

![after](https://raw.githubusercontent.com/mxsm/picture/main/rust/tokio/runtimeafter.png)

线程池shutdown后主要是处理后线程池中的一些可观察性的状态以及线程退出的回调函数。

**通过上面的分析会发现，当线程池达到最大线程数后不会根据超时时间降下来，也就是没有像Java线程池那样，如果最大线程池的数据和核心线程池的线程数量不一样，当没有任务后一定时间后线程数量会降到和核心线程数量一致的情况。**

## 4. 总结

在 Tokio 中，`blockingPool` 提供了一种在异步环境中执行阻塞操作的方法，以避免在单个线程上阻塞整个事件循环。以下是 Tokio 中 `blockingPool` 的执行过程的简要总结：

1. **创建阻塞任务**： 当需要执行一个阻塞操作时，可以通过 `blockingPool` 创建一个阻塞任务。这个任务通常是一个异步闭包，其中包含需要执行的阻塞操作。
2. **提交任务**： 创建的阻塞任务可以通过 `blockingPool.spawn()` 方法提交给 Tokio 的阻塞池。这个方法会将阻塞任务放入一个专门的线程池中执行，以避免阻塞主事件循环。
3. **执行阻塞操作**： 阻塞任务被提交到阻塞池后，Tokio 会将其调度到一个空闲的工作线程上执行。在这个线程上，阻塞任务可以安全地执行任何需要阻塞等待的操作，如文件 I/O、网络 I/O 或 CPU 密集型计算等。
4. **非阻塞等待**： 在主事件循环中，阻塞任务执行时不会阻塞整个事件循环。相反，Tokio 会在后台运行其他异步任务，并在阻塞任务完成后及时返回结果。
5. **返回结果**： 一旦阻塞任务执行完成并返回结果，Tokio 将会将结果返回给调用方，从而完成整个阻塞操作的过程。

通过使用 `blockingPool`，可以确保在 Tokio 的异步环境中执行阻塞操作时不会阻塞主事件循环，保持整个应用程序的响应性和性能。
