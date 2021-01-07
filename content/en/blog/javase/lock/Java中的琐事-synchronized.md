---
title: Java中的琐事-synchronized
categories:
  - Java
  - JSE
  - 锁
tags:
  - Java
  - JSE
  - 锁
abbrlink: 57e6d4e7
date: 2019-04-24 12:24:44
---
### 1.  java的内置锁和显示锁

- **内置锁**：每一个Java对象都可以用作一个实现同步的锁，这些锁被称为**内置锁**，线程进入代码块或者方法的时候自动获得该锁，在退出同步代码或者方法的时候会释放该锁。内置锁通过关键字 **`synchronized`** 来使用。

  内置锁是互斥锁是一把互斥锁，换句话说就是只有一个线程能够获得该锁。

- **显示锁**：显式锁(**`ReentrantLock`**)正式为了解决这些灵活需求而生。 **`ReentrantLock`** 的字面意思是*可重入锁*，可重入的意思是线程可以同时多次请求同一把锁，而不会自己导致自己死锁。

- **显示锁和内置锁的区别**：

  - 显示锁可定时，提供了一种以定时方式结束等待的方法。如果线程在规定时间内没有获得锁，直接返回   **`false`** 。而内置锁会一直等待直到获取到锁。
  - 显示锁可中断，提供了一种 **`RenentrantLock.lockInterruptibly()`** 中断的方式。
  - 显示锁实现了公平锁和非公平锁，而内置锁是非公平锁，显示锁的选择更多。

### 2. 关键字 **`synchronized`**

**`synchronized`** 关键字提供了我们操作 **`Java`** 的内置锁。

#### 2.1 对象锁和类锁

- **对象锁**： **`sychronized`** 关键字添加到非 **`static`** 方法上或者 **`synchonized(this){....}`** 和 **`synchonized(非this对象){....}`** 代码快获取的就是对象锁。

- **类锁**：添加到 **`static`** 静态方法上，或者 **`synchonized(xxxx.class)`** 代码块。获取的都是类锁。

  ```java
  public class SynchronizedLocked {
  
      //对象锁
      public synchronized void a(){
  
      }
  
      public void b(){
          //对象锁
          synchronized (this){
  
          }
      }
  
      //类锁
      public synchronized static void c(){
  
      }
  
      public void d(){
          //类锁
          synchronized (SynchronizedLocked.class){
  
          }
      }
  
  }
  ```

  1. 一段 **`synchronized`** 的代码被一个线程执行之前，他要先拿到执行这段代码的权限。
  2. 在Java里边就是拿到某个同步对象的锁（一个对象只有一把锁）
  3. 如果这个时候同步对象的锁被其他线程拿走了，他（这个线程）就只能等了（线程阻塞在锁池等待队列中）
  4. 取到锁后，他就开始执行同步代码(被 **`synchronized`** 修饰的代码）
  5. 线程执行完同步代码后马上就把锁还给同步对象，其他在锁池中等待的某个线程就可以拿到锁执行同步代码了
  6. 这样就保证了同步代码在统一时刻只有一个线程在执行

#### 2.2 代码验证

**`synchronized`** 在对象方法上

```java
public class SynchronizedLocked {

    public static void main(String[] args) {
        HasSelfPrivateNum numRef = new HasSelfPrivateNum();

        ThreadA athread = new ThreadA(numRef);
        athread.setName("ThreadA");
        athread.start();

        ThreadB bthread = new ThreadB(numRef);
        bthread.setName("ThreadB");
        bthread.start();

    }

}

class HasSelfPrivateNum{

     public void addI() {
        try {
            System.out.println(Thread.currentThread().getName() + " 进入时间 "  + System.currentTimeMillis());
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + " 出去时间 "  + System.currentTimeMillis());
        } catch (InterruptedException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}

class ThreadA extends Thread {

    private HasSelfPrivateNum numRef;

    public ThreadA(HasSelfPrivateNum numRef) {
        super();
        this.numRef = numRef;
    }

    @Override
    public void run() {
        numRef.addI();
    }

}



class ThreadB extends Thread {

    private HasSelfPrivateNum numRef;

    public ThreadB(HasSelfPrivateNum numRef) {
        super();
        this.numRef = numRef;
    }

    @Override
    public void run() {
        numRef.addI();
    }
}
```

方法 **`addI`** 没有加锁的情况下打印结果

```
ThreadA 进入时间 1551161742564
ThreadB 进入时间 1551161742565
ThreadA 出去时间 1551161744565
ThreadB 出去时间 1551161744566
```

给 **`HasSelfPrivateNum`** 类的 **`addI`** 方法加上 **`synchronized`** 

```java
class HasSelfPrivateNum{

     public synchronized void addI() {
        try {
            System.out.println(Thread.currentThread().getName() + " 进入时间 "  + System.currentTimeMillis());
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + " 出去时间 "  + System.currentTimeMillis());
        } catch (InterruptedException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}
```

方法 **`addI`** 没有加锁的情况下打印结果

```
ThreadA 进入时间 1551162012348
ThreadA 出去时间 1551162014350
ThreadB 进入时间 1551162014350
ThreadB 出去时间 1551162016353
```

**实验结论**： 两个线程访问同一个对象中的同步方法是线程安全的。上面的同步方法先打印出了 **`ThreadA`** 然后打印出了 **`ThreadB`** 。（**注意这里是同一个对象**），那么如果是多个对象又会怎么样呢？看如下代码

```java
//这里代码不同在于用了两个对象numRef1 numRef2
public class SynchronizedLocked {

    public static void main(String[] args) {
        HasSelfPrivateNum numRef1 = new HasSelfPrivateNum();

        ThreadA athread = new ThreadA(numRef1);
        athread.setName("ThreadA");
        athread.start();

        HasSelfPrivateNum numRef2 = new HasSelfPrivateNum();
        ThreadB bthread = new ThreadB(numRef2);
        bthread.setName("ThreadB");
        bthread.start();

    }

}

class HasSelfPrivateNum{

     public synchronized void addI() {
        try {
            System.out.println(Thread.currentThread().getName() + " 进入时间 "  + System.currentTimeMillis());
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + " 出去时间 "  + System.currentTimeMillis());
        } catch (InterruptedException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}

class ThreadA extends Thread {

    private HasSelfPrivateNum numRef;

    public ThreadA(HasSelfPrivateNum numRef) {
        super();
        this.numRef = numRef;
    }

    @Override
    public void run() {
        numRef.addI();
    }

}



class ThreadB extends Thread {

    private HasSelfPrivateNum numRef;

    public ThreadB(HasSelfPrivateNum numRef) {
        super();
        this.numRef = numRef;
    }

    @Override
    public void run() {
        numRef.addI();
    }
}
```

运行打印结果：

```
ThreadA 进入时间 1551162422478
ThreadB 进入时间 1551162422479
ThreadA 出去时间 1551162424481
ThreadB 出去时间 1551162424481
```

**从打印结果来看这里是非同步的，原因在于ThreadA获取的numRef1对象的对象锁，ThreadB获取的是numRef2的对象锁，他们并没有在获取锁上面有竞争关系。**

**synchronized(this){…} 代码块**

```java
class HasSelfPrivateNum{

     public  void addI() {
         synchronized(this){
              try {
            System.out.println(Thread.currentThread().getName() + " 进入时间 "  + System.currentTimeMillis());
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + " 出去时间 "  + System.currentTimeMillis());
        } catch (InterruptedException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
         }
    }
}
```

下面看一下类锁的情况：

```java
public class SynchronizedLocked {

    public static void main(String[] args) {
        HasSelfPrivateNum numRef1 = new HasSelfPrivateNum();

        ThreadA athread = new ThreadA(numRef1);
        athread.setName("ThreadA");
        athread.start();

        HasSelfPrivateNum numRef2 = new HasSelfPrivateNum();

        ThreadB bthread = new ThreadB(numRef2);
        bthread.setName("ThreadB");
        bthread.start();

    }

}

class HasSelfPrivateNum{

     public  void addI() {
         //类锁
         synchronized(SynchronizedLocked.class){
             try {
                 System.out.println(Thread.currentThread().getName() + " 进入时间 "  + System.currentTimeMillis());
                 Thread.sleep(2000);
                 System.out.println(Thread.currentThread().getName() + " 出去时间 "  + System.currentTimeMillis());
             } catch (InterruptedException e) {
                 // TODO Auto-generated catch block
                 e.printStackTrace();
             }
         }

    }
}

class ThreadA extends Thread {

    private HasSelfPrivateNum numRef;

    public ThreadA(HasSelfPrivateNum numRef) {
        super();
        this.numRef = numRef;
    }

    @Override
    public void run() {
        numRef.addI();
    }

}



class ThreadB extends Thread {

    private HasSelfPrivateNum numRef;

    public ThreadB(HasSelfPrivateNum numRef) {
        super();
        this.numRef = numRef;
    }

    @Override
    public void run() {
        numRef.addI();
    }
}
```

打印结果：

```
ThreadA 进入时间 1551165184568
ThreadA 出去时间 1551165186570
ThreadB 进入时间 1551165186570
ThreadB 出去时间 1551165188571
```

从上面可以看出虽然是两个不同的对象，但是获取的对象锁，所以 **`ThreadA`** 和 **`ThreadB`** 存在竞争的关系。实现了线程同步的情况。

### 3 双重校验锁实现对象单例（线程安全）

这个就是传说中double-check

```java
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
```

### 4. 总结

**synchronized关键字最主要的三种使用方式：**

- **修饰实例方法，对当前的对象实例加锁，进入同步代码获得当前的实例锁**。
- **修饰静态方法，对当前类加锁，进入同步代码钱要获得当前类对象锁**。也就是给当前类加锁，也会作用于所有的对象。静态成员不属于任何对象实例。 因为静态成员不属于任何一个实例对象，是类成员（ static 表明这是该类的一个静态资源，不管new了多少个对象，只有一份，所以对该类的所有对象都加了锁）。所以如果一个线程A调用一个实例对象的非静态 synchronized 方法，而线程B需要调用这个实例对象所属类的静态 synchronized 方法，是允许的，不会发生互斥现象，**因为访问静态 synchronized 方法占用的锁是当前类的锁，而访问非静态 synchronized 方法占用的锁是当前实例对象锁**
- **修饰代码块，指定加锁对象，对给定对象加锁，进入同步代码看前要获得给定对象的锁。这里修饰代码块加锁可以的对象可以是类也可以是对象。** 

### 5. synchronized与ReenTrantLock 的同和不同

**相同：**

​	两者都是重入锁

**不同：** 

1. **synchronized 依赖于 JVM 而 ReenTrantLock 依赖于 API**	

   synchronized 是依赖于 JVM 实现的，Reentrant 依赖AQS和CAS来进行的实现。

2.  **ReenTrantLock 比 synchronized 多了一些功能** 

   - **ReenTrantLock提供了一种能够中断等待锁的线程的机制**
   - **ReenTrantLock可以指定是公平锁还是非公平锁，而synchronized只是非公平锁**
   - **ReenTrantLock在通知线程比synchronized更加的灵活。**

