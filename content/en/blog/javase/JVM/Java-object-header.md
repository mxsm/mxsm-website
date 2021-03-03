---
title: 深入理解Java对象头Mark Word
linkTitle: 深入理解Java对象头Mark Word
date: 2020-05-06
---

> 下面是基于JDK13 64位

网上对于Java对象头Mark Word有很多的资料，但是大多数都是32系统的，jdk7甚至1.6的版本。通过对网上资料的查找根据自己的一些代码下面来深入理解一下Java对象头Mark Word的组成。

### 1 对象头的参看神器

```xml
<dependency>
  <groupId>org.openjdk.jol</groupId>
  <artifactId>jol-core</artifactId>
  <version>0.14</version>
</dependency>
```

通过使用对象头查看神器来小试牛刀一下代码如下：

```java
package com.github.mxsm;

import org.openjdk.jol.info.ClassLayout;

public class HeaderView {

    public static void main(String[] args) {
        HeaderView headerView = new HeaderView();
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }
}

```

通过运行的结果如下：

```shell
com.github.mxsm.HeaderView object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           54 c3 00 f8 (01010100 11000011 00000000 11111000) (-134167724)
     12     4        (loss due to the next object alignment)
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```

通过发现在正常不设置任何参数的情况下，对象头的长度为12个字节。

增加一个JVM参数（取消对象指针压缩，默认情况下JDK是开启的）：

```
-XX:-UseCompressedOops
```

运行的结果：

```shell
com.github.mxsm.HeaderView object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           08 17 2e 1c (00001000 00010111 00101110 00011100) (472782600)
     12     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
Instance size: 16 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

所以在不开启对象指针压缩的情况下对象头的长度为16个字节。

### 2 对象头的组成

- #### Mark Word(标记字段)

- #### klass pointer(类型指针)

- #### array length(数组长度)

**普通对象**：

```java
//开启了指针压缩
|--------------------------------------------------------------|
|                     Object Header (96 bits)                  |
|------------------------------------|-------------------------|
|        Mark Word (64 bits)         | Klass Word (32 bits)    |
|------------------------------------|-------------------------|
 //没有开启指针压缩    
|--------------------------------------------------------------|
|                     Object Header (128 bits)                 |
|------------------------------------|-------------------------|
|        Mark Word (64 bits)         | Klass Word (64 bits)    |
|------------------------------------|-------------------------|    
public class HeaderView {
    //-XX:+UseCompressedOops
    //-XX:-UseCompressedOops
    public static void main(String[] args) {
        Header headerView = new Header();
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }
}    
```

-XX:+UseCompressedOops 指针压缩开启运行结果

```
com.github.mxsm.Header object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           92 c3 00 f8 (10010010 11000011 00000000 11111000) (-134167662)
     12     4        (loss due to the next object alignment)
Instance size: 16 bytes
Space losses: 0 bytes internal + 4 bytes external = 4 bytes total
```

-XX:+UseCompressedOops 指针压缩关闭运行结果

```shell
com.github.mxsm.Header object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           d0 1b 3b 1c (11010000 00011011 00111011 00011100) (473635792)
     12     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
Instance size: 16 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

**数组对象**：

```java
//开启指针压缩
|----------------------------------------------------------------------------------|
|                                 Object Header (128 bits)                         |
|--------------------------------|-----------------------|-------------------------|
|        Mark Word(64bits)       | Klass Word(32bits)    |  array length(32bits)   |
|--------------------------------|-----------------------|-------------------------|

//没有开启指针压缩
|----------------------------------------------------------------------------------|
|                                 Object Header (160 bits)                         |
|--------------------------------|-----------------------|-------------------------|
|        Mark Word(64bits)       | Klass Word(64bits)    |  array length(32bits)   |
|--------------------------------|-----------------------|-------------------------|

 public class HeaderView {

    public static void main(String[] args) {
        Header[] headerView = new Header[100];
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }

}
```

-XX:+UseCompressedOops 指针压缩开启运行结果：

```shell
[Lcom.github.mxsm.Header; object internals:
 OFFSET  SIZE                     TYPE DESCRIPTION                               VALUE
      0     4                          (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4                          (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4                          (object header)                           05 c4 00 f8 (00000101 11000100 00000000 11111000) (-134167547)
     12     4                          (object header)                           64 00 00 00 (01100100 00000000 00000000 00000000) (100)
     16   400   com.github.mxsm.Header Header;.<elements>                        N/A
Instance size: 416 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

-XX:-UseCompressedOops 指针压缩关闭运行结果：

```shell
[Lcom.github.mxsm.Header; object internals:
 OFFSET  SIZE                     TYPE DESCRIPTION                               VALUE
      0     4                          (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4                          (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4                          (object header)                           b0 1d ab 1c (10110000 00011101 10101011 00011100) (480976304)
     12     4                          (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
     16     4                          (object header)                           64 00 00 00 (01100100 00000000 00000000 00000000) (100)
     20     4                          (alignment/padding gap)                  
     24   800   com.github.mxsm.Header Header;.<elements>                        N/A
Instance size: 824 bytes
Space losses: 4 bytes internal + 0 bytes external = 4 bytes total
```



### 3 Mark Word

标记字段每个字段表示什么，我们可以从JVM的源码着手分析，下面来看一下在 [OpenJDK中markOop.hpp](https://github.com/openjdk/jdk/blob/jdk-13-ga/src/hotspot/share/oops/arrayKlass.hpp) JDK源码的文件注释，注释说明了位图的表示：

> 说明:在OpenJDK中发现15版本已经没有markOop.hpp文件存在了。

```cpp
//  64 bits:
//  --------
//  unused:25 hash:31 -->| unused:1   age:4    biased_lock:1 lock:2 (normal object)
//  JavaThread*:54 epoch:2 unused:1   age:4    biased_lock:1 lock:2 (biased object)
//  PromotedObject*:61 --------------------->| promo_bits:3 ----->| (CMS promoted object)
//  size:64 ----------------------------------------------------->| (CMS free block)
//  
//  使用COOPs指针压缩技术
//  unused:25 hash:31 -->| cms_free:1 age:4    biased_lock:1 lock:2 (COOPs && normal object)
//  JavaThread*:54 epoch:2 cms_free:1 age:4    biased_lock:1 lock:2 (COOPs && biased object)
//  narrowOop:32 unused:24 cms_free:1 unused:4 promo_bits:3 ----->| (COOPs && CMS promoted object)
//  unused:21 size:35 -->| cms_free:1 unused:7 ------------------>| (COOPs && CMS free block)

//    [JavaThread* | epoch | age | 1 | 01]       lock is biased toward given thread
//    [0           | epoch | age | 1 | 01]       lock is anonymously biased
//
//  - the two lock bits are used to describe three states: locked/unlocked and monitor.
//
//    [ptr             | 00]  locked             ptr points to real header on stack
//    [header      | 0 | 01]  unlocked           regular object header
//    [ptr             | 10]  monitor            inflated lock (header is wapped out)
//    [ptr             | 11]  marked             used by markSweep to mark an object
//                                               not valid at any other time
```

如下图：

指针压缩开启：

![指针压缩开启](https://github.com/mxsm/picture/blob/main/java/jvm/markword%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A9%E5%BC%80%E5%90%AF.png?raw=true)

指针压缩关闭

![指针压缩关闭](https://github.com/mxsm/picture/blob/main/java/jvm/markword%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A9%E6%B2%A1%E5%BC%80%E5%90%AF.png?raw=true)

> 说明：
>
> 1. 轻量锁是相对于偏向锁来说的
> 2. 无锁状态是用01来表示
> 3. 重量锁在英文说明中用的是(inflated lock)膨胀锁

### 4 Mark Word 锁状态

通过分析JVM的源码注释可以发现Java对象头在不同的状态下会有不同的表现形式，主要有三种状态：

- **无锁状态**
- **加锁状态**
- **GC标记**

Java中上锁可以理解为给对象上锁，也就是改变对象头的状态(锁的状态)如果成功上锁那么就进入同步的代码块中。Java中锁又分为三类：

- **偏向锁(01)**
- **轻量锁(00)**
- **重量锁(10)**

> 说明：01、00、10 是对象头中锁的两位的表示

不同的锁效率也不一样。

### 5 jol数据如何查看

```java
package com.github.mxsm;

import org.openjdk.jol.info.ClassLayout;

/**
 * @author mxsm
 * @Date 2021/1/21
 * @Since
 */
public class HeaderView {

    public static void main(String[] args) {
        Header headerView = new Header();
        System.out.println("HashCode十六进制----------->"+Integer.toHexString(headerView.hashCode()));
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }

}
```

运行结果:

![](https://github.com/mxsm/picture/blob/main/java/jvm/jol%E6%95%B0%E6%8D%AE%E5%A6%82%E4%BD%95%E6%9F%A5%E7%9C%8B.png?raw=true)

用示意图来表示Mark Word的数据排列结合jol打印的数据：

![](https://github.com/mxsm/picture/blob/main/java/jvm/markword%E4%BD%8D%E5%9B%BE%E5%9B%BE%E8%A7%A3.png?raw=true)

排列如上图就能和上面打印的对比出来了。这样也就解释了为什么头部未使用的25个byte

> 说明：通过上面的锁的两个位标识可以看出来，在没有枷锁的时候应该是01和图中也一一对上

### 5 Mark Word 正常状态

以下都是在开启指针压缩的情况下(这个也是JVM的默认)，首先看一下Header类

```java
public class Header {

    private boolean flag;

    private int index;

    private long date;

    private float flt;

    private double db;

    private byte bytes;

    private String string;

    private char ch;

}

public class HeaderView {

    public static void main(String[] args) {
        Header headerView = new Header();
        System.out.println("HashCode十六进制----------->"+Integer.toHexString(headerView.hashCode()));
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }

}
```

正常状态打印数据：

![](https://github.com/mxsm/picture/blob/main/java/jvm/markword%E6%AD%A3%E5%B8%B8%E7%8A%B6%E6%80%81.png?raw=true)

> 说明:从上图可以看出来不同的数据类型占用的字节数都不一样。

### 6 Mark Word 偏向锁

```java
public class Header {
    public synchronized void biasedLock(){
        System.out.println("biasedLock................");
    }
}

package com.github.mxsm;

import org.openjdk.jol.info.ClassLayout;

/**
 * @author mxsm
 * @Date 2021/1/21
 * @Since
 */
public class HeaderView {

    public static void main(String[] args) {
        Header headerView = new Header();
        System.out.println("加锁之前.....");
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
        headerView.biasedLock();
        System.out.println("加锁之后.....");
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }
}
```

打印结果：

![](https://github.com/mxsm/picture/blob/main/java/jvm/%E7%8A%B6%E6%80%81%E8%BD%AC%E5%8F%98%E4%B8%BA%E5%81%8F%E5%90%91%E9%94%811.png?raw=true)

通过结果发现调用上面这个程序只有一个线程去调用biasedLock方法，应该是偏向锁，但是你会发现输出的结果（第一个字节）依然是00000001和无锁的时候一模一样，其实这是**因为虚拟机在启动的时候对于偏向锁有延迟**如果没有偏向锁的延迟的话，虚拟机在启动的时候，可能JVM某个线程调用你的线程，这样就有可能变成了轻量锁或者重量锁(如果没有延迟会降低JVM启动的速度)，所以要做偏向锁的延迟。查看的方式有两种：

1. 增加JVM参数:-XX:BiasedLockingStartupDelay=0

2. 加锁之前让线程睡几秒

   ```java
   package com.github.mxsm;
   
   import java.util.concurrent.TimeUnit;
   import org.openjdk.jol.info.ClassLayout;
   
   package com.github.mxsm;
   
   import java.util.concurrent.TimeUnit;
   import org.openjdk.jol.info.ClassLayout;
   
   /**
    * @author mxsm
    * @Date 2021/1/21
    * @Since
    */
   public class HeaderView {
   
       public static void main(String[] args) {
           /**
            * 睡眠时间大概在5秒左右，4秒测试我这边没有效果
            * 切记延迟一定要放在对象创建之前，不然是无效的，因为在你对象创建之前，偏向锁的延迟的时间
            * 没有给你睡过去，这时候，对象已经创建了，对象头的信息已经生成了。(在对象头生成之前)
            */
           try {
               TimeUnit.MILLISECONDS.sleep(4500);
           } catch (InterruptedException e) {
               e.printStackTrace();
           }
           Header headerView = new Header();
           System.out.println("加锁之前.....");
           System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
          
           headerView.biasedLock();
           System.out.println("加锁之后.....");
           System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
       }
   }
   
   ```

   > 说明：
   >
   > - 睡眠时间大概在五秒左右，具体可以去测试
   > - 线程睡眠时间一定要在对象创建之前(对象头生成之前)

![](https://github.com/mxsm/picture/blob/main/java/jvm/%E7%8A%B6%E6%80%81%E8%BD%AC%E4%B8%BA%E5%81%8F%E5%90%91%E9%94%812.png?raw=true)

通过图片可以看出来已经变成可偏向状态了。

### 7 Mark Word重量锁(膨胀锁)

```java
package com.github.mxsm;

import org.openjdk.jol.info.ClassLayout;

/**
 * @author mxsm
 * @Date 2021/1/21
 * @Since
 */
public class Header {

    public synchronized void biasedLock(){

        System.out.println("biasedLock方法执行................");
        System.out.println(ClassLayout.parseInstance(this).toPrintable());

    }

}

package com.github.mxsm;

import java.util.concurrent.TimeUnit;
import org.openjdk.jol.info.ClassLayout;

/**
 * @author mxsm
 * @Date 2021/1/26
 * @Since
 */
public class InflatedLock {

    public static void main(String[] args) {
        //偏向锁延迟开启的状态下
        final Header headerView = new Header();
        System.out.println("加锁之前.....");
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());

        new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (headerView){
                    try {
                        TimeUnit.SECONDS.sleep(5);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println("------ Thread1 release-----\n");
                    System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
                }
            }
        },"Thread1").start();

        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("Thread1 is locking");
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());


        headerView.biasedLock();
        System.out.println("加锁之后.....");
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());

        System.gc();
        System.out.println("GC后.....");
        System.out.println(ClassLayout.parseInstance(headerView).toPrintable());
    }

}
```

执行结果：

![](https://github.com/mxsm/picture/blob/main/java/jvm/%E7%8A%B6%E6%80%81%E8%BD%AC%E4%B8%BA%E9%87%8D%E5%BA%A6%E9%94%811.png?raw=true)

![](https://github.com/mxsm/picture/blob/main/java/jvm/%E7%8A%B6%E6%80%81%E8%BD%AC%E4%B8%BA%E9%87%8D%E5%BA%A6%E9%94%812.png?raw=true)

gc后年龄增加1。



参考文档：

- [深入理解Java的对象头mark word](https://blog.csdn.net/qq_36434742/article/details/106854061)
