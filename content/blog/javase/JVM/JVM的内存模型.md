---
title: JVM的内存模型
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
abbrlink: 5805834a
date: 2018-11-04 23:38:42
---
### 1.  JVM的内存模型

从网上找了几个内存的模型和自己画的一个

![图片](https://github.com/mxsm/document/blob/master/image/JSE/JVMmodel.png?raw=true)

![图片](https://github.com/mxsm/document/blob/master/image/JSE/JVM%E5%86%85%E5%AD%98%E6%A8%A1%E5%9E%8B%E5%9B%BE%E8%A7%A3.png?raw=true)

![图片](https://github.com/mxsm/document/blob/master/image/JSE/%E8%99%9A%E6%8B%9F%E6%9C%BA%E5%86%85%E5%AD%98%E6%A8%A1%E5%9E%8B%E5%9B%BE%E8%A7%A3.png?raw=true)

**线程共享：**

- **方法区：** 

  在 **`Java`** 虚拟机中，方法区是可供各线程共享的运行时内存区域。在HotSpot中，设计者将方法区纳入GC分代收集。HotSpot虚拟机堆内存被分为新生代和老年代，对堆内存进行分代管理，所以HotSpot虚拟机使用者更愿意将方法区称为 **`老年代(或者叫永久代)`** 。

- **堆：**

  堆内存是 **`JVM`** 所有线程共享的部分，在虚拟机启动的时候就已经创建了。所有的对象和数组都在堆上进行分配。这部分空间可以通过GC进行垃圾回收的。当申请不到空间时会抛出 **`OutOfMemoryError`** 。

**线程隔离：** 

- **PC寄存器**

  PC寄存器也叫程序计数器，可以看成当前线程所执行的字节码的行号指示器。在任何一个确定的时刻，一个处理器都只会执行一条线程中的指令。应酬为了线程切换能够正确的恢复到正确的执行位置。每条线程都需要一个独立的程序计数器，PC寄存器所以是线程私有的和特定的线程绑定在一起的。**执行的是Java方法该寄存器保存的是当前指令的地址。如果执行的是本地方法PC寄存器就是空的。 ** ( **`主要的作用就是完成线程的上下文切换`** )

- **本地方法栈**

  保存native方法进入区域的地址

- **虚拟机栈**

  每一个 **`Java`** 线程都有自己的虚拟机栈，这个栈与线程一起创建，他的生命周期和线程一样。虚拟机栈描述的是 **`Java 方法执行的内存模型`** ，每个方法被执行的时候会同时创建一个 **`栈帧`**  用来存储局部变量表，操作数栈，动态链接，方法出口信息等。每个方法被调用直到执行完成的整个过程就对应虚拟机栈创建的一个线程的栈帧，包含了出栈和入栈的过程。

### 2 Java Heap 内存模型（JDK7）

在Java中  **`方法区`** 和 **`Heap(堆)`** 应该都属于堆的范畴，但是只是不同的Java虚拟机的实现对此进行了区分而已。

当代主流虚拟机（ **`Hotspot VM`** ）的垃圾回收都采用“分代回收”的算法。“分代回收”是基于这样一个事实：**对象的生命周期不同，所以针对不同生命周期的对象可以采取不同的回收方式，以便提高回收效率。**

**`Hotspot VM`** 将内存划分为不同的物理区，就是“分代”思想的体现。如图所示，JVM内存主要由 **`新生代`** ， **`老年代`** 、 **`永久代构成`** 。而 **`新生代`** 和 **`老年代`** 构成上面的JVM内存模型中说的 **`堆`** ， 而 **`永久代`** 构成了 **`方法区`** 

![图解](https://github.com/mxsm/document/blob/master/image/JSE/JVM%E5%A0%86%E5%92%8C%E6%96%B9%E6%B3%95%E5%8C%BA%E7%9A%84%E5%86%85%E5%AD%98%E6%A8%A1%E5%9E%8B.png?raw=true)

- **新生代(Young Generation):** 大多数对象在新生代中被创建，其中很多对象的生命周期很短。每次新生代的垃圾回收（又称 **`Minor GC`** ）后只有少量对象存活，所以选用 **`复制算法`** ，只需要少量的复制成本就可以完成回收。

  - **Eden区：** 大部分对象在Eden区中生成。当 **`Eden区`** 满时，还存活的对象将被复制到 **`Survivor区(S0)`** 。(PS:程序的设计者真的是厉害命名都是结合神话故事然后又能生动反映实际情况。耶和华上帝照自己的形像造了人类的袓先，男的称亚当，女的称夏娃，安置第一对男女住在伊甸园中。伊甸园在圣经的原文中含有快乐，愉快的园子的意思.只有佩服两个字)
  - **S0区:** S0区存放Eden区GC剩下的。
  -  **S1区:** S1区存放S0区GC剩下的。

  当Eden区满时，还存活的对象将被复制到两个Survivor区（中的一个）。当这个Survivor区满时，此区的存活且不满足“晋升”条件的对象将被复制到另外一个Survivor区。对象每经历一次Minor GC，年龄加1，达到“晋升年龄阈值”后，被放到老年代，这个过程也称为“晋升”。显然，“晋升年龄阈值”的大小直接影响着对象在新生代中的停留时间，在Serial和ParNew GC两种回收器中，“晋升年龄阈值”通过参数MaxTenuringThreshold设定，默认值为15。

- **老年代（Old Generation）** ：在新生代中经历了N次垃圾回收后仍然存活的对象，就会被放到年老代，该区域中对象存活率高。老年代的垃圾回收（又称Major GC）通常使用“ **标记-清理** ”或“ **标记-整理** ”算法。**整堆包括新生代和老年代的垃圾回收称为Full GC**（HotSpot VM里，除了CMS之外，**其它能收集老年代的GC都会同时收集整个GC堆，包括新生代**）。

- **永久代（Perm Generation）：** 主要存放元数据，例如Class、Method的元信息，与垃圾回收要回收的Java对象关系不大。相对于新生代和年老代来说，该区域的划分对垃圾回收影响比较小。

  JDK8用 **MetaSpace** 代替了 **永久代**

### 2. JVM具体分析

![](https://github.com/mxsm/document/blob/master/image/JSE/JVM.png?raw=true)

通过字节码来分析栈帧，首先看一下源码创建

![](https://github.com/mxsm/document/blob/master/image/JSE/bytes.gif?raw=true)

这里演示了如何获取字节码的。

```java
Compiled from "Math.java"
public class com.github.mxsm.Math {
  public static final int CONST;

  public com.github.mxsm.Math();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public int compute();
    Code:
       0: iconst_1
       1: istore_1
       2: iconst_2
       3: istore_2
       4: iload_1
       5: iload_2
       6: iadd
       7: bipush        10
       9: imul
      10: istore_3
      11: iload_3
      12: ireturn

  public static void main(java.lang.String[]);
    Code:
       0: new           #2                  // class com/github/mxsm/Math
       3: dup
       4: invokespecial #3                  // Method "<init>":()V
       7: astore_1
       8: aload_1
       9: invokevirtual #4                  // Method compute:()I
      12: pop
      13: return
}
```

> 命令对照表：[https://xfl03.gitee.io/coremodtutor/%E9%99%84%E5%BD%95B.html](https://xfl03.gitee.io/coremodtutor/附录B.html) 