---
title: "一个Java对象占用多大内存"
linkTitle: “一个Java对象占用多大内存”
date: 2022-06-02
weight: 20220602
---

平时开发中很少会有人去想：一个Java对象占用多大内存，今天就来探究一下到底我们平时创建的对象占用了多大的内存。在Java中对象分为两种：基本类型、引用类型。我们从这两种类型入手来分析。

> Tips: JDK版本为17

### 1. 基本类型

Java中有8种基本类型，占用的内存空间如下：

| 类型    | 占用空间(byte) |
| ------- | -------------- |
| boolean | 1              |
| byte    | 1              |
| short   | 2              |
| char    | 2              |
| int     | 4              |
| float   | 4              |
| long    | 8              |
| double  | 8              |

**Java中的基本类型数据是在栈上面分配还是栈上面?**

回答上面一个问题之前首先要明确这个变量定义在哪？平时定义基本变量有三种情况：

1. 定义类的静态变量
2. 定义类的成员变量
3. 定义方法体内变量

上面三种情况分配在不同的位置：

| 变量位置         | 分配位置 |
| ---------------- | -------- |
| 定义类的静态变量 | 堆上分配 |
| 定义类的成员变量 | 堆上分配 |
| 定义方法体内变量 | 栈上分配 |

> Tips: jdk17 字符串常量池和静态变量仍然在堆当中；运行时常量池、类型信息、常量、字段、方法被移动都了元空间中

### 2. 引用类型

下面来分析一下引用类型对象的大小。

#### 2.1 Java对象模型

Java对象模型分为三个部分：**对象头、对象实际数据、对齐填充区**

![Java-object-model](https://raw.githubusercontent.com/mxsm/picture/main/blog/javase/jvmJava-object-model.png)

对象头中又包含了很多，这个后续文章分析。

**对象头又包含了三部分：MarkWord、对象元数据指针、数组对象长度：**

1. MarkWord：用于存储对象运行时的数据，好比 HashCode、锁状态标志、GC分代年龄等。**这部分在 64 位操作系统下占 8 字节，32 位操作系统下占 4 字节。**
2. 对象元数据指针：对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是哪一个类的实例。这部分就涉及到指针压缩的概念，**在开启指针压缩的状况下占 4 字节，未开启状况下占 8 字节。**
3. 数组长度：这部分只有是数组对象才有，**若是是非数组对象就没这部分。这部分占 4 字节。所以Java中对象的最大值就是int类型的最大值** 

对象实际数据就是存储对象各个字段中的信息

对齐填充：Java 对象的大小默认是按照 8 字节对齐，也就是说 Java 对象的大小必须是 8 字节的倍数。若是算到最后不够 8 字节的话，那么就会进行对齐填充。

### 3. 对象大小查看神器

```xml
<dependency>
    <groupId>org.openjdk.jol</groupId>
    <artifactId>jol-core</artifactId>
    <version>0.9</version>
</dependency>
```

jol工具是查看对象大小的神器

#### 3.1 指针压缩开启-对象只包含基础数据类型

对象类：

```java
public class ObjectBase {

    //这个对象大小应该是: 8+4+4+8+1+7=32

    private int a;

    private long b;

    private byte c;

}
```

测试验证代码：

```java
public class Test1 {

    public static void main(String[] args) {
        ClassLayout layout = ClassLayout.parseClass(ObjectBase.class);
        System.out.println(layout.toPrintable());
    }
}
```

测试结果：

![image-20220603141125996](https://raw.githubusercontent.com/mxsm/picture/main/blog/javase/jvmimage-20220603141125996.png)

结果和上面的预测一样，有7byte的填充。

#### 3.2 指针压缩开启-对象包含基础数据和引用对象

对象类：

```java
public class ObjectBase {

    //这个对象大小应该是: 8+4+4+8+1+4+3=32

    private int a;

    private long b;

    private byte c;

    private RefObject refObject;

}
public class RefObject {

    private int a = 1;

    private short b = 2;

}

```

测试验证代码：

```java
public class Test1 {

    public static void main(String[] args) {
        ClassLayout layout = ClassLayout.parseClass(ObjectBase.class);
        System.out.println(layout.toPrintable());
    }
}
```

测试结果：

![image-20220603141956973](https://raw.githubusercontent.com/mxsm/picture/main/blog/javase/jvmimage-20220603141956973.png)

#### 3.3 指针压缩开启-数组对象

测试代码：

```java
public class Test1 {

    public static void main(String[] args) {
        //ClassLayout layout = ClassLayout.parseClass(ObjectBase.class);
        ClassLayout layout = ClassLayout.parseInstance(new ObjectBase[10]);
        System.out.println(layout.toPrintable());
    }

}
```

测试结果：

![image-20220603143249267](https://raw.githubusercontent.com/mxsm/picture/main/blog/javase/jvmimage-20220603143249267.png)

#### 3.4 指针压缩关闭

以3.1的代码作为测试代码，增加 **`-XX:-UseCompressedOops`** 参数，测试结果为：

![image-20220603155554452](https://raw.githubusercontent.com/mxsm/picture/main/blog/javase/jvmimage-20220603155554452.png)

JDK17的情况下竟然没效果。看一下JDK11

![image-20220603155652365](https://raw.githubusercontent.com/mxsm/picture/main/blog/javase/jvmimage-20220603155652365.png)

jdk11和预想的一样。

### 4. 总结

ava对象大小主要由三部分注册：对象头、对象实际数据、填充对齐字段大小三部分组成。而对象头的大小相对固定，在开启了指针压缩的情况下对象头的大小最小12，最大16字节，然后实际数据大小取决于Java对象的成员变量多少。最好就是需要多少的对齐字节。默认的情况下Java对象大小都是8的整数倍。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

参考文档：

- https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html
