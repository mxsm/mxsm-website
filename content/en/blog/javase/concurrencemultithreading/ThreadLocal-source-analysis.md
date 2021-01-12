---
title: ThreadLocal源码解析
categories:
  - Java
  - JSE
  - 并发和多线程
tags:
  - Java
  - JSE
  - 并发和多线程
abbrlink: '68410011'
date: 2018-11-30 21:49:43
---
### 1. 什么是ThreadLocal？

从名字上面看就大致应该能够猜到和 **线程** 以及 **本地** 的一些知识有关。

**`ThreadLocal`** 提供了线程本地变量，它可以保证访问到的变量属于当前线程，每个线程都保存有一个变量副本，每个线程的变量都不同，而同一个线程在任何时候访问这个本地变量的结果都是一致的。当此线程结束生命周期时，所有的线程本地实例都会被 **`GC`** 。**`ThreadLocal`** 相当于提供了**一种线程隔离**，将变量与线程相绑定。

**概括的说：就是提供一种访问数据的线程隔离模式**

### 2. ThreadLocal源码分析— JDK8

首先看我们一般如何使用 **`ThreadLoacl`**

```java
        ThreadLocal<String> threadLocal = new ThreadLocal<>();
        threadLocal.set("test");
        threadLocal.get();
        threadLocal.remove();
```

主要是包含了： **`set`**  、 **`get`** 、  **`remove`** 三个方法

看一下 **`ThreadLocal`** 类中的变量情况：

```java

    private final int threadLocalHashCode = nextHashCode();

    /**
     * HashCode的初始值为0
     * 
     */
    private static AtomicInteger nextHashCode =
        new AtomicInteger();

    /**
     *hash值的增长步长
     */
    private static final int HASH_INCREMENT = 0x61c88647;

    /**
     * 返回下一个HashCode
     */
    private static int nextHashCode() {
        return nextHashCode.getAndAdd(HASH_INCREMENT);
    }
```

**`ThreadLocal`** 通过 **`threadLocalHashCode`** 来标识每一个 **`ThreadLocal`** 的唯一性。**`threadLocalHashCode`** 通过 **`AtomicInteger`** 进行更新 (**`CAS`**) 每一次hash操作的增量为 **0x61c88647**

看一下 **`set`** 方法

```java
    public void set(T value) {
        //获取当前执行方法的线程
        Thread t = Thread.currentThread();
      	//获取当前线程的ThreadLocalMap
        ThreadLocalMap map = getMap(t);
        if (map != null)
          	//存在直接放入值
            map.set(this, value);
        else
          	//不存在直接先创建ThreadLocalMap 然后放入
            createMap(t, value);
    }
```

跟进看一下  **`getMap(Thread t)`** 方法

```java
ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}

//在Thread 内部的变量
ThreadLocal.ThreadLocalMap threadLocals = null;
```

这里可以看出返回的是 **`Thread`** 内部的一个类。到了这里，我们可以看出，每个 **`Thread`** 里面都有一个 **`ThreadLocal.ThreadLocalMap`** 成员变量，也就是说每个线程通过 **`ThreadLocal.ThreadLocalMap`** 与 **`ThreadLocal`** 相绑定，这样可以确保每个线程访问到的thread-local variable都是本线程的。

 **ThreadLocalMap的实现**

```java
/**
 * Map的初始容量 2的幂.
 */
private static final int INITIAL_CAPACITY = 16;
/**
 * 是一个Entry 类型的数组，用于存储数据
 */
private Entry[] table;
/**
 * 表中的存储数目
 */
private int size = 0;
/**
 * 扩容的阈值
 */
private int threshold; // Default to 0

```

**`Entry`** 是 **`ThreadLocalMap`** 中的静态内部类。

```java
        static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

**`Entry`** 类继承了 **`WeakReference<ThreadLocal<?>>`** ，即每个 **`Entry`** 对象都有一个 **`ThreadLocal`** 的弱引用（作为key），这是为了防止内存泄露。一旦线程结束，key变为一个不可达的对象，这个Entry就可以被GC了。

构造函数

```java
        ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
            //初始化大小
            table = new Entry[INITIAL_CAPACITY];
          	//获取位置 --- 和HashMap中的 hashCode & (size - 1) 找哈希桶是一个道理
            int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);
            table[i] = new Entry(firstKey, firstValue);
            size = 1;
          	// 设置阈值 -- len * 2 / 3;
            setThreshold(INITIAL_CAPACITY);
        }
```

接着看一下 **`ThreadLocalMap#set`** 方法的实现

```java
 private void set(ThreadLocal<?> key, Object value) {

            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);
						
   					//nextIndex 方法来解决hash冲突 --- 线性探测法 而不是 HashMap的链表
            for (Entry e = tab[i];e != null; e = tab[i = nextIndex(i, len)]) {
                ThreadLocal<?> k = e.get();

                if (k == key) {
                    e.value = value;
                    return;
                }

                if (k == null) {
                    replaceStaleEntry(key, value, i);
                    return;
                }
            }

            tab[i] = new Entry(key, value);
            int sz = ++size;
            if (!cleanSomeSlots(i, sz) && sz >= threshold)
                rehash();
        }
```

接下来看看 **`ThreadLocal#get`** 方法

```java
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }

```

看一下 **`ThreadLocal#remove`** 方法

```java
public void remove() {
         ThreadLocalMap m = getMap(Thread.currentThread());
         if (m != null)
             //调用ThreadLocalMap的remove
             m.remove(this);
     }
```

