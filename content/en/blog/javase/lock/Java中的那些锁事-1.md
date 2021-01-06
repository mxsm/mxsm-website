---
title: Java中的那些锁事-1
categories:
  - Java
  - JSE
  - 锁
tags:
  - Java
  - JSE
  - 锁
abbrlink: f1779fa4
date: 2018-08-26 22:37:40
---
### 1. 锁的特性

- 互斥
- 可见性

锁作为并发共享数据，保证一致性的工具

锁的分类目录：

![图片](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/Java%E7%9A%84%E4%B8%BB%E6%B5%81%E9%94%81.png)

### 2. 悲观锁  VS 乐观锁

**悲观锁**和**乐观锁**体现了看待线程同步的不同角度。在Java和数据库中都有应用

- **悲观锁**：对于共享数据的并发操作，悲观锁认为自己在使用数据的时候一定会有其他的线程来修改数据。因此在获取数据的时候先加锁，确保数据不会被别的线程修改。Java中synchronized关键字和Lock的实现都是悲观锁。
- **乐观锁**：对于共享的数据，乐观锁认为自己的使用的数据不会有其他的线程修改，所以在获取数据的时候不会加锁。只是在更新的时候去判断有没有别的线程更新了这个数据。如果这个数据没有被更新，当前的线程奖自己修改的数据成功写入。如果数据已经被其他的的线程更新了根据不同的实现方式执行不同的操作（报错或者重试）。乐观锁在Java中使用的是无锁编程来实现的(CAS算法)

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/%E4%B9%90%E8%A7%82%E9%94%81%E5%92%8C%E6%82%B2%E8%A7%82%E9%94%81%E7%9A%84%E6%89%A7%E8%A1%8C%E5%9B%BE%E8%A7%A3.png)

- 悲观锁适合写操作多的场景，先加锁可以保证写操作时数据正确。
- 乐观锁适合读操作多的场景，不加锁的特点使其读操作性能大大提高。

代码：

```java
//悲观锁
public synchronized void add(){

 }
// ReentrantLock -- 悲观锁
private ReentrantLock lock = new ReentrantLock(); // 需要保证多个线程使用的是同一个锁
public void modifyPublicResources() {
	lock.lock();
    try {
          // 操作同步资源
        }finally {
      	//一定要放在finally让锁一定会释放
		lock.unlock();
    }

}

//乐观锁--- 需要保证多个线程使用的是同一个AtomicInteger
private AtomicInteger atomicInteger = new AtomicInteger();  
atomicInteger.incrementAndGet(); //执行自增1
```

**`AtomicInteger`** 是 **`java.util.concurrent`** 包中的原子类，就是通过CAS来实现乐观锁。CAS全称 Compare And Swap（比较与交换），是一种无锁算法。在不使用锁（没有线程被阻塞）的情况下实现多线程之间的变量同步。**`java.util.concurrent`** 包中的原子类就是通过CAS来实现了乐观锁。

CAS算法涉及到三个操作数：

- 需要读写的内存值 V。
- 进行比较的值 A。
- 要写入的新值 B。

当且仅当 V 的值等于 A 时，CAS通过原子方式用新值B来更新V的值（“比较+更新”整体是一个原子操作），否则不会执行任何操作。一般情况下，“更新”是一个不断重试的操作。

之前提到java.util.concurrent包中的原子类，就是通过CAS来实现了乐观锁，那么我们进入原子类 **`AtomicInteger`** 的源码，看一下  **`AtomicInteger`** 的定义(JDK11的代码)：

```java

    /*
     * This class intended to be implemented using VarHandles, but there
     * are unresolved cyclic startup dependencies.
     */
    private static final jdk.internal.misc.Unsafe U = jdk.internal.misc.Unsafe.getUnsafe();
    private static final long VALUE = U.objectFieldOffset(AtomicInteger.class, "value");

    private volatile int value;
```

看一下getAndIncrement的实现

```java
    //获取并且增加
    public final int getAndIncrement() {
        return U.getAndAddInt(this, VALUE, 1);
    }

    @HotSpotIntrinsicCandidate
    public final int getAndAddInt(Object o, long offset, int delta) {
        int v;
        do {
            v = getIntVolatile(o, offset);
        } while (!weakCompareAndSetInt(o, offset, v, v + delta));
        return v;
    }

    @HotSpotIntrinsicCandidate
    public final boolean weakCompareAndSetInt(Object o, long offset,
                                              int expected,
                                              int x) {
        return compareAndSetInt(o, offset, expected, x);
    }

    @HotSpotIntrinsicCandidate
    public final native boolean compareAndSetInt(Object o, long offset,
                                                 int expected,
                                                 int x);
```

CAS算法的三个问题：

- **ABA问题** 。CAS需要在操作值的时候检查内存值是否发生变化，没有发生变化才会更新内存值。但是如果内存值原来是A，后来变成了B，然后又变成了A，那么CAS进行检查时会发现值没有发生变化，但是实际上是有变化的。ABA问题的解决思路就是在变量前面添加版本号，每次变量更新的时候都把版本号加一，这样变化过程就从“A－B－A”变成了“1A－2B－3A”。
- **循环时间长开销大** 。CAS操作如果长时间不成功，会导致其一直自旋，给CPU带来非常大的开销。
- **只能保证一个共享变量的原子操作**。对一个共享变量执行操作时，CAS能够保证原子操作，但是对多个共享变量操作时，CAS是无法保证操作的原子性的。

### 3. 自旋锁 VS 适应性自旋锁

自旋锁概念：阻塞或唤醒一个Java线程需要操作系统切换CPU状态来完成，这种状态转换需要耗费处理器时间。如果同步代码块中的内容过于简单，状态转换消耗的时间有可能比用户代码执行的时间还要长。

在许多场景中，同步资源的锁定时间很短，为了这一小段时间去切换线程，线程挂起和恢复现场的花费可能会让系统得不偿失。如果物理机器有多个处理器，能够让两个或以上的线程同时并行执行，我们就可以让后面那个请求锁的线程不放弃CPU的执行时间，看看持有锁的线程是否很快就会释放锁。

而为了让当前线程“稍等一下”，我们需让当前线程进行自旋，如果在自旋完成后前面锁定同步资源的线程已经释放了锁，那么当前线程就可以不必阻塞而是直接获取同步资源，从而避免切换线程的开销。这就是自旋锁。

自旋锁体现在代码上面就是通过循环来实现，例如 **`AtomicInteger`** 的 **`getAndIncrement`** 方法就是通过循环不断的来尝试。

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/%E8%87%AA%E6%97%8B%E9%94%81%E5%9B%BE%E8%A7%A3.png)

自旋锁本身是有缺点的，它不能代替阻塞。自旋等待虽然避免了线程切换的开销，但它要占用处理器时间。如果锁被占用的时间很短，自旋等待的效果就会非常好。反之，如果锁被占用的时间很长，那么自旋的线程只会白浪费处理器资源。所以，自旋等待的时间必须要有一定的限度，如果自旋超过了限定次数（默认是10次，可以使用         **`-XX:PreBlockSpin`** 来更改）没有成功获得锁，就应当挂起线程。

自旋锁的实现原理同样也是CAS，AtomicInteger中调用unsafe进行自增操作的源码中的do-while循环就是一个自旋操作，如果修改数值失败则通过循环来执行自旋，直至修改成功。

```java
 @HotSpotIntrinsicCandidate
    public final int getAndAddInt(Object o, long offset, int delta) {
        int v;
        //通过循环来自旋直到修改成功
        do {
            v = getIntVolatile(o, offset);
        } while (!weakCompareAndSetInt(o, offset, v, v + delta));
        return v;
    }
```

自适应意味着自旋的时间（次数）不再固定，而是由前一次在同一个锁上的自旋时间及锁的拥有者的状态来决定。如果在同一个锁对象上，自旋等待刚刚成功获得过锁，并且持有锁的线程正在运行中，那么虚拟机就会认为这次自旋也是很有可能再次成功，进而它将允许自旋等待持续相对更长的时间。如果对于某个锁，自旋很少成功获得过，那在以后尝试获取这个锁时将可能省略掉自旋过程，直接阻塞线程，避免浪费处理器资源。

在自旋锁中 另有三种常见的锁形式:TicketLock、CLHlock和MCSlock。

### 4. 无锁 VS 偏向锁 VS 轻量级锁 VS 重量级锁

首先为什么Synchronized能实现线程同步？

在回答这个问题之前我们需要了解两个重要的概念：“Java对象头”、“Monitor”。

#### Java对象头

synchronized是悲观锁，在操作同步资源之前需要给同步资源先加锁，这把锁就是存在Java对象头里的，而Java对象头又是什么呢？

我们以Hotspot虚拟机为例，Hotspot的对象头主要包括两部分数据：Mark Word（标记字段）、Klass Pointer（类型指针）。

**Mark Word**：默认存储对象的HashCode，分代年龄和锁标志位信息。这些信息都是与对象自身定义无关的数据，所以Mark  Word被设计成一个非固定的数据结构以便在极小的空间内存存储尽量多的数据。它会根据对象的状态复用自己的存储空间，也就是说在运行期间Mark  Word里存储的数据会随着锁标志位的变化而变化。

**Klass Point**：对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是哪个类的实例。

#### Monitor

Monitor可以理解为一个同步工具或一种同步机制，通常被描述为一个对象。每一个Java对象就有一把看不见的锁，称为内部锁或者Monitor锁。

Monitor是线程私有的数据结构，每一个线程都有一个可用monitor   record列表，同时还有一个全局的可用列表。每一个被锁住的对象都会和一个monitor关联，同时monitor中有一个Owner字段存放拥有该锁的线程的唯一标识，表示该锁被这个线程占用。

现在话题回到synchronized，synchronized通过Monitor来实现线程同步，Monitor是依赖于底层的操作系统的Mutex Lock（互斥锁）来实现的线程同步。

如同我们在自旋锁中提到的“阻塞或唤醒一个Java线程需要操作系统切换CPU状态来完成，这种状态转换需要耗费处理器时间。如果同步代码块中的内容过于简单，状态转换消耗的时间有可能比用户代码执行的时间还要长”。这种方式就是synchronized最初实现同步的方式，这就是JDK  6之前synchronized效率低的原因。这种依赖于操作系统Mutex Lock所实现的锁我们称之为“重量级锁”，JDK  6中为了减少获得锁和释放锁带来的性能消耗，引入了“偏向锁”和“轻量级锁”。

所以目前锁一共有4种状态，级别从低到高依次是：无锁、偏向锁、轻量级锁和重量级锁。锁状态只能升级不能降级。

通过上面的介绍，我们对synchronized的加锁机制以及相关知识有了一个了解，那么下面我们给出四种锁状态对应的的Mark Word内容，然后再分别讲解四种锁状态的思路以及特点：

|  锁状态  | 存储类容                                                | 状态 |
| :------: | :------------------------------------------------------ | :--: |
|   无锁   | 对象的hashCode、对象分代年龄、是否是偏向锁（0）         |  01  |
|  偏向锁  | 偏向线程ID、偏向时间戳、对象分代年龄、是否是偏向锁（1） |  01  |
| 轻量级锁 | 指向栈中锁记录的指针                                    |  00  |
| 重量级锁 | 指向互斥量（重量级锁）的指针                            |  10  |

**无锁**

无锁没有对资源进行锁定，所有的线程都能访问并修改同一个资源，但同时只有一个线程能修改成功。

无锁的特点就是修改操作在循环内进行，线程会不断的尝试修改共享资源。如果没有冲突就修改成功并退出，否则就会继续循环尝试。如果有多个线程修改同一个值，必定会有一个线程能修改成功，而其他修改失败的线程会不断重试直到修改成功。上面我们介绍的CAS原理及应用即是无锁的实现。无锁无法全面代替有锁，但无锁在某些场合下的性能是非常高的。

**偏向锁**

偏向锁是指一段同步代码一直被一个线程所访问，那么该线程会自动获取锁，降低获取锁的代价。

在大多数情况下，锁总是由同一线程多次获得，不存在多线程竞争，所以出现了偏向锁。其目标就是在只有一个线程执行同步代码块时能够提高性能。

当一个线程访问同步代码块并获取锁时，会在Mark  Word里存储锁偏向的线程ID。在线程进入和退出同步块时不再通过CAS操作来加锁和解锁，而是检测Mark  Word里是否存储着指向当前线程的偏向锁。引入偏向锁是为了在无多线程竞争的情况下尽量减少不必要的轻量级锁执行路径，因为轻量级锁的获取及释放依赖多次CAS原子指令，而偏向锁只需要在置换ThreadID的时候依赖一次CAS原子指令即可。

偏向锁只有遇到其他线程尝试竞争偏向锁时，持有偏向锁的线程才会释放锁，线程不会主动释放偏向锁。偏向锁的撤销，需要等待全局安全点（在这个时间点上没有字节码正在执行），它会首先暂停拥有偏向锁的线程，判断锁对象是否处于被锁定状态。撤销偏向锁后恢复到无锁（标志位为“01”）或轻量级锁（标志位为“00”）的状态。

偏向锁在JDK 6及以后的JVM里是默认启用的。可以通过JVM参数关闭偏向锁：-XX:-UseBiasedLocking=false，关闭之后程序默认会进入轻量级锁状态。

**轻量级锁**

是指当锁是偏向锁的时候，被另外的线程所访问，偏向锁就会升级为轻量级锁，其他线程会通过自旋的形式尝试获取锁，不会阻塞，从而提高性能。

在代码进入同步块的时候，如果同步对象锁状态为无锁状态（锁标志位为“01”状态，是否为偏向锁为“0”），虚拟机首先将在当前线程的栈帧中建立一个名为锁记录（Lock  Record）的空间，用于存储锁对象目前的Mark Word的拷贝，然后拷贝对象头中的Mark Word复制到锁记录中。

拷贝成功后，虚拟机将使用CAS操作尝试将对象的Mark Word更新为指向Lock Record的指针，并将Lock Record里的owner指针指向对象的Mark Word。

如果这个更新动作成功了，那么这个线程就拥有了该对象的锁，并且对象Mark Word的锁标志位设置为“00”，表示此对象处于轻量级锁定状态。

如果轻量级锁的更新操作失败了，虚拟机首先会检查对象的Mark Word是否指向当前线程的栈帧，如果是就说明当前线程已经拥有了这个对象的锁，那就可以直接进入同步块继续执行，否则说明多个线程竞争锁。

若当前只有一个等待线程，则该线程通过自旋进行等待。但是当自旋超过一定的次数，或者一个线程在持有锁，一个在自旋，又有第三个来访时，轻量级锁升级为重量级锁。

**重量级锁**

升级为重量级锁时，锁标志的状态值变为“10”，此时Mark Word中存储的是指向重量级锁的指针，此时等待锁的线程都会进入阻塞状态。

整体的锁状态升级流程如下：

![图片](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/%E9%94%81%E7%9A%84%E5%8D%87%E7%BA%A7%E6%B5%81%E7%A8%8B.png)

综上，偏向锁通过对比Mark Word解决加锁问题，避免执行CAS操作。而轻量级锁是通过用CAS操作和自旋来解决加锁问题，避免线程阻塞和唤醒而影响性能。重量级锁是将除了拥有锁的线程以外的线程都阻塞。

### 5 公平锁 VS 非公平锁

公平和不公平是看是否按照先来后到的顺序。

- **公平锁**：指多个线程按照申请锁的顺序来获取锁，线程直接进入队列中排队，队列中的第一个线程才能获得锁。公平锁的优点是等待锁的线程不会饿死。
  - **优点**：等待锁的线程不会饿死
  - **缺点**：整体吞吐效率相对非公平锁要低，等待队列中除第一个线程以外的所有线程都会阻塞，CPU唤醒阻塞线程的开销比非公平锁大。
- **非公平锁**：多个线程加锁时**直接尝试获取锁** ，获取不到才会到等待队列的队尾等待。但如果此时锁刚好可用，那么这个线程可以无需阻塞直接获取到锁，所以非公平锁 **有可能出现后申请锁的线程先获取锁的场景** 。
  - **优点**：可以减少唤起线程的开销，整体的吞吐效率高，因为线程有几率不阻塞直接获得锁，CPU不必唤醒所有线程。
  - **缺点**：处于等待队列中的线程可能会饿死，或者等很久才会获得锁。

------

公平锁图解：

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/%E5%85%AC%E5%B9%B3%E9%94%81%E8%BF%90%E8%A1%8C%E5%9B%BE%E8%A7%A3.png)

------

非公平锁图解：

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/%E9%9D%9E%E5%85%AC%E5%B9%B3%E9%94%81%E7%9A%84%E5%9B%BE%E8%A7%A3.png)

公平锁和非公平锁在Java中的实现，以 **`ReentrantLock`** (重入锁)为例子：

```java
package java.util.concurrent.locks;
import java.util.concurrent.TimeUnit;
import java.util.Collection;

public class ReentrantLock implements Lock, java.io.Serializable {
    private static final long serialVersionUID = 7373984872572414699L;
    /** Synchronizer providing all implementation mechanics */
    private final Sync sync;

    /**
     * Base of synchronization control for this lock. Subclassed
     * into fair and nonfair versions below. Uses AQS state to
     * represent the number of holds on the lock.
     */
    abstract static class Sync extends AbstractQueuedSynchronizer {
        private static final long serialVersionUID = -5179523762034025860L;

        /**
         * Performs {@link Lock#lock}. The main reason for subclassing
         * is to allow fast path for nonfair version.
         */
        abstract void lock();

        /**
         * Performs non-fair tryLock.  tryAcquire is implemented in
         * subclasses, but both need nonfair try for trylock method.
         */
        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }

        protected final boolean tryRelease(int releases) {
            int c = getState() - releases;
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            boolean free = false;
            if (c == 0) {
                free = true;
                setExclusiveOwnerThread(null);
            }
            setState(c);
            return free;
        }

        protected final boolean isHeldExclusively() {
            // While we must in general read state before owner,
            // we don't need to do so to check if current thread is owner
            return getExclusiveOwnerThread() == Thread.currentThread();
        }

        final ConditionObject newCondition() {
            return new ConditionObject();
        }

        // Methods relayed from outer class

        final Thread getOwner() {
            return getState() == 0 ? null : getExclusiveOwnerThread();
        }

        final int getHoldCount() {
            return isHeldExclusively() ? getState() : 0;
        }

        final boolean isLocked() {
            return getState() != 0;
        }

        /**
         * Reconstitutes the instance from a stream (that is, deserializes it).
         */
        private void readObject(java.io.ObjectInputStream s)
            throws java.io.IOException, ClassNotFoundException {
            s.defaultReadObject();
            setState(0); // reset to unlocked state
        }
    }

    /**
     * Sync object for non-fair locks
     */
    static final class NonfairSync extends Sync {
        private static final long serialVersionUID = 7316153563782823691L;

        /**
         * Performs lock.  Try immediate barge, backing up to normal
         * acquire on failure.
         */
        final void lock() {
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1);
        }

        protected final boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }

    /**
     * Sync object for fair locks
     */
    static final class FairSync extends Sync {
        private static final long serialVersionUID = -3000897897090466540L;

        final void lock() {
            acquire(1);
        }

        /**
         * 公平锁tryAcquire的实现
         */
        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState(); //获取资源的状态
            if (c == 0) {// 为0表明资源没有被占用
                //公平锁多了一个hasQueuedPredecessors判断
                if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0)
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
    }

    //默认创建的是非公平锁
    public ReentrantLock() {
        sync = new NonfairSync();
    }

    //true公平锁，false非公平锁
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }


    public void lock() {
        sync.lock();
    }

    public void lockInterruptibly() throws InterruptedException {
        sync.acquireInterruptibly(1);
    }

    //尝试获取锁
    public boolean tryLock() {
        return sync.nonfairTryAcquire(1);
    }
	
    //尝试获取锁
    public boolean tryLock(long timeout, TimeUnit unit)
            throws InterruptedException {
        return sync.tryAcquireNanos(1, unit.toNanos(timeout));
    }

    //释放锁
    public void unlock() {
        sync.release(1);
    }
	
    //判断是否为公平锁--公平锁和非公平锁两种实现
    public final boolean isFair() {
        return sync instanceof FairSync;
    }

}

```

```java
//判断当前线程是否为队列的的第一个    
public final boolean hasQueuedPredecessors() {
        // The correctness of this depends on head being initialized
        // before tail and on head.next being accurate if the current
        // thread is first in queue.
        Node t = tail; // Read fields in reverse initialization order
        Node h = head;
        Node s;
        return h != t &&
            ((s = h.next) == null || s.thread != Thread.currentThread());
    }
```

从上面的实现来看，公平锁就是通过同步队列来实现多个线程按照申请锁的顺序来获取锁，从而实现公平的特性。非公平锁加锁时不考虑排队等待问题，直接尝试获取锁，所以存在后申请却先获得锁的情况。符合公平锁和非公平锁的特点。

### 6. 可重入锁 VS 非可重入锁

- **可重入锁**：又名递归锁，是指在同一个线程在外层方法获取锁的时候，在进入该线程内层方法会自动获取锁（前提锁对象得是同一个对象或者class）。不会因为之前或去过还没释放而阻塞。Java中 **`ReentrantLock`** 和 **`synchronized`** 都是可重入锁。

  - 优点：一定程度避免死锁。

  ```java
  public class A {
      public synchronized void a() {
          System.out.println("a...");
          b();
      }
  
      public synchronized void b() {
          System.out.println("b...");
      }
  }
  ```

  两个方法都是被内置锁synchronized修饰，a方法中调用了b方法。因为内置锁可以重入。所以线程在调用b方法的时候可以直接获取对象的锁，进入b方法进行操作，如果非重入锁，由于a和b锁是同一个对象。那么当前线程调用b之前要将执行a时获取当前的对象的锁释放掉，然而在没有运行完a方法，当前线程释放不了当前对象锁。所以出现死锁的现象。通俗的说：**把a和b方法当做两个房间，重入锁好比，进入a放假的钥匙同样能够进入b房间然后完成一一锁好退出来。非重入锁：先进入了a房间，但是要走出a房间释放a房间需要进入b房间。但是b房间的钥匙被a房间用了不能重复使用。这样导致了死锁，导致出不去a房间也进不去b房间**。

- **非可重入锁**：锁对象被占用后在没有释放之前不允许其他的线程获取同一个锁。Java中的 **`NonReentrantLock`** 就是非可重入锁的实现

重入锁图解：

![重入锁图解](https://github.com/mxsm/document/blob/master/image/JSE/%E9%87%8D%E5%85%A5%E9%94%81%E5%9B%BE%E8%A7%A3.png?raw=true)

非重入锁图解：

![图解](https://github.com/mxsm/document/blob/master/image/JSE/%E9%9D%9E%E9%87%8D%E5%85%A5%E9%94%81%E5%9B%BE%E8%A7%A3.png?raw=true)

以 **`NonReentrantLock`** 和 **`ReentrantLock`** 的代码来看一下实现的区别(JDK8)

首先是非重入锁（ **`NonReentrantLock`** ）：

```java
	//锁的获取   
@Override
    protected boolean tryAcquire(int acquires) {
        //直接通过compareAndSetState来获取锁
        if (compareAndSetState(0, 1)) {
            //设置当前锁的拥有者为当前的获取锁线程
            owner = Thread.currentThread();
            return true;//获取成功返回true
        }
        return false;//获取失败返回false
    }
//锁的释放
  @Override
    protected boolean tryRelease(int releases) {
        //判断释放锁的线程是否为拥有锁的线程
        if (Thread.currentThread() != owner) {
            throw new IllegalMonitorStateException();
        }
        owner = null;
        //直接修改为0
        setState(0);
        return true;
    }
```

对比看一下重入锁（ **`ReentrantLock`** ）：

```java
//尝试获取锁--非公平锁
final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
    		//没有线程占有锁
            if (c == 0) {
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
    		//判断获取锁的线程和之前获取锁的线程是否为同一个
            else if (current == getExclusiveOwnerThread()) {
                //如果是state+acquires(该数值为1)
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
	   //重入锁的释放
        protected final boolean tryRelease(int releases) {
            //释放的占有锁的线程数
            int c = getState() - releases;
            //对线程进行判断
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            //默认是释放失败的
            boolean free = false;
            //如果为0释放完
            if (c == 0) {
                free = true;
                //独有的锁的拥有线程设置为null
                setExclusiveOwnerThread(null);
            }
            //设置status的值
            setState(c);
            return free;
        }
```

从上面的代码分析通过对status值的控制来实现重入锁和非重入锁。而 **`synchronized`** 是虚拟机底层实现。水平有限没办法分析。

### 7 独享锁 VS 共享锁

- **独享锁**：也叫做排他锁，是指该锁只能被一个线程所持有。线程T对数据A加上排他锁后，其他线程不能对A加任何类型的锁。获得排它锁的线程即能读数据又能修改数据。JDK中的 **synchronized** 和JUC( **`java.util.concurrent`** )中Lock的实现类就是互斥锁—([锁的相关文章](http://www.iocoder.cn/JUC/good-collection/))。 **`ReentrantReadWriteLock.WriteLock`**
- **共享锁**：该锁可以被多个线程持有，如果线程T对数据A加上共享锁后，则其他线程只能对A再加共享锁，不能加排它锁。获得**共享锁的线程只能读数据，不能修改数据**。 **`ReentrantReadWriteLock.ReadLock`**

独享锁和共享锁都是通过AbstractQueuedSynchronizer(简称AQS)，队列同步器来实现的。

```java
public class ReentrantReadWriteLock
        implements ReadWriteLock, java.io.Serializable {
    private static final long serialVersionUID = -6992448646407690164L;
    /** 内部类提供的读锁 */
    private final ReentrantReadWriteLock.ReadLock readerLock;
    /** 内部类提供的写锁 */
    private final ReentrantReadWriteLock.WriteLock writerLock;
    /** Performs all synchronization mechanics */
    final Sync sync;

    /**
     * 读写说默认创建的是非公平锁
     * 
     */
    public ReentrantReadWriteLock() {
        this(false);
    }

    public ReentrantReadWriteLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
        readerLock = new ReadLock(this);
        writerLock = new WriteLock(this);
    }
    
    //......
}
```

Sync代码

```java
 		static final int SHARED_SHIFT   = 16;
        static final int SHARED_UNIT    = (1 << SHARED_SHIFT);
		//读锁和写锁的最大值
        static final int MAX_COUNT      = (1 << SHARED_SHIFT) - 1;
		//独占锁写的标志位int的第16位
        static final int EXCLUSIVE_MASK = (1 << SHARED_SHIFT) - 1;

        /** Returns the number of shared holds represented in count  */
        static int sharedCount(int c)    { return c >>> SHARED_SHIFT; }
        /***/
        static int exclusiveCount(int c) { return c & EXCLUSIVE_MASK; }
```

**`ReentrantReadWriteLock.WriteLock（重入锁）`** 的加锁代码

```java
//加锁
public void lock() {
            sync.acquire(1);
        }
//方法acquire
public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }

protected final boolean tryAcquire(int acquires) {
            //获取当前的获取锁的线程
            Thread current = Thread.currentThread();
    		//获取当前锁的个数
            int c = getState();
    		//获取写锁的数量--低16位
            int w = exclusiveCount(c);
    		//不等于0--已经有线程持有了锁
            if (c != 0) {
                 //写锁为0总的锁不为0说明存在读锁，或者当前线程不是持有锁的线程返回false
                if (w == 0 || current != getExclusiveOwnerThread())
                    return false;
                //现有的写锁加上当前的锁大于最大值MAX_COUNT 抛错
                if (w + exclusiveCount(acquires) > MAX_COUNT 抛错)
                    throw new Error("Maximum lock count exceeded");
                // Reentrant acquire
				//设置锁的数量
                setState(c + acquires);
                return true;
            }
    		//对于非公平锁writerShouldBlock在JDK8中总是返回false
            if (writerShouldBlock() ||
                !compareAndSetState(c, c + acquires))
                return false;
            setExclusiveOwnerThread(current);
            return true;
        }
```

从上面的代码梳理一下 **`WriteLock`** 加锁的过程：

1. 调用 **`ReentrantReadWriteLock.WriteLock`** 对象的 **`lock`** 方法。
2. **`lock`** 方法调用 **`sync.acquire(1)`** ，获取的值为1。
3. **`tryAcquire`**尝试获取锁，如果获取成功就不用执行下一个判断 **`acquireQueued`**

**`tryAcquire`** 的获取加锁过程：

1. 获取当前线程 **`current`** (这个只的是获取锁对象的线程)
2. 获取锁的个数 **`c`**(读锁和写锁)
3. 获取写锁的个数 **`w`**（int的低16位）
4. 判断锁的数量 **`c`**不等于0
   - 不等于0
     - 写锁**`w`**等于0或者获取锁的线程不等于锁的拥有者线程，返回**`false`**
     - 写锁**`w`**+请求的锁 > 写锁的最大值MAX_COUNT，直接抛错
     - 设置设置锁的数量然后返回true获取锁成功
5. 对于非公平锁 **`writerShouldBlock()`** 一直返回的是false,所以看后面的 **`compareAndSetState`** 的设置如果失败返回 **`false`** 获取写锁失败
6. **`compareAndSetState`** 设置成功，设置当前说的拥有者为现在获取线程的对象。

------

**`ReentrantReadWriteLock.ReadLock`** 的加锁代码

```java
        @ReservedStackAccess
        protected final int tryAcquireShared(int unused) {
            /*
             * Walkthrough:
             * 1. 如果另一个线程持有写锁,获取读锁失败.
             * 2. Otherwise, this thread is eligible for
             *    lock write state, so ask if it should block
             *    because of queue policy. If not, try
             *    to grant by CASing state and updating count.
             *    Note that step does not check for reentrant
             *    acquires, which is postponed to full version
             *    to avoid having to check hold count in
             *    the more typical non-reentrant case.
             * 3. If step 2 fails either because thread
             *    apparently not eligible or CAS fails or count
             *    saturated, chain to version with full retry loop.
             */
            Thread current = Thread.currentThread();
            int c = getState();
            if (exclusiveCount(c) != 0 &&
                getExclusiveOwnerThread() != current)
                return -1;
            int r = sharedCount(c);
            if (!readerShouldBlock() &&
                r < MAX_COUNT &&
                compareAndSetState(c, c + SHARED_UNIT)) {
                if (r == 0) {
                    firstReader = current;
                    firstReaderHoldCount = 1;
                } else if (firstReader == current) {
                    firstReaderHoldCount++;
                } else {
                    HoldCounter rh = cachedHoldCounter;
                    if (rh == null ||
                        rh.tid != LockSupport.getThreadId(current))
                        cachedHoldCounter = rh = readHolds.get();
                    else if (rh.count == 0)
                        readHolds.set(rh);
                    rh.count++;
                }
                return 1;
            }
            return fullTryAcquireShared(current);
        }
```

可以看到在tryAcquireShared(int 
unused)方法中，如果其他线程已经获取了写锁，则当前线程获取读锁失败，进入等待状态。如果当前线程获取了写锁或者写锁未被获取，则当前线程（线程安全，依靠CAS保证）增加读状态，成功获取读锁。读锁的每次释放（线程安全的，可能有多个读线程同时释放读锁）均减少读状态，减少的值是“1<<16”。所以读写锁才能实现读读的过程共享，而读写、写读、写写的过程互斥。

### 8. 锁的总结

| 锁               | 公平锁     | 非公平锁   | 重入锁 | 非重入锁 | 独享锁 | 共享锁 | 悲观锁 | 乐观锁 | 自旋锁 | 适应性自旋锁 |
| ---------------- | ---------- | ---------- | ------ | -------- | ------ | ------ | ------ | ------ | ------ | ------------ |
| synchronized     | ×          | √          | √      | ×        | √      | ×      | √      | ×      | ×      | ×            |
| ReentrantLock    | 看构造函数 | 看构造函数 | √      | ×        | √      | ×      | √      | ×      | √      | √            |
| NonReentrantLock | 看构造函数 | 看构造函数 | ×      | √        | √      | ×      | √      | ×      | √      | √            |
| ReadLock         | 看构造函数 | 看构造函数 | √      | ×        | ×      | √      | ×      | √      | √      | √            |
| WriteLock        | 看构造函数 | 看构造函数 | √      | ×        | √      | ×      | √      | ×      | √      | √            |

参考文档：[不可不说的Java“锁”事--来自美团](https://tech.meituan.com/2018/11/15/java-lock.html)

