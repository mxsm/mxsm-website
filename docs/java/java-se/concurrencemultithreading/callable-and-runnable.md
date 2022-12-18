---
title: "Callable与Runnable的区别你知道吗？"
linkTitle: "Callable与Runnable的区别你知道吗？"
date: 2022-02-06
weight: 202202061135
---

> JDK版本：JDK11

### 1. 背景

在平时的开发过程中线程肯定用不少，线程启动执行需要实现 **`Runnable`** 类：

```java
public class ThreadTest {

    public static void main(String[] args) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(111);
            }
        }, "Thread-mxsm").start();
    }
}
```

是自己新建一个线程对象，然后执行**Runnable** 执行完成线程结束。

除了这样的还有使用到线程池，如下：

```java
public class ThreadTest {

    public static void main(String[] args) {
       ExecutorService executorService = Executors.newFixedThreadPool(2);
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                System.out.println(111);
            }
        });
    }
}
```

但是在线程池来执行提交任务的时候，你可能注意到了这样情况如下图：

![image-20220206114743214](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220206114743214.png)

在标号1的位置，你会发现竟然还可以提交一个 **Callable** 到线程池进行执行。

**问题来了：**

- **Runnable和Callable有什么关系，为什么线程池可以提交Callable。**
- **从单个线程来看，线程Thead只能执行Runnable接口的实现，但是线程池为什么就可以执行Callable**
- **Callable如何经过包装变成Runnable给线程调用**

![Callable与Runnable](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/Callable%E4%B8%8ERunnable.png)

### 2. Callable与Runnable的关联分析

从上面的列出的三个方面来分析两者之间的关联。

#### 2.1 Callable与Runnable源码分析

**Runnable** 平时在开发的时候经常用，所以大家也比较熟悉：

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

只有一个方法 **`run`** 。 在源码中的注释中翻译总结一下就是：**任何需要由Thread执行的类都需要实现Runnable**。

> Tips: 所以Callable应该是巧妙的转换成了Runnable

**Callable** 用的不多，看一下源码：

```java
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception;
}
```

**Callable** 也只有一个方法 **call** 但是方法有返回值。

**从源码上面可以看出来 Callable 和 Runnable 没有任何继承关系，Runnable的方法没有返回值，而Callable的方法有返回值。**

#### 2.2 从线程池看Callable如何包装成Runnable

JDK在Runnable的注释上有明确的说明：任何需要由Thread执行的类都需要实现Runnable。所以我们可以推断出来Callable用了某种方式包装成了Runnable。

通过 **ExecutorService#submit** 方法提交 Callable 来分析：

![image-20220206134605524](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220206134605524.png)

1. AbstractExecutorService#submit方法中 newTaskFor 方法将 Callable转换成了 RunnableFuture。

![image-20220206134807913](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220206134807913.png)

通过 **newTaskFor** 方法可以发现，最终是创建了一个 **FutureTask** 对象，**Callable** 作为构造函数的参数。那么看一下**FutureTask** ：

```java
public class FutureTask<V> implements RunnableFuture<V> {
    /** The underlying callable; nulled out after running */
    private Callable<V> callable;
    /** The result to return or exception to throw from get() */
    private Object outcome; // non-volatile, protected by state reads/writes
    /** The thread running the callable; CASed during run() */
    private volatile Thread runner;
    /** Treiber stack of waiting threads */
    private volatile WaitNode waiters;
    
    public FutureTask(Callable<V> callable) {
        if (callable == null)
            throw new NullPointerException();
        this.callable = callable;
        this.state = NEW;       // ensure visibility of callable
    }
	//省略部分代码
}
```

Callable作为了FutureTask的一个属性值。之前说过，要想被Thread执行必须实现Runnable。那么我们看一下 **FutureTask** 的实现类 **RunnableFuture** ：

![image-20220206135449066](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220206135449066.png)

1. **RunnableFuture** 继承了 **Runnable** 

换句话说：**FutureTask 实现了 Runnable**

![image-20220206135805034](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220206135805034.png)

1. **FutureTask#run 内部就调用了Callable的call方法**

然后由线程池中的Thread去执行FutureTask(也就是Runnable的实现的实例)。上面类的继承关系：

![image-20220206140347583](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220206140347583.png)

**Callable转换成Runnable的流程**：

1. **开发者实现Callable接口**
2. **实例化Callable，然后提交到线程池**
3. **以Callable为构造函数创建FutureTask**
4. **最终将FutureTask提交给线程池的线程进行执行**

> Tips: 在提交Runnable的实现到线程池执行的时候，如果需要获取到返回值，会将 Runnable的实例，通过RunnableAdapter适配器适配成Callable。
>
> ```java
>     private static final class RunnableAdapter<T> implements Callable<T> {
>         private final Runnable task;
>         private final T result;
>         RunnableAdapter(Runnable task, T result) {
>             this.task = task;
>             this.result = result;
>         }
>         public T call() {
>             task.run();
>             return result;
>         }
>         public String toString() {
>             return super.toString() + "[Wrapped task = " + task + "]";
>         }
>     }
> ```

#### 2.3 线程池如何执行Callable有什么特点

将Callable包装成Runnable后，线程池的执行和执行Runnable一样，Callable的特点就是可以获取到返回值。如果执行的逻辑不关心返回值就可以直接用Runnable来。但是如果需要涉及到获取到业务逻辑中的返回值那么就使用Callable来提交到线程池中。

### 3. 总结

- **Runnable和Callable两者没有继承关系，Callable通过FutureTask包装成Runnable。**
- **线程池执行任务的时候，如果关系返回值就用Callable，不关心返回值用Runnable。**
- **Runnable如果也需要返回值，线程池内部是通过RunnableAdapter适配器来适配成Callable**
