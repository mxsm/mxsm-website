---
title: "Windows 11 + WSL(ubuntu 20.04) + CLion(2023.3.4) 编译OpenJDK17"
sidebar_label: Rust基本数据类型
linkTitle: "Windows 11 + WSL(ubuntu 20.04) + CLion(2023.3.4) 编译OpenJDK17"
weight: 202403042229
description: Windows 11 + WSL(ubuntu 20.04) + CLion(2023.3.4) 编译OpenJDK17
---

## 1. 前言

为了深入的理解JVM，我们使用JDK的源码来导入CLion开发工具自己编译JDK.下面使用的环境：

- windows11
- WSL2(ubuntu 20.04)
-  CLion(2023.3.4) 

## 2. 准备工作

### 2.1 下载OpenJDK源码

从[github](https://github.com/)上下载[OpenJDK](https://github.com/openjdk/jdk)源码到本地

```shell
$ git clone https://github.com/openjdk/jdk.git
```

![image-20240304223850905](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq-rust/namesrvimage-20240304223850905.png)

切换到jdk17的tag版本

```shell
$ git checkout tags/jdk-17+34 -b jdk-17
```



### 2.2 安装OpenJDK-17

升级Ubuntu软件资源库

```shell
$ sudo apt update && sudo apt upgrade -y
```

安装OpenJDK

```shell
$ sudo apt-get install openjdk-17-jdk
```

完成上述准备工作后进行OpenJDK编译

## 3. 编译OpenJDK

### 3.1 执行编译命令

```shell
$ bash configure --enable-debug --with-jvm-variants=server --build=x86_64-unknown-linux-gnu
```

编译成功：

![image-20240305220618200](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305220618200.png)

执行编译命令的时候可能会遇到下面的问题，针对下面的问题进行一一的解决。

**问题1：error: The path of BOOT_JDK**

![image-20240304225208518](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240304225208518.png)

使用的是直接通过命令进行安装，这里需要将之前安装的JDK17配置仔path里面。 使用命令查看：

```shell
$ update-alternatives --config java
```

![image-20240304225613762](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240304225613762.png)

配置path:

![image-20240305213605426](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305213605426.png)

**问题2：error: Cannot locate a valid Visual Studio installation**

![image-20240305214010469](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305214010469.png)

命令增加

```shell
$  bash configure --build=x86_64-unknown-linux-gnu
```

**问题3： error: Could not find all X11 headers**

![image-20240305214845676](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305214845676.png)

执行下面命令安装：

```shell
sudo apt-get install libxrandr-dev
```

**问题4：error: Could not find cups!**

![image-20240305215318622](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305215318622.png)

执行命令安装：

```shell
sudo apt-get install -y libcups2-dev
```

### 3.2 构建images

```shell
$ make images CONF=linux-x86_64-server-fastdebug
```

![image-20240305221701199](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305221701199.png)

编译成功：

![image-20240305222919918](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305222919918.png)

## 4. 导入CLion

运行命令生成更新**compile_commands.json**

```shell
$ make compile-commands CONF=linux-x86_64-server-fastdebug
```

这个会生成仔build对应的目录中

![image-20240305231622810](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305231622810.png)

然后使用Clion通过选择这个文件导入项目。导入项目后切换项目根目录，操作路径：**Tools -> Compilation Database -> Change Project Root**

![image-20240305231718672](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305231718672.png)

查找一下main.c这个文件

![image-20240305231954053](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305231954053.png)

此时已经导入

## 5.配置调试

需要配置构建目标，操作路径：
**Preferences > Build, Exceution, Deployment > Custom Build Targets**

![image-20240305234041616](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234041616.png)

最终打开**Edit Tool**编辑小面板，其中**Tool Settings**几个参数内容分别是：

![image-20240305234131745](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234131745.png)

第二个：

![image-20240305234203754](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234203754.png)

编辑配置：

![image-20240305234246334](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234246334.png)

选择自定义构建应用

![image-20240305234326813](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234326813.png)

![image-20240305234401193](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234401193.png)

执行选择已经编译好的java命令。然后点击运行debug模式
![image-20240305234645160](https://raw.githubusercontent.com/mxsm/picture/main/java/jvmimage-20240305234645160.png)

已经成功运行。

