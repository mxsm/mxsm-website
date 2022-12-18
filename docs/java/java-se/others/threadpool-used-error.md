---
title: "Java线程池使用不当会发生什么-生产案例"
linkTitle: "Java线程池使用不当会发生什么-生产案例"
date: 2022-01-29
weight: 202201291017
---

线程池使用不当会发生什么？如下图所示(可以自己先分析)：

![Dingtalk_20220129101427](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/Dingtalk_20220129101427.jpeg)

> 这个是我公司在实际工作中发现的一个问题。但是这个接口调用频率不高所以在线上并没有发现问题(发版重新发布项目就会释放服务器的资源)

将线程池化的目的就是减少线程创建和销毁的资源消耗，同时也防止用户无限制的创建线程把系统资源全部消耗掉。所以Java定义了线程池提供给开发者使用。但是如果线程池使用不当会发生什么呢？这种代码写在这里分分钟四十米的大刀架在脖子上。吐槽完，我们接下来写一个类似的来看看会发生什么以及分析一下导致这种情况发生的原因以及如何规避。

### 1. 例子演示

> 演示代码地址：https://github.com/mxsm/spring-sample/tree/master/spring-boot-protobuf

定义一个Controller

```java
@RestController
public class ThreadPoolController {

    @Autowired
    private ThreadPoolService threadPoolService;

    @GetMapping(value = "/createThreadPool")
    public boolean createThreadPool(){
        return threadPoolService.createThread();
    }

}
```

定义一个ThreadPool的Service，模拟上图的问题

```java
@Service
public class ThreadPoolService {

    public boolean createThread(){

		//增加ThreadFactory为了好区分
        ExecutorService executorService = Executors.newSingleThreadScheduledExecutor(new ThreadFactory() {

            /**
             * Constructs a new {@code Thread}.  Implementations may also initialize priority, name, daemon
             * status, {@code ThreadGroup}, etc.
             *
             * @param r a runnable to be executed by new thread instance
             * @return constructed thread, or {@code null} if the request to create a thread is rejected
             */
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "mxsm");
            }
        });
        executorService.submit(new Runnable() {
            @Override
            public void run() {
                System.out.println("王尼玛");
            }
        });

        return true;
    }

}
```

然后通过调用接口 **`/createThreadPool`** 模拟上面工作中的真实实例的问题。看看会发生什么。将项目打包成jar包然后运行在本地。

![example打包过程](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/example%E6%89%93%E5%8C%85%E8%BF%87%E7%A8%8B.gif)

然后运行项目：

![example运行](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/example%E8%BF%90%E8%A1%8C.gif)

运行后不停的请求上面的接口：

![请求模拟](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/%E8%AF%B7%E6%B1%82%E6%A8%A1%E6%8B%9F.gif)

看到有执行的打印说明已经请求到了。然后我们通过命令： **`jps`** 以及 **`jstack -l <pid>`** 来查看线程池的情况

![线程状态查看](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/%E7%BA%BF%E7%A8%8B%E7%8A%B6%E6%80%81%E6%9F%A5%E7%9C%8B.gif)

注意观察下线程的状态如下图：

![image-20220129105917968](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220129105917968.png)

都是在等待的过程中，这说明了什么问题？**`线程并没有随着方法执行完成而消亡`** 这个就很可怕了，如果你的接口不停的被调用，这个线程的创建数会源源不断的增加，当增加到你服务器资源全部被使用完就会导致服务宕机报(java.lang.OutOfMemoryError)。接下来分析如何为什么会写出这样的代码

> Tips: 这里可能很多人没有发现 **Executors.newSingleThreadScheduledExecutor** 这个创建的是一个单线程的线程池。所以导致的线程增长速度是调用一次接口增加1，如果是100个线程线程池呢？那可能会很快导致服务不可用宕机。我只想说还好是单线程线程池接口调用频率不高

### 2. 原因分析以及解决

#### 2.1 可能原因分析

1. 对于Spring Bean的几种模式不是很了解，在默认情况下Bean是单例模式，对Bean的生命周期不是很了解。在前面这种情况下，Bean会伴随Spring容器启动到消亡整个生命周期。环境话说我服务不停 **`UserActionImpl`** 整个对象实例会以单例的模式一直存在。

2. 不了解线程池的原理，只知道Spring Bean的方法是线程隔离的。方法执行完成里面的变量都被回收了。这就是线程池和其他变量不一样的地方。具体的原理可以去研究一下线程池的源码。那这个我们怎么验证呢？

   ![线程池运行](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E8%BF%90%E8%A1%8C.gif)

   从上面的图可以看出来，**`“完成”`**  两字都打印出来了按理来说服务要停止了但是服务并没有。这就是因为线程池的原因。

3. 也有可能本来只是想异步执行 **`Runnable`** 里面代码，有听说线程池的好处很多就直接用了错误的代码，(这里你还不如new Thread算了)

4. 同时也有可能是写代码的时候粗心没有注意，本来是想将线程池定义成为类的属性变量的。但是粗心写错了地方

#### 2.2 解决方法

1. 不用线程池直接new Thread去执行 Runnable 实例
2. 将线程池定义为类的属性变量

### 3. 正确使用线程池应该注意的地方

- 每一个线程池最好是以单例的形式存在，不要像上面一样每次执行一次方法创建一次线程池。这样很容易消耗光生产的服务器资源
- 线程池的最大线程需要在创建线程池的时候确定，线程数需要根据业务需求设置
- 线程池的等待队列大小设置根据业务需求以及具体问题来设置（一般无界队列是不允许的，当发生阻塞的情况无界队列同样的道理可能会消耗光服务的所有资源）

### 4. 总结

对每一行代码抱有敬畏之心才能让代码更加高效、简洁、优雅！如果只是为了用某些技术而用，只知其然，而不知其所以然好不如用最笨的方式实现。至少不会导致程序的问题或者服务不可用。在对一些不确定的问题或者有疑问就自己写一个简单的模拟程序去验证自己的猜想。
