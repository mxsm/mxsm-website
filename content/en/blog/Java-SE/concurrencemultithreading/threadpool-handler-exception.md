---
title: "线程池异常你都了解如何处理吗？"
linkTitle: "线程池异常你都了解如何处理吗？"
date: 2022-02-01
weight: 202202012147
---

「这是我参与2022首次更文挑战的第16天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

大家在开发的过程中是否发现，我们使用线程池的时候很少去处理运行过程中出现的错误，不处理错误这样没关系吗？不处理会不会导致线程池结束？如果需要处理错误我们应该如何进行处理呢？那么今天从以下几个方面来看一下

![线程池异常](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E5%BC%82%E5%B8%B8.png)

### 1.线程池异常

通过代码来演示三种异常线程池的情况。

#### 1.1Runable执行异常(业务异常)

测试代码：

```java
public class ThreadPoolExceptionTest {

    public static void main(String[] args) {

        ExecutorService executorService = Executors.newFixedThreadPool(2, new ThreadFactory() {
            AtomicInteger integer = new AtomicInteger(1);
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "mxsm-"+integer.getAndIncrement());
            }
        });
        executorService.execute(() -> {
            System.out.println(1);
            int i = 1/0;
            System.out.println(i);
        });
        executorService.execute(() -> {
            for (;;){
                try {
                    TimeUnit.SECONDS.sleep(1);
                    System.out.println(Thread.currentThread().getName()+" 当前时间："+System.currentTimeMillis());
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        System.out.println("主线程执行完成");
    }
}
```

运行程序观察测试结果：

![线程运行池Runable错误验证](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E6%B1%A0Runable%E9%94%99%E8%AF%AF%E9%AA%8C%E8%AF%81.gif)

**结论：线程池正常运行，Runable的异常不会导致线程池停止运行，其他的线程正常运行**

> Tips: 执行Runable发生错误的线程将会被销毁会重新建一个线程，以保证固定线程池2的数量

#### 1.2 提交任务到任务队列已满异常

测试代码：

```java
public class ThreadPoolExceptionTest {

    public static void main(String[] args) {

        ExecutorService executorService = new ThreadPoolExecutor(1, 1, 100, TimeUnit.SECONDS,new ArrayBlockingQueue<>(1),new ThreadFactory(){
            AtomicInteger integer = new AtomicInteger(1);
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "mxsm-"+integer.getAndIncrement());
            }
        });
        for(int i = 0; i < 3; ++i){
            final int b = i;
            executorService.execute(() -> {
                for (;;){
                    try {
                        TimeUnit.SECONDS.sleep(1);
                        System.out.println(Thread.currentThread().getName()+ b +" 当前时间："+System.currentTimeMillis());
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            });
        }
        System.out.println("主线程结束");
    }
}
```

运行程序观察测试结果：

![线程运行池队列满了错误验证](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E6%B1%A0%E9%98%9F%E5%88%97%E6%BB%A1%E4%BA%86%E9%94%99%E8%AF%AF%E9%AA%8C%E8%AF%81.gif)

**结论：线程池使用默认的拒绝策略的时候，当线程池提交任务到任务队列已满线程池会直接抛出错误，进而影响到主线程的后续的运行如果没有在主线程中进行错误处理(没有打印主线程结束)**

> Tips: 提交任务到任务队列已满异常影响的范围和方式由拒绝策略决定

#### 1.3 线程池本身异常

这里说的线程池本身异常包括但不仅限于在设置线程池大小的时候，可能不停的新建线程导致线程消耗完成了服务器的所有资源

测试代码：

```java
/**
 * @author mxsm
 * @date 2022/2/1 22:49
 * @Since 1.0.0
 *
 * 设置内存大小
 * -Xmx2m
 * -Xms2m
 *
 */
public class ThreadPoolExceptionTest {


    public static void main(String[] args) {

        ExecutorService executorService = Executors.newCachedThreadPool();
        final AtomicInteger integer = new AtomicInteger();
        for(int i = 0;i <= 100000; ++i){
            final  int b = i;
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    try {
                        System.out.println(integer.getAndIncrement());
                        TimeUnit.SECONDS.sleep(b);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            });
        }
        System.out.println("主线程结束");
    }
}
```

运行程序观察测试结果：

![线程池本身导致的某些异常](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E6%9C%AC%E8%BA%AB%E5%AF%BC%E8%87%B4%E7%9A%84%E6%9F%90%E4%BA%9B%E5%BC%82%E5%B8%B8.gif)

**结论：线程池导致某些异常会导致线程池直接退出可能同时导致住线程或者主应用发生问题或者退出。**

> Tips: 这里演示的众多问题中的一个

### 2. 异常如何处理

线程池执行任务主要是通过 **ThreadPoolExecutor#runWork** 执行的：

![image-20220201234314506](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220201234314506.png)

1. 如果任务Runnable执行错误线程池就会往外抛错误退出while循环
2. 处理Worker退出逻辑

![image-20220201234741869](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220201234741869.png)

1. 从workers集合中删除执行报错的Worker.

> Tips: 如果你不停的执行Runnable错误的话，线程池的线程标号会越来越大，也就是这里这个原因。

最终执行当前Runnable线程结束。并不会影响线程池和其他线程。

#### 2.1 Runable执行异常(业务异常)处理方式

由于Runable执行异常并不会影响到整个系统的运行，不会因为在线程池中执行任务报错导致真系统错误退出。所以线程池执行任务的异常处理方式通常有两种：

- **直接不处理(也可以打印日志)**
- **捕获异常不让异常往外抛**

#### 2.2 提交任务到任务队列已满异常处理

这个异常取决于使用的何种拒绝策略。Java内置的拒绝策略有四种：

- **CallerRunsPolicy：在任务被拒绝添加后，会调用当前线程池的所在的线程去执行被拒绝的任务**
- **AbortPolicy：直接抛出异常**
- **DiscardPolicy：会让被线程池拒绝的任务直接抛弃，不会抛异常也不会执行。**
- **DiscardOldestPolicy：当任务呗拒绝添加时，会抛弃任务队列中最旧的任务也就是最先加入队列的，再把这个新任务添加进去。**
- **自定义策略，只要实现RejectedExecutionHandler接口**

对于提交任务到任务队列已满异常，如果不进行catch不影响整个整个系统的运行可以不进行处理，如果可能会导致系统中断。就需要对错误进行处理。

#### 2.3 线程池本身导致的异常

线程池本身导致的异常可能会导致程序的中断，如果程序必须依靠线程池才能完成对应功能，当线程池本身导致异常如上面演示的。那么是否处理异常都无关紧要。整个程序直接崩溃！但是线程池只是一个备选方案，可以将可能的异常进行捕获处理。(但是不能完全杜绝让程序崩溃的问题)

### 3. 从异常看如何使用线程池

1. **线程池一定要设置最大线程数，防止不停的创建线程池消耗掉服务器所有的资源**
2. **线程池的阻塞队列尽量不要设置为无界队列，原因：同样不停的添加任务可能把服务器的资源消耗完成**
3. **对于可预见的异常尽量进行捕获处理**

