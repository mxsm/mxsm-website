---
title: Thread的常用方法
categories:
  - Java
  - JSE
  - 并发和多线程
tags:
  - Java
  - JSE
  - 并发和多线程
abbrlink: bd87e127
date: 2019-02-22 04:08:49
---
### Thread.sleep—static方法

让当前线程睡眠(**睡眠达到后，无法保证立刻被JVM调度**)，所以他不会让其他的线程也处于休眠，线程休眠不会失去拥有的对象锁。作用：保持对象锁，让出CPU,调用目的是不让当前线程独霸CPU的资源。留一定的机会给其他的线程。休眠的实际时间的精度和准确性受系统的调度器和计数器的影响。

```java
 public static void sleep(long millis, int nanos)
    throws InterruptedException {
        if (millis < 0) {
            throw new IllegalArgumentException("timeout value is negative");
        }

        if (nanos < 0 || nanos > 999999) {
            throw new IllegalArgumentException(
                                "nanosecond timeout value out of range");
        }

        if (nanos >= 500000 || (nanos != 0 && millis == 0)) {
            millis++;
        }

        sleep(millis);
    }
public static native void sleep(long millis) throws InterruptedException;
```

纳秒级别的sleep没有实现。只是在数据判断后进行了微秒级别上进行了调整。

### Thread.currentThread —static方法

返回一个当前代码执行线程的引用对象

```java
public class ThreadTest {

    public static void main(String[] args) throws  Exception{

        Test test = new Test();
       Thread thread = new Thread(test);
       thread.setName("A");
       thread.start();
    }

}

class Test extends Thread{

    public Test(){
        System.out.println("Test 1 "+Thread.currentThread().getName());
        System.out.println("Test 2 "+this.getName());
    }

    @Override
    public void run() {
        System.out.println("run 1 "+Thread.currentThread().getName());
        System.out.println("run 2 "+this.getName());
    }
}
```

运行的结果：

Test 1 main
Test 2 Thread-0
run 1 A
run 2 Thread-0

执行Test的构造函数是main线程，执行run方法的是A线程。 this表示的是Test线程。

### Thread.isAlive — 实例方法

isAlive();是测试线程的run();方法是否还在进行，还在进行返回true，运行完返回false，还没有开始运行返回false

```java
public class ThreadTest {

    public static void main(String[] args) throws  Exception{

        Test test = new Test();
        Thread thread = new Thread(test);
        System.out.println(thread.isAlive());
        System.out.println(thread.isAlive());
        thread.start();
        System.out.println(thread.isAlive());
        System.out.println(thread.isAlive());
        Thread.sleep(50);
        System.out.println(thread.isAlive());
        Thread.sleep(40);
        System.out.println(thread.isAlive());
        Thread.sleep(40);
        System.out.println(thread.isAlive());
    }

}

class Test implements Runnable{

    @Override
    public void run() {
        for(int i=0; i<10;++i){
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(i);
        }
    }
}
```

某一次运行结果

false
false
true
true
0
1
2
3
4
true
5
6
7
true
8
9
false

### Thread.interrupt — 实例方法

作用：调用**`Thread`对象**的**`interrupt`**函数并不是立中断线程，而只是将**线程中的终端状态设置为true**,当线程运行其中有调用阻塞的函数时(Thread.sleep,Object.wait,Thread.join等)，阻塞函数调用后会不断的轮询检测中断状态的标注是否为true,这停止阻塞并且抛出**`InterruptedException`**异常，同时还会重置中断状态标志位**false**。有循环则继续阻塞直到正常结束。

演示代码如下：

```java
public class ThreadTest {

    public static void main(String[] args) throws  Exception{

        Test test = new Test();
        Thread thread = new Thread(test);
        thread.start();
        long i = System.currentTimeMillis();
        while (System.currentTimeMillis() - i < 10 * 1000) {
            thread.isAlive();
        }
        //打断阻塞--将线程的isInterrupted设置为true
        thread.interrupt();

    }

}

class Test implements Runnable{

    @Override
    public void run() {
        System.out.println("start work");
        while (!Thread.currentThread().isInterrupted()){
            System.out.println("doing work");
            try {
                //不停的轮询检测终端的标志位是否为true
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                //抛出异常设置为false
                e.printStackTrace();
                //设置标志位为true--跳出wile循环,否则会一直死循环
                Thread.currentThread().interrupt();
            }
        }
        System.out.println("done woring");
    }
}
```

### Thread.setDaemon — 实例方法

Java中的线程分为两类：

- **用户线程**：Thread.setDaemon(false)设置为用户线程，如果不设置默认为用户线程
- **守护线程**：Thread.setDaemon(true)设置为守护线程

两者之间的区别：

- 主线程结束后用户线程还在继续运行，JVM存活。
- 如果没有用户线程，都是守护线程，那么JVM结束。

注意一下几点：

- Thread.setDaemon(true)必须在thread.start()之前，你不能把一个正常运行的用户线程设置为守护线程,会抛出`IllegalThreadStateException`一个错误

- ```java
  public class ThreadTest {
  
      public static void main(String[] args) throws  Exception{
  
          Test test = new Test();
          Thread thread = new Thread(test);
          thread.start();
          thread.setDaemon(true); //会抛出IllegalThreadStateException 但是线程还是正常的工作
          long i = System.currentTimeMillis();
          while (System.currentTimeMillis() - i < 3 * 1000) {
              thread.isAlive();
          }
          thread.interrupt();
      }
  }
  
  ```

  

- 在Daemon线程中产生的新线程也是Daemon的

  ```java
  public class ThreadTest1 {
  
      public static void main(String[] args) {
          Thread thread = new Thread(()->{
              Thread threada = new Thread(()->{
                  System.out.println(Thread.currentThread().getName() + "  " + Thread.currentThread().isDaemon()); //打印的是Thread-1  true
                  System.out.println(Thread.currentThread().getThreadGroup().getName());
              });
              threada.start();
          });
          thread.setDaemon(true);
          thread.start();
          //如果没有后面的Thread.sleep
          try {
              Thread.sleep(5000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
      }
  }
  ```

- 不要认为所有的应用都可以分配给Daemon来进行服务，比如读写操作或者计算逻辑。
  写java多线程程序时，一般比较喜欢用java自带的多线程框架，比如ExecutorService，但是java的线程池会将守护线程转换为用户线程，所以如果要使用后台线程就不能用java的线程池

  ```java
  static class DefaultThreadFactory implements ThreadFactory {
          private static final AtomicInteger poolNumber = new AtomicInteger(1);
          private final ThreadGroup group;
          private final AtomicInteger threadNumber = new AtomicInteger(1);
          private final String namePrefix;
  
          DefaultThreadFactory() {
              SecurityManager s = System.getSecurityManager();
              group = (s != null) ? s.getThreadGroup() :
                                    Thread.currentThread().getThreadGroup();
              namePrefix = "pool-" +
                            poolNumber.getAndIncrement() +
                           "-thread-";
          }
  
          public Thread newThread(Runnable r) {
              Thread t = new Thread(group, r,
                                    namePrefix + threadNumber.getAndIncrement(),
                                    0);
              if (t.isDaemon())
                  //设置为非守护线程
                  t.setDaemon(false);
              if (t.getPriority() != Thread.NORM_PRIORITY)
                  //优先级设置为正常
                  t.setPriority(Thread.NORM_PRIORITY);
              return t;
          }
      }
  ```

  

### Thread.join — 类方法

线程合并

- **不带超时参数**：当我们在线程调用 **`join（）`** 方法的时候，当前线程进入等待状态，直到等待引用线程中止。 **`join()`** 也可能返回如引用的线程被**interrupted**。如果引用线程早已经中止或者还没有调用 **start** 方法，调用 **join()** 立刻返回

- **有超时参数**：调用 **`join()`** 方法不带超时时间，引用的线程阻塞或者执行时间较长，那么线程就会一直阻塞，这样可能会变成一个没有响应的问题。为了解决这个问题我们设置一个超时时间。超时时间为0将不会超时。和没有超时参数是一个效果。

- **join()和同步**：调用 **`join()`** 方法有同步的效果，等待线程直到引用中止。join()创建了 **Happens-before** 关系（*All actions in a thread happen-before any other thread successfully returns from a join() on that thread*）。这就意味着当线程**t1**调用**t2.join()**所有的 **t2** 的改变返回在 **t1** 都是可见的，然而我们不调用 **join()** 或者使用其他的同步机制。我们不能保证当 **t2** 完成或者甚至其他的线程完成在 **t1** 线程中可见。因此即使被调用的线程是中止状态立刻返回，在某些情况下我们仍然需要调用。

  ```java
  SampleThread t4 = new SampleThread(10);
  t4.start();
  // not guaranteed to stop even if t4 finishes.
  do {
          
  } while (t4.processingCount > 0);
  ```

  为了同步上面的代码块，我们可以加入 **`t4.join()`** 而不是循环或者其他的同步机制

```java
public class ThreadJoinExample {
    public static void main(String[] args) {
        Thread t1 = new Thread(new MyRunnable(), "t1");
        Thread t2 = new Thread(new MyRunnable(), "t2");
        Thread t3 = new Thread(new MyRunnable(), "t3");

        t1.start();

        try {
            //Thread started:::t1
            t1.join(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        t2.start();

        try {
            //Thread started:::t2
            //Thread ended:::t1
            t1.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        t3.start();
        //Thread started:::t3
        try {
            t1.join();
            t2.join();
            //Thread ended:::t2
            t3.join();
            //Thread ended:::t3
        } catch (InterruptedException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        System.out.println("All threads are dead, exiting main thread");
    }


}
class MyRunnable implements Runnable{

    @Override
    public void run() {
        System.out.println("Thread started:::"+Thread.currentThread().getName());
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("Thread ended:::"+Thread.currentThread().getName());
    }

}
```

### Thread.yield — 静态方法

正如官方文档说明的那样， **`yield()`** 提供了一个通知 **`scheduler`** 的机制， **当前线程愿意放弃当前对处理器的使用，但希望能尽快将其调度回来** 。“调度程序”可以自由地坚持或忽略这些信息，实际上，根据操作系统的不同，调度程序有不同的行为。

```java
public class ThreadYield {
    public static void main(String[] args) {
        Runnable r = () -> {
            int counter = 0;
            while (counter < 2) {
                System.out.println(Thread.currentThread()
                    .getName());
                counter++;
                Thread.yield();
            }
        };
        new Thread(r).start();
        new Thread(r).start();
    }
}
```

某一次运行结果：

```
Thread-0
Thread-1
Thread-0
Thread-1
```

某一次运行结果：

```
Thread-0
Thread-1
Thread-1
Thread-0
```

#### yield() VS wait()

- **`yield()`** 可以在上下文中调用，而 **`wait()`** 只能在同步块或方法中显式获取的锁上调用。
- 与 **`yield()`** 不同， **`wait()`** 可以指定在再次调度线程之前等待的最小时间周期。
- **`wait()`** ，还可以通过在任何时候通过调用相关锁对象上的 **`notify()`** 或 **`notifyAll()`** 来唤醒线程

#### yield() VS sleep()

- **`yield()`** 只能试探地尝试挂起当前线程的执行，而不能保证它何时被调度回来，而 **`sleep()`** 可以强制调度程序将当前线程的执行挂起参数设置的一段时间。

#### yield() VS join()

- 当前线程可以调用其他任何线程的 **`join()`** 来让当前线程等待直到其他调用的线程中止
- **`join()`** 一个时间作为参数，该参数指示当前线程在恢复之前应该等待的最大时间

正如官方文档所建议的，很少需要使用 **`yield()`** ，因此应该避免使用，除非根据其行为非常清楚地了解目标。尽管如此， **`yield()`** 的一些用途包括设计并发控制结构、改进计算密集型程序中的系统响应能力等。



### 结束线程

- 使用 **`interrupt`** 方法
- 使用return停止线程
