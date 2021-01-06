---
title: JUC包中的原子类
categories:
  - Java
  - JSE
  - 并发和多线程
tags:
  - Java
  - JSE
  - 并发和多线程
abbrlink: b0273a49
date: 2018-08-08 00:41:07
---
### 1 Atomic原子类介绍

这里 Atomic 是指一个操作是不可中断的。即使是在多个线程一起执行的时候，一个操作一旦开始，就不会被其他线程干扰。所以，所谓原子类说简单点就是具有原子/原子操作特征的类。并发包  `java.util.concurrent`  的原子类都存放在 `java.util.concurrent.atomic` 。

根据操作的数据类型可以分为4类：

1. **基本类型** 
   - **AtomicInteger** 整形原子类
   - **AtomicLong**  长整型原子类
   - **AtomicBoolean** 布尔型原子类
   - **LongAdder** 长整型原子类 — JDK8新增
   - **DoubleAdder**  double类型新增 — JDK8新增
2. **数组类型**
   - **AtomicIntegerArray** ：整形数组原子类
   - **AtomicLongArray**：长整形数组原子类
   - **AtomicReferenceArray** ：引用类型数组原子类
3. **引用类型**
   - **AtomicReference**：引用类型原子类
   - **AtomicStampedRerence**：原子更新引用类型里的字段原子类
   - **AtomicMarkableReference** ：原子更新带有标记位的引用类型
4. **对象的属性修改类型**
   - **AtomicIntegerFieldUpdater**:原子更新整形字段的更新器
   - **AtomicLongFieldUpdater**：原子更新长整形字段的更新器
   - **AtomicStampedReference** ：原子更新带有版本号的引用类型。该类将整数值与引用关联起来，可用于解决原子的更新数据和数据的版本号，可以解决使用 CAS 进行原子更新时可能出现的 ABA 问题。

