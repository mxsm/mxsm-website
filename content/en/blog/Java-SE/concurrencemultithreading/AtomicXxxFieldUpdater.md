---
title: "AtomicXXXFieldUpdater在内存优化中的是实战"
linkTitle: "AtomicXXXFieldUpdater在内存优化中的实战"
date: 2022-09-03
weight: 202209031441. 
---

我报名参加金石计划1期挑战——瓜分10万奖池，这是我的第1篇文章，[点击查看活动详情](https://s.juejin.cn/ds/jooSN7t)

### 1. 背景

在很多项目中例如 `Netty、druid、DLedger` 中都能看到 `AtomicXXXFieldUpdater` 的身影,例如在Netty的 `HashedWheelTimer` 类中就有 `AtomicIntegerFieldUpdater` 代码的存在。又比如在druid中的[PR-165](https://github.com/alibaba/druid/pull/165/files)。大量的试用了`AtomicXXXFieldUpdater` 这一类相似的类。AtomicXXXFieldUpdater表示的是一系列类：

- **AtomicIntegerFieldUpdater**
- **AtomicLongFieldUpdater**
- **AtomicReferenceFieldUpdater**

今天就来聊聊 **`AtomicXXXFieldUpdater`** 在内存优化中的实战，下面在笔者在 [DLedger(RocketMQ的一个组件)](https://github.com/openmessaging/dledger) 中对内存的优化，对应的[ISSUE#189](https://github.com/openmessaging/dledger/issues/189)和[PR-190](https://github.com/openmessaging/dledger/pull/190)

### 2. 案例说明

首先我们看一下这样的例子：

```java
public class AtomicIntegerTest {

    final AtomicInteger startPosition = new AtomicInteger(0);
    final AtomicInteger wrotePosition = new AtomicInteger(0);
    final AtomicInteger committedPosition = new AtomicInteger(0);
    final AtomicInteger flushedPosition = new AtomicInteger(0);

    public static void main(String[] args) throws Exception{
        List<AtomicIntegerTest> list = new LinkedList<>();
        for (int i = 0; i < 1000000; i++) {
            list.add(new AtomicIntegerTest());
        }
        System.out.println("create instances 1000000");
        System.in.read();
    }

}
```

然后使用 **`YourKit tools`** 工具进行分析(也可以使用其他的分析工具)。

 ![AtomicXXXFieldUpdater1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/AtomicXXXFieldUpdater1.png)

从上图可以看出来**`AtomicInteger`** 大概占用了64M。而AtomicIntegerTest对象实例整个占用了96M.

然后用`AtomicIntegerFieldUpdater` 进行改造,如下例子：

```java
public class AtomicIntegerFieldUpdaterTest {

    public static final AtomicIntegerFieldUpdater<AtomicIntegerFieldUpdaterTest> startPosition =  AtomicIntegerFieldUpdater.newUpdater(AtomicIntegerFieldUpdaterTest.class,"startPositionInt");
    public static final AtomicIntegerFieldUpdater<AtomicIntegerFieldUpdaterTest> wrotePosition = AtomicIntegerFieldUpdater.newUpdater(AtomicIntegerFieldUpdaterTest.class,"wrotePositionInt");
    public static final AtomicIntegerFieldUpdater<AtomicIntegerFieldUpdaterTest> committedPosition = AtomicIntegerFieldUpdater.newUpdater(AtomicIntegerFieldUpdaterTest.class,"committedPositionInt");
    public static final AtomicIntegerFieldUpdater<AtomicIntegerFieldUpdaterTest> flushedPosition =AtomicIntegerFieldUpdater.newUpdater(AtomicIntegerFieldUpdaterTest.class,"flushedPositionInt");

    private volatile int startPositionInt = 0;
    private volatile int wrotePositionInt = 0;
    private volatile int committedPositionInt = 0;
    private volatile int flushedPositionInt = 0;

    public static void main(String[] args) throws Exception{
        List<AtomicIntegerFieldUpdaterTest> list = new LinkedList<>();
        for (int i = 0; i < 1000000; i++) {
            list.add(new AtomicIntegerFieldUpdaterTest());
        }
        System.out.println("create instances 1000000");
        System.in.read();
    }

}
```

使用使用 **`YourKit tools`** 工具进行分析结果如下：

![AtomicXXXFieldUpdater2](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/AtomicXXXFieldUpdater2.png)

AtomicIntegerFieldUpdaterTest整个对象大小的和为32M,相比之前的总共小了64M。大大的减少了内存的开销。

然后笔者对DLedger项目的DefaultMmapFile进行优化最终被Merge:

![image-20220903151732636](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220903151732636.png)

### 3. AtomicXXXFieldUpdater如何使用

- **AtomicXXXFieldUpdater必须是静态变量**
- **被更新的变量必须被关键字volatile修饰**

例子如下：

```java
public class AtomicIntegerFieldUpdaterTest {
    public static final AtomicIntegerFieldUpdater<AtomicIntegerFieldUpdaterTest> startPosition =  AtomicIntegerFieldUpdater.newUpdater(AtomicIntegerFieldUpdaterTest.class,"startPositionInt");

    private volatile int startPositionInt = 0;
}
```

### 4. 使用AtomicXXXFieldUpdater后内存为什么会减少

> 对象内存大小如果不是很清楚可以阅读一下：[《一个Java对象占用多大内存-理论篇》](https://juejin.cn/post/7104912745744564237)和[《一个Java对象占用多大内存-实践篇》](https://juejin.cn/post/7105200279322099726)

我们用上面的案例来进行分析使用AtomicXXXFieldUpdater后内存为什么会减少。

首先我们要知道的是一个对象内存组成，**`AtomicIntegerTest`** 

```
public class AtomicIntegerTest {

    final AtomicInteger startPosition = new AtomicInteger(0);
    final AtomicInteger wrotePosition = new AtomicInteger(0);
    final AtomicInteger committedPosition = new AtomicInteger(0);
    final AtomicInteger flushedPosition = new AtomicInteger(0);
}
```

**`AtomicIntegerTest`** 单个对象的大小是多少？如下图所示

![AtomicXXXFieldUpdater3](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/AtomicXXXFieldUpdater3.png)

而`AtomicIntegerFieldUpdaterTest`对象的大小：

![AtomicXXXFieldUpdater4](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/AtomicXXXFieldUpdater4.png)

少了64bytes。也就是少了 `AtomicInteger` 对象的大小。

### 5. 总结

`AtomicIntegerFieldUpdater`、`AtomicLongFieldUpdater`、`AtomicReferenceFieldUpdater` 合理的使用能够大大减少应用的内存消耗。特别是 AtomicInteger相对应的对象数量越多并且在实例化的对象也越多的情况下。与此同时也需要关注一下在使用 `AtomicXXXFieldUpdater` 的方式方法。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢