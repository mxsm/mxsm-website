---
title: RootBeanDefinition、ChildBeanDefinition、GenericBeanDefinition的区别
date: 2021-03-05
weight: 4
---

从RootBeanDefinition、ChildBeanDefinition、GenericBeanDefinition类图看一下：
![类图](https://github.com/mxsm/picture/blob/main/spring/RootBeanDefinition_uml.png?raw=true)

本质上来说是没有太大的区别它们都继承了 AbstractBeanDefinition 、在它们各自的类中、并没有什么太大的特殊的逻辑、某种程度上来说、它们可以说是差别非常小的

- RootBeanDefinition可以单独作为一个BeanDefinition，也可以作为其他BeanDefinition的父类。但是他不能作为其他BeanDefinition的子类（可以去看源码，在setParentName的时候，会抛出一个异常）
- ChildBeanDefinition相当于一个子类，不可以单独存在，必须要依赖一个父BeanDetintion。（最大的区别他的parentName属性是通过构造方法设置的，而且并没有提供一个无参构造方法给我们。)
- GenericBeanDefinition是首选的