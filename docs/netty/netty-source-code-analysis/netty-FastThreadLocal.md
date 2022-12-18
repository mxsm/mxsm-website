---
title: "Netty FastThreadLocal相比Java ThreadLocal到底快在哪里?"
linkTitle: "Netty FastThreadLocal相比Java ThreadLocal到底快在哪里?"
date: 2022-01-22
weight: 202201220944
---

在Netty中有这样一个类 **FastThreadLocal** 从名字可以看出来应该和Java原有的 **ThreadLocal** 有着同样的作用，但是前面加了一个修饰 **`Fast`** ，这意思就是具有和Java原有的 **ThreadLocal** 有着同样的作用但是比它快。那到底是怎么样的设计能让 **FastThreadLocal** 更加的快。

### 1. 性能对比

FastThreadLocal比ThreadLocal快空口无凭，用数据说话，这里基于JMH来对FastThreadLocal和ThreadLocal进行测试。测试代码如下：

> JMH使用可以参考一下之前的文章 《[Java微基准测试工具-JMH](https://juejin.cn/post/7041886951007338533)》

```java
@BenchmarkMode(Mode.AverageTime)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 5)
@Threads(200)
@Fork(1)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
public class ThreadLocalTest {


    private FastThreadLocal<Integer> fastThreadLocal = new FastThreadLocal();

    private ThreadLocal<Integer> threadLocal = new ThreadLocal<>();

    private long a = 1000;

    @Benchmark
    public void fastThreadLocal(Blackhole blackhole) {

        try {
            FastThreadLocalThread thread = new FastThreadLocalThread(new Runnable() {
                @Override
                public void run() {
                    for(int i = 0; i < 100000;++i){
                        fastThreadLocal.set(i);
                        fastThreadLocal.get();
                        fastThreadLocal.remove();
                    }

                }
            });
            thread.start();
            thread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        blackhole.consume(a);
    }

    @Benchmark
    public void threadLocal(Blackhole blackhole) {
        try {
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    for(int i = 0; i < 100000;++i){
                        threadLocal.set(i);
                        threadLocal.get();
                        threadLocal.remove();
                    }


                }
            });
            thread.start();
            thread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        blackhole.consume(a);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
            .include(ThreadLocalTest.class.getSimpleName())
            .result("result.json")
            .resultFormat(ResultFormatType.JSON).build();
        new Runner(opt).run();
    }
}
```

看一下运行结果的截图：

![image-20220122220713516](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220122220713516.png)

然后看一下将 result.json导入可视化网站后生成的对比图：

![FastThreadLocalJMH](https://raw.githubusercontent.com/mxsm/picture/main/netty/FastThreadLocalJMH.png)

这里对比的是调用的平均时间，从图可以看出来FastThreadLocal优于ThreadLocal(FastThreadLocal时间更短)。

下面看一下吞吐量：

```java
@BenchmarkMode(Mode.Throughput)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 10)
@Threads(200)
@Fork(1)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.SECONDS)
public class ThreadLocalTest {
    //省略代码
}
```

![](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220122220123489.png)

然后看一下将 result.json导入可视化网站后生成的对比图：

![FastThreadLoacl吞吐量](https://raw.githubusercontent.com/mxsm/picture/main/netty/FastThreadLoacl%E5%90%9E%E5%90%90%E9%87%8F.png)

**从上面图可以得出结论：不论是单次执行方法的快慢还是吞吐量FastThreadLocal的性能都由于ThreadLocal。**

> 代码为什么要新建一个线程呢？因为FastThreadLocal需要搭配FastThreadLocalThread使用才能发挥出来最大作用，为了消除影响所以在ThreadLocal也同样试用了新建一个Thread去处理。这里实际运行应该比测试出来的值更加高。原因在于这里存在了线程的切换时间

### 2. FastThreadLocal相比ThreadLocal到底快在哪里?

两者实现的功能差不多，对于两者之间的快慢取决于内部功能实现的数据结构，下面通过分析数据结构的差异来对比一下，两者之间的快慢到底是怎么引起的。

#### 2.1 FastThreadLocal解析

通过阅读 **FastThreadLocal** 源码的get/remove操作可以知道，在 **FastThreadLocal** 内部主要是由 **`InternalThreadLocalMap`** 来实现。只要将InternalThreadLocalMap的实现和数据结构与ThreadLocal的实现以及数据结构进行对比就能知道FastThreadLocal快的秘诀。而Netty有实现了 **FastThreadLocalThread** 将 **`InternalThreadLocalMap`** 作为一个变量：整个结构图如下：

![FastThreadLoacl结构 (1)](https://raw.githubusercontent.com/mxsm/picture/main/netty/FastThreadLoacl%E7%BB%93%E6%9E%84%20(1).png)

**FastThreadLocal 使用的空间换时间的做法来减少ThreadLocal哈希碰撞产生的问题。** 

这里怎么去理解？我就用上面图举例子进行阐述：

例如我们在项目中新建十个FastThreadLocal，这样的话每一个FastThreadLocal中的变脸index都是一个唯一值：

```java
    public FastThreadLocal() {
        index = InternalThreadLocalMap.nextVariableIndex();
    }
```

是通过InternalThreadLocalMap的一个静态变量产生的。当你不停的创建FastThreadLocal对象的时候就会InternalThreadLocalMap的静态变量nextIndex就会不停的往上递增。

当  **FastThreadLocal-1** 实例在 **FastThreadLocalThread** 线程对象实例中调用 set方法，会创建一个 **InternalThreadLocalMap** 实例绑定在 **FastThreadLocal-1** 实例上面，

```java
//InternalThreadLocalMap#get
public static InternalThreadLocalMap get() {
    Thread thread = Thread.currentThread();
    if (thread instanceof FastThreadLocalThread) {
        return fastGet((FastThreadLocalThread) thread);
    } else {
        return slowGet();
    }
}

//InternalThreadLocalMap#fastGet
private static InternalThreadLocalMap fastGet(FastThreadLocalThread thread) {
    InternalThreadLocalMap threadLocalMap = thread.threadLocalMap();
    if (threadLocalMap == null) {
        thread.setThreadLocalMap(threadLocalMap = new InternalThreadLocalMap());
    }
    return threadLocalMap;
}
```

> Tips: 这里代码有判断是不是FastThreadLocalThread，所以如果普通的Thread线程执行那么FastThreadLocal和普通的ThreadLocal没有什么区别。

然后后续的 **FastThreadLocal** 实例set值的时候，直接就从**FastThreadLocal-1** 实例对象上获取 **InternalThreadLocalMap** 实例。当往 **InternalThreadLocalMap** 实例set数据的时候就是根据不同的 **FastThreadLocal** 的不同index放在不同的数组位置。

```java
//FastThreadLocal#setKnownNotUnset
private void setKnownNotUnset(InternalThreadLocalMap threadLocalMap, V value) {
    if (threadLocalMap.setIndexedVariable(index, value)) {
        addToVariablesToRemove(threadLocalMap, this);
    }
}

//InternalThreadLocalMap#setIndexedVariable
public boolean setIndexedVariable(int index, Object value) {
    Object[] lookup = indexedVariables;
    if (index < lookup.length) {
        Object oldValue = lookup[index];
        lookup[index] = value;
        return oldValue == UNSET;
    } else {
        expandIndexedVariableTableAndSet(index, value);
        return true;
    }
}
```

直接设置到 **`indexedVariables`** 数组对应的位置。

### 3. 总结

- **FastThreadLocal** 快的代价就是用空间换时间。但是对于现在内存较大的情况下空间换时间是一个不错的选择
- **FastThreadLocal** 兼容了普通Thread的使用
- **FastThreadLocal** 因为是为了Netty量身定制的所以有一定的使用局限性，必须搭配 **FastThreadLocalThread** 才能发挥优势所在