---
title: "如何快速创建Spring Boot项目"
linkTitle: "快速创建Spring Boot项目"
date: 2022-02-10
weight: 202202102218
---

「这是我参与2022首次更文挑战的第24天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

Spring Boot项目创建在平时开发和学习过程中非常常见，但是如何快速的创建Spring Boot项目你是否知道，今天来介绍几种快速创建Spring Boot项目方式。

### 1. Spring 官方脚手架官网

**官网地址**：https://start.spring.io/

![image-20220210222122414](https://raw.githubusercontent.com/mxsm/picture/main/springboot/image-20220210222122414.png)

1. 选择项目类型，Maven项目，还是Gradle项目
2. 语言选择
3. Spring Boot版本（版本比较新，包含最新的版本）
4. 项目的元数据，这个使用者可以手动输入
5. 打包类型
6. Java版本(默认是11)，可以根据用户的需求自己选
7. 可以根据用户的项目的类型和依赖情况自己判断用户需要增加哪些依赖

这些填好后直接生成下载然后解压导入到开发工具

**特点：**

- 提供的Spring Boot版本比较新
- 支持对不同语言的选择
- 增加的依赖主要是Spring官网的一些框架

### 2. 阿里云Spring Boot脚手架

**官网地址：** https://start.aliyun.com/bootstrap.html

![image-20220210222201193](https://raw.githubusercontent.com/mxsm/picture/main/springboot/image-20220210222201193.png)

阿里云的这个Spring Boot官网脚手架和Spring官网的脚手架大体相同但是也有不同的地方。

- Spring Boot的版本相对没有那么的激进，版本相对较落后。没有最新的SpringBoot版本
- 阿里云的提供应用架构的选择，同时可以选择下面的相关联的示例代码
- 组件依赖相对来说更加多，当然包含了阿里的全家桶，也包含了一些测试等等相关依赖可以提供选择

同样生成后解压然后导入开发工具就可以了

> Tips: 如果Spring的脚手架官网你访问不是那么的流畅，建议用阿里云的。至少访问速度没有问题

### 3. IDEA Spring脚手架

在IDEA的工程新建界面有一个Spring Initializr,如下图

![image-20220210222336099](https://raw.githubusercontent.com/mxsm/picture/main/springboot/image-20220210222336099.png)

这个使用的是Spring官网脚手架模板，直接集成到了开发工具。在点击Next后

![image-20220210222538710](https://raw.githubusercontent.com/mxsm/picture/main/springboot/image-20220210222538710.png)

展示了依赖的选择。就是把官网的功能搬到开发工具

### 4. 自定义Maven脚手架

如何自定义Maven脚手架可以看一下我的这篇文章《[Maven-自定义archetype](https://juejin.cn/post/6844904160299581454)》，使用这种方法的好处：

- SpringBoot版本和依赖都可以自己定义，还可以自定义初始化代码结构
- 集成到IDEA开发工具中，只需要简单的下一步下一步就能生成

但是这样也有缺点：

- 每次需要修改版本发布
- 只是开发Maven版本

### 5.总结

- 从生成的方式来看主要分成网页和开发工具，网页生成的需要导入开发工具才能进行下一步开发，开发工具生成直接就生成了
- 网页生成如果访问Spring官网慢，建议直接使用阿里云的网页生成
- 自定义需要开发比较繁琐，不适合学习过程的快速搭建。适合公司

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！