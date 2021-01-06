---
title: LinkedList源码解析
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
abbrlink: 2fbc4786
date: 2019-11-17 05:33:53
---
### 链表的数据结构

```java
private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
```

- 底层的数据结构为双向链表

![双向链表图示](https://github.com/mxsm/document/blob/master/image/datastructure/Doubly-linked-list.svg.png?raw=true)

### LinkedList源码解析

##### add(E e)

```java
    //直接插入--调用的是插入到最后一个节点的后面
    public boolean add(E e) {
        //直接调用的往节点后面添加
        linkLast(e);
        return true;
    }

	//插入节点后面
	void linkLast(E e) {
        final Node<E> l = last;
        //创建新的节点
        final Node<E> newNode = new Node<>(l, e, null);
        last = newNode;
        //如果最后一个节点为NULL说明加入的是第一个节点
        if (l == null)
            first = newNode;
        else
            //将新的节点放在最后一个节点后面
            l.next = newNode;
        //增加数量
        size++;
        modCount++;
    }
	//插入节点前面
    void linkBefore(E e, Node<E> succ) {
        // assert succ != null;
        final Node<E> pred = succ.prev;
        final Node<E> newNode = new Node<>(pred, e, succ);
        succ.prev = newNode;
        if (pred == null)
            first = newNode;
        else
            pred.next = newNode;
        size++;
        modCount++;
    }
```

##### add(int index, E e)

```java
    //插入到某个指定位置
	public void add(int index, E element) {
        //检查是否越界
        checkPositionIndex(index);
        //如果和链表的大小相同直接插入到最后
        if (index == size)
            linkLast(element);
        else
            linkBefore(element, node(index));
    }
	
	//获取当前位置的Node
	Node<E> node(int index) {
        
		//将size左移一位判断和index之间的关系(巧妙的节省了便利查找的时间)
        if (index < (size >> 1)) {
            Node<E> x = first;
            for (int i = 0; i < index; i++)
                x = x.next;
            return x;
        } else {
            Node<E> x = last;
            for (int i = size - 1; i > index; i--)
                x = x.prev;
            return x;
        }
    }

```

**注意：终点关注node函数的算法，来减少获取到节点的耗时**

#### unlink--删除实现

```java
    E unlink(Node<E> x) {
       
        /**
          *大概的思路：把删除节点prev节点的next设置为删除节点的next
          *把删除节点的next的prev节点设置设置为删除节点prev
          */
        
        final E element = x.item;
        final Node<E> next = x.next;
        final Node<E> prev = x.prev;
		
        //处理pre
        if (prev == null) {
            first = next;
        } else {
            prev.next = next;
            x.prev = null;
        }
		
        //处理next 
        if (next == null) {
            last = prev;
        } else {
            next.prev = prev;
            x.next = null;
        }

        x.item = null;
        size--;
        modCount++;
        return element;
    }
```

#### 总结

LinkedList是采用双向链表实现的。所以它也具有链表的特点，每一个元素（结点）的地址不连续，通过引用找到当前结点的上一个结点和下一个结点，即插入和删除效率较高，只需要常数时间，而get和set则较为低效。
 LinkedList的方法和使用和ArrayList大致相同，由于LinkedList是链表实现的，所以额外提供了在头部和尾部添加/删除元素的方法，也没有ArrayList扩容的问题了。另外，ArrayList和LinkedList都可以实现栈、队列等数据结构，但LinkedList本身实现了队列的接口，所以更推荐用LinkedList来实现队列和栈。

**在需要频繁读取集合中的元素时，使用ArrayList效率较高，而在插入和删除操作较多时，使用LinkedList效率较高**。同样这些也符合数组和链表的特点