---
title: HashMap和HashTable的区别
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
abbrlink: 8f303c09
date: 2019-08-09 20:12:54
---
### HashMap和HashTable区别

1. **线程是否安全**：HashMap非线程安全，HashTable是线程安全的；HashTable内部都经过了`synchronized`

   ```java
   //HashMap的put方法
       public V put(K key, V value) {
           return putVal(hash(key), key, value, false, true);
       }
   
   	//HashTable的put方法
   	    public synchronized V put(K key, V value) {
           // Make sure the value is not null
           if (value == null) {
               throw new NullPointerException();
           }
   
           // Makes sure the key is not already in the hashtable.
           Entry<?,?> tab[] = table;
           int hash = key.hashCode();
           int index = (hash & 0x7FFFFFFF) % tab.length;
           @SuppressWarnings("unchecked")
           Entry<K,V> entry = (Entry<K,V>)tab[index];
           for(; entry != null ; entry = entry.next) {
               if ((entry.hash == hash) && entry.key.equals(key)) {
                   V old = entry.value;
                   entry.value = value;
                   return old;
               }
           }
           addEntry(hash, key, value, index);
           return null;
       }
   
   
   ```

   

2. **效率:** 因为线程安全问题，HashMap要比HashTable效率略高一点，JDK1.8基本上被淘汰了，不要在代码中使用

3. **对Null key 和Null value的支持：** HashMap可以用null作为键值，这样的且只有一个。但是在 HashTable 中 put 进的键值或者value只要有一个 null，直接抛出 NullPointerException

   ```java
   //HashTable
   public synchronized V put(K key, V value) {
           //确保value不等于null
           if (value == null) {
               throw new NullPointerException();
           }
   
           // Makes sure the key is not already in the hashtable.
           Entry<?,?> tab[] = table;
       	//key不能为null--NullPointerException
           int hash = key.hashCode();
           int index = (hash & 0x7FFFFFFF) % tab.length;
           @SuppressWarnings("unchecked")
           Entry<K,V> entry = (Entry<K,V>)tab[index];
           for(; entry != null ; entry = entry.next) {
               if ((entry.hash == hash) && entry.key.equals(key)) {
                   V old = entry.value;
                   entry.value = value;
                   return old;
               }
           }
           addEntry(hash, key, value, index);
           return null;
       }
   ```

4. **初始容量大小和每次扩充容量大小的不同 ：**

   - 默认初始容量不一样：`HashMap`初始容量16，`HashTable`初始容量11。扩容HashMap都是变为原来的2倍，HashMap容量每次扩容都是2的幂次方大小(tableSizeFor方法保证)，HashTable的的扩容(oldCapacity << 1) + 1及2n+1

     ```java
      public Hashtable() {
             this(11, 0.75f);
         }
     	//HashMap 发生在第一次put的时候
          int newCap = DEFAULT_INITIAL_CAPACITY;
          int newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
     ```

5. **底层数据结构:** JDK1.8以后的HashMap在解决Hash冲突试用了哈希表+链表+红黑树，链表转换为红黑树的状态的阈值为8。用来减少搜索时间，HashTable没有这样的改动



