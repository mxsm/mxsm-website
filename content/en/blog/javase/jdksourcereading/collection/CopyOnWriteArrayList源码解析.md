---
title: CopyOnWriteArrayList源码解析
categories:
  - Java
  - JSE
  - JDK源码解析
  - Collection集合源码分析
tags:
  - Java
  - JSE
  - JDK源码解析
  - Collection集合源码分析
abbrlink: 8f641e02
date: 2018-07-23 22:55:32
---
### CopyOnWrite容器

基本思路就是在多个线程共享同一个内容，当某个线程想修改这个内容的时候，才会真正的把内容拷贝出去形成一个新的内容然后再修改，这是一种**延迟懒惰策略**

### 概念

通俗的理解是当我们往一个容器添加元素的时候，不直接往当前容器添加，而是先将当前容器进行Copy，复制出一个新的容器，然后新的容器里添加元素，添加完元素之后，再将原容器的引用指向新的容器。
 这样做的好处是我们可以对CopyOnWrite容器**进行并发的读，而不需要加锁**，因为当前容器不会添加任何元素。
 所以CopyOnWrite容器也是一种**读写分离的思想，读和写在不同的容器**

#### CopyOnWriteArrayList

```java
    /** 重入锁--同步所有的突变操作 */
    final transient ReentrantLock lock = new ReentrantLock();

    /** 数据保存结构 */
    private transient volatile Object[] array;

    /**
     * Gets the array.  Non-private so as to also be accessible
     * from CopyOnWriteArraySet class.
     */
    final Object[] getArray() {
        return array;
    }

    /**
     * Sets the array.
     */
    final void setArray(Object[] a) {
        array = a;
    }

    /**
     * 初始化长度为0
     */
    public CopyOnWriteArrayList() {
        setArray(new Object[0]);
    }

    /**
     * 参数为一个集合
     * 
     * 
     *
     * @param c the collection of initially held elements
     * @throws NullPointerException if the specified collection is null
     */
    public CopyOnWriteArrayList(Collection<? extends E> c) {
        Object[] elements;
        if (c.getClass() == CopyOnWriteArrayList.class)
            elements = ((CopyOnWriteArrayList<?>)c).getArray();
        else {
            elements = c.toArray();
            // c.toArray might (incorrectly) not return Object[] (see 6260652)
            if (elements.getClass() != Object[].class)
                elements = Arrays.copyOf(elements, elements.length, Object[].class);
        }
        setArray(elements);
    }

    /**
     * 参数为一个数组
     *
     * @param toCopyIn the array (a copy of this array is used as the
     *        internal array)
     * @throws NullPointerException if the specified array is null
     */
    public CopyOnWriteArrayList(E[] toCopyIn) {
        setArray(Arrays.copyOf(toCopyIn, toCopyIn.length, Object[].class));
    }
```

**注意**：由于当我们往一个容器添加元素的时候，不直接往当前容器添加，而是先将当前容器进行Copy，复制出一个新的容器，然后新的容器里添加元素，添加完元素之后，再将原容器的引用指向新的容器。所以在往CopyOnWriteArrayList添加数据的时候不要一个个添加，**最好的方式是通过带参数的构造方法或者调用addAll的方式添加数据，减少底层的每次拷贝而占用内存和频繁的导致GC操作**。

### Add方法

```java
public boolean add(E e) {
        final ReentrantLock lock = this.lock;
    	//加锁
        lock.lock();
        try {
            //获取原有的数据数组
            Object[] elements = getArray();
            //数组的长度
            int len = elements.length;
            //拷贝---长度为len + 1
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            //将新添加的数据设置到最后
            newElements[len] = e;
            //将array指向新的newElements --内存可见(array变量被volatile修饰)
            setArray(newElements);
            return true;
        } finally {
            //释放锁
            lock.unlock();
        }
    }    

public void add(int index, E element) {
        final ReentrantLock lock = this.lock;
        //加锁
        lock.lock();
        try {
            Object[] elements = getArray();
            int len = elements.length;
            if (index > len || index < 0)
                throw new IndexOutOfBoundsException("Index: "+index+
                                                    ", Size: "+len);
            Object[] newElements;
            int numMoved = len - index;
            if (numMoved == 0)
                newElements = Arrays.copyOf(elements, len + 1);
            else {
                newElements = new Object[len + 1];
                System.arraycopy(elements, 0, newElements, 0, index);
                System.arraycopy(elements, index, newElements, index + 1,
                                 numMoved);
            }
            newElements[index] = element;
            setArray(newElements);
        } finally {
            //释放锁
            lock.unlock();
        }
    }
```

注意：

- 采用`ReentrantLock`保证了同一时刻只有一个写的线程在复制。
- 数组变量array的应用是用`volatile`修饰过的，应酬将旧的数组应用指向新的数组；根据`volatile`的`happens-before`规则，线程对数组引用的修改对线程是可见的。
- 由于在写数据的时候，是在新的数组中插入数据的，从而保证读写实在两个不同的数据容器中进行操作。

![图示](https://github.com/mxsm/document/blob/master/image/JSE/CopyOnWriteArrayList.png?raw=true)

### 总结

#### 优点

- 读写是分离的
- 读线程之间是互不阻塞的
- 牺牲数据的实时性而保证了最终数据的一致性。即读线程对数据的更新是延迟感知的，因此这种情况下读线程不存在等待的情况。

#### 缺点

- 内存占用的问题：因为CopyOnWrite是写的时候复制机制，所以在写操作的时候。内存中会存在两个对象的内存，旧的对象和新写入的对象。注意:在复制的时候只是复制容器里的引用，只是在写的时候会创建新对象添加到新容器里，而旧容器的对象还在使用，所以有两份对象内存）如果对象内存占用比较大有可能造成频繁的GC。
- CopyOnWrite容器保证最终的数据一致性而不能保证数据的实时一致性
