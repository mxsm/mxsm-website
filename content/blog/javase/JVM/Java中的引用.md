---
title: Java中的引用
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
abbrlink: 1ae51239
date: 2019-09-28 02:24:34
---
### Java引用的四种类型

- **分为强引用（Strong Reference）**

  这个大家天天用可能只是没有注意比如

  ```java
  Object obj = new Object()
  ```

  这就是强引用。只要有强引用，对象永远不会被回收

- **分为软引用（Soft Reference）**

  自己表示没有用过，没用过那就看一下通过代码：

  ```java
  SoftReference<StringBuilder> softReference = new SoftReference<>(new StringBuilder("test"));
  ```

  官方的说法是由垃圾收集器根据内存需求自行清除。软引用大部分用来实现**内存敏感**的缓存

  ```java
  /**
   * -XX:+PrintGCDetails
   * -Xms20m
   * -Xmx20m
   */
  
  public class SoftReferenceTest {
  
      private static final int _1MB = 1024*1024;
  
      public static void main(String[] args) {
  
          SoftReference<Byte[]> softReference = new SoftReference<>(new Byte[2*_1MB]);
          System.out.println(softReference.get());
          byte[] allco1 = new byte[2*_1MB];
          byte[] allco2 = new byte[2*_1MB];
          byte[] allco3 = new byte[2*_1MB];
          byte[] allco4 = new byte[2*_1MB];
          byte[] allco5 = new byte[2*_1MB];
          System.out.println(softReference.get());
  
      }
  }
  
  ```

  ```
  [Ljava.lang.Byte;@6bf2d08e
  [GC (Allocation Failure) [PSYoungGen: 5065K->485K(6144K)] 13257K->9357K(19968K), 0.0018207 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
  [GC (Allocation Failure) [PSYoungGen: 4751K->496K(6144K)] 13623K->13517K(19968K), 0.0043121 secs] [Times: user=0.01 sys=0.01, real=0.00 secs] 
  [Full GC (Ergonomics) [PSYoungGen: 496K->0K(6144K)] [ParOldGen: 13021K->13305K(13824K)] 13517K->13305K(19968K), [Metaspace: 3354K->3354K(1056768K)], 0.0166522 secs] [Times: user=0.03 sys=0.00, real=0.02 secs] 
  [Full GC (Ergonomics) [PSYoungGen: 4340K->4096K(6144K)] [ParOldGen: 13305K->13261K(13824K)] 17645K->17357K(19968K), [Metaspace: 3364K->3364K(1056768K)], 0.0160700 secs] [Times: user=0.03 sys=0.00, real=0.02 secs] 
  [Full GC (Allocation Failure) [PSYoungGen: 4096K->0K(6144K)] [ParOldGen: 13261K->9094K(13824K)] 17357K->9094K(19968K), [Metaspace: 3364K->3364K(1056768K)], 0.0048642 secs] [Times: user=0.01 sys=0.00, real=0.00 secs] 
  null
  Heap
   PSYoungGen      total 6144K, used 2129K [0x00000007bf980000, 0x00000007c0000000, 0x00000007c0000000)
    eden space 5632K, 37% used [0x00000007bf980000,0x00000007bfb94778,0x00000007bff00000)
    from space 512K, 0% used [0x00000007bff80000,0x00000007bff80000,0x00000007c0000000)
    to   space 512K, 0% used [0x00000007bff00000,0x00000007bff00000,0x00000007bff80000)
   ParOldGen       total 13824K, used 9094K [0x00000007bec00000, 0x00000007bf980000, 0x00000007bf980000)
    object space 13824K, 65% used [0x00000007bec00000,0x00000007bf4e1b68,0x00000007bf980000)
   Metaspace       used 3375K, capacity 4496K, committed 4864K, reserved 1056768K
    class space    used 367K, capacity 388K, committed 512K, reserved 1048576K
  ```

  打印为null说明GC已经回收了内存。

  **对于关联软引用的对象，在系统将要发生内存溢出异常之前，将会把这些对象进行二次回收，如果仍没有足够的内存，才会抛出内存溢出异常。使用SoftReference类来实现**

- **分为弱引用（Weak Reference）**

  **弱引用也是描述非必须的对象，被它关联的对象，只能生存到下一次垃圾回收发生之前，当垃圾回收时，无论内存是否足够，都会被回收，系统提供WeakReference类来实现弱引用**

  代码验证：

  ```java
  public class WeakRefrenceTest {
  
      public static void main(String[] args) {
  
          WeakReference<String> weakReference = new WeakReference<>(new String("1111"));
          System.out.println("GC前："+weakReference.get());
          System.gc(); //手动调用GC操作
          System.out.println("GC后："+weakReference.get());
  
      }
  
  }
  ```

  打印结果：

  ```
  GC前：1111
  GC后：null
  ```

  如果换成下面的这样代码呢？

  ```java
  public class WeakRefrenceTest {
  
      public static void main(String[] args) {
  		
          //new String("1111") 换成 
          WeakReference<String> weakReference = new WeakReference<>("1111");
          System.out.println("GC前："+weakReference.get());
          System.gc();
          System.out.println("GC后："+weakReference.get());
  
      }
  
  }
  ```

  打印的结果：

  ```
  GC前：1111
  GC后：1111
  ```

  为什么上面 **`new String("111")`** 打印的GC后的为空而直接 **`111`** 打印的是GC后的是111。因为 **`111`** 被放到了常量池里面。

- **虚引用（Phantom Reference）**