---
title: Spring中自定义常见的接口
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring 自定义拓展
  - 自定义拓展的技巧
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring 自定义拓展
abbrlink: 2829cf9f
date: 2019-05-24 22:34:22
---
### 1. 常见的拓展接口

![](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/Spring%E5%B8%B8%E8%A7%81%E7%9A%84%E6%8B%93%E5%B1%95%E6%8E%A5%E5%8F%A3.png?raw=true)

-  ImportSelector 和DeferredImportSelector

  主要是配合 @Import使用来将配置文件中的类名称加载到Spring容器中。比如SpringBoot项目中的EnableAutoConfiguration配置在spring.factories文件中。

- ImportBeanDefinitionRegistrar

  可以配合@Import注解来

