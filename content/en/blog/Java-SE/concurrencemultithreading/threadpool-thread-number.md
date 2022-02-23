---
title: "线程池的数量和线程池中线程数量如何设置-理论篇"
linkTitle: "线程池的数量和线程池中线程数量如何设置-理论篇"
date: 2022-02-20
weight: 202202202200
---

### 1.引言

大家可能都和我一样，在网上看到过这样的一个理论(先不说正确与否)：

- 计算密集型：CPU核心数+1
- I/O密集型：CPU核心数*2

> Linux查看命令：lscpu

![image-20220219215720981](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220219215720981.png)

按照上面的理论，那么我的线程池大小应该设计成这样：

- 计算密集型：CPU核心数+1=17
- I/O密集型：CPU核心数*2=32

但是有没有发现这样的一个问题，这里说的好像都是一个线程池中线程的数量，如果一个项目中存在多个线程池，是不是每一个线程池都应该设置成一样的线程数量。这里就会引出一下几个问题：

![线程池和线程池线程数量](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E5%92%8C%E7%BA%BF%E7%A8%8B%E6%B1%A0%E7%BA%BF%E7%A8%8B%E6%95%B0%E9%87%8F.png)



### 2. 项目中是不是只能有一个线程池？

对于 **`项目中是不是只能有一个线程池？`** 这个问题，很显然大家都知道不太可能只能拥有一个线程池。就拿一个简单的Web项目来说，至少会有一个Tomcat的处理线程池。如果项目需要连接数据库那么至少还会有一个数据库的链接管理线程池。这样来说就至少存在了两个线程池。结论就是：**大部分项目中线程池会存在多个特别是在Web项目中，但是在某些非Web应用也可能只存在一个线程池或者不存在线程池的情况。** 

这种存在多个线程池的情况下显然就不适用了开篇提到的网上说的那个理论，因为web项目中tomcat的线程池默认值大小就是200，如果按照上面的理论显然是不正确的。那么如何设置线程池的大小(线程池中线程数量多少)首先要搞清楚以下几个问题：

- 单个线程池和线程池中线程是如何执行的是不是有不同

  例如单独创建10个线程启动运行，和线程池创建线程数量10个的线程是不是一样获取CPU的执行

- 两个线程池线程数为5和一个线程池数量为10的是否一样

通过这两个问题我们来通过代码分析一下上图中的第二个问题：**多个线程池共存的情况CPU如何执行线程**

### 3.多个线程池共存的情况CPU如何执行线程

通过下面三个代码例子来分析

#### 3.1  4个单线程

```java
public class ThreadNumTest {
    public static void main(String[] args) {
        for(int i = 0; i < 4; ++i){
            new Thread(new Runnable() {
                @Override
                public void run() {
                    do {

                    }while (true);
                }
            }, "mxsm").start();
        }
        System.out.println("main函数运行结束");
    }
}
```

编译然后在服务器上运行:

![ThreadNumExample1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/ThreadNumExample1.gif)

然后通过如下命令进行观察：

```shell
$ jps
$ top -H -p <java程序的PID>
```

运行完上面的命令后按 **`数字键1`** 查看CPU的使用率

![image-20220219222136205](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220219222136205.png)

这里会发现有4个CPU的使用率已经到达100%。接下来看第2种情况

#### 3.2 一个线程池-4个线程：

```java
public class ThreadNumTest {
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(4);
        for(int i = 0; i < 4; ++i){
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    do {

                    }while (true);
                }
            });
        }
        System.out.println("main函数运行结束-一个线程池-4个线程");
    }
}
```

编译然后在服务器上运行:

![ThreadNumExample1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/ThreadNumExample2.gif)

通过命令(上面的第一种情况)查看

![image-20220219222507978](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220219222507978.png)

发现有4个CPU的使用率达到了100%，接下来看第三种情况

#### 3.3 2个线程池每个2个线程：

```java
public class ThreadNumTest {
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        ExecutorService executorService1 = Executors.newFixedThreadPool(2);
        for(int i = 0; i < 2; ++i){
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    do {

                    }while (true);
                }
            });
            executorService1.submit(new Runnable() {
                @Override
                public void run() {
                    do {

                    }while (true);
                }
            });
        }
        System.out.println("main函数运行结束-2个线程池每个2个线程");
    }
}
```

编译然后在服务器上运行:

![ThreadNumExample1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/ThreadNumExample3.gif)

通过命令(上面的第一种情况)查看

![image-20220219222742257](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220219222742257.png)

发现有4个CPU的使用率达到了100%。

------

通过代码的演示得出一个结论：**线程池个数的多少和是否进行池化，对CPU对线程的执行没有影响。这也是线程池化只是影响效率并不会影响CPU对线程的执行底层逻辑。(这里说的效率是没有池化情况下线程需要执行任务要新建，执行完成后需要销毁。这里会影响到效率)。都是4个CPU的使用率达到了百分之百。**

上面是通过一个死的空循环不停的执行，CPU才跑满，大多数情况下程序都会有I/O操作，或者网络的收发数据报文的情况。这些操作就需要等待反馈，在这个过程中线程就是等待的状态，CPU就会没有工作，操作系统就会调度CPU去执行其他的线程。这里就会出现上下文的切换。

### 4. 系统负荷(Load averages)与进程上下文切换

在讲如何设置线程数量的之前，来说一下Linux中的系统负荷（Load averages），

#### 4.1 Linux中的系统负荷（Load averages）

查看命令：

```shell
uptime
#或者
top
```

这个东西怎么理解，可以参照一下这个文章的理解：《[Understanding Linux CPU Load](https://scoutapm.com/blog/understanding-load-averages)》。在这个文章中有一张图：

![image-20220220112446981](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220220112446981.png)

上图描述了CPU的过载：

- 是使用CPU时间片(“过桥”)或排队使用CPU的进程
- 通道就表示一个CPU
- 运行队列长度:当前运行的进程数加上等待(排队)运行的进程数的总和  

简单翻译理解一下几个重要的地方：

- Load averages值在0.00-1的范围内(不包含1)，CPU正常运行这个是比较好的情况，桥上的车没有拥堵，没达到最大承受
- Load averages值在1，表明CPU满负荷运行，桥上的车没有拥堵，达到了最大承受
- Load averages值大于1， 标明CPU超负荷运行， 桥上的车已经达到最大的承受，同时开始在桥的入口处开始堵车

> Tips: 
>
> 1. 上面说的是单核单线程的情况下，如果是多核多线程情况Load averages值就不是1了，例如我现在这个CPU8核16线程那么Load averages=16算是满负荷运行。
> 2. Load averages=1没有任何其他的空间，经验值一般在0.7左右，如果为1.0你去操作电脑的时候就会出现卡顿的情况，原因就在于CPU只能刚好满负荷完成任务。对于其他额外的任务就需要排队，所以就会导致电脑出现卡顿的情况。

#### 4.2 进程的上下文切换

对于进程执行任务来说，如果进程绑定到某个CPU上面，这个CPU也只执行这一个进程，这种情况下是不存在进程的上下文的切换。CPU的工作过程中上下文的切换需要浪费一部分时间。**`所以过于频繁的上下文切换也会导致运行变慢`** 。同样的一个任务再没有上下文切换的时候执行100次肯定比有上下文切换的时间短。

上下文切换分类：

- 自愿上下文切换

  指进程无法获取所需资源，导致的上下文切换。比如说， I/O、内存等系统资源不足时，就会发生自愿上下文切换

- 非自愿上下文切换

  进程由于时间片已到等原因，被系统强制调度，进而发生的上下文切换

> Tips: Java线程和Linux系统的进程的关系可以看好一下《[Difference between Thread vs Process in Java?](https://www.java67.com/2012/12/what-is-difference-between-thread-vs-process-java.html)》以及在 stackoverflow《[Distinguishing between Java threads and OS threads?](https://stackoverflow.com/questions/1888160/distinguishing-between-java-threads-and-os-threads)》上这个回答。

#### 5. 线程数量设置原则

**总的原则**：**`在CPU满载(或者满负荷的0.7或者某个固定值)的情况下，通过调节线程数量能让系统单位时间内尽可能的完成更多的任务`**

**`线程数量的多少取决在合适的数量在单位时间内能够尽可能多的完成某一个任务次数`** ，这里的线程数指的是执行某个任务频率很高的线程，例如：tomcat的执行线程池，数据库的线程池等等，而定时一个小时获取某个配置的线程池或者线程池这些都不是考虑的范围。

------

线程数量设置会在下一篇文章进行介绍。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考文档：

- [Difference between Thread vs Process in Java?](https://www.java67.com/2012/12/what-is-difference-between-thread-vs-process-java.html)
- [Distinguishing between Java threads and OS threads?](https://stackoverflow.com/questions/1888160/distinguishing-between-java-threads-and-os-threads)
- [Understanding Linux CPU Load](https://scoutapm.com/blog/understanding-load-averages)