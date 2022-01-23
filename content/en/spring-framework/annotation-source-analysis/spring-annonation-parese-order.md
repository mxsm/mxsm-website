---
title: "Spring 注解解析顺序问题"
linkTitle: "Spring 注解解析顺序问题"
date: 2022-01-23
weight: 202201232201
---

在之前的Spring相关文章当中分析过 **BeanPostProcessor** 接口执行顺序问题，今天突然想到在Spring框架中常用的注解也不少。那么注解的解析到底是一个什么样的先后顺序呢？今天就通过源码来分析总结一下Spring常用注解的解析顺序，以及在自定义注解中应该顺序应该注意什么？

### 1. Spring 常用注解

![Spring常用注解-修饰类](E:\download\Spring常用注解-修饰类.jpg)
