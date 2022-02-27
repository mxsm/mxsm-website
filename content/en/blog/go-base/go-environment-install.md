---
title: "Java开发学Go-Go环境安装设置"
linkTitle: "Java开发学Go-Go环境安装设置"
date: 2022-02-27
weight: 202202271452
---

### 1. 前言

作者本人是一个Java开发者，但是现在很多的中间件和一些组件都是由Go编写，K8S，ETCD等等都是用的GO,所以想系统的学习一下Go的基础以及相关知识。在学习过程中记录作为一个Java开发者角度去学习一门新的语言遇到的一些疑问和问题。从最基础的环境安装设置开始。

### 2. Go环境安装

#### 2.1 Go安装包下载

去[Go的官网](https://go.dev/) 下载对应的版本和平台的安装包，本人的开发平台是Windows所以选择都是Windows平台的Go安装包：

![go的选择版本下载过程](https://raw.githubusercontent.com/mxsm/picture/main/go/base/go%E7%9A%84%E9%80%89%E6%8B%A9%E7%89%88%E6%9C%AC%E4%B8%8B%E8%BD%BD%E8%BF%87%E7%A8%8B.gif)

选择对应的版本进行下载，我这里下载的版本：**Go 1.17.7** 。 官网的下载地址：https://go.dev/dl/

#### 2.2 安装到本地环境

运行安装包安装到本地：

![Go安装到本地](https://raw.githubusercontent.com/mxsm/picture/main/go/base/Go%E5%AE%89%E8%A3%85%E5%88%B0%E6%9C%AC%E5%9C%B0.gif)

打开命令行工具，运行命令：

```shell
go version
```

![image-20220227151147288](https://raw.githubusercontent.com/mxsm/picture/main/go/base/image-20220227151147288.png)

能够正确的显示go的版本信息就表名安装成功了。

> Tips: Linux和Mac的安装可以参照官网的安装教程，地址：https://go.dev/doc/install

### 3. Go环境设置

安装完成，接下来就是设置Go的各种环境变量。在设置之前我们首先要知道设置一些什么，Java程序员安装Java开发环境知道要设置 `JAVA_HOME` 等一些环境变量。那么Go需要设置哪些呢？首先通过命令查看说明：

```shell
go help
```

![image-20220227152536953](https://raw.githubusercontent.com/mxsm/picture/main/go/base/image-20220227152536953.png)

这里有个 **`env`** 的命令，作用是：打印Go的环境信息：

```shell
go env
```

![image-20220227152723854](https://raw.githubusercontent.com/mxsm/picture/main/go/base/image-20220227152723854.png)

这里打印出来了刚安装好的Go的一些环境信息，有这么几个需要重新进行设置：

- GO111MODULE

  off/on/auto, 是 go modules 功能的开关。一种包的管理机制，就理解和Maven，Gradle一样的Jar包管理工具就行，这个在Go1.17.7版本直接设置on就好了

- GOCACHE

  缓存目录，最好设置到其他盘的目录

- GOMODCACHE

  缓存目录，最好设置到其他盘的目录

- GOPATH

  最好设置到其他盘的目录

- GOPROXY

  GOPROXY表示的是go的代理设置，可以设置成阿里云https://mirrors.aliyun.com/goproxy 或者七牛云https://goproxy.cn 

设置命令：

```shell
##可以通过 go help env 查看如何使用
go env -w GO111MODULE=on
```

> Tips:windows系统使用上述命令如果有警告如下图：
>
> ![image-20220227154238880](https://raw.githubusercontent.com/mxsm/picture/main/go/base/image-20220227154238880.png)
>
> 直接在系统环境变量配置变量值即可：
>
> ![image-20220227154418952](https://raw.githubusercontent.com/mxsm/picture/main/go/base/image-20220227154418952.png)

看一下设置好的：

![image-20220227160445274](https://raw.githubusercontent.com/mxsm/picture/main/go/base/image-20220227160445274.png)

### 4. Go开发工具选择

对于开发工具GO的官网推荐了三个：

- [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=golang.go)
- [GoLand](https://www.jetbrains.com/go)
- [vim](https://github.com/fatih/vim-go)

对于一个Java开发者而言，因为经常使用jetbrains 的IDEA，使用GoLand可能也会更加的得心应手，但是缺点就是不是免费。VS Code也是一个不错的选择，免费， vim用的少不是很推荐使用。开发工具的使用看个人的喜好。自己用着舒服得心应手就好了。

> Tips: 我使用的是GoLand

### 5.与Java之间的异同

相比较Java而言，Go使用命令的机会更多一点，环境配置大体相差不大。

### 6. Go的学习网站

- https://go.dev/doc/ 官方的文档
- Github awesome go 系列网站，这个大家可以自行去Github搜索

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢