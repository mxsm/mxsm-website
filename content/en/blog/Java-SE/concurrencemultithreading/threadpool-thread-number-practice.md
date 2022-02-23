---
title: "线程池的数量和线程池中线程数量如何设置-实践篇"
linkTitle: "线程池的数量和线程池中线程数量如何设置-实践篇"
date: 2022-02-20
weight: 202202202214
---

「这是我参与2022首次更文挑战的第35天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

### 1.引言

在之前的文章讲了一些线程池数量和线程池中线程数量如何设置的一些理论知识（[线程池的数量和线程池中线程数量如何设置-理论篇](https://juejin.cn/post/7066675779966337031)），同时也介绍了一些关于Linux的负载以及操作系统中上下文切换的一些知识(大家可以深入去了解一下，我这边只是做了一些简单说明)。本篇要讲的是根据之前的一些理论实际来验证和设置。根据不同的线程池数量：

- 单线程池
- 多线程池(分析线程池数量为2的)

分析在计算密集型和I/O密集型对线程数量和线程池的数量的选择。

### 2. 监控工具说明

- vmstat

  ```sh
  vmstat -tw 3
  ```

  用来查看系统的上下文切换以及CPU的用户进程使用率

- pidstat

  pidstat命令监控单个线程的上下文切换，如果命令没有需要安装

  ```shell
  dnf install sysstat
  ```

  用如下命令来监控

  ```shell
  pidstat -t -w -p <pid> -T ALL
  ```
  
- top

  查看CPU的使用率

> Tips: 命令vmstat和pidstat的使用大家可以去网上搜索相关使用方式，这里不做重点的介绍

测试所用CPU信息：

![image-20220221224907788](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220221224907788.png)

### 3. 计算密集类型

下面通过代码来演示单线程池和多线程池对计算密集型的应用应该如何设置

#### 3.1 单个线程池

```java
public class Test {
          private static long MAX = Integer.MAX_VALUE / 50L;
    public static void main(String[] args) throws Exception {
        long sum = 0;
        int nThreads = Integer.parseInt(args[0]);
        int times = Integer.parseInt(args[1]);
        ExecutorService service = Executors.newFixedThreadPool(nThreads, new ThreadFactory() {
            private AtomicLong num = new AtomicLong(1);

            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, "thread-mxsm-" + num.getAndIncrement());
                thread.setDaemon(false);
                return thread;
            }
        });
        for (int i = 0; i < times; ++i) {
            sum += extracted(nThreads,service);
        }
        System.out.println("线程数量："+nThreads+"  "+times+"次执行的平均时间："+(sum / times)+"ms");
        service.shutdown();
    }

    private static long extracted(int nThreads,ExecutorService service) throws InterruptedException {
        AtomicLong start = new AtomicLong(0);

        CountDownLatch countDownLatch = new CountDownLatch(1);
        CyclicBarrier barrier = new CyclicBarrier(nThreads);

        for (int i = 0; i < nThreads; ++i) {
            service.submit(new Runnable() {
                private volatile long current = 0;
                @Override
                public void run() {
                    try {
                        barrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                    do {
                        for (int i = 0; i < 200000; ++i) {
                        }
                        current = start.incrementAndGet();
                    } while (current < MAX);
                    countDownLatch.countDown();
                }
            });
        }
        long current = System.currentTimeMillis();
        countDownLatch.await();
        long time = System.currentTimeMillis() - current;
        return time;
    }

}
```

运行代码。

```shell
java com.github.mxsm.grpc.login.Test 参数1 参数2
```

说明：

- 参数1：线程数量
- 参数2： 执行次数

运行结果：

![image-20220221230214963](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220221230214963.png)

现象结论：对于计算密集型，单个线程执行的效率超过其他的方式，其他的方式时间相差也不到

#### 3.2 多线程池(2个)

```java
public class Test {

        private static long MAX = Integer.MAX_VALUE / 50L;

    public static void main(String[] args) throws Exception {
        long sum = 0;
        int nThreads = Integer.parseInt(args[0]);
        int times = Integer.parseInt(args[1]);
        ExecutorService service = Executors.newFixedThreadPool(nThreads, new ThreadFactory() {
            private AtomicLong num = new AtomicLong(1);

            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, "thread-mxsm1-" + num.getAndIncrement());
                thread.setDaemon(false);
                return thread;
            }
        });
        ExecutorService service1 = Executors.newFixedThreadPool(nThreads, new ThreadFactory() {
            private AtomicLong num = new AtomicLong(1);

            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, "thread-mxsm2-" + num.getAndIncrement());
                thread.setDaemon(false);
                return thread;
            }
        });
        for (int i = 0; i < times; ++i) {
            sum += extracted(nThreads,service,service1);
        }
        System.out.println("总的线程数量："+(nThreads*2)+"  "+times+"次执行的平均时间："+(sum / times)+"ms");
        service.shutdown();
        service1.shutdown();
    }

    private static long extracted(int nThreads,ExecutorService service,ExecutorService service1) throws InterruptedException {
        AtomicLong start = new AtomicLong(0);

        CountDownLatch countDownLatch = new CountDownLatch(1);
        CyclicBarrier barrier = new CyclicBarrier(nThreads*2);


        for (int i = 0; i < nThreads; ++i) {
            service.submit(new Runnable() {
                private volatile long current = 0;

                @Override
                public void run() {
                    try {
                        barrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                    do {
                        for (int i = 0; i < 200000; ++i) {
                        }
                        current = start.incrementAndGet();
                    } while (current < MAX);
                    countDownLatch.countDown();
                }
            });
            service1.submit(new Runnable() {
                private volatile long current = 0;

                @Override
                public void run() {
                    try {
                        barrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                    do {
                        for (int i = 0; i < 200000; ++i) {
                        }
                        current = start.incrementAndGet();
                    } while (current < MAX);
                    countDownLatch.countDown();
                }
            });
        }
        long current = System.currentTimeMillis();
        countDownLatch.await();
        long time = System.currentTimeMillis() - current;
        return time;
    }
}
```

运行代码结果如下图：

![image-20220221230722460](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220221230722460.png)

现象结论：对于计算密集型，单线程池和多线程池基本上一样，而线程池的数量不同，线程池的线程数量不同时间差不多。

------

**结论：对于计算密集型的类型，数据的计算主要是在内存，线程除了被动的上下文切换几乎没有主动上下文切换，所以减少上下文的切换是提高执行效率的关键。**

> Tips: 在Netty的BossGroup EventLoopGroup的线程数量一般设置为1，这里主要是因为属于计算密集类型的工作。

### 4. IO密集型

IO密集型通过使用如下代码替换

```java
try {
        TimeUnit.MICROSECONDS.sleep(1);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
//替换
for (int i = 0; i < 200000; ++i) {
}    



private static long MAX = Integer.MAX_VALUE / 6L;
//替换成
private static long MAX = 5000;
```

单线程池代码和多线程池代码都替换

#### 4.1 单线程池

运行替换后的代码

```shell
java com.github.mxsm.threadnum.Test xx xxx
#例子
java com.github.mxsm.threadnum.Test 1 10
```

运行代码结果如下图：

![image-20220221231303415](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220221231303415.png)

现象结论： 对于IO密集型，随着线程池中线程数量增加时间会下降，当到达某个最大值后线程池线程数量增加可能导致耗时增加。大量的线程上下文切换导致耗时严重。

#### 4.2 多线程池(2个)

运行代码。结果如下图所示：

![image-20220221231723237](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220221231723237.png)

现象结论： 对于IO密集型，单线程池和多线程池效果一样。

------

**结论：对于IO密集型，一定范围内随着线程数量的增加耗时会呈现明显的下降，但是当线程数量过多的时候，这个时候线程上下文切换会增加，导致整体的时间增加。**

> Tips: 这里为了节约时间就没有吧值设置的很大所以没有通过命令去查看上下文的切换。大家可以执行通过命令查看

### 5. 结论

- 对于完成一件事情，线程池数量的多少不影响，但是如果是完成不同的事情，需要不同的线程池进行线程池隔离。同时在一个项目中多个不同类型的线程池之间在上下文切换的时候会有影响。例如：计算密集型和IO密集型的两个线程池混合
- 计算密集型如果是完成一件事情，线程为越少越好。可以减少上下文切换的时间。
- I/O密集在线程池线程的数量在一定范围内越多越好，处理完成一件事情耗时也越少。但是增加到一定程度后会增加上下文的切换耗时反而导致时间增加。
- 线程数量的到底设置多少。没有一个绝对的什么公式。需要进行压力测试以及不断的调整



> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
