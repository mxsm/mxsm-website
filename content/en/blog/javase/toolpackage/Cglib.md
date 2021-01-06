---
title: Cglib
categories:
  - Java
  - Java常见的工具包
tags:
  - Java
  - Java常见的工具包
abbrlink: 29cef8e0
date: 2019-07-04 12:26:16
---
### 1 Cglib工具包

#### 1.1 什么是Cglib?

CGLIB是一个功能强大，高性能的代码生成包。它为没有实现接口的类提供代理，为JDK的动态代理提供了很好的补充。通常可以使用Java的动态代理创建代理，但当要代理的类没有实现接口或者为了更好的性能，CGLIB是一个好的选择。

#### 1.2 Cglib原理

CGLIB原理：动态生成一个要代理类的子类，子类重写要代理的类的所有不是final的方法。在子类中采用方法拦截的技术拦截所有父类方法的调用，顺势织入横切逻辑。它比使用java反射的JDK动态代理要快。

CGLIB底层：使用字节码处理框架ASM，来转换字节码并生成新的类。不鼓励直接使用ASM，因为它要求你必须对JVM内部结构包括class文件的格式和指令集都很熟悉。

> Cglib缺点：对于final方法，无法进行代理

#### 1.3 GitHub地址



> https://github.com/cglib/cglib -- cglib地址
>
> https://mydailyjava.blogspot.com/2013/11/cglib-missing-manual.html   -- cglib使用案例地址

### 2 Cglib的实际应用

#### 2.1 Spring项目Cglib

Spring类CglibAopProxy