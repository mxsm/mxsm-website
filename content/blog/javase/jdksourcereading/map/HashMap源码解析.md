---
title: HashMap源码解析
categories:
  - Java
  - JSE
  - JDK源码解析
  - Map集合源码解析
tags:
  - Java
  - JSE
  - JDK源码解析
  - Map集合源码解析
abbrlink: a2a7cca8
date: 2018-11-10 11:32:18
---
### 哈希算法
hash是具有唯一性且不可逆的，唯一性指的是相同的输入产生的hash code永远是一样的，而不可逆也比较容易理解，数据摘要算法并不是压缩算法，它只是生成了一个该数据的摘要，没有将数据进行压缩。压缩算法一般都是使用一种更节省空间的编码规则将数据重新编码，解压缩只需要按着编码规则解码就是了，试想一下，一个几百MB甚至几GB的数据生成的hash code都只是一个拥有固定长度的序列，如果再能逆向解压缩，那么其他压缩算法该情何以堪？

我们上述讨论的仅仅是在密码学中的hash算法，而在散列表中所需要的散列函数是要能够将key寻址到buckets中的一个位置，散列函数的实现影响到整个散列表的性能。

一个完美的散列函数要能够做到均匀地将key分布到buckets中，每一个key分配到一个bucket，但这是不可能的。虽然hash算法具有唯一性，但同时它还具有重复性，**唯一性保证了相同输入的输出是一致的，却没有保证不同输入的输出是不一致的**，也就是说，**完全有可能两个不同的key被分配到了同一个bucket（因为它们的hash code可能是相同的），这叫做碰撞冲突**。总之，理想很丰满，现实很骨感，散列函数只能尽可能地减少冲突，没有办法完全消除冲突。

### 什么时候会产生冲突HashMap
HashMap中调用hashCode()方法来计算hashCode。
由于在Java中两个不同的对象可能有一样的hashCode,所以不同的键可能有一样hashCode，从而导致冲突的产生。

#### HashMap解决冲突方式
- HashMap在处理冲突时使用链表存储相同索引(桶)的元素
- 从Java 8开始，HashMap，ConcurrentHashMap和LinkedHashMap在处理频繁冲突时将使用平衡树来代替链表，当同一hash桶中的元素数量超过特定的值便会由链表切换到平衡树，这会将get()方法的性能从O(n)提高到O(logn)
- 当从链表切换到平衡树时，HashMap迭代的顺序将会改变。不过这并不会造成什么问题，因为HashMap并没有对迭代的顺序提供任何保证
- 使用HashMap之所以会产生冲突是因为使用了键对象的hashCode()方法，而equals()和hashCode()方法不保证不同对象的hashCode是不同的。需要记住的是，**相同对象的hashCode一定是相同的，但相同的hashCode不一定是相同的对象**  

以上就是Java中HashMap如何处理冲突。这种方法被称为链地址法，因为使用链表存储同一桶内的元素。通常情况HashMap，HashSet，LinkedHashSet，LinkedHashMap，ConcurrentHashMap，HashTable，IdentityHashMap和WeakHashMap均采用这种方法处理冲突。  
从JDK 8开始，HashMap，LinkedHashMap和ConcurrentHashMap为了提升性能，在频繁冲突的时候使用平衡树来替代链表。因为HashSet内部使用了HashMap，LinkedHashSet内部使用了LinkedHashMap，所以他们的性能也会得到提升。

在Java 8 之前， 如果发生碰撞往往是将该value直接链接到该位置的其他所有value的末尾，即相互碰撞的所有value形成一个链表。

因此，在最坏情况下，HashMap的查找时间复杂度将退化到O（n）.

但是在Java 8 中，该碰撞后的处理进行了改进。当一个位置所在的冲突过多时，存储的value将形成一个排序二叉树，排序依据为key的hashcode。

则，在最坏情况下，HashMap的查找时间复杂度将从O（1）退化到O（logn）。

#### 由链表改进为红黑树的好处
1. 最坏的情况的时间开销由O（n）降到了O（logn）
2. 改善哈希碰撞攻击

#### 哈希碰撞攻击原理
哈希表的原理是用数组来保存键值对，键值对存放的位置（下标）由键的哈希值决定，键的哈希值可以在参数时间内计算出来，这样哈希表插入、查找和删除的时间复杂度为O(1)，但是这是理想的情况下，真实的情况是，键的哈希值存在冲突碰撞，也就是不同的键的哈希值可能相等，一个好的哈希函数应该是尽可能的减少碰撞。解决冲突碰撞的方法有分为两种：开放地址法和 链接法，这里不具体展开。哈希表一般都采用链接法来解决冲突碰撞，也就是用一个链表来将分配到同一个桶（键的哈希值一样）的键值对保存起来。

所谓的哈希碰撞攻击就是，针对哈希函数的特性，精心构造数据，使所有数据的哈希值相同，当这些数据保存到哈希表中，哈希表就会退化为单链表，哈希表的各种操作的时间复杂度提升一个数量级，因此会消耗大量CPU资源，导致系统无法快速响应请求，从而达到拒绝服务攻击（Dos）的目的。




### jdk1.8和JDK 1.8 以前 HashMap对比
HashMap之前实现

```
方式：数组+链表
缺点：哈希函数取得再好，也很难达到元素百分百均匀分布。当 HashMap 中有大量的元素都存放到同一个桶中时，
这个桶下有一条长长的链表，这个时候 HashMap 就相当于一个单链表，假如单链表有 n
个元素，遍历的时间复杂度就是 O(n)，完全失去了它的优势
```
针对这种情况，JDK 1.8 中引入了 红黑树（查找时间复杂度为 O(logn)）来优化这个问题
常见的算法时间复杂度由小到大依次为：  Ο(1)＜Ο(log2n)＜Ο(n)＜Ο(nlog2n)＜Ο(n2)＜Ο(n3)＜…＜Ο(2n)＜Ο(n!)

#### JDK8 HashMap
HashMap数据结构示意图见(哈希表+单链表+红黑树)：![HashMap内部结构图示](https://github.com/mxsm/document/blob/master/image/JSE/hashmapdatastruct.png?raw=true)

HashMap几个重要的变量：

```java
   /**
     * The default initial capacity - MUST be a power of two.
     * 默认的容量16--并且容量必须是2的幂
     */
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; //16
	/**
     * 最大限度容量
     * 
     */
	static final int MAXIMUM_CAPACITY = 1 << 30;

	/**
     * 默认加载因子0.75f
     */
    static final float DEFAULT_LOAD_FACTOR = 0.75f;

	/**
     * 链表转换为红黑树的阈值
     */
    static final int TREEIFY_THRESHOLD = 8;

 	/**
     * 红黑树转换为链表的阈值
     */
    static final int UNTREEIFY_THRESHOLD = 6;

   /**
     * 如果在创建HashMap实例时没有给定capacity、loadFactor则默认值分别是16和0.75
     * 当好多bin被映射到同一个桶时，如果这个桶中bin的数量小于TREEIFY_THRESHOLD当然不
     * 会转化成树形结构存储；如果这个桶中bin的数量大于了 TREEIFY_THRESHOLD ，
     * 但是capacity小于MIN_TREEIFY_CAPACITY则依然使用链表结构进行存储，此时会对H
     * ashMap进行扩容；如果capacity大于了MIN_TREEIFY_CAPACITY ，则会进行树化。
     */
    static final int MIN_TREEIFY_CAPACITY = 64;

   /**
     * The table, initialized on first use, and resized as
     * necessary. When allocated, length is always a power of two.
     * (We also tolerate length zero in some operations to allow
     * bootstrapping mechanics that are currently not needed.)
     * 保存HashMap的数据结构，使用懒加载方式，分配长度总是2的幂。
     */
    transient Node<K,V>[] table;

    /**
     * Holds cached entrySet(). Note that AbstractMap fields are used
     * for keySet() and values().
     */
    transient Set<Map.Entry<K,V>> entrySet;

    /**
     * The number of key-value mappings contained in this map.
     * K-V map中保存的数量  -- 方法size() 获取的就是这个字段
     */
    transient int size;

    /**
     * The number of times this HashMap has been structurally modified
     * Structural modifications are those that change the number of mappings in
     * the HashMap or otherwise modify its internal structure (e.g.,
     * rehash).  This field is used to make iterators on Collection-views of
     * the HashMap fail-fast.  (See ConcurrentModificationException).
     * HashMap的数据结构改变的次数
     */
    transient int modCount;

    /**
     * The next size value at which to resize (capacity * load factor).
     * 扩容的阈值
     * @serial
     */
    // (The javadoc description is true upon serialization.
    // Additionally, if the table array has not been allocated, this
    // field holds the initial array capacity, or zero signifying
    // DEFAULT_INITIAL_CAPACITY.)
    int threshold;

    /**
     * The load factor for the hash table.
     * 负载因子
     * @serial
     */
    final float loadFactor;
```

节点：

```java
static class Node<K,V> implements Map.Entry<K,V> {
    //哈希值，就是位置
    final int hash;
    //键
    final K key;
    //值
    V value;
    //指向下一个几点的指针
    Node<K,V> next;
    //...
}
```
红黑树节点

```java

static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent;  // red-black tree links
    TreeNode<K,V> left;
    TreeNode<K,V> right;
    TreeNode<K,V> prev;    // needed to unlink next upon deletion
    boolean red;
}
```

方法：**tableSizeFor--找到最接近传入cap的2的幂**

```java
static final int tableSizeFor(int cap) {
        int n = cap - 1;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
    	//(n < 0) ? 1:()后面的 (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1是
    	//是一块
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }
```

**tableSizeFor**方法图解如下：

![图解](https://github.com/mxsm/document/blob/master/image/JSE/tablesize%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

方法：**put--存入数据**

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,boolean evict) {
        Node<K,V>[] tab; 
        Node<K,V> p; 
        //桶的容量
        int n；
        //桶的索引
        int i;

        if ((tab = table) == null || (n = tab.length) == 0)
            //懒加载---没有初始化进行初始化
            n = (tab = resize()).length;
    	//获取hash桶
        if ((p = tab[i = (n - 1) & hash]) == null)
            //没有哈希碰撞直接放在对应的桶中
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; 
            K k;
            //判断桶的第一个节点是否和插入的数据相等--不是走下一个else if
            if (p.hash == hash && ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            //判断是否已经转换为红黑树了--不是走下面的else
            else if (p instanceof TreeNode)
               //做红黑树的插入数据操作
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
             
            else {
             //桶里面的数据还是链表的结构
            //遍历查找替换或者直接存放到链表最后面
                for (int binCount = 0; ; ++binCount) {
                //找到下一个节点为空的节点
                    if ((e = p.next) == null) {
                   		//插入链表的下一个节点
                        p.next = newNode(hash, key, value, null);
                        //判断是否要将链表结构转换成红黑树(TREEIFY_THRESHOLD=8)
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            //桶容器的链表转换为红黑树
                            treeifyBin(tab, hash);
                        break;
                    }
                    //查找到key值相等的直接跳出
                    if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            //HashMap中存在插入的key值
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
    	//更新修改次数
        ++modCount;
    	//增加map的size
        if (++size > threshold)
        //大于阈值扩容
            resize();
        afterNodeInsertion(evict);
        return null;
    }
```
方法：**treeifyBin—链表转换为红黑树**

```java
final void treeifyBin(Node<K,V>[] tab, int hash) {
        int n, index; Node<K,V> e;
    	//tab为空进行扩容
    	//tab的容量小于MIN_TREEIFY_CAPACITY进行扩容
        if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
            resize();
        else if ((e = tab[index = (n - 1) & hash]) != null) {
            //获取到节点进行链表转换为红黑树
            TreeNode<K,V> hd = null, tl = null;
            do {
                //Node --> TreeNode
                TreeNode<K,V> p = replacementTreeNode(e, null);
                if (tl == null)
                    hd = p;
                else {
                    p.prev = tl;
                    tl.next = p;
                }
                tl = p;
            } while ((e = e.next) != null);
            if ((tab[index] = hd) != null)
                //红黑树退化为链表
                hd.treeify(tab);
        }
    }
```

**注意链表的转换为红黑树的两个条件**：

1. 链表的长度>=TREEIFY_THRESHOLD（8为默认值）
2. 容量>=MIN_TREEIFY_CAPACITY(64默认值)

方法：**putTreeVal--红黑树的添加操作**


```java
final TreeNode<K,V> putTreeVal(HashMap<K,V> map, Node<K,V>[] tab,int h, K k, V v) {
            Class<?> kc = null;
            boolean searched = false;
            //获取根节点
            TreeNode<K,V> root = (parent != null) ? root() : this;
            //每次添加元素时，从根节点遍历，对比哈希值
            for (TreeNode<K,V> p = root;;) {
                int dir; //插入的位置
                int ph; 
                K pk;
                if ((ph = p.hash) > h)
                    dir = -1;//左子树
                else if (ph < h)
                    dir = 1; //右子树
                else if ((pk = p.key) == k || (k != null && k.equals(pk)))
                //如果当前节点的哈希值、键和要添加的都一致，就返回当前节点
                    return p;
                else if ((kc == null && (kc = comparableClassFor(k)) == null) 
                       || (dir = compareComparables(kc, k, pk)) == 0) {
                    if (!searched) {
                        TreeNode<K,V> q, ch;
                        searched = true;
                        if (((ch = p.left) != null &&
                             (q = ch.find(h, k, kc)) != null) ||
                            ((ch = p.right) != null &&
                             (q = ch.find(h, k, kc)) != null))
                             //如果从 ch 所在子树中可以找到要添加的节点，就直接返回
                            return q;
                    }
                    //哈希值相等，但键无法比较，只好通过特殊的方法给个结果
                    dir = tieBreakOrder(k, pk);
                }
            //经过前面的计算，得到了当前节点和要插入节点的一个大小关系
            //要插入的节点比当前节点小就插到左子树，大就插到右子树
                TreeNode<K,V> xp = p;
            //如果当前节点还没有左孩子或者右孩子时才能插入，否则就进入下一轮循环
                if ((p = (dir <= 0) ? p.left : p.right) == null) {
                    Node<K,V> xpn = xp.next;
                    TreeNode<K,V> x = map.newTreeNode(h, k, v, xpn);
                    if (dir <= 0)
                        xp.left = x;
                    else
                        xp.right = x;
                    xp.next = x;
                    x.parent = x.prev = xp;
                    if (xpn != null)
                        ((TreeNode<K,V>)xpn).prev = x;
                    //红黑树中，插入元素后必要的平衡调整操作
                    moveRootToFront(tab, balanceInsertion(root, x));
                    return null;
                }
            }
        }
```
方法：**balanceInsertion -- 调整插入后数据的平衡**

```java
static <K,V> TreeNode<K,V> balanceInsertion(TreeNode<K,V> root,TreeNode<K,V> x) {
            //每个新增节点默认为红色
            x.red = true;
            // xp父节点 xpp祖父节点 xppl祖父左节点 xppr 祖父右节点
            for (TreeNode<K,V> xp, xpp, xppl, xppr;;) {
                if ((xp = x.parent) == null) {
                    // x的父节点为空，x应为根节点，应为黑色 --(红黑树根节点为黑色)
                    x.red = false;
                    return x;
                }
                else if (!xp.red || (xpp = xp.parent) == null)
                // 父节点是黑色，祖父节点为空，直接返回
                    return root;
                //一下处理为逻辑--父节点是红色
                
                //父节点为祖父节点的左节点
                if (xp == (xppl = xpp.left)) {
                    //父节点是祖父节点的左节点
                    if ((xppr = xpp.right) != null && xppr.red) {
                        //叔父节点为红色--将叔父节点设置为黑色
                        xppr.red = false;
                        //父节点设置为黑色
                        xp.red = false;
                        //将祖父节点设置为红色
                        xpp.red = true;
                        //将祖父节点设置为当前节点，继续操作
                        x = xpp;
                    }
                    else {
                        //叔父节点为空或者黑色
                        if (x == xp.right) {
                           // x为父节点右节点，则要进行左旋操作
                            root = rotateLeft(root, x = xp);
                            xpp = (xp = x.parent) == null ? null : xp.parent;
                        }
                        // 经过左旋x为左节点
                        if (xp != null) {
                            //父节点涂成黑色
                            xp.red = false;
                            if (xpp != null) {
                                // 祖父节点不为空
                                // 祖父节点设为红色
                                xpp.red = true;
                                // 以祖父节点为支点右旋转
                                root = rotateRight(root, xpp);
                            }
                        }
                    }
                }
                 //父节点为祖父节点的右节点
                else {
                    if (xppl != null && xppl.red) {
                        // 叔父节点为红色
                        // 将叔父节点设为黑色
                        xppl.red = false;
                        xp.red = false;
                        xpp.red = true;
                        x = xpp;
                    }
                    else {
                        if (x == xp.left) {
                            root = rotateRight(root, x = xp);
                            xpp = (xp = x.parent) == null ? null : xp.parent;
                        }
                        if (xp != null) {
                            xp.red = false;
                            if (xpp != null) {
                                xpp.red = true;
                                root = rotateLeft(root, xpp);
                            }
                        }
                    }
                }
            }
        }
```

方法：**rotateLeft和rotateRight**

```java
//红黑树左旋
static <K,V> TreeNode<K,V> rotateLeft(TreeNode<K,V> root,TreeNode<K,V> p) {
            TreeNode<K,V> r, pp, rl;
            if (p != null && (r = p.right) != null) {
                if ((rl = p.right = r.left) != null)
                    rl.parent = p;
                if ((pp = r.parent = p.parent) == null)
                    (root = r).red = false;
                else if (pp.left == p)
                    pp.left = r;
                else
                    pp.right = r;
                r.left = p;
                p.parent = r;
            }
            return root;
        }

//红黑树右旋
static <K,V> TreeNode<K,V> rotateRight(TreeNode<K,V> root,TreeNode<K,V> p) {
            TreeNode<K,V> l, pp, lr;
            if (p != null && (l = p.left) != null) {
                if ((lr = p.left = l.right) != null)
                    lr.parent = p;
                if ((pp = l.parent = p.parent) == null)
                    (root = l).red = false;
                else if (pp.right == p)
                    pp.right = l;
                else
                    pp.left = l;
                l.right = p;
                p.parent = l;
            }
            return root;
        }
```



方法：**resize--扩容**

```java
 final Node<K,V>[] resize() {
        //保存原有的数据
        Node<K,V>[] oldTab = table;
        //原有的容量
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        //临界值 当实际大小(容量*填充比)超过临界值时，会进行扩容
        int oldThr = threshold;
        int newCap =0;
        int newThr = 0;
        if (oldCap > 0) {
            //原有容量大于最大限度容量，临界值=整数最大值，并且返回原有的不进行扩容
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // zero initial threshold signifies using defaults
            //使用的是无参构造方法
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        @SuppressWarnings({"rawtypes","unchecked"})
        //创建新的Node数组
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        //以下就是扩容--判断是不是新new的对象
        if (oldTab != null) {
            for (int j = 0; j < oldCap; ++j) {
            //处理旧数据的存放位置--三种情况
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    //旧数据没有子节点
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    //TreeNode节点--红黑树的形式存放
                    else if (e instanceof TreeNode)
                        //树形结构修剪
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                    //链表有子节点数据移动
                    //保证顺序
                        Node<K,V> loHead = null;
                        Node<K,V> loTail = null;
                        Node<K,V> hiHead = null;
                        Node<K,V> hiTail = null;
                        Node<K,V> next = null;
                        do {
                            //获取当前节点的下一个
                            next = e.next;
                           /**
                            * e.hash & oldCap 说明e.hash后的值小于oldCap,即使扩充了,
                            *也是扩充链表的后半部分,前面已经有的元素还是在原来的位置
                            *（容量除了最大容量其他都是2的倍数，通过(e.hash & oldCap) == 0)
                            *就可以判断链表的扩充）
                            *
                            */
                            if ((e.hash & oldCap) == 0) {
                            //如果loTail==null说明是第一个元素,把这个元素赋值给loHead
                                if (loTail == null)
                                    loHead = e;
                                else
                                //如果不是第一个元素,就把他加到后面
                                    loTail.next = e;
                                loTail = e;
                            }else {
                            //如果走下面的代码,则说明,新的元素的key值的hash已经超过了oldCap,所有要加入到新库充的链表中
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }
```
下列代码的图解：

```java
(e.hash & oldCap) == 0
```

![图解](https://github.com/mxsm/document/blob/master/image/JSE/hashMap1.8%E5%93%88%E5%B8%8C%E7%AE%97%E6%B3%95%E4%BE%8B%E5%9B%BE1.png?raw=true)

![图解](https://github.com/mxsm/document/blob/master/image/JSE/hashMap1.8%E5%93%88%E5%B8%8C%E7%AE%97%E6%B3%95%E4%BE%8B%E5%9B%BE2.png?raw=true)

![图解](https://github.com/mxsm/document/blob/master/image/JSE/jdk1.8hashMap%E6%89%A9%E5%AE%B9%E4%BE%8B%E5%9B%BE.png?raw=true)



方法：**split--树形结构修剪**

```java
//tab 表示保存桶头结点的哈希表
//index 表示从哪个位置开始修剪
//bit 要修剪的位数（哈希值）

final void split(HashMap<K,V> map, Node<K,V>[] tab, int index, int bit) {
            TreeNode<K,V> b = this;
            // Relink into lo and hi lists, preserving order
            TreeNode<K,V> loHead = null;
            TreeNode<K,V> loTail = null;
            TreeNode<K,V> hiHead = null;
            TreeNode<K,V> hiTail = null;
            int lc = 0;
            int hc = 0;
            for (TreeNode<K,V> e = b, next; e != null; e = next) {
                //当前节点的下个节点
                next = (TreeNode<K,V>)e.next;
                e.next = null;
                if ((e.hash & bit) == 0) {
                    if ((e.prev = loTail) == null)
                        loHead = e;
                    else
                        loTail.next = e;
                    loTail = e;
                    ++lc;
                }
                else {
                    if ((e.prev = hiTail) == null)
                        hiHead = e;
                    else
                        hiTail.next = e;
                    hiTail = e;
                    ++hc;
                }
            }

            if (loHead != null) {
                if (lc <= UNTREEIFY_THRESHOLD)
                    tab[index] = loHead.untreeify(map);
                else {
                    tab[index] = loHead;
                    if (hiHead != null) // (else is already treeified)
                        loHead.treeify(tab);
                }
            }
            if (hiHead != null) {
                if (hc <= UNTREEIFY_THRESHOLD)
                    tab[index + bit] = hiHead.untreeify(map);
                else {
                    tab[index + bit] = hiHead;
                    if (loHead != null)
                        hiHead.treeify(tab);
                }
            }
        }
```

方法：**remove--删除**

```java
    /**
     * Implements Map.remove and related methods.
     *
     * @param hash key的哈希值
     * @param key the key
     * @param value the value to match if matchValue, else ignored
     * @param matchValue if true only remove if value is equal
     * @param movable if false do not move other nodes while removing
     * @return the node, or null if none
     */
    final Node<K,V> removeNode(int hash, Object key, Object value,
                               boolean matchValue, boolean movable) {
        Node<K,V>[] tab; 
        Node<K,V> p; 
        int n;//哈希表长度保存变量
        int index; //哈希表的索引
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (p = tab[index = (n - 1) & hash]) != null) {
            Node<K,V> node = null, e; K k; V v;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                node = p;
            else if ((e = p.next) != null) {
                if (p instanceof TreeNode)
                    //红黑树查找
                    node = ((TreeNode<K,V>)p).getTreeNode(hash, key);
                else {
                    //链表查找
                    do {
                        if (e.hash == hash &&
                            ((k = e.key) == key ||
                             (key != null && key.equals(k)))) {
                            node = e;
                            break;
                        }
                        p = e;
                    } while ((e = e.next) != null);
                }
            }
            if (node != null && (!matchValue || (v = node.value) == value ||
                                 (value != null && value.equals(v)))) {
                if (node instanceof TreeNode)
                    //红黑树删除
                    ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
                else if (node == p)
                	//链表删除
                    tab[index] = node.next;
                else
                    p.next = node.next;
                ++modCount;
                --size;
                afterNodeRemoval(node);
                return node;
            }
        }
        return null;
    }
```

方法：**removeTreeNode—红黑树删除节点**

```java
final void removeTreeNode(HashMap<K,V> map, Node<K,V>[] tab,boolean movable) {
            int n;
            if (tab == null || (n = tab.length) == 0)
                return;
            int index = (n - 1) & hash;
    		//获取到哈希表的第一个节点
            TreeNode<K,V> first = (TreeNode<K,V>)tab[index]; 
    		//哈希表的第一个节点即为红黑树的跟节点
    		TreeNode<K,V>  root = first;
    		TreeNode<K,V> rl;
    		//删除节点的下一个节点--链表的情况
            TreeNode<K,V> succ = (TreeNode<K,V>)next;
    		//删除节点的前一个节点
    		TreeNode<K,V> pred = prev;
    
    		//pred节点为空说明删除节点为跟节点
            if (pred == null)
                tab[index] = first = succ;
            else
                //pred非空的--前一个节点的下一个节点为删除节点的下一个节点
                pred.next = succ;
    		
            if (succ != null)
                //删除节点的下一个节点不为空将将删除节点的next节点的prev节点设置为删除节点的前一个节点
                succ.prev = pred;
    		
            if (first == null)
                //first为空说明删除的是根节点且没有其他节点
                //若删除的结点是树中的唯一结点则直接结束
                return;
    
            if (root.parent != null)
                //获取根节点--确保root指向根节点
                root = root.root();
    
            if (root == null || root.right == null ||
                (rl = root.left) == null || rl.left == null) {
                // 根自身或者左右儿子其中一个为空说明结点数过少（不超过2）转为线性表并结束
                tab[index] = first.untreeify(map);  // too small
                return;
            }
    		
    		
            TreeNode<K,V> p = this;//指向删除节点
    		TreeNode<K,V> pl = left;//指向删除节点的左子树
    		TreeNode<K,V> pr = right;//指向删除节点的右子树
    		TreeNode<K,V> replacement;//替代的节点
    		//删除节点的左右节点都不为空
            if (pl != null && pr != null) {
                TreeNode<K,V> s = pr;
                TreeNode<K,V> sl;
                //找到删除节点的hashCode最小值--二叉查找树的删除原理
                //删除结点的左右儿子都不为空时，寻找右子树中最左的叶结点作为后继，s指向这个后继结点
                while ((sl = s.left) != null) // find successor
                    s = sl;
                //交换s和删除节点p的颜色--交换后继结点和要删除结点的颜色
                boolean c = s.red; 
                boolean s.red = p.red;
                boolean  p.red = c; // swap colors
                
                TreeNode<K,V> sr = s.right;
                TreeNode<K,V> pp = p.parent;
                //交换s和p的位置
                if (s == pr) { // p was s's direct parent
                    p.parent = s;
                    s.right = p;
                }
                else {
                    TreeNode<K,V> sp = s.parent;
                    if ((p.parent = sp) != null) {
                        if (s == sp.left)
                            sp.left = p;
                        else
                            sp.right = p;
                    }
                    if ((s.right = pr) != null)
                        pr.parent = s;
                }
                p.left = null;
                if ((p.right = sr) != null)
                    sr.parent = p;
                if ((s.left = pl) != null)
                    pl.parent = s;
                if ((s.parent = pp) == null)
                    root = s;
                else if (p == pp.left)
                    pp.left = s;
                else
                    pp.right = s;
                if (sr != null)
                    replacement = sr;
                else
                    replacement = p;
            }
            else if (pl != null)
                replacement = pl;
            else if (pr != null)
                replacement = pr;
            else
                replacement = p;
            if (replacement != p) {
                TreeNode<K,V> pp = replacement.parent = p.parent;
                if (pp == null)
                    root = replacement;
                else if (p == pp.left)
                    pp.left = replacement;
                else
                    pp.right = replacement;
                p.left = p.right = p.parent = null;
            }

            TreeNode<K,V> r = p.red ? root : balanceDeletion(root, replacement);

            if (replacement == p) {  // detach
                TreeNode<K,V> pp = p.parent;
                p.parent = null;
                if (pp != null) {
                    if (p == pp.left)
                        pp.left = null;
                    else if (p == pp.right)
                        pp.right = null;
                }
            }
            if (movable)
                moveRootToFront(tab, r);
        }
```

> 注意：HashMap如果key为null,那么存放的桶的位置为第一个也就是index=0的位置。由源码可以看出来
>
> ```java
>     static final int hash(Object key) {
>         int h;
>         return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
>     }
> ```

### 相关参考链接

```
https://www.cnblogs.com/CarpenterLee/p/5503882.html
https://blog.csdn.net/wushiwude/article/details/75331926
http://www.importnew.com/29724.html
https://www.jianshu.com/p/5b157d4be1ad
```