---
title: volatile详解
categories:
  - Java
  - JSE
tags:
  - Java
  - JSE
abbrlink: 6e37ac90
date: 2019-11-06 03:20:07
---
### volatile的官方定义

java语言规范第三版中对volatile的定义如下：java编程语言允许线程访问共享变量，为了确保共享变量能被准确和一致的更新，线程应确保通过排他锁单独获得这个变量。java语言提供了volatile，在某些情况下比锁更加方便。如果一个字段被声明为volatile，java线程内存模型确保所有线程看到这个变量的值是一致的。

`Java`语言中`volatile`可以被看着是一种程度比较轻的`synchronized`；与synchronized相比`volatile` 变量所需的编码较少，并且运行时开销也较少，但是**它所能实现的功能也仅是 `synchronized` 的一部分**

### volatile 变量

Volatile 变量具有 `synchronized` 的可见性特性，但是**不具备原子特性**。这就是说线程能够自动发现 volatile 变量的最新值。Volatile 变量可用于提供线程安全，但是只能应用于非常有限的一组用例：多个变量之间或者某个变量的当前值与修改后值之间没有约束。因此，**单独使用 volatile 还不足以实现计数器、互斥锁或任何具有与多个变量相关的不变式（Invariants）的类**（例如 “start <=end”）。

出于简易性或可伸缩性的考虑，您可能倾向于使用 volatile 变量而不是锁。当使用 volatile 变量而非锁时，某些习惯用法（idiom）更加易于编码和阅读。此外，volatile 变量不会像锁那样造成线程阻塞，因此也很少造成可伸缩性问题。在某些情况下，如果读操作远远大于写操作，volatile 变量还可以提供优于锁的性能优势。

例子：

```java
public class VolatileTest {

    private static volatile int count = 0;

    public static void main(String[] args) throws Exception{

       Thread[] threads = new Thread[20];
       for(int i = 0; i < threads.length; ++i){
           threads[i] = new Thread(()->{
               for(int k = 0 ;k<1000;k++){
                   count++;//这一步操作不是原子操作,而volatile不能保证复合操作的原子性
               }
           });
           threads[i].start();
       }
       for(int i = 0; i < threads.length; ++i){
            threads[i].join();
       }
        System.out.println(count);
    }
}
```

运行的结果大部分都不等于20X1000

**所以`volatile` 无法保证复合性操作的原子性**

### 正确使用 volatile 变量的条件

在有限的一些情形下使用 volatile 变量替代锁。要使 volatile 变量提供理想的线程安全，必须同时满足下面两个条件

- 对变量的写操作不依赖于当前值

  ```java
  volatile int count = 0; //不依赖于当前值
  volatile int count = count + 1; //依赖当前值
  ```

  

- 该变量没有包含在具有其他变量的不变式中

  ```java
  volatile int count = 1; 
  int c = count + 1; 
  ```

  

第一个条件的限制使 volatile 变量不能用作线程安全计数器。虽然增量操作（`x++`）看上去类似一个单独操作，实际上它是一个由读取－修改－写入操作序列组成的组合操作，必须以原子方式执行，而 volatile 不能提供必须的原子特性。实现正确的操作需要使 `x` 的值在操作期间保持不变，而 volatile 变量无法实现这点。（然而，如果将值调整为只从单个线程写入，那么可以忽略第一个条件。）—上面的代码说明这个问题

### 性能考虑

使用 volatile 变量的主要原因是其简易性：在某些情形下，使用 volatile 变量要比使用相应的锁简单得多。使用 volatile 变量次要原因是其性能：某些情况下，volatile 变量同步机制的性能要优于锁。

很难做出准确、全面的评价，例如 “X 总是比 Y 快”，尤其是对 JVM 内在的操作而言。（例如，某些情况下 VM 也许能够完全删除锁机制，这使得我们难以抽象地比较 `volatile` 和 `synchronized` 的开销。）就是说，在目前大多数的处理器架构上，volatile 读操作开销非常低 —— 几乎和非 volatile 读操作一样。而 volatile 写操作的开销要比非 volatile 写操作多很多，因为要保证可见性需要实现内存界定（Memory Fence），即便如此，volatile 的总开销仍然要比锁获取低。

volatile 操作不会像锁一样造成阻塞，因此，在能够安全使用 volatile 的情况下，volatile 可以提供一些优于锁的可伸缩特性。如果读操作的次数要远远超过写操作，与锁相比，volatile 变量通常能够减少同步的性能开销。

### 正确使用volatile的模式

要始终牢记使用 volatile 的限制 —— 只有在状态真正独立于程序内其他内容时才能使用 volatile —— 这条规则能够避免将这些模式扩展到不安全的用例

#### 状态标志

也许实现 volatile 变量的规范使用仅仅是使用一个布尔状态标志，用于指示发生了一个重要的一次性事件，例如完成初始化或请求停机。

实际应用：IM工程中在akka actor收到销毁命令的时候设置标记让netty不再往外推消息。

```java
public abstract class AbstractMessageDistribute<T> extends AbstractActor implements MessageDistribute {

	protected Logger logger = LoggerFactory.getLogger(getClass());
	
	private T channelContext;

/**
	 * Channel是否active
	 */
	private volatile  boolean  isActive = true; //状态标记
	public void setActive(boolean active) {
		isActive = active;
	}
}
public class NettyAkkaActor extends ChannelTransportDistribute{

	@Override
	public void postStop() throws Exception {
        setActive(false); //设置
		super.postStop();
	}

private void receiveEtcdCacheMessageWrapper(EtcdCacheMessageWrapper wrapper) {
		ImMessage notification = wrapper.getImMessage();
		if(isActive()){ //判断
			//...........
		}

	}
}

```

### 一次性安全发布

缺乏同步会导致无法实现可见性，这使得确定何时写入对象引用而不是原语值变得更加困难。在缺乏同步的情况下，可能会遇到某个对象引用的更新值（由另一个线程写入）和该对象状态的旧值同时存在。（这就是造成著名的双重检查锁定（double-checked-locking）问题的根源，其中对象引用在没有同步的情况下进行读操作，产生的问题是您可能会看到一个更新的引用，但是仍然会通过该引用看到不完全构造的对象）。

代码示例1：将 volatile 变量用于一次性安全发布

```java
public class BackgroundFloobleLoader {
    public volatile Flooble theFlooble;
 
    public void initInBackground() {
        // do lots of stuff
        theFlooble = new Flooble();  // this is the only write to theFlooble
    }
}
 
public class SomeOtherClass {
    public void doWork() {
        while (true) { 
            // do some stuff...
            // use the Flooble, but only if it is ready
            if (floobleLoader.theFlooble != null) 
                doSomething(floobleLoader.theFlooble);
        }
    }
}
```

代码示例2：单例模式—懒汉模式—double-checked

```java
//double checked
public class LazySingleton {

    private volatile  static  LazySingleton lazySingleton;

    private static final Object LOCK = new Object();

    private LazySingleton(){

    }

    public static LazySingleton doubleCheckedLazySingleton(){

        if(lazySingleton == null){
            synchronized (LOCK){
                if(lazySingleton == null){
                    lazySingleton = new LazySingleton();
                }
            }
        }
        return lazySingleton;
    }
}

//测试代码

public class LazyModel {

    public static void main(String[] args) throws Exception{
        Object target = new Object();
        Map<LazySingleton,Object> set = new ConcurrentHashMap<>();
        Thread[] threads = new Thread[10000];
        for(int i = 0; i < threads.length;++i){
            threads[i] = new Thread(()->{
                set.put(LazySingleton.doubleCheckedLazySingleton(),target);
            });
            threads[i].start();
        }
        for(int i = 0; i < threads.length;++i){

            threads[i].join();
        }
        System.out.println(set.size()); //输出的size等于1
    }
}
```

### 开销较低的读-写锁策略

目前为止，您应该了解了 volatile 的功能还不足以实现计数器。因为 `++x` 实际上是三种操作（读、添加、存储）的简单组合，如果多个线程凑巧试图同时对 volatile 计数器执行增量操作，那么它的更新值有可能会丢失。

然而，如果读操作远远超过写操作，您可以结合使用内部锁和 volatile 变量来减少公共代码路径的开销。清单 6 中显示的线程安全的计数器使用 `synchronized` 确保增量操作是原子的，并使用 `volatile` 保证当前结果的可见性。如果更新不频繁的话，该方法可实现更好的性能，因为读路径的开销仅仅涉及 volatile 读操作，这通常要优于一个无竞争的锁获取的开销。

```java
public class CheesyCounter {
    // Employs the cheap read-write lock trick
    // All mutative operations MUST be done with the 'this' lock held
    @GuardedBy("this") private volatile int value;
 
    public int getValue() { return value; }
 
    public synchronized int increment() {
        return value++;
    }
}
```

之所以将这种技术称之为 “开销较低的读－写锁” 是因为您使用了不同的同步机制进行读写操作。因为本例中的写操作违反了使用 volatile 的第一个条件，因此不能使用 volatile 安全地实现计数器 —— 您必须使用锁。然而，您可以在读操作中使用 volatile 确保当前值的*可见性*，因此可以使用锁进行所有变化的操作，使用 volatile 进行只读操作。其中，锁一次只允许一个线程访问值，volatile 允许多个线程执行读操作，因此当使用 volatile 保证读代码路径时，要比使用锁执行全部代码路径获得更高的共享度 —— 就像读－写操作一样。然而，要随时牢记这种模式的弱点：如果超越了该模式的最基本应用，结合这两个竞争的同步机制将变得非常困难。

### volatile 底层实现

对于`volatile`变量，当对`volatile`变量进行写操作的时候，JVM会向处理器发送一条lock前缀的指令，将这个缓存中的变量回写到系统主存中。

写回主存后，其他处理器缓存的值还是旧的。再执行计算操作就会有问题，所以在多处理器下为了保证各个处理器的缓存是一致的，就会实现缓存一致性协议。

> 缓存一致性协议：每一个处理器通过嗅探在总线上面的传播的数据来检查自己缓存的值是不是过期了，当处理器发现自己缓存行对应的内存地址被修改，就会将当前的处理器的缓存设置为无效状态，当处理器要对这个数据进行修改操作的时候，会强制重新去系统内存里把数据督导处理器缓存里。

所以如果一个变量被 **`volatile`** 所修饰的话，在每次数据变化之后，其值都会被强制刷入主存。而其他的处理器的缓存由于遵守了缓存一致性协议，也会把这个变量的值从主存加载到自己的缓存中， 这就保证了 **`volatile`** 在并发编程中期指在多个缓存中是可见的。