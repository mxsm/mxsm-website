---
title: "我用Rust写了一个Rocketmq name server"
linkTitle: "我用Rust写了一个Rocketmq name server"
sidebar_label: Rocketmq-rust name server
weight: 202401282245
description: rust rocketmq namesrv
---

> 我是蚂蚁背大象(Apache EventMesh PMC&Committer)，文章对你有帮助给[Rocketmq-rust star](https://github.com/mxsm/rocketmq-rust),关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/rocketmq-rust/issues)\~谢谢! Emal:mxsm@apache.com

## 1. Rocketmq-rust namesrv概述

经过一个多月的开发，终于开发出来了一个Rust版本的Rocketmq name server组件。这个组件和Rocketmq Java版本完全兼容。提供相同的功能。

> Github项目地址：[**Rocketmq-rust**](https://github.com/mxsm/rocketmq-rust)

使用Rust开发出来的Rocketmq name server的好处：

- 启动时间相比Java版本大大减少

  ![image-20240128230341090](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128230341090.png)

  可以看到启动不到一秒钟就完成整个Rocketmq name server的启动。

- 有着跨平台的特性(这里需要在不同的平台进行编译)

- 内存安全，由于Rust语言的特性没有内存的回收机制。

> 如果平时有使用Rocketmq，并且本地需要启动Name server可以考虑使用这个Rust版本，既方便有快速。下载地址：https://github.com/mxsm/rocketmq-rust/releases/download/v0.1.0/rocketmq-rust-all-bin-0.1.0.zip

## 2.快速开始Rocketmq-rust name server

快速的使用Rocketmq的name server有两种方式：

- 直接下载编译好的程序
- 使用cargo命令进行安装
- 使用源码进行编译

### 2.1 下载二进制文件

首先从Github的版本页面[下载](https://github.com/mxsm/rocketmq-rust/releases/download/v0.1.0/rocketmq-rust-all-bin-0.1.0.zip)二进制文件[rocketmq-rust-all-bin-0.1.0.zip](https://github.com/mxsm/rocketmq-rust/releases/download/v0.1.0/rocketmq-rust-all-bin-0.1.0.zip)。

![image-20240128233113192](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128233113192.png)

![image-20240128233133244](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128233133244.png)

文件下载后进行解压解压后可以看到如下两个文件夹如下图：

![image-20240128231344495](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128231344495.png)

**windows** 和 **Linux** 两个平台的文件。

> Mac的这个版本暂时没有提供，后续的版本会提供。

下面就以Windows为例(Linux的大家也可以自己去尝试现在的windows10,可以安装一个WSL)。在**windows** 的文件里面有 **`rocketmq-namesrv-rust.exe`** 的执行文件这个就是Rocketmq name server的启动文件。

![image-20240128231641067](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128231641067.png)

双击即可启动。如下图所示：

![image-20240128231927444](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128231927444.png)

通过如下命令查看使用：

```powershell
rocketmq-namesrv-rust.exe --help

RocketMQ Name server(Rust)

Usage: rocketmq-namesrv-rust.exe [OPTIONS]

Options:
  -p, --port <PORT>    rocketmq name server port [default: 9876]
  -i, --ip <IP>        rocketmq name server ip [default: 127.0.0.1]
  -c, --config <FILE>  rocketmq name server config file
  -h, --help           Print help
  -V, --version        Print version
```

这里可以配置rocketmq name server的ip地址和端口以及配置文件。相对于Java版本这里我做了一些优化

![image-20240128232228666](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128232228666.png)

### 2.2 通过命令安装

通过rust的cargo命令进行安装，我这里用linux作为例子(WSL)。使用一下命令

```shell
 cargo install rocketmq-namesrv
```

等待安装到本地。![image-20240128232834062](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128232834062.png)

然后运行验证一下，运行命令

```shell
rocketmq-namesrv-rust
```

![image-20240128232946771](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128232946771.png)

通过查看发现运行成功。

### 2.3 使用源码进行编译

使用源码编译和通过cargo命令进行安装是一样的首先需要rust进行安装，版本最小为**1.75.0**。然后从Github **[rocketmq-rust](https://github.com/mxsm/rocketmq-rust)** 将源代码clone到本地，然后进入代码的根目录。运行如下命令：

```
cargo run --bin rocketmq-namesrv-rust
```

就能运行rocketmq name server了。

## 3. 功能验证

功能如何验证，首先我们将**[rocketmq-dashboard](https://github.com/apache/rocketmq-dashboard)** 的代码clone到本地或者如果本地有对应的也可以。

> 验证都用IDEA来进行

**1. 启动rust版本的nameserver**

![image-20240128234422219](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128234422219.png)

**2. 启动rocketmq-dashboard**

![image-20240128234956398](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128234956398.png)

通过上面的nameserver打印的日志可以看出来已经连上了(到这里Broker还没有启动)， 登录web进入发现也没呀任何数据，如下图：

![image-20240128235058216](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128235058216.png)

**3 启动Broker注册**

![image-20240128235235695](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128235235695.png)

name server收到broker的注册请求。下面我们看一下web页面的信息。

![image-20240128235321539](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240128235321539.png)

数据已经注册上去了。到这里可以发现基本功能都已经实现了。

## 4. 总结

当前 [**rocketmq-rust**](https://github.com/mxsm/rocketmq-rust) 这个项目基本用rust实现了一个Rocketmq name server的功能，这个组件仔功能方面可能会有些bug存在，后续也会进行进一步的测试和修复。使用过程中发现问题可以提[ISSUE](https://github.com/mxsm/rocketmq-rust/issues) 与此同时如果对 **rust** 和 **rocketmq** 感兴趣欢迎大家一起参与到项目中来。

![image-20240129000040927](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240129000040927.png)