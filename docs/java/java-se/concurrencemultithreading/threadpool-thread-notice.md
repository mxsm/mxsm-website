---
title: "线程池的线程的类型你是否了解？"
linkTitle: "线程池的线程的类型你是否了解？"
date: 2022-02-09
weight: 202202090953
---

### 1.背景

线程池很多人都会用，线程的创建细节你是否了解过过。我在之前的文章中也见过一些和线程池相关的内容：《[Callable与Runnable的区别你知道吗？](https://juejin.cn/post/7061975326393368583)》、《[线程池异常如何处理你都了解吗？](https://juejin.cn/post/7059997315209101349)》以及《[揭秘为什么主线程结束了Java线程池还在运行](https://juejin.cn/post/7059042741509947405)》，如果有兴趣可以看一下。下面要讲的也是和线程有关。首先我们通过下面的代码中的现象来看一下这几种情况

### 2. 现象代码演示

下面演示的代码有单个线程的也有线程池的。

#### 2.1 现象1

示例代码1：

```java
public class Phenomena1 {

    public static void main(String[] args) {
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {

                try {
                    System.out.println("Thread start");
                    TimeUnit.SECONDS.sleep(5);
                    System.out.println("Thread end");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "mxsm");
        t.start();
        System.out.println("主线程结束");
    }
}
```

运行结果：

![线程运行现象1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E7%8E%B0%E8%B1%A11.gif)

示例代码2:

```java
public class Phenomena1 {

    public static void main(String[] args) {
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {

                try {
                    System.out.println("Thread start");
                    TimeUnit.SECONDS.sleep(5);
                    System.out.println("Thread end");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "mxsm");
        t.setDaemon(true);
        t.start();
        System.out.println("主线程结束");
    }
}
```

运行结果：

![线程运行现象2](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E7%8E%B0%E8%B1%A12.gif)

> Tips: 示例代码2增加 **t.setDaemon(true);** 这段代码

**运行结果总结：**

- 示例代码1主线程结束后，JVM等待mxsm线程执行完成才退出。
- 示例代码2主线程结束后，JVM没等mxsm线程执行完成就退出了，mxsm也没执行到 **`System.out.println("Thread end");`** 代码段。

#### 2.2 现象2

示例代码1：

```java
public class Phenomena1 {

    public static void main(String[] args) {
        ExecutorService executorService = Executors.newSingleThreadExecutor();
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("Runnable start");
                    TimeUnit.SECONDS.sleep(10);
                    System.out.println("Runnable end");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        System.out.println("主线程结束");
    }
}
```

运行结果：

![线程运行现象3](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E7%8E%B0%E8%B1%A13.gif)

示例代码2：

```java
public class Phenomena1 {

    public static void main(String[] args) {
        ExecutorService executorService = Executors.newSingleThreadExecutor(new ThreadFactory() {
            private AtomicInteger num = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "mxsm-"+num.getAndIncrement());
            }
        });
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("Runnable start");
                    TimeUnit.SECONDS.sleep(10);
                    System.out.println("Runnable end");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        System.out.println("主线程结束");
    }
}
```

运行结果：

![线程运行现象4](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E7%8E%B0%E8%B1%A14.gif)

示例代码3：

```java
public class Phenomena1 {

    public static void main(String[] args) {
        ExecutorService executorService = Executors.newSingleThreadExecutor(new ThreadFactory() {
            private AtomicInteger num = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "mxsm-"+num.getAndIncrement());
                t.setDaemon(true);
                return t;
            }
        });
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("Runnable start");
                    TimeUnit.SECONDS.sleep(10);
                    System.out.println("Runnable end");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        System.out.println("主线程结束");
    }
}
```

运行结果：

![线程运行现象5](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E7%8E%B0%E8%B1%A15.gif)

**运行结果总结：**

- 示例代码1都是用的Java默认的创建，提交的任务都正常执行，JVM线程也一直在等待(线程池一直在运行过程)
- 示例代码2，只是增加 **`ThreadFactory`** 实现，这样好处就是能自由定义线程名称也更加方便出现问题排查问题，提交的任务都正常执行，JVM线程也一直在等待(线程池一直在运行过程)
- 示例代码2，增加增加 **`ThreadFactory`** 实现，同时相比示例2增加了  **t.setDaemon(true);** 这段代码。出现了提交的线程没有执行完成，线程池也在没有shutdown的情况下直接退出，JVM线程也结束的情况

通过上面的两个现象五个示例都发现一个共同点：

>  Thread.setDaemon(true) 不管是线程池还是单个线程都执行了这个方法。

这个也就是我们下面要讲的Java中线程的分类。

### 3. 线程的分类

![线程分类](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E5%88%86%E7%B1%BB.png)

**Java线程可以分类两类**

- **用户线程**

  JVM 会在终止之前等待任何用户线程完成其任务

- **Daemon线程(精灵线程/守护线程)**

  其唯一作用是为用户线程提供服务

**JVM虚拟机的特点：**

- 不是在强行被中断或者JVM发生问题宕机情况下必须保证用户线程执行完毕
- JVM不需要保证守护线程执行完成，才能JVM虚拟机才能退出

通过上面的代码演示的情况也可以看出来用户线程和虚拟线程的区别所在。用户线程我们平时用的很多具体的使用场景，我们看一下守护线程能做什么。

#### 3.1 守护线程能用来做什么

根据守护线程的特性，主要用户后台支持任务，例如垃圾回收、释放未使用的对象内存、删除缓存中的过期数据等等。但是由于其JVM退出并不会等待守护线程执行完成再退出所以守护线程中尽量不要去打开一些文件资源，这些资源很多时候需要关闭。

```java
public class Application {

    public static void main(String[] args) {
        Thread a = new Thread(new Runnable() {
            @Override
            public void run() {
               for(;;){
                   try {
                       TimeUnit.SECONDS.sleep(10);
                   } catch (InterruptedException e) {
                       e.printStackTrace();
                   }
               }
            }
        },"mxsm-d");
        a.setDaemon(true);
        a.start();
        Thread b = new Thread(new Runnable() {
            @Override
            public void run() {
                for(;;){
                    try {
                        TimeUnit.SECONDS.sleep(10);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        },"mxsm-u");

        b.start();
        System.out.println(222);
    }
}
```

运行代码，用命令：

> jps   -- 获取PID
>
> jstack -l pid 获取线程的信息

GC线程并不是守护线程

#### 3.2  守护线程如何创建

代码：

```java
Thread t = new Thread(() -> {});
t.setDaemon(true);
```

### 4. 线程池的线程如何创建

线程池中的线程创建分为两种情况：

- 使用的Executors默认的ThreadFactory实现创建
- 使用自定义的ThreadFactory实现创建

#### 4.1 Executors默认的ThreadFactory实现创建

Java ThreadFactory的默认实现如下图:

![image-20220209221452300](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220209221452300.png)

重要的一步就是判断了线程是否为守护线程，如果是守护线程设置为 **t.setDaemon(false);** 将线程设置为用户线程。

#### 4.2 自定义ThreadFactory实现创建

自定义的和Java默认的应该关键的步骤要一相同， 那就是创建的线程必须是用户线程：

```java
new ThreadFactory() {
            private AtomicInteger num = new AtomicInteger();
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "mxsm-"+num.getAndIncrement());
                t.setDaemon(false);
                return t;
            }
        }
```



> Tips:  用户线程中创建的线程在不设置的情况下就是用户线程，守护线程中创建的线程就是守护线程，所有上面的示例代码中ThreadFactory实现并没有设置 t.setDaemon(false)，同样线程池也能正常运行的情况。

### 5. 总结

- 线程池在使用自定义创建线程的情况下最好加上  **t.setDaemon(false);**  这段代码，你不知道你的创建线程池的线程是不是守护线程，如果是守护线程恭喜你喜提bug,运行过程也可能安然无恙。
- 单个线程对于守护线程的使用也需要考虑其特性，斟酌功能是不是适合使用守护线程来实现，比如你在守护线程池中操作文件，和一些如果JVM结束需要执行一些后续的工作等等。



> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！