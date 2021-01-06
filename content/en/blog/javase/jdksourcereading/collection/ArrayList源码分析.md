---
title: ArrayList源码分析
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
abbrlink: c352a0f3
date: 2018-05-07 09:34:55
---
### ArrayList

ArrayList并不是线程安全的，在读线程在读取ArrayList的时候如果有写线程在写数据的时候，基于fast-fail机制，会抛出**ConcurrentModificationException**异常，也就是说ArrayList并不是一个线程安全的容器

### 构造方法

```java
    /**
     * 默认容量10
     */
    private static final int DEFAULT_CAPACITY = 10;

    /**
     * 空的数据实例
     */
    private static final Object[] EMPTY_ELEMENTDATA = {};

    /**
      *用户指定参数容量
      */
    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            //初始容量大于0，创建对应的Object数组长度
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            //等于0赋值空数组
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            //小于0抛错
            throw new IllegalArgumentException("Illegal Capacity: "+
                                               initialCapacity);
        }
    }

    /**
     * 无参数默认为空数组
     */
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

    /**
     * 构造包含指定collection元素的列表，这些元素利用该集合的迭代器按顺序返回
     */
    public ArrayList(Collection<? extends E> c) {
        elementData = c.toArray();
        if ((size = elementData.length) != 0) {
            // c.toArray might (incorrectly) not return Object[] (see 6260652)
            if (elementData.getClass() != Object[].class)
                //数组的拷贝
                elementData = Arrays.copyOf(elementData, size, Object[].class);
        } else {
            // 空数组替代
            this.elementData = EMPTY_ELEMENTDATA;
        }
    }
```

- 不指定容量默认为空 size=0
- 默认的扩容容量为10
- 底层的数据结构object数组

### ArrayList扩容机制

是否扩容是根据调用add方法时候来判断的。

#### 1. 先来看 `add` 方法

```java
public boolean add(E e) {
    	//添加元素之前调用ensureCapacityInternal确保容量
        ensureCapacityInternal(size + 1);  // Increments modCount!!
    	//添加到对应的位置
        elementData[size++] = e;
        return true;
    }
```

#### 2.  `add` 方法

```java
private void ensureCapacityInternal(int minCapacity) {
        ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
    }

private static int calculateCapacity(Object[] elementData, int minCapacity) {
     // 获取默认的容量和传入参数的较大值    
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        return minCapacity;
    }

private void ensureExplicitCapacity(int minCapacity) {
        modCount++;

        // 判断最小的容量和数组之间的大小关系
        if (minCapacity - elementData.length > 0)
            //扩容
            grow(minCapacity);
    }
```

#### 3.`grow`方法

```java
private void grow(int minCapacity) {
        // 
        int oldCapacity = elementData.length;
    	//进行扩容-- oldCapacity + (oldCapacity >> 1) 相当于 oldCapacity + (oldCapacity / 2) 
        int newCapacity = oldCapacity + (oldCapacity >> 1);
    	//然后检查新容量是否大于最小需要容量，若还是小于最小需要容量，那么就把最小需要容量当作数组的新容量，
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
    	/**如果新容量大于 MAX_ARRAY_SIZE,进入(执行) `hugeCapacity()` 
          *方法来比较 minCapacity 和 MAX_ARRAY_SIZE
          *如果minCapacity大于最大容量，则新容量则为`Integer.MAX_VALUE`
          */
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }
```

## `System.arraycopy()`

```java
  int[] src = new int[]{1,2,3};
        int[] dest = new int[100];

        System.arraycopy(src, 1, dest, 50, 2);
        System.out.println(dest[51]);
        System.out.println(dest[50]);
```

输出结果：3 

​		   2

### ArrayList和Vector的区别

`Vector`从代码层面看方法上加了`synchronized`是线程安全，但是如果一个线程访问需要同步操作耗时比较长。

ArrayList不是同步的，所以在不需要保证线程安全的时候使用ArrayList

### 使用注意

- 如果知道 **`ArrayList`** 的长度直接设置 **`initialCapacity`** 初始容量。这样的好处在于避免了扩容带来的性能问题。减少了添加过程中扩容的步骤，如果数量小于10就直接用默认的，因为 **`ArrayList`** 的最小容量为10。

