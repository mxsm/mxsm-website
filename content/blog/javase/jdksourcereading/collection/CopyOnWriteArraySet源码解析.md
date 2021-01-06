---
title: CopyOnWriteArraySet源码解析
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
abbrlink: 31dc46fb
date: 2019-05-22 15:04:27
---
### 1. CopyOnWriteArraySet的构造函数

```java
public class CopyOnWriteArraySet<E> extends AbstractSet<E>
        implements java.io.Serializable {
    private final CopyOnWriteArrayList<E> al;
    
    public CopyOnWriteArraySet() {
        al = new CopyOnWriteArrayList<E>();
    }
    
    public CopyOnWriteArraySet(Collection<? extends E> c) {
        if (c.getClass() == CopyOnWriteArraySet.class) {
            @SuppressWarnings("unchecked") CopyOnWriteArraySet<E> cc =
                (CopyOnWriteArraySet<E>)c;
            al = new CopyOnWriteArrayList<E>(cc.al);
        }
        else {
            al = new CopyOnWriteArrayList<E>();
            al.addAllAbsent(c);
        }
    }
}    
```
通过源码可以看出来 ***`CopyOnWriteArraySet`*** 实现通过 ***`CopyOnWriteArrayList`*** 来实现。
### 2. CopyOnWriteArraySet#add源码解析

```java
public boolean add(E e) {
    return al.addIfAbsent(e);
}
```
通过 **CopyOnWriteArrayList#*addIfAbsent*** 方法来实现添加。下面看一下源码：

```java
    public boolean addIfAbsent(E e) {
        Object[] snapshot = getArray();
        return indexOf(e, snapshot, 0, snapshot.length) >= 0 ? false :
            addIfAbsent(e, snapshot);
    }
```
源码比较简单，首先获取已存在的对象，判断要插入的对象是否存在，存在返回false不存在直接添加。

```java
    private boolean addIfAbsent(E e, Object[] snapshot) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] current = getArray();
            int len = current.length;
            if (snapshot != current) {
                // Optimize for lost race to another addXXX operation
                int common = Math.min(snapshot.length, len);
                for (int i = 0; i < common; i++)
                    if (current[i] != snapshot[i] && eq(e, current[i]))
                        return false;
                if (indexOf(e, current, common, len) >= 0)
                        return false;
            }
            Object[] newElements = Arrays.copyOf(current, len + 1);
            newElements[len] = e;
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

