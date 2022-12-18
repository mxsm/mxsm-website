---
title: "SpringBoot项目中线程池在服务类方法中创建后导致线程数量暴增"
linkTitle: "SpringBoot项目中线程池在服务类方法中创建后导致线程数量暴增"
date: 2022-03-11
weight: 202203112125
---

### 1.背景

公司上线了一套应用的监控系统，能够检测应用的一些状态，例如：内存、线程数等等，在应用运行一段时间后收到了应用线程数过多的警告。当时就犯迷糊了。应用重启后又回复正常，没多少时间又有相对应的警报线程数过多警告。时间间隔也没太多的规律。

> Tips:线程数量多于600就会报警

然后就是问题的排查过程。运行命令

```shell
jps  -- 查找出对应应用的pid
jstack -l <pid> 列出应用中的线程池
```

通过认真检查线程发现pool-xxx-thread-xxx的线程池的线程。从这里可以初步判断是线程池的问题。通过对代码的排查发现了如下代码：

```java
@Service
@Slf4j
public class AccountAuthServiceImpl implements AccountAuthService {
     //省略了部分代码
    
      //功能：将两个系统账号进行绑定
      @Override
      public boolean bindUser(Long hrsAccountId, Long hmcAccountId){

        ExecutorService executorService = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors()*2);
        Future<Boolean> hrsExt = executorService.submit(new Callable<Boolean>() {

            @Override
            public Boolean call() throws Exception {
                //查询hrsAccountId是否存在
                return true;
            }
        });
        Future<Boolean> hmcExt = executorService.submit(new Callable<Boolean>() {

            @Override
            public Boolean call() throws Exception {
                //查询hmcAccountId是否存在
                return true;
            }
        });
        try {
            return hrsExt.get(3, TimeUnit.SECONDS) & hmcExt.get(3, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        } catch (TimeoutException e) {
            e.printStackTrace();
        }
        return false;
    }
}
```

> Tips: 省略了部分代码，看了一下这个代码怎么有点眼熟。这个和我之前遇到过一个问题很像，有兴趣的可以去看一下这个篇文章：《[Java线程池使用不当会发生什么-生产案例](https://juejin.cn/post/7058495829572583461)》

上面服务的代码是在前端调用Controller然后Controller调用这个服务的方法。到这里可能很多人都还不知道问题出在哪里。下面就来分析一下问题的所在，以及如何避免这样的问题的发生。

### 2. 问题分析

**问题1：线程池线程没有设置自定义名称**

​     创建线程池没有自定义线程池的名称，有人会说了这算什么问题。又不影响运行(PS:这种话心里说说就好了千万别面试说)！这种说法也没毛病，但是你反过来仔细想想为什么还要设计一个能让你自定义名称的`ThreadFactory` 。前面的问题排查，打开线程信息放眼望去都是pool-xxx-thread-xxx这种。然后通过猜可能是线程池的问题。如果你设置了线程的自定义名称一看就知道这个线程池是自己new的。

**问题2：线程池的创建放在了SpringBoot web项目的Service方法里面**

   从上面代码来看本意是通过线程池的方式并行的去请求两个服务的接口达到提高效率的目的。同时还遵循了网上很多时候说的什么线程数量是CPU的两倍。很多人肯定会说这没毛病呀，方法中线程安全方法结束变量被垃圾回收器回收(PS:这种话心里说说就好了千万别面试说)。问题就出在这里，线程池和其他的变量有不一样。这里创建线程池就相当于你在方法中创建了一个线程然后启动，如下图代码：

```java
public boolean bindUser(Long hrsAccountId, Long hmcAccountId){
            new Thread(new Runnable() {
            @Override
            public void run() {
                for (;;){
                    
                }
            }
        }).start();
}
```

每调用一次接口都会创建类似如上图创建线程。

> Tips: 参照《[揭秘为什么主线程结束了Java线程池还在运行](https://juejin.cn/post/7059042741509947405)》这篇文章，这里导致的和这个揭秘的是一个道理。

每调一次接口创建一个线程池，然后创建两个线程，如果我调用1000次那就是2000个线程。对于一个对外暴露的接口来说一次发版间隔调用上千次很正常。所以这个随着时间的增长和调用接口频次的增加会导致应用的线程数量慢慢的增加。直到达到报警的阈值。

### 3.问题导致的原因

- 对于问题1不设置线程池的线程名称问题，很多时候是个人的习惯问题以及公司并没有相对应的代码规范。
- 问题2的导致，可能是只知道线程池说有什么好处，但是并不了解线程池的生命周期，以及线程池的一些注意事项。

### 4. 开发中如何避坑

- 对于问题1，我们开发过程中应该养成一个良好的编码习惯，即使公司没有这些线程池相关的规定。大家应该也遵守。不仅仅是是线程池，线程也是一样，如果出现问题怎么样能够很快的定位问题这个在多线程中很重要。如果设置了我们自己所熟知的线程前缀名称，在排查问题的时候一看到出现大量的开发者熟悉的线程名称前缀的时候就能想到和快速定位到问题。**原则：线程池或者线程出现问题能够让开发者快速定位问题(通过线程名称)**
- 对于第二个问题牵涉到两个方面：
  - 对线程池机制的了解
  - SpringBoot项目中线程池的使用

首先说一下线程池机制也就是JDK线程的池化技术，这个本意是为了解决多线程过程中反复创建线程和使用结束后线程销毁这个时间的损耗，而将已经创建的线程管理起来，下次又任务接着使用无需重新创建线程。在线程池中的线程都是用户线程的情况下，只要JVM不退出以及用户不主动调用线程池的shutdown方法线程池即使在主线程结束后也不会销毁线程池。所以在使用过程中，如果需要线程池隔离，每一类线程池应该在项目启动后只能被创建一次，而不是上面所示在方法中进行创建。

其次就是在Spring Boot项目中使用线程池这里有两种情况：

1. 使用Spring Boot线程池配置+@Async注解
2. 在服务类自己定义线程池

第一种方式很多时候就是所有的需要执行的任务都交给一个线程池完成，不会进行线程池隔离(也可以做，但是大多数时候都没做)。第二种就比较自由一点。

**第一种方式Spring Boot给你做了一些避免措施，防止了上面的问题发生。但是对于某一个技术的使用如果没有把握最好的方法就是写一个简单的例子跑一下验证自己的疑惑和猜想**

### 5. 总结

- 线程池和线程一定要设置开发者熟悉的名称，方便出现问题时候的排查，这个在其他项目和Java中通过命令都可以发现，线程命名是很重要的一个步骤。虽然Java提供了默认的名字，但是在排查问题中自定义名称显得尤为重要。
- Spring Boot 中使用线程池可以使用Spring Boot提供的使用线程池的方式，开发者也可以用自定义的方式。但是如果遇到自己不确定的是否这样的使用是否正确最好自己通过小案例进行验证。避免上述案例的发生。
- 对于一项技术我们需要知其然同样也需要知其所以然

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢