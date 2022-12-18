---
title: "为什么不建议使用Executors创建线程池？"
linkTitle: "为什么不建议使用Executors创建线程池？"
date: 2022-02-13
weight: 202202131027
---

### 1.引言

为什么开发过程中都不建议使用 **`Executors`** 创建线程池，不建议使用 **`Executors`** 创建为什么Java还提供这样一个创建类。开发过程中完全不能用 **`Executors`** 创建线程池吗，带着这几个问题我们从源码以及开发过程来说明一下几个问题：

![Executors](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/Executors.png)

### 2. Java提供Executors的猜想

Executors在Java中其实就是一个充当一个工具类，对 **Executor, ExecutorService, ScheduledExecutorService, ThreadFactory** 提供语义化的服务。让使用者能够更好的使用在不同的业务中使用的不同的线程池。提供一个统一化的线程池工厂来创建。例如：

- 创建一个固定大小的线程就可以使用

  ```java
  Executors.newFixedThreadPool(int nThreads)
  ```

  在创建的时候这个就很明确，一看就是创建一个固定大小的线程池，那么线程数量多少就是传入的参数nThreads

- 创建一个单线程的线程池

  ```java
  Executors.newSingleThreadExecutor()
  ```

  这样创建完成连参数都省略了

所以 Java提供Executors为了创建各类线程池提供方便，符合语义。既然是这样那么为什么又不建议使用呢？这不是自相矛盾吗

### 3. 为什么不建议使用Executors创建线程池

为什么不建议使用Executors创建线程池我们从源码以及示例来分析。我们以创建固定线程池为例(其他的可以触类旁通都差不多)，Executors创建固定线程池方法如下图：

![image-20220213111611033](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220213111611033.png)

1. 设置固定线程池大小

   ```java
   public static ExecutorService newFixedThreadPool(int nThreads) {
       return new ThreadPoolExecutor(nThreads, nThreads,
                                     0L, TimeUnit.MILLISECONDS,
                                     new LinkedBlockingQueue<Runnable>());
   }
   ```

2. 设置线程池大小和自定义实现ThreadFactory

   ```java
   public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) {
       return new ThreadPoolExecutor(nThreads, nThreads,
                                     0L, TimeUnit.MILLISECONDS,
                                     new LinkedBlockingQueue<Runnable>(),
                                     threadFactory);
   }
   ```

通过代码可以发现两者的区别在于是否自定义实现ThreadFactory。里面都是创建ThreadPoolExecutor。

#### 3.1 Executors与直接创建ThreadPoolExecutor优劣

方式1和方式2创建线程池相比直接使用ThreadPoolExecutor创建的优势在于：**简单，语义明确**。

但是方式1创建线程池存在用户自身无法控制线程池名称以及队列的长度，队列使用的是无界队列，方式2虽然可以自定义线程池名称但是相比线程池名称更加应该关注的是队列，和方式1一样都是使用的无界队列。所以方式1和方式2劣势相比比直接使用ThreadPoolExecutor创建线程池的劣势在于：**无法控制队列的长度这个也是不推荐使用Executors主要原因** 。

> Tips:通过LinkedBlockingQueue的源码发现，允许的请求队列长度为 Integer.MAX_VALUE

用代码来演示一下如果不停的创建可能会发生的问题：

```java
/**
 * @author mxsm
 * @date 2022/2/9 22:01
 * @Since 1.0.0
 *
 * -Xms5m
 * -Xmx5m
 */
public class Phenomena1 {
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(1);
        for(;;){
            executorService.submit(new Work());
            System.out.println(System.currentTimeMillis());
        }
    }

    static class Work implements Runnable{

        private StringBuilder builder = new StringBuilder();

        public Work() {
            for(int i = 0; i < 10000000; ++i){
                builder.append(i);
            }
            System.out.println(builder.toString().getBytes(StandardCharsets.UTF_8).length/1024);
        }
        @Override
        public void run() {
            try {
                System.out.println(System.currentTimeMillis());
                TimeUnit.MINUTES.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

运行结果：

![线程池运行oom演示](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E8%BF%90%E8%A1%8Coom%E6%BC%94%E7%A4%BA.gif)

> Tips:将内存调小

****

**在以LinkedBlockingQueue作为队列情况下，会导致大量的请求堆积最终可能导致OOM**

#### 3.2 线程执行问题回溯

在线程池执行发生错误的时候，这个时候就需要根据错误堆栈进行追踪，如果你创建线程如下：

```java
public class Phenomena1 {
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(1);
        ExecutorService executorService1 = Executors.newFixedThreadPool(2);
        executorService.submit(new Runnable() {
            @Override
            public void run() {

            }
        });
        executorService1.submit(new Runnable() {
            @Override
            public void run() {

            }
        });
    }
}
```

运行程序然后用java命令查看线程池：

```shell
jsp
jstack -l <pid>
```

![线程池不设置线程名称](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E4%B8%8D%E8%AE%BE%E7%BD%AE%E7%BA%BF%E7%A8%8B%E5%90%8D%E7%A7%B0.gif)

看一下线程的情况

![image-20220213175809396](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220213175809396.png)

通过上图并不知道这两个线程属于哪个线程池。

**所以在使用Executors创建线程池很多人不设置自定义的ThreadFactory，这也是不建议使用Executors的原因。**

### 4. 是不是Executors完全不能使用来创建线程池

当然不是Executors完全不能使用来创建线程池，如果能够在使用中解决上面说的两个问题那么就完全可以使用，自定义ThreadFactory作为参数传入。另外一个就是能够预见任务的数量，不会因为无限的提交任务导致资源耗尽。

### 5. 总结

- 不建议使用Executors来创建线程池，主要是有两大原因第一个是问题回溯的问题，使用Executors都可以使用默认的情况，无法用户自定义线程名称不利于排查问题，第二个原因也是最主要原因就是线程池的队列长度太长在这种情况下可能会导致往队列中不停的添加任务，最终在没有达到队列上线的情况下先把服务器运行的内存资源耗尽导致OOM
- 通过直接使用ThreadPoolExecutor创建线程池，设置相对复杂但是设置相对灵活很多。在开发中可以自定义一个Executors，来创建线程池，在语义相同的情况下增加参数来避免前面说的问题
- Executors也是可以用来创建，但是需要考虑不同的场景。
