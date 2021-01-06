---
title: Java GC日志图解
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
abbrlink: 43a48c8f
date: 2018-07-14 04:30:09
---
### 1. GC日志开启

**Java** 的GC日志可以通过命令 **`-XX:+PrintGCDetails`** 开启。下面就来看看如何看懂GC的日志。

### 2. 如何看GC日志

下面是以**JDK8**为例子，GC也是用的默认(**ParallelGC**)的没有做任何修改。**GC**分为两种：

- **Minor GC** — **新生代GC**

  ![图解](https://github.com/mxsm/document/blob/master/image/JSE/MinorGCDetail.jpg?raw=true)

  1. **GC (System.gc())：** **GC**的类型 GC表示的是 **Minor GC** 

  2. **[PSYoungGen: 7887K->1228K(76288K)]** 

     ```
     PSYoungGen: 表示年轻带
     7887K: GC前新生代占用的内存
     1228K：GC后新生代占用的内存
     76288K：新生代总共大小
     ```

  3. **7887K->1236K(251392K)**

     ```
     7887K：GC前JVM堆内存占用
     1236K：GC后JVM堆内存占用
     251392K： JVM堆总大小
     ```

     

  4. **0.0019310 secs**  GC耗时

  5. **[Times: user=0.01 sys=0.00, real=0.01 secs]**

     ```
     user=0.01 用户耗时
     sys=0.00 系统耗时
     real=0.01 实际耗时
     ```

- **Full GC(Major GC) — 老年代GC**

  ![图](https://github.com/mxsm/document/blob/master/image/JSE/FullGCDetail.jpg?raw=true)

1. **Full GC (System.gc())** GC类型—**Full GC**
2. **[PSYoungGen: 1228K->0K(76288K)]:**  新生代：GC前内存占用—>GC后内存占用(新生代内存占用总量)
3. **[ParOldGen: 8K->1081K(175104K)]:**  老年代：GC前内存占用—>GC后内存占用(老年代的内存占用总量) 
4.  **1236K->1081K(251392K)：** JVM内存占用: GC前内存占用—>GC后内存占用(JVM内存占用总量)
5. **[Metaspace: 3212K->3212K(1056768K)]：** 元数据区： GC前内存在用—>GC后内存占用(元数据区总量)
6. 后面的都是时间

