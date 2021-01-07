---
title: 简单工厂模式
categories:
  - 设计模式
  - 创建型模式
tags:
  - 设计模式
  - 创建型模式
abbrlink: 6b3bea20
date: 2019-02-08 12:36:22
---
### 简单工厂模式(Simple Factory Pattern)

#### 模式的动机

根据不同的参数获取不同的对象

#### 模式定义

简单工厂模式(Simple Factory Pattern)：又称为静态工厂方法(Static Factory Method)模式，它属于类创建型模式。在简单工厂模式中，可以根据参数的不同返回不同类的实例。简单工厂模式专门定义一个类来负责创建其他类的实例，被创建的实例通常都具有共同的父类。

#### 模式结构

包含的角色：

- **Factory:工厂角色**
- **Product：抽象产品角色**
- **ConcreteProduct：具体产品角色**

类的UML图：

![图](https://github.com/mxsm/document/blob/master/image/designmode/SimpleFactory.png?raw=true)

这个模式适合：

- 工厂模式负责创建的对象种类比较少
- 客户端只知道传入工厂类的参数不关心如何创建对象。

JDK中的案例

```java
//获取字符集
Charset.forName("UTF-8");
Charset.forName("GBK")
  
//日期
public final static DateFormat getDateInstance();
public final static DateFormat getDateInstance(int style);
public final static DateFormat getDateInstance(int style,Locale locale);

//java的加密技术
KeyGenerator keyGen=KeyGenerator.getInstance("DESede");
```

