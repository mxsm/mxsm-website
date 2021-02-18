---
title: "AQS源码解析"
linkTitle: "AQS源码解析"
weight: 2
date: 2018-05-11 05:48:46
---
### 1. 什么是AQS

没听过的往这里看，什么是 **`AQS`** ? **`AQS`** 的全称为— **`AbstractQueuedSynchronizer`** 在 **`java.util.concurrent.locks`** 这个包下面。 **`AQS`** 是一个用来构建锁和同步器的框架。在 **`ReentrantLock`**

**`ReentrantReadWriteLock`** 等都是基于 **`AQS`** 。

### 2. AQS的原理

> AQS核心思想是，如果被请求的共享资源空闲，则将当前请求资源的线程设置为有效的工作线程，并且将共享资源设置为锁定状态。如果被请求的共享资源被占用，那么就需要一套线程阻塞等待以及被唤醒时锁分配的机制，这个机制AQS是用CLH队列锁实现的，即将暂时获取不到锁的线程加入到队列中。
>
> CLH(Craig,Landin,and Hagersten)队列是一个虚拟的双向队列（虚拟的双向队列即不存在队列实例，仅存在结点之间的关联关系）。AQS是将每条请求共享资源的线程封装成一个CLH锁队列的一个结点（Node）来实现锁的分配。

![流程图](https://github.com/mxsm/document/blob/master/image/JSE/AQS%E5%9B%BE%E8%A7%A3.png?raw=true)

![图解](https://github.com/mxsm/document/blob/master/image/JSE/AQS%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86%E5%9B%BE.png?raw=true)

> AQS，它维护了一个volatile int state （代表共享资源）和一个FIFO线程等待队列（多线程争用资源被阻塞时会进入此队列）。这里volatile是核心关键词保证线程的可见性。
>
> state 对于重入锁来说state是0和非零。而对于非重入锁state是0和1的区别。总的来说0表示共享资源没有被占用，非0表示资源被占用

**state有三种：**

- **getState()**

  ```java
     protected final int getState() {
          return state;
      }
  ```

  

- **setState()**

  ```java
     protected final void setState(int newState) {
          state = newState;
      }
  ```

  

- **compareAndSetState()**

  ```java
      protected final boolean compareAndSetState(int expect, int update) {
          // See below for intrinsics setup to support this
          return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
      }
  ```

  

- **AQS** 定义了两种资源共享方式：

  -  **`Exclusive`**   ：独占，只有一个线程能执行，如 **`ReentrantLock`** ， **`state`** 可以累加这个就是重入锁的概念 。
    - 公平锁：按照线程在队列中的排队顺序，先来后到的原则
    - 非公平锁：无视队列的顺序直接去抢锁，抢不到在排队。
  -   **`Share`**  (共享，多个线程可同时执行，如Semaphore/CountDownLatch/ReadWriteLock)

- **isHeldExclusively()** ：该线程是否正在独占资源。只有用到condition才需要去实现它

- **tryAcquire(int)** ：独占方式。尝试获取资源，成功则返回true，失败则返回false。

- **tryRelease(int)** ：独占方式。尝试释放资源，成功则返回true，失败则返回false。

- **tryAcquireShared(int)** ：共享方式。尝试获取资源。负数表示失败；0表示成功，但没有剩余可用资源；正数表示成功，且有剩余资源。

- **tryReleaseShared(int)** ：共享方式。尝试释放资源，成功则返回true，失败则返回false。

- **getState()** ：返回同步状态的当前值

- **setState(int newState)**：设置当前同步状态

- **compareAndSetState(int expect, int update)**：使用CAS设置当前状态，该方法能够保证状态设置的原子性；

- **acquire(int arg)**：独占式获取同步状态，如果当前线程获取同步状态成功，则由该方法返回，否则，将会进入同步队列等待，该方法将会调用可重写的tryAcquire(int arg)方法；

- **acquireInterruptibly(int arg)**：与**acquire(int arg)**相同，但是该方法响应中断，当前线程为获取到同步状态而进入到同步队列中，如果当前线程被中断，则该方法会抛出 **`InterruptedException`** 异常并返回；

- **tryAcquireNanos(int arg,long nanos)**：超时获取同步状态，如果当前线程在nanos时间内没有获取到同步状态，那么将会返回false，已经获取则返回true；

- **acquireShared(int arg)**：共享式获取同步状态，如果当前线程未获取到同步状态，将会进入同步队列等待，与独占式的主要区别是在同一时刻可以有多个线程获取到同步状态；

- **acquireSharedInterruptibly(int arg)**：共享式获取同步状态，响应中断

- **tryAcquireSharedNanos(int arg, long nanosTimeout)**：共享式获取同步状态，增加超时限制；

- **release(int arg)**：独占式释放同步状态，该方法会在释放同步状态之后，将同步队列中第一个节点包含的线程唤醒

- **releaseShared(int arg)**：共享式释放同步状态；

> 以ReentrantLock为例，state初始化为0，表示未锁定状态。A线程lock()时，会调用tryAcquire()独占该锁并将state+1。此后，其他线程再tryAcquire()时就会失败，直到A线程unlock()到state=0（即释放锁）为止，其它线程才有机会获取该锁。当然，释放锁之前，A线程自己是可以重复获取此锁的（state会累加），这就是可重入的概念。但要注意，获取多少次就要释放多么次，这样才能保证state是能回到零态的。
>
> 再以CountDownLatch以例，任务分为N个子线程去执行，state也初始化为N（注意N要与线程个数一致）。这N个子线程是并行执行的，每个子线程执行完后countDown()一次，state会CAS(Compare and Swap)减1。等到所有子线程都执行完后(即state=0)，会unpark()主调用线程，然后主调用线程就会从await()函数返回，继续后余动作。
>
> 一般来说，自定义同步器要么是独占方法，要么是共享方式，他们也只需实现tryAcquire-tryRelease、tryAcquireShared-tryReleaseShared中的一种即可。但AQS也支持自定义同步器同时实现独占和共享两种方式，如ReentrantReadWriteLock。

### 3. AQS的底层实现

自定义同步器在实现时只需要实现共享资源 state 的获取与释放方式即可，至于具体线程等待队列的维护（如获取资源失败入队/唤醒出队等），AQS已经在上层已经帮我们实现好了。

#### 3.1  AQS底层使用了模板方法模式

同步器的设计是基于模板方法模式的，如果需要自定义同步器一般的方式是这样（模板方法模式很经典的一个应用）：

1.  继承  **`AbstractQueuedSynchronizer`** 并重写指定方法。
2. 将 **`AQS`** 组合在自定义同步组件的实现中，并调用其模板方法，而这些模板方法会调用使用者重写的方法。

**模板设计模式：**

> 模板方法模式是基于”继承“的，主要是为了在不改变模板结构的前提下在子类中重新定义模板中的内容以实现复用代码。举个很简单的例子假如我们要去一个地方的步骤是：购票buyTicket()->安检securityCheck()->乘坐某某工具回家ride()->到达目的地arrive()。我们可能乘坐不同的交通工具回家比如飞机或者火车，所以除了ride()方法，其他方法的实现几乎相同。我们可以定义一个包含了这些方法的抽象类，然后用户根据自己的需要继承该抽象类然后修改 ride()方法。
>
> 模板方法的特点：
> 1 处理流程固定
> 2 中间某些处理方式不同，但是这个流程还是不变的

**`AQS`  使用了模板方法模式，自定义同步器时需要重写下面几个AQS提供的模板方法：**

```java
isHeldExclusively()//该线程是否正在独占资源。只有用到condition才需要去实现它。
tryAcquire(int acquire)//独占方式。尝试获取资源，成功则返回true，失败则返回false。
tryRelease(int acquire)//独占方式。尝试释放资源，成功则返回true，失败则返回false。
tryAcquireShared(int acquire)//共享方式。尝试获取资源。负数表示失败；0表示成功，但没有剩余可用资源；正数表示成功，且有剩余资源。
tryReleaseShared(int acquire)//共享方式。尝试释放资源，成功则返回true，失败则返回false。
```

#### 3.2 AQS源码分析 — JDK8

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
    
    private transient volatile Node head;

    private transient volatile Node tail;

    /**
     * 同步状态
     */
    private volatile int state;
    
}

```

AQS属性介绍：

| 属性                 | 类型   | 说明                                                         |
| -------------------- | ------ | ------------------------------------------------------------ |
| exclusiveOwnerThread | Thread | 代表独占锁的线程                                             |
| head                 | Node   | 持有锁的线程结点，也是队列中的头结点                         |
| tail                 | Node   | 阻塞队列中的尾结点，同时每一个新的结点进来，都插入到阻塞队列的最后 |
| state                | int    | 大于0说明有线程持有锁，0表示没有线程持有锁。大于1说明是可重入 |

具体结构如下：

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/CLH%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

同步器是实现锁的关键，利用同步器将锁的语义实现，然后在锁的实现中聚合同步器。可以这样理解：锁的API是面向使用者的，它定义了与锁交互的公共行为，而每个锁需要完成特定的操作也是透过这些行为来完成的（比如：可以允许两个线程进行加锁，排除两个以上的线程），但是实现是依托给同步器来完成；同步器面向的是线程访问和资源控制，它定义了线程对资源是否能够获取以及线程的排队等操作。锁和同步器很好的隔离了二者所需要关注的领域，严格意义上讲，同步器可以适用于除了锁以外的其他同步设施上（包括锁）。同步器的开始提到了其实现依赖于一个FIFO队列，那么队列中的元素Node就是保存着线程引用和线程状态的容器，每个线程对同步器的访问，都可以看做是队列中的一个节点。Node的主要包含以下成员变量：

```java
static final class Node {

  volatile int waitStatus;

  volatile Node prev;

  volatile Node next;

  volatile Thread thread;

  Node nextWaiter;
}
```

| 属性名称       | 描述                                                         |
| -------------- | ------------------------------------------------------------ |
| **waitStatus** | 表示节点的状态。其中包含的状态有：<br />1.CANCELLED，值为1，在同步队列中等待的线程等待超时或被中断，需要从同步队列中取消该Node的结点，其结点的waitStatus为CANCELLED，即结束状态，进入该状态后的结点将不会再变化。<br />2.SIGNAL，值为-1，被标识为该等待唤醒状态的后继结点，当其前继结点的线程释放了同步锁或被取消，将会通知该后继结点的线程执行。说白了，就是处于唤醒状态，只要前继结点释放锁，就会通知标识为SIGNAL状态的后继结点的线程执行<br />3.CONDITION，值为-2，与Condition相关，该标识的结点处于等待队列中，结点的线程等待在Condition上，当其他线程调用了Condition的signal()方法后CONDITION状态的结点将从等待队列转移到同步队列中，等待获取同步锁<br />4.PROPAGATE，值为-3，与共享模式相关，在共享模式中，该状态标识结点的线程处于可运行状态<br />5.值为0，表示当前节点在sync队列中，等待着获取锁 |
| **prev**       | 前置节点                                                     |
| **next**       | 下一个节点                                                   |
| **nextWaiter** | 存储condition队列中的后继节点                                |
| **thread**     | 入队列时的当前线程                                           |

### 4. AbstractQueuedSynchronizer源码分析

在Java中很多锁都是继承 **`AbstractQueuedSynchronizer`** 来实现。

#### 4.1 独占锁的获取过程

通过 **ReentrantLock** 获取锁，先看一下 **`acquire`** 方法。**这个方法功能是拿到互斥锁，如果现在不可行就会等待到拿到锁后才返回**：

```java
    public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
```

上面的方法会尝试通过`tryAcquire`来拿锁，这个是个模板方法（AQS采用模板设计模式），需要子类覆盖。那么来看一下`addWaiter`方法做了什么，**这个方法会将当前线程包装成一个链表结点，并将结点加入到等待链表的尾部**：

```java
    private Node addWaiter(Node mode) {
        //创建Node
        Node node = new Node(Thread.currentThread(), mode);
        // 首先尝试使用CAS来插入Node节点，失败在用enq方式设置
        Node pred = tail;
        if (pred != null) {
            node.prev = pred;
            if (compareAndSetTail(pred, node)) {
                pred.next = node;
                return node;
            }
        }
        enq(node);
        return node;
    }
```

看一下方法 **`enq`** ，这个方法主要的功能是添加node到 **`CLH`** 列表中。 默认也是使用CAS来实现添加：

```java
    private Node enq(final Node node) {
        for (;;) {
            Node t = tail;
            //初始化-Head不在阻塞队列中
            if (t == null) { // Must initialize
                if (compareAndSetHead(new Node()))
                    tail = head;
            } else {
                //添加node到阻塞队列
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                    t.next = node;
                    return t;
                }
            }
        }
    }
```

Node添加到阻塞队列后，就是 **`acquireQueued`** 方法 **循环拿锁的逻辑** ：

- 判断当前节点的 pred 节点是否为 head 节点，如果是，则尝试获取锁
- 获取锁失败后，进入挂起逻辑

```java
    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            // 线程中断标记字段
            boolean interrupted = false;
            for (;;) {
                // 获取当前节点的 pred 节点
                final Node p = node.predecessor();
                // 如果 pred 节点为 head 节点，那么再次尝试获取锁
                if (p == head && tryAcquire(arg)) {
                    // 获取锁之后，那么当前节点也就成为了 head 节点
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    //不需要挂起，返回 false
                    return interrupted;
                }
                // 获取锁失败，则进入挂起逻辑
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    interrupted = true;
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

> 注意：**head 节点代表当前持有锁的线程，那么如果当前节点的 pred 节点是 head 节点，很可能此时 head 节点已经释放锁了，所以此时需要再次尝试获取锁**

当前线程具体会不会阻塞取决于 **`shouldParkAfterFailedAcquire`** 返回值，看一下线程挂起逻辑：

```java
    private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
        int ws = pred.waitStatus;
        if (ws == Node.SIGNAL)
            //如果 pred 节点为 SIGNAL 状态，返回true，说明当前节点需要挂起
            return true;
        if (ws > 0) {
            //如果ws > 0,说明节点状态为CANCELLED，需要从队列中删除（前面的状态说明过）
            do {
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
            //如果是其它状态，则操作CAS统一改成SIGNAL状态,由于这里waitStatus的值只能是0或者PROPAGATE
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }
```

上面的方法主要做了以下三件事情：

- 判断 pred 节点状态，如果为 SIGNAL 状态，则直接返回 true 执行挂起
- 删除阻塞队列中的CANCELLED状态的节点
- CAS设置节点为SIGNAL状态，然后再一次循环一个acquireQueued中的自旋进行判断

**`shouldParkAfterFailedAcquire`** 方法返回true下面看一下 **`parkAndCheckInterrupt`** 方法：

```java
    private final boolean parkAndCheckInterrupt() {
        LockSupport.park(this);
        return Thread.interrupted();
    }
```

梳理以下整个的流程图如下：

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/%E8%8E%B7%E5%8F%96%E7%8B%AC%E5%8D%A0%E9%94%81%E7%9A%84%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true)

#### 4.2 独占锁的释放过程

**`unlock`** 释放独占锁

```java
    public void unlock() {
    	//释放独占锁
        sync.release(1);
    }
```

**`release`** 方法主要释放锁：

```java
    public final boolean release(int arg) {
        //上边自定义的tryRelease如果返回true，说明该锁没有被任何线程持有
        if (tryRelease(arg)) {
            // 获取头结点
            Node h = head;
            // 头结点不为空并且头结点的waitStatus不是初始化节点情况，解除线程挂起状态
            if (h != null && h.waitStatus != 0)
                unparkSuccessor(h);
            return true;
        }
        return false;
    }
```

> 说明：
>
> - h == null Head还没初始化。初始情况下，head == null，第一个节点入队，Head会被初始化一个虚拟节点。所以说，这里如果还没来得及入队，就会出现head == null 的情况
> - h != null && waitStatus == 0 表明后继节点对应的线程仍在运行中，不需要唤醒
> - h != null && waitStatus < 0 表明后继节点可能被阻塞了，需要唤醒

再来看一下 **`unparkSuccessor`** 方法，主要是用来唤醒后继节点

```java
    private void unparkSuccessor(Node node) {
        //获取头部节点的状态
        int ws = node.waitStatus;
        if (ws < 0)
            compareAndSetWaitStatus(node, ws, 0);

        //获取当前节点的下一个节点
        Node s = node.next;
        //下一个节点为null或者状态为CANCELLED就找到队列最开始非CANCELLED的节点
        if (s == null || s.waitStatus > 0) {
            s = null;
            //就从尾部节点开始找，到队首，找到队列第一个waitStatus<=0的节点
            for (Node t = tail; t != null && t != node; t = t.prev)
                if (t.waitStatus <= 0)
                    s = t;
        }
        // 如果当前节点的下个节点不为空，而且状态<=0，就把当前节点unpark
        if (s != null)
            LockSupport.unpark(s.thread);
    }
```

> **在这里有个问题为什么要从节点的尾部往头部查找第一个非Cancelled的节点？原因如下**：
>
> 之前的addWaiter方法
>
> ```java
>     private Node addWaiter(Node mode) {
>         Node node = new Node(Thread.currentThread(), mode);
>         // Try the fast path of enq; backup to full enq on failure
>         Node pred = tail;
>         if (pred != null) {
>             node.prev = pred;
>             if (compareAndSetTail(pred, node)) {
>                 pred.next = node;
>                 return node;
>             }
>         }
>         enq(node);
>         return node;
>     }
> ```
>
> 我们从这里可以看到，节点入队并不是原子操作。也就是说：
>
>  node.prev = pred;
>  if (compareAndSetTail(pred, node)) {
>            pred.next = node;
>            return node;
>    }
>
> 这两个步骤可以看做是Tail入队列的原子操作，但是此时pred.next = node;还没执行，如果这个时候执行了unparkSuccessor方法，就没办法从前往后找了，所以需要从后往前找。
>
> 还有一个原因：还有一点原因，在产生CANCELLED状态节点的时候，先断开的是Next指针，Prev指针并未断开，因此也是必须要从后往前遍历才能够遍历完全部的Node。
>
> 综上所述，如果是从前往后找，由于极端情况下入队的非原子操作和CANCELLED节点产生过程中断开Next指针的操作，可能会导致无法遍历所有的节点。所以，唤醒对应的线程后，对应的线程就会继续往下执行。



### 5. Semaphore(信号量) — 允许多个线程同时访问

关键字 **`synchronized`**  和  **`ReentrantLock`** 都是只允许一个线程访问某个资源。Semaphore(信号量)可以指定多个线程同时访问某个资源。

```java
public class SemaphoreExample1 {
  // 请求的数量
  private static final int threadCount = 550;

  public static void main(String[] args) throws InterruptedException {
    // 创建一个具有固定线程数量的线程池对象（如果这里线程池的线程数量给太少的话你会发现执行的很慢）
    ExecutorService threadPool = Executors.newFixedThreadPool(300);
    // 一次只能允许执行的线程数量。
    final Semaphore semaphore = new Semaphore(20);

    for (int i = 0; i < threadCount; i++) {
      final int threadnum = i;
      threadPool.execute(() -> {// Lambda 表达式的运用
        try {
          semaphore.acquire();// 获取一个许可，所以可运行线程数量为20/1=20
          test(threadnum);
          semaphore.release();// 释放一个许可
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }

      });
    }
    threadPool.shutdown();
    System.out.println("finish");
  }

  public static void test(int threadnum) throws InterruptedException {
    Thread.sleep(1000);// 模拟请求的耗时操作
    System.out.println("threadnum:" + threadnum);
    Thread.sleep(1000);// 模拟请求的耗时操作
  }
}
```

**`Semaphore`** 好比是一条高速公路，构造函数好比说明了高速公路拥有几条车道，公平和非公平是否允许这条高速公路插队。每一个线程好比高速公路上面的汽车，**acquire** 方法好比一台骑车占用几个车道，如果占用一个车道5车道就能跑5辆车，如果要占用5个车道就只能跑一辆车。

### 5. CountDownLatch

**`CountDownLatch`** 是一个同步工具类，它允许一个或多个线程一直等待，直到其他线程的操作执行完后再执行。

#### 5.1 CountDownLatch的三种经典用法

- **某一线程在开始运行前等待n个线程执行完毕。**

  一个典型应用场景就是启动一个服务时，主线程需要等待多个组件加载完毕，之后再继续执行。

  或者后续的结果要用到前面几个线程的结果。

  ```java
  public class CountDownLatchTest implements Callable<String> {
  
      private CountDownLatch countDownLatch;
  
      public CountDownLatchTest(CountDownLatch countDownLatch) {
          this.countDownLatch = countDownLatch;
      }
      @Override
      public String call() throws Exception {
  
          try {
              int t = 0;
              System.out.println((t = (int)(Math.random()*10)));
              TimeUnit.SECONDS.sleep(t);
              return Thread.currentThread().getName() + "  " + System.currentTimeMillis();
          } finally {
              countDownLatch.countDown();
          }
      }
  
      public static void main(String[] args) throws Exception{
  
          ExecutorService executorService = Executors.newCachedThreadPool();
          CountDownLatch latch = new CountDownLatch(3);
          CountDownLatchTest t1 = new CountDownLatchTest(latch);
          CountDownLatchTest t2 = new CountDownLatchTest(latch);
          CountDownLatchTest t3 = new CountDownLatchTest(latch);
          Future<String> tt1 =  executorService.submit(t1);
          Future<String> tt2 =  executorService.submit(t2);
          Future<String> tt3 =  executorService.submit(t3);
          latch.await();
          System.out.println(tt1.get());
          System.out.println(tt2.get());
          System.out.println(tt3.get());
  
      }
  
  }
  ```

  

- **实现多个线程开始执行任务的最大并行性。注意是并行性，不是并发，强调的是多个线程在某一时刻同时开始执行。类似于赛跑，将多个线程放到起点，等待发令枪响，然后同时开跑。**

  做法是初始化一个共享的 `CountDownLatch` 对象，将其计数器初始化为 1 ：`new CountDownLatch(1) `，多个线程在开始执行任务前首先 `coundownlatch.await()`，当主线程调用 countDown() 时，计数器变为0，多个线程同时被唤醒。

  ```java
  public class CountDownLatchTest1 implements Runnable {
  
      private CountDownLatch countDownLatch;
  
      public CountDownLatchTest1(CountDownLatch countDownLatch) {
          this.countDownLatch = countDownLatch;
      }
  
      @Override
      public void run() {
          try {
              countDownLatch.await();
              System.out.println(System.currentTimeMillis());
              int t = 0;
              System.out.println((t = (int)(Math.random()*10)));
              TimeUnit.SECONDS.sleep(t);
              System.out.println("完成---"+Thread.currentThread().getName());
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
      }
  
      public static void main(String[] args) throws Exception{
  		
         //线程同时开始和线程等待结束后在执行下面的做法有点相反
          
          ExecutorService executorService = Executors.newCachedThreadPool();
          CountDownLatch latch = new CountDownLatch(1); // 设置为1
          CountDownLatchTest1 t1 = new CountDownLatchTest1(latch);
          CountDownLatchTest1 t2 = new CountDownLatchTest1(latch);
          CountDownLatchTest1 t3 = new CountDownLatchTest1(latch);
  
          executorService.execute(t1);
          executorService.execute(t2);
          executorService.execute(t3);
  
          TimeUnit.SECONDS.sleep(2);
  
          latch.countDown();
          executorService.shutdown();
  
      }
      
  }
  ```

  打印结果：

  ```
  1551412043786
  1551412043786
  1551412043786
  3
  0
  1
  完成---pool-1-thread-3
  完成---pool-1-thread-2
  完成---pool-1-thread-1
  ```

  从结果看出来线程是同时开始的。

- **死锁检测**

#### 5.2  CountDownLatch不足

CountDownLatch是一次性的，计数器的值只能在构造方法中初始化一次，之后没有任何机制再次对其设置值，当CountDownLatch使用完毕后，它不能再次被使用。

### 6. CyclicBarrier (循环栅栏)

CyclicBarrier 的字面意思是可循环使用（Cyclic）的屏障（Barrier）,好比一桌人吃饭一样，比如8个人一桌，人到齐了就可以开饭。如果如果小于八个人就不能开饭。能实现和CountDownLatch相类似的功能。

```java
public class CyclicBarrierTest {

    private static final CyclicBarrier cyclicBarrier = new CyclicBarrier(5);

    public static void main(String[] args) throws Exception{
        ExecutorService threadPool = Executors.newFixedThreadPool(10);
        for(int i = 0; i < 10; ++i){
            final int threadNum = i;
            Thread.sleep(1000);
            threadPool.execute(() -> {
                try {
                    test(threadNum);
                } catch (InterruptedException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            });
        }
        threadPool.shutdown();
    }
    public static void test(int threadnum) throws InterruptedException, BrokenBarrierException {
        System.out.println("threadnum:" + threadnum + "is ready");
        try {
            cyclicBarrier.await();
        } catch (Exception e) {
            System.out.println("-----CyclicBarrierException------");
        }
        System.out.println("threadnum:" + threadnum + "is finish");
    }

}
```



[参考文档]: https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html

