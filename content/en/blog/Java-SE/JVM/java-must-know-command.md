---
title: "Linux下Java开发者必须知道的那些Java命令"
linkTitle: “Linux下Java开发者必须知道的那些Java命令”
date: 2022-01-27
weight: 202201271446
---

「这是我参与2022首次更文挑战的第10天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

Linux环境下和Window环境或者说有可视化界面环境最大的缺点是所有的数据呈现都要靠命令来实现没有图形界面工具，今天来结合实际生产过程中的场景来聊一聊Linux下Java开发者必须知道的那些命令。

### 1. 环境准备

- 运行环境：Ubuntu 20.04.3 LTS (运行在windows上面的子系统)
- JDK版本： openjdk version "11.0.13" 2021-10-19
- Spring Boot版本：2.6.3

在 [Spring初始化官网](https://start.spring.io/ ) 生成一个SpringBoot项目然后打包成jar包再上述环境中运行启动起来

![创建spring运行jar包](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/%E5%88%9B%E5%BB%BAspring%E8%BF%90%E8%A1%8Cjar%E5%8C%85.gif)

这样就已经运行起来了，环境已经准备好了。

### 2. 获取运行Jar包的PID

**场景**：在已经运行的项目，PID。

**命令**：**`ps -ef 或者 jps`** 

![image-20220127152430825](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220127152430825.png)

通过Linux的ps命令或者java的jps命令获取。

### 3. 获取启动项目配置的参数

**场景**：在已经运行的项目，我们想知道配置的参数有哪些。

**命令**：**`jinfo -flags <pid>`**

![image-20220127152739983](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220127152739983.png)

> Tips: **jinfo** 还有其他的用法
>
> ```shell
> Usage:
>     jinfo <option> <pid>
>        (to connect to a running process)
> 
> where <option> is one of:
>     -flag <name>         to print the value of the named VM flag
>     -flag [+|-]<name>    to enable or disable the named VM flag
>     -flag <name>=<value> to set the named VM flag to the given value
>     -flags               to print VM flags
>     -sysprops            to print Java system properties
>     <no option>          to print both VM flags and system properties
>     -? | -h | --help | -help to print this help message
> ```
>
> - 查看某个或者设置某个参数的值

### 4. 查看项目堆的使用情况

**场景**：运行过程中，有时候需要查看项目堆内存的使用情况

**命令**：**`jhsdb jmap --heap --pid <pid>`**

![image-20220127162154475](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220127162154475.png)

### 5. 查看线程状态

**场景**：在运行过程中有时候会需要参看某一个线程的状态

**命令**：**`jstack -l <pid>`**

![image-20220127164738845](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220127164738845.png)

### 6. 查看某一个线程CPU的使用率

**场景**：在排查问题的时候会出现CPU的使用率很高的情况，这个时候回我们想要知道是哪个Java线程占用了CPU.

**命令**：**`1. jstack -l <pid>`**

​            **`2. top -H -p <pid>`**

首先根据命令里获取Java所有线程的信息，然后选择你需要的线程例如下图：

![image-20220127165614424](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220127165614424.png)

我选择了mxsm_0这个线程，那么我们怎么使用第二个命令。看一下上图标号为2的数据，**`nid=0xa43`** 将其转换成十进制就是 **`2627`**

然后使用命令 top -H -p 2627：

![image-20220127170026843](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/image-20220127170026843.png)

标记处的数据和上面的计算出来的是一样的。

> Tips: 查看线程CPU使用率的需要结合Linux命令使用，虽然使用频率比较少但是对于排除线程使用率来说真的好用。
