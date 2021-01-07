---
title: 工厂方法模式
categories:
  - 设计模式
  - 创建型模式
tags:
  - 设计模式
  - 创建型模式
abbrlink: '48598499'
date: 2019-09-14 22:21:55
---
### 工厂方法模式(Factory Method Pattern)

#### 模式动机

一类产品对应一类工厂

#### 模式定义

工厂方法模式(Factory Method Pattern)又称为工厂模式，也叫虚拟构造器(Virtual Constructor)模式或者多态工厂(Polymorphic Factory)模式，它属于类创建型模式。在工厂方法模式中，工厂父类负责定义创建产品对象的公共接口，而工厂子类则负责生成具体的产品对象，这样做的目的是将产品类的实例化操作延迟到工厂子类中完成，即通过工厂子类来确定究竟应该实例化哪一个具体产品类。

#### 模式结构

- Product：抽象产品
- ConcreteProduct：具体产品
- Factory：抽象工厂
- ConcreteFactory：具体工厂

类的UML图：

![图](https://github.com/mxsm/document/blob/master/image/designmode/FactoryMethodPattern.png?raw=true)

