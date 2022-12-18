---
title: "CompletableFuture详解"
linkTitle: "CompletableFuture详解"
date: 2022-07-30
weight: 202207301354
---

平时开发过程中 `Runable` 、`Future` 、 `Thread` 、`ExecutorService`、`Callable` 这些和多线程相关的class了解和使用的也比较多，相对来说更加的熟悉和了解。使用起来也更加的得心应手。但是这些组合在一起解决多线程的问题的同时也有一些不是很满足实际开发过程中的需求。然后在JDK8引入了一个新的类 **`CompletableFuture`** 来解决之前的痛点问题。接下来了解一下 **`CompletableFuture`** 的一些基本情况以及使用和注意事项。

### 1 CompletableFuture概述

在JDK8之前，我们使用的Java多线程变成，主要是 **Thread+Runnable** 来完成，但是这种方式有个弊端就是没有返回值。如果想要返回值怎么办呢，大多数人就会想到 **`Callable + Thread`** 的方式来获取到返回值。如下：

```java
public class TestCompletable {

    public static void main(String[] args) throws Exception{
        FutureTask<String> task = new FutureTask((Callable<String>) () -> {
            TimeUnit.SECONDS.sleep(2);
            return UUID.randomUUID().toString();
        });
        new Thread(task).start();
        String s = task.get();
        System.out.println(s);
    }
}
```

从运行上面代码可以知道当调用代码 `String s = task.get();` 的时候，当前主线程是阻塞状态，另一种方式获取到返回值就是通过轮询 `task.isDone()` 来判断任务是否做完获取返回值。因此JDK8之前提供的异步能力有一定的局限性：

- Runnable+Thread虽然提供了多线程的能力但是没有返回值。
- Callable+Thread的方法提供多线程和返回值的能力但是在获取返回值的时候会阻塞主线程。

![Future执行流程图](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/Future%E6%89%A7%E8%A1%8C%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

所以上述的情况只适合不关心返回值，只要提交的Task执行了就可以。另外的就是能够容忍等待。因此我们需要更大的异步能力为了去解决这些痛点问题。比如一下场景：

- 两个Task计算合并为一个，这两个异步计算之间相互独立，但是两者之前又有依赖关系。
- 对于多个Task,只要一个任务返回了结果就返回结果

等等其他的一些负载的场景， JDK8 就引入了 **`CompletableFuture`**

![image-20220730150022826](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220730150022826.png)

#### 1.1 CompletableFuture与Future的关系

通过上面的类继承关系图可以知道 **`CompletableFuture`** 实现了 **`Future`** 接口和 **`CompletionStage`** 。因此 CompletableFuture是对 Futrue的功能增强包含了Future的功能。从继承的另一个 **`CompletionStage`** 的名称来看完成阶段性的接口。这个怎么理解，这个就是下面要说的CompletableFuture本质。

#### 1.2 CompletableFuture本质

CompletableFuture本质是什么？笔者的理解CompletableFuture相当于一个Task编排工具。为什么这么说依据如下：

- CompletableFuture#completedFuture、CompletableFuture#whenComplete 这些方法都是对某一个阶段Task计算完成然后进行下一步的动作。将下一个一个Task和前一个Task进行编排。
- CompletableFuture#handle 将Task串连起来

这些动作其实就是Task编排。

### 2 CompletableFuture使用案例

下面通过自己写的一些例子和开源项目 [DLedger](https://github.com/openmessaging/dledger) 中的一些例子来看一下 **`CompletableFuture`** 使用。

**CompletableFuture具有Future的功能：**

```java
public class TestCompletable {

    public static void main(String[] args) throws Exception{
        FutureTask<String> futureTask = new FutureTask(() -> {
            Thread.sleep(2000);
            return UUID.randomUUID().toString();
        });
        new Thread(futureTask).start();
        CompletableFuture<String> future = CompletableFuture.completedFuture(futureTask.get());
        String uuid = future.get();
        System.out.println(uuid);

    }
}
```

运行代码会发现整个过程会等待会然后打印错结果：

![completableFuture1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/completableFuture1.gif)

**Task完成后回调：**

```java
public class TestCompletable {

    public static void main(String[] args) throws Exception{

        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println(Thread.currentThread().getName());
                TimeUnit.SECONDS.sleep(3);
                System.out.println("");
                return UUID.randomUUID().toString();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return UUID.randomUUID().toString();
        });
        future.whenComplete((uuid,exception)->{
            System.out.println(uuid);
            System.out.println(Thread.currentThread().getName());
        });

        System.out.println(11111);
        System.in.read();
    }

}
```

运行一下看一下结果：

![completableFuture1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/completableFuture2.gif)

通过结果可以看出来当完成UUID生成后，又执行了whenComplete里面的回调方法。同时还可以通过 **`future.get()`** 获取到返回值。或者就用上面的代码不用get的方式。在回调函数中就能获取到。

**完成任意一个Task就开始执行回调函数：**

```
public class TestCompletable {

    public static void main(String[] args) throws Exception{

        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println(Thread.currentThread().getName());
                TimeUnit.SECONDS.sleep(3);
                return "开始生成UUID-"+UUID.randomUUID().toString();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return UUID.randomUUID().toString();
        });
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println(Thread.currentThread().getName());
                TimeUnit.SECONDS.sleep(4);

                return "开始生成UUID1-"+UUID.randomUUID().toString();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return UUID.randomUUID().toString();
        });

        CompletableFuture.anyOf(future,future1).whenComplete((uuid,ex)->{
            System.out.println(uuid);
        });

        System.out.println(11111);
        System.in.read();
    }

}
```

看一下执行结果：

![completableFuture1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/completableFuture3.gif)

上面使用了只是一部分`CompletableFuture`的特性。通过对Task进行编排可以做到很多的事情。

在DLedger中：

![image-20220730162811121](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220730162811121.png)

通过使用 **`CompletableFuture`** 异步化，处理请求都是通过CompletableFuture#whenCompleteAsync方法。感兴趣的可以去阅读一下源码进一步了解**`CompletableFuture`** 在实际项目中的使用。

### 3 CompletableFuture使用需要注意点

对于和多线程编程扯上关系，首先想到的就是当前的Task到底由那个Thread执行，使用的不好可能会有性能问题。首先根据`CompletableFuture`的方法命名可以了解到：

- xxxx()：表示该方法将继续在当前执行CompletableFuture的方法线程中执行
- xxxxAsync()：表示异步，在线程池中执行。

用例子来说明：

```java
public class TestCompletable {

    public static void main(String[] args) throws Exception{

        CompletableFuture future = new CompletableFuture();
        future.whenComplete((item,ex)->{
            System.out.println(item);
            System.out.println(Thread.currentThread().getName());
        });
        future.complete(1111);
        TimeUnit.SECONDS.sleep(2);
    }
}
```

运行结果：

![image-20220730201846935](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220730201846935.png)

```java
public class TestCompletable {

    public static void main(String[] args) throws Exception{

        CompletableFuture future = new CompletableFuture();
        future.whenCompleteAsync((item,ex)->{
            System.out.println(item);
            System.out.println(Thread.currentThread().getName());
        });
        future.whenCompleteAsync((item,ex)->{
            System.out.println(item);
            System.out.println(Thread.currentThread().getName());
        }, Executors.newFixedThreadPool(10, new ThreadFactory() {
            private AtomicInteger integer = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "Thread-"+integer.getAndIncrement());
            }
        }));
        future.complete(1111);
        TimeUnit.SECONDS.sleep(2);
    }
}
```

运行结果：

![image-20220730202220638](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220730202220638.png)

> Tips: 在没有指定线程池的情况下，使用的是CompletableFuture内部的线程池。

对于性能有考虑的需要注意同步和异步的使用。

### 4 总结

`CompletableFuture`可以指定异步处理流程：

- `thenAccept()`处理正常结果；
- `exceptional()`处理异常结果；
- `thenApplyAsync()`用于串行化另一个`CompletableFuture`
- `anyOf()`和`allOf()`用于并行化多个`CompletableFuture`

在`CompletableFuture`执行Task的时候，是需要使用线程池还是用当前的线程去执行。这个需要根据具体的情况来定。使用的时候要尽可能的小心。

> 我是蚂蚁背大象([GitHub](https://github.com/mxsm))，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

我正在参与掘金技术社区创作者签约计划招募活动，[点击链接报名投稿](https://juejin.cn/post/7112770927082864653)。
