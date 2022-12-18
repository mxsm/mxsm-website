持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第10天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

在使用线程池开发的过程中大家有没有想过这样的一个问题：为什么我们需要定义这么多线程池去执行不同类型的任务？用一个适当大小的线程池去执行所有的类型的任务不可以吗。就这个几个问题来聊一聊线程池应该是用一个还是用多个去执行不同类型的任务。

## 1. 大线程池与多线程池

开发过程中的任务大致分为两大类：

- IO密集型任务，此类任务特点就是需要经常暂停任务进行其他的IO操作，如文件读写、网络数据请求等
- 计算密集型任务，此类任务的特点就是大多数操作都是在内存中进行

下面通过模拟这两种情况来看一下结果，首先看一下在大线程池和多线程池执行IO密集型任务所消耗的时间：

```java
package org.example.objectsize;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.commons.io.FileUtils;

public class IOTest {

    public static void main(String[] args) throws Exception{
        extracted();
        main1(args);
    }

    private static void extracted() throws InterruptedException {
        final AtomicInteger integer = new AtomicInteger();
        final  File file = new File("C:\\Users\\mxsm\\Desktop\\RocketMQ5\\aaa.txt");
        ExecutorService executorService = Executors.newFixedThreadPool(50);
        CountDownLatch latch =  new CountDownLatch(50);
        long l = System.currentTimeMillis();
        for(int i = 0; i < 50; ++i){
            executorService.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        try {
                            FileUtils.write(file, integer.get()+"", StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }while (integer.getAndIncrement() < 100000);
                    latch.countDown();
                }
            });
        }
        latch.await();
        System.out.println("大线程池："+(System.currentTimeMillis()-l));
        executorService.shutdown();
    }
    public static void main1(String[] args) throws Exception{
        final AtomicInteger integer = new AtomicInteger();
        final  File file = new File("C:\\Users\\mxsm\\Desktop\\RocketMQ5\\aaa.txt");
        ExecutorService executorService1 = Executors.newFixedThreadPool(10);
        ExecutorService executorService2 = Executors.newFixedThreadPool(10);
        ExecutorService executorService3 = Executors.newFixedThreadPool(10);
        ExecutorService executorService4 = Executors.newFixedThreadPool(10);
        ExecutorService executorService5 = Executors.newFixedThreadPool(10);
        CountDownLatch latch =  new CountDownLatch(50);
        long l = System.currentTimeMillis();
        for(int i = 0; i < 10; ++i){
            executorService1.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        try {
                            FileUtils.write(file, integer.get()+"", StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }while (integer.getAndIncrement() < 100000);
                    latch.countDown();
                }
            });
            executorService2.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        try {
                            FileUtils.write(file, integer.get()+"", StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }while (integer.getAndIncrement() < 100000);
                    latch.countDown();
                }
            });
            executorService3.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        try {
                            FileUtils.write(file, integer.get()+"", StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }while (integer.getAndIncrement() < 100000);
                    latch.countDown();
                }
            });
            executorService4.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        try {
                            FileUtils.write(file, integer.get()+"", StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }while (integer.getAndIncrement() < 100000);
                    latch.countDown();
                }
            });
            executorService5.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        try {
                            FileUtils.write(file, integer.get()+"", StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }while (integer.getAndIncrement() < 100000);
                    latch.countDown();
                }
            });
        }
        latch.await();
        System.out.println("多线程池："+(System.currentTimeMillis()-l));
        executorService1.shutdown();
        executorService2.shutdown();
        executorService3.shutdown();
        executorService4.shutdown();
        executorService5.shutdown();
    }
}
```

然后运行查看：

![image-20221024202744968](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221024202744968.png)

运行的时间差不多。

然后看一下计算密集型：

```java
package org.example.objectsize;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;

public class IOTest {

    public static void main(String[] args) throws Exception{
        extracted();
        main1(args);
    }

    private static void extracted() throws InterruptedException {
        final AtomicLong integer = new AtomicLong();
        ExecutorService executorService = Executors.newFixedThreadPool(50);
        CountDownLatch latch =  new CountDownLatch(50);
        long l = System.currentTimeMillis();
        for(int i = 0; i < 50; ++i){
            executorService.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                    }while (integer.getAndIncrement() < 10000000L);
                    latch.countDown();
                }
            });
        }
        latch.await();
        System.out.println("大线程池："+(System.currentTimeMillis()-l));
        executorService.shutdown();
    }
    public static void main1(String[] args) throws Exception{
        final AtomicLong integer = new AtomicLong();
        ExecutorService executorService1 = Executors.newFixedThreadPool(10);
        ExecutorService executorService2 = Executors.newFixedThreadPool(10);
        ExecutorService executorService3 = Executors.newFixedThreadPool(10);
        ExecutorService executorService4 = Executors.newFixedThreadPool(10);
        ExecutorService executorService5 = Executors.newFixedThreadPool(10);
        CountDownLatch latch =  new CountDownLatch(50);
        long l = System.currentTimeMillis();
        for(int i = 0; i < 10; ++i){
            executorService1.execute(new Runnable() {
                @Override
                public void run() {
                    do{

                    }while (integer.getAndIncrement() < 10000000L);
                    latch.countDown();
                }
            });
            executorService2.execute(new Runnable() {
                @Override
                public void run() {
                    do{

                    }while (integer.getAndIncrement() < 10000000L);
                    latch.countDown();
                }
            });
            executorService3.execute(new Runnable() {
                @Override
                public void run() {
                    do{

                    }while (integer.getAndIncrement() < 10000000L);
                    latch.countDown();
                }
            });
            executorService4.execute(new Runnable() {
                @Override
                public void run() {
                    do{

                    }while (integer.getAndIncrement() < 10000000L);
                    latch.countDown();
                }
            });
            executorService5.execute(new Runnable() {
                @Override
                public void run() {
                    do{
                        
                    }while (integer.getAndIncrement() < 10000000L);
                    latch.countDown();
                }
            });
        }
        latch.await();
        System.out.println("多线程池："+(System.currentTimeMillis()-l));
        executorService1.shutdown();
        executorService2.shutdown();
        executorService3.shutdown();
        executorService4.shutdown();
        executorService5.shutdown();
    }
}

```

运行结果：

![image-20221024203234577](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221024203234577.png)

从中会发现两者之间的结果相差不多。

**从上面两个例子可以知道，多线程和大线程池两者其实都差不多**



## 2. 大线程池和多线程池选择原则

从大多数开源的项目来看，每一类任务使用一个线程池也就是：每一类任务使用独立的线程池，不与其他的任务共享线程池。原因分析：

- 独立线程池不影响不同任务类型的任务作业，有利于保证任务的独立性和完整性
- 共用一个线程池可能会出现如下的问题：
  - 不同的任务执行的时间长短不同，所以占用线程的时间也不相同。当一类线程执行时间较长但是他可能执行的频率并不高这种情况下可能会导致其他的任务会一直在队列中等待排队获取执行机会。这种情况下会影响到其他任务的正常执行。
  - 线程池的线程数量不好确定，不同类的任务使用同一个。导致时间的估算比单个任务复杂了很多很多，线程数量设置太少优惠导致线程池的资源不够用，设置太多会导致线程的切换耗费大量的时间。对于IO密集型来说可能还能额接受但是对于计算密集型来说就不是那么友好。
  - 由于不同的任务类型执行的时间不同导致线程池的资源分配不均，有的任务可能抢占不到资源一直在等待队列中等待。当等待队列中任务越来越多可能消耗掉JVM的内存导致应用宕机
  - 从错误的最终和排查的角度来说，多线程池更加有助于最终问题



## 3. 总结

每一个线程池最好做单一任务，尽可能的减少多任务类型混合使用一个线程池。特别是如果某一类任务延迟一定时间会导致问题的情况下，例如通过心跳维持某种状态当延迟执行后服务端可能就任务当前连接失效从而进行剔除。但是线程池的使用也是需要结合实际情况，用合适的方式来实现功能才是最好的。

> 我是蚂蚁背大象(GitHub:mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!