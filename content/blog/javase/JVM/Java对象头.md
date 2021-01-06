---
title: Java对象头
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
  - Java对象头
abbrlink: 2eeb8779
date: 2020-05-06 00:27:00
---

> 下面是基于JDK8 64位

### 对象头的参看神器

```xml
<dependency>
  <groupId>org.openjdk.jol</groupId>
  <artifactId>jol-core</artifactId>
  <version>0.10</version>
</dependency>
```

代码如下：

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

### 对象头的组成

- #### Mark Word

- #### class pointer

- #### array length

**普通对象**：

```java
//开启了指针压缩
|--------------------------------------------------------------|
|                     Object Header (96/128 bits)              |
|------------------------------------|-------------------------|
|        Mark Word (64 bits)         | Klass Word (32 bits)    |
|------------------------------------|-------------------------|
 
//没有开启指针压缩    
|--------------------------------------------------------------|
|                     Object Header (128 bits)                 |
|------------------------------------|-------------------------|
|        Mark Word (64 bits)         | Klass Word (64 bits)    |
|------------------------------------|-------------------------|    
```

**数组对象**：

```java
//开启指针压缩
|----------------------------------------------------------------------------------|
|                                 Object Header (128 bits)                         |
|--------------------------------|-----------------------|-------------------------|
|        Mark Word(64bits)       | Klass Word(32/64bits) |  array length(32bits)   |
|--------------------------------|-----------------------|-------------------------|

//没有开启指针压缩
|----------------------------------------------------------------------------------|
|                                 Object Header (160 bits)                         |
|--------------------------------|-----------------------|-------------------------|
|        Mark Word(64bits)       | Klass Word(64bits) |  array length(32bits)   |
|--------------------------------|-----------------------|-------------------------|    
```

在开启指针压缩和非指针压缩

### Mark Word

下面看一下markOop.hpp JDK源码的文件注释

```cpp
//  64 bits:
//  --------
//  unused:25 hash:31 -->| unused:1   age:4    biased_lock:1 lock:2 (normal object)
//  JavaThread*:54 epoch:2 unused:1   age:4    biased_lock:1 lock:2 (biased object)
//  PromotedObject*:61 --------------------->| promo_bits:3 ----->| (CMS promoted object)
//  size:64 ----------------------------------------------------->| (CMS free block)
//
//  unused:25 hash:31 -->| cms_free:1 age:4    biased_lock:1 lock:2 (COOPs && normal object)
//  JavaThread*:54 epoch:2 cms_free:1 age:4    biased_lock:1 lock:2 (COOPs && biased object)
//  narrowOop:32 unused:24 cms_free:1 unused:4 promo_bits:3 ----->| (COOPs && CMS promoted object)
//  unused:21 size:35 -->| cms_free:1 unused:7 ------------------>| (COOPs && CMS free block)
```

然后看一下变成表格

```
|------------------------------------------------------------------------------|--------------------|
|                                  Mark Word (64 bits)                         |       State        |
|------------------------------------------------------------------------------|--------------------|
| unused:25 | identity_hashcode:31 | unused:1 | age:4 | biased_lock:1 | lock:2 |       Normal       |
|------------------------------------------------------------------------------|--------------------|
| thread:54 |       epoch:2        | unused:1 | age:4 | biased_lock:1 | lock:2 |       Biased       |
|------------------------------------------------------------------------------|--------------------|
|                       ptr_to_lock_record:62                         | lock:2 | Lightweight Locked |
|------------------------------------------------------------------------------|--------------------|
|                     ptr_to_heavyweight_monitor:62                   | lock:2 | Heavyweight Locked |
|------------------------------------------------------------------------------|--------------------|
|                                                                     | lock:2 |    Marked for GC   |
|------------------------------------------------------------------------------|--------------------|
```



参考资料：

https://www.jianshu.com/p/3d38cba67f8b