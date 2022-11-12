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

![image-20221110215605457](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221110215605457.png)

完成启动后接下来就是对这个项目进行改造

:::tip

- nodejs版本最好用16，这个视情况而定

- 主题可以去样例展示选择查看地址：https://docusaurus.io/zh-CN/showcase


:::

### 2.3 基于下载主题改造

改造的主要有两个文件：

- **docusaurus.config.js**

  **docusaurus.config.js** 是主要的配置文件，具体的修改地方大家可以参照官方的文档：

  - https://docusaurus.io/zh-CN/docs/configuration （docusaurus.config.js）

  主要配置一些navbar以及一些关键性信息。

- **sidebars.js**

  这个文件主要用于配置左边的sidebar,具体的配文档参考官网：https://docusaurus.io/zh-CN/docs/sidebar

根据自己的需求修改上述的两个文件，然后删除掉原先项目中docs下面的文件，将自己的markdown文件放入其中，根据个人的需要进行组织文件。

看一下笔者改造后自己的网站效果：

![image-20221110224848030](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221110224848030.png)

:::tip

项目Github地址：https://github.com/mxsm/mxsm-website

:::

## 3. 触发 GitHub Actions 自动部署

如何将自己的博客部署到GitHub上面， 笔者这里源代码仓库和部署代码仓库部署同源，

- 源代码仓库：https://github.com/mxsm/mxsm-website
- 部署代码仓库：https://github.com/mxsm/mxsm.github.io

部署流程如下：

1. 生成一个新 [SSH 密钥](https://help.github.com/en/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)。 因为这个 SSH 密钥会用在 CI 中，所以不能输入任何密码。

2. 默认情况下，你的公钥应该会被创建在 `~/.ssh/id_rsa.pub` 中。如果没有，那么在添加 [GitHub 部署密钥](https://developer.github.com/v3/guides/managing-deploy-keys/)时，要记得使用你在前一步中提供的名字。

3. 用 `pbcopy < ~/.ssh/id_rsa.pub` 把密钥复制到剪贴板，然后在你的部署仓库中，把它粘贴入[部署密钥](https://developer.github.com/v3/guides/managing-deploy-keys/#deploy-keys)。 如果命令行不适合，可以手动复制文件内容。 在保存部署密钥之前，要勾选 `Allow write access`。

   ![setting-github-sec](C:\Users\mxsm\Desktop\pic\setting-github-sec.gif)

4. 你需要把你的私钥设置成 [GitHub secret](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)，从而允许 Docusaurus 为你运行部署。

5. 用 `pbcopy < ~/.ssh/id_rsa` 复制你的私钥，然后把它粘贴成一个 GitHub secret，名字叫 `ACTIONS_DEPLOY_KEY`。 如果命令行不适合，可以手动复制文件内容。 保存你的 secret。

   ![setting-github-sec](C:\Users\mxsm\Desktop\pic\setting-github-sec1.gif)

6. 在 `.github/workflows/` 中创建你的[文档工作流文件](https://help.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file)。 在这个例子里，就是 `deploy.yml`。

   ```yaml
   name: Deploy mxsm website to GitHub
   
   on:
     pull_request:
       branches: [main]
     push:
       branches: [mxsm-website-27]
   
   jobs:
     test-deploy:
       if: github.event_name != 'push'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v3
           with:
             node-version: 18
             cache: npm
         - name: Install dependencies
           run: npm ci --legacy-peer-deps
         - name: Test build website
           run: npm run build
     deploy:
       if: github.event_name == 'push'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v3
           with:
             node-version: 18
             cache: npm
         - uses: webfactory/ssh-agent@v0.5.0
           with:
             ssh-private-key: ${{ secrets.ACTIONS_DEPLOY_KEY }}
         - name: Deploy to GitHub Pages
           env:
             USE_SSH: true
             DEPLOYMENT_BRANCH: gh-pages
           run: |
             git config --global user.email "ljbmxsm@gmail.com"
             git config --global user.name "mxsm"
             npm update --legacy-peer-deps
             npm run clear
             npm run build
             npm run deploy
   ```

7. 现在，你应该大概有：一个源代码仓库，设置了 GitHub 工作流和作为 GitHub Secret 的 SSH 私钥，以及一个部署仓库，在 GitHub 部署密钥中设置了 SSH 公钥。

到这里就已经配置好了，那么Actions上面时候触发呢，我上面配置的是当 **`mxsm-website-27`** 分支有Push的时候就可以触发Actions部署了。

![image-20221110230906205](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221110230906205.png)

然后看一下部署代码仓库(gh-pages分支)：

![image-20221110231029109](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221110231029109.png)

:::tip

- 触发Actions的一种情况源代码仓库和部署代码仓库是**同一**仓库，可以参照[官网的配置地址](https://docusaurus.io/zh-CN/docs/deployment#triggering-deployment-with-github-actions)
- SSH身份验证之前配置过，可以使用之前的。
- 如何利用Github搭建Blog

:::

## 4. 开启博客之旅

做好以上的准备工作后接下来的就是编写博客。用markdown文档编写blog，将文档放在对应的docs下面的文件夹里面。或者可以通过使用**`plugin-content-docs`** 插件拓展其他的自定义的目录。这样博客就搭建完成，基本上无需写前端代码只需要修改对应的配置即可。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢!

参考资料：

- https://docusaurus.io/zh-CN/
- https://github.com/ionic-team/ionic-docs

本文正在参加[「金石计划 . 瓜分6万现金大奖」](https://juejin.cn/post/7162096952883019783)
