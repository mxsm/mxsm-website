---
title: "揭秘为什么主线程结束了Java线程池还在运行"
linkTitle: "揭秘为什么主线程结束了Java线程池还在运行"
date: 2022-01-30
weight: 202201302256
---

### 1. 背景

很多人在使用使用线程池的过程中肯定会发现过当在某个线程中定义了一个线程池，主线程已经结束了但是线程池还在运行。这种在Web开发中可能不是那么能感知到但是在普通的Java程序中就很容易发现。下面给一个例子演示：

```java
public class Test {

    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        executorService.execute(() -> {
            for(;;){
                try {
                    System.out.println("王尼玛");
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        System.out.println("完成");
    }
}
```

一般人的理解：当main函数执行完成，整个程序也就结束了。

但是实际的情况并非如此，程序还在运行中。直接运行程序来验证所说：

![线程运行池验证](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E6%B1%A0%E9%AA%8C%E8%AF%81.gif)

通过在IDEA中运行程序可以看到，当 “完成” 打印了后，还有 “王尼玛” 在打印，同时可以看到IDEA右上角的Stop按钮不是灰色(说明程序正在运行)。那么什么会这样？下面我们通过研究Java 线程池的源码来解析这个现象。

### 2. 源码分析

> JDK版本信息：
>
> java version "11.0.12" 2021-07-20 LTS
> Java(TM) SE Runtime Environment 18.9 (build 11.0.12+8-LTS-237)
> Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.12+8-LTS-237, mixed mode)

创建线程池主要是创建 **`ThreadPoolExecutor`** 实例对象。通过分析其构造函数看看需要设置的参数：

```java
    public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue,
                              ThreadFactory threadFactory,
                              RejectedExecutionHandler handler) 
```

总结一下这些参数就是：

- 线程池的线程数设置，以及非核心线程的存活时间
- 线程池的工作队列
- 线程池的线程名称
- 拒绝策略

线程池对象创建完成后，我们往线程池中提交 **`Runnable`** ：



![线程池execute方法](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/%E7%BA%BF%E7%A8%8B%E6%B1%A0execute%E6%96%B9%E6%B3%95.png)

1. 工作的线程数量是否小于核心线程数量
2. 将线程包装成Worker然后运行Runable

在ThreadPoolExecutor#addWorker方法中有这样一段代码：

![ThreadPoolExecutoraddWork](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/ThreadPoolExecutoraddWork.png)

1. 将Runable转换为Worker
2. 启动Worker所属的线程

从上面可以看出来Worker就是关键。看一下Worker的源码：

```java
private final class Worker extends AbstractQueuedSynchronizer implements Runnable{
      //省略部分代码
    
        final Thread thread;
        /** Initial task to run.  Possibly null. */
        Runnable firstTask;
}
```

从定义可以知道实现了 **`AQS`** 以及 **`Runable`** 接口，其中有两个重要的属性：

- **thread:** 存放当前Worker绑定的线程
- **firstTask：** 存放Worker实例化时候的 **`Runable`** （当执行过一次后就为null了）

通过Worker构造函数:

![image-20220131001253113](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220131001253113.png)

发现通过获取 **`ThreadPoolExecutor#getThreadFactory`** 的 **`ThreadFactory`** 新建一个线程，同时将Worker作为一个Runable的实例对象和Thread进行绑定。

> Tips: 如上面ThreadPoolExecutor#addWorker代码图，标号2当Worker绑定的线程对象启动就会执行 Worker的run方法。

当线程启动就会执行 **`Worker#run`** 方法：

```java
//Worker#run
public void run() {
   runWorker(this);
}
```

里面最终调用的是 **ThreadPoolExecutor#runWorker** 方法：

![runWork解析](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/runWork%E8%A7%A3%E6%9E%90.png)

1. 判断task是否为空，如果是Worker第一次执行，那么task不会为空

2. 在task为空的情况下，会从workQueue队列中获取

   workQueue队列是在ThreadPoolExecutor实例化的时候构造函数设置，是一个阻塞队列。

3. 执行task,因为task是一个Runable对象，所以直接调用task.run执行。

4. 执行完成了将task设置为null

**分析了这么多，接下来就是今天问题的关键：Java线程池为什么主线程结束了线程池还在运行？**

在 **ThreadPoolExecutor#runWorker** 方法中有一个while循环，这个while循环的条件是：

```java
while (task != null || (task = getTask()) != null)
```

这个条件有点意思，有意思在哪？

- 第一次执行的时候，task不为空是肯定的，不会去执行后面的判断
- 第二次执行的时候，task肯定为空(因为finally里面设置了task=null),那么就会去从workQueue阻塞队列中获取task，如果没有那么当前执行的worker就会阻塞等待task。获取到了后就会接着进入while循环执行。

**上面这个while循环说白了在正常的情况下永远都是True,所以这个Worker的线程会一直不停的执行下去。**

### 3. 总结

**将线程绑定到Worker上，然后巧妙的利用阻塞队列构建一个总是为true While循环条件，让Worker的线程一直在循环执行阻塞队列中的Task。这也是线程池为什么在主线程结束后线程池还在运行的奥秘。通俗的讲：就是这个执行任务的核心线程进入了死循环，只不过这个死循环是人为构造出来的。**
