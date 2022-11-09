---
title: Docusaurus搭建博客
sidebar_label: Docusaurus搭建博客
sidebar_position: 20221109
pagination_label: Markdown 特性
description: 我解决不了这个问题时在哪里找到你
slug: /others/blog-building
keywords:
  - docs
  - docusaurus
last_update:
  date: 2022-11-09
  author: mxsm
---

作为一个纯后端开发人员面对前端真的是头大，但是对于想要搭建属于自己的博客的人来说有没有什么办法呢？当然是有的常用的搭建博客的框架有以下几个（这三个都是笔者使用过的）：

- [Hexo](https://hexo.io/zh-cn/) - 快速、简洁且高效的博客框架
- [Hugo](https://gohugo.io/)-The world’s fastest framework for building websites
- [docusaurus](https://docusaurus.io/zh-CN/)-快速构建以内容为核心的最佳网站

笔者网站第一个版本使用的是Hexo搭建，然后使用Hugo来重建web网站。各有千秋大体上都差不多，因为作为一个快速搭建blog类的网站以及技术类的官网需求都基本上大同小异。下面来介绍用[docusaurus](https://docusaurus.io/zh-CN/) 搭建博客网站。

## 1. 需要会什么？

对于这一类工具去搭建博客网站首先一点就是对前端的要求几乎为零(前提是无需要进行特性化改造)那么需要会什么？

- 能够使用一些简单的nodejs命令
- 能够查阅官网，官网基本上搭建操作以及部署都有详细的教程
- **会写Markdown文档，大多数这类搭建框架都是使用markdown作为文件输入然后经过处理转换成标准模板的HTML文件进行展示和访问。**

:::tip

会写Markdown文档是最重要的。

:::

## 2.Docusaurus搭建博客

接下来从环境准备以及博客的搭建一步步来讲解整个搭建过程(前端完全不会也可以学会)，用windows平台作为搭建演示

### 2.1 nodejs环境安装

从官网下载nodejs并且安装到本地

```shell
node -v
npm -v
```

![image-20221109233649314](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221109233649314.png)

这个就是我当前使用的版本。安装好了前置的环境接下来就是安装搭建博客

### 2.2 下载对应的主题项目

笔者这里是基于[**ionic-docs**](https://github.com/ionic-team/ionic-docs) 进行的改造，主要是觉得这个项目整体风格和主题比较符合自己。从Github上面clone下来

```shell
git clone https://github.com/ionic-team/ionic-docs

cd ionic-docs

npm update --force

npm run start
```

执行完成以上的命令后会自动打开web页面：



