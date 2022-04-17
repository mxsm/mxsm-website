---
title: "如何快速搭建Java项目开发环境"
linkTitle: "如何快速搭建Java项目开发环境"
date: 2022-04-14
weight: 202204142108
---

一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第14天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

环境搭建是每个开发人员必须的知道的，平时开发如何快速的搭建开发环境今天给大家分享一下。本人主要使用的是windows平台做开发Java。下面介绍的也是已windows平台Java开发作为分享。

### 1. 搭建Linux环境

在windows开发肯定需要搭建一个Linux的部署环境，这个环境有以下几个作用：

- 安装开发所需要的存储例如MySQL、ES等等
- 作为项目的部署环境以及打包环境

Linux的环境搭建有两种方式：

- 通过VMware安装Linux系统

  由于现在Centos已经停止维护，这里通过VMware建议安装Ubuntu

- windows平台的WSL

  wsl无需VMware，是基于Windows的子系统。这个的优势在于可以直接访问到windows磁盘的文件，wsl搭建可以参照[《Windows WSL让你告别VMware》](https://juejin.cn/post/7066067971717726245)

Linux环境搭建是一个一次性的工作，搭建好以后再不重装系统的情况下可以一直使用

### 2. 开发环境搭建

作为Java开发，开发环境的搭建主要分为三个部分，分别是：

- Java开发环境搭建(JDK等等)
- 构建工具环境搭建(Maven,Gradle)
- 开发工具
- 版本管理工具Git
- 命令行工具Cmder

#### 2.1 Java开发环境搭建

下载JDK,常用的JDK有Oracle的和OpenJDK两种(我用这两种比较多)，下载地址：

[**Oracle JDK下载**](https://www.oracle.com/java/technologies/downloads/)

[**OpenJDK 下载**](https://jdk.java.net/18/)

#### 2.2 构建工具环境搭建

Java开发常用的构建工具Maven和Gradle，我自学一些技术和写一些项目的时候Maven用的比较多。Gradle使用看工作需要

[**Maven 下载**](https://maven.apache.org/download.cgi)

[**Gradle 下载**](https://gradle.org/install/)

maven和gradle的配置，可以根据官网以及网上的资料进行配置。这里不详细讲解

#### 2.3 开发工具

对于开发工具选择这个看个人的喜好，**Eclipse、MyEclipse、VScode、IDEA** 。其中Eclipse、VScode都是免费，MyEclipse和IDEA是付费。这里四个除了VsCode其他三个我都使用过。从感受来说IDEA是比较好用的。

#### 2.4 版本管理工具Git

现在使用的最多的版本管理工具就是Git,在windows本地安装好Git。然后推荐两个界面的管理工具：

- [**SourceTree**](https://www.sourcetreeapp.com/)
- [**TortoiseGit**](https://tortoisegit.org/)

这两个都可以安装，**TortoiseGit** 可以用于平时的clone代码操作，而 **SourceTree** 提供非常友好的图形化合并操作界面，所以平时主要用来代码合并等。

#### 2.5 命令行工具Cmder

如果你对Windows的命令不是很熟悉，又想在windows命令行使用Linux的一些命令那么一点要安装 **`Cmder`** 工具。下载和安装可以参照Cmder官网：https://cmder.net/

### 3. 项目中间件的搭建

项目中间件搭建推荐使用Docker,可以把Docker安装在WSL系统中或者VMware的Linux系统中。把常见的你使用到的中间件和一些依赖的服务的Docker启动命令写下来。这样你就算换了环境，只需要搭建Docker然后执行命令即可。

### 4. 项目快速搭建

Maven项目的快速搭建可以平时编写一些Maven的脚手架(这个需要个人的平时积累)。Spring Boot项目的快速搭建推荐两个网站：

- https://start.spring.io/
- https://start.aliyun.com/bootstrap.html

> Tips:Maven脚手架如何开发可以看一下[《Maven-自定义archetype》](https://juejin.cn/post/6844904160299581454)，Spring Boot项目快速搭建参照[《如何快速创建Spring Boot项目？》](https://juejin.cn/post/7063088234628120589)

### 5. 总结

搭建Linux环境、开发环境搭建这个两个是搭建好了就能长久使用，项目中间件搭建的快慢是整个关键，容器化对于学习来说是不二的选择。SpringBoot项目的快速搭建通过Spring以及相关脚手架网站能够快速生成模板代码。从而达到快速搭建开发环境的目的。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！