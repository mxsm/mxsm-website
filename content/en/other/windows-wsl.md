---
Windows WSL让你告别VMware
---

### 1. 引言

使用Linux几种方式：

- Mac

  买一台mac电脑最直接的方式，大多数程序员的不二选择。价格劝退一部分人

- 安装Linux系统

  自己在电脑上装一个Linux系统，像ubuntu这可能就变成了程序员专用了。其他的人用起来可能就不是那么的友好

- Windows系统安装VMware

  通过安装VMware，然后在VMware中安装Linux系统。(比较好的一种选择)

- 购买云Linux主机

  在各种云大行其道的今天，购买云主机也是一种选择，还能随时随地有网有电脑就能使用

- Windows WSL

  这个是Windows 10 才有的功能全称：*`Windows Subsystem for Linux`*  。 在windows安装Linux的子系统

下面介绍一下WSL的安装以及使用

### 2. 如何安装WSL

#### 2.1 开启Windows的WSL相关设置

进入启用或关闭Windows功能

![image-20220218220155027](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220218220155027.png)

然后勾选下图1,2两个功能确定：

![](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220218220422072.png)

#### 2.2 从Windows应用商店获取

在Windows应用商店搜索WSL

![微软商城搜索](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/%E5%BE%AE%E8%BD%AF%E5%95%86%E5%9F%8E%E6%90%9C%E7%B4%A2.gif)

ubuntu和Debian都可以选择

> Tips： 在最近Oracle在Windows商店上线了Oracle Linux 8.5, 随着Centos8 的维护日期截止。Oracle Linux 也成了替代选择之一

我这里以Oracle Linux 8.5为例子：

![OracleLinux例子](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%90.gif)

> Tips:  运行WSL需要看一下对windows的系统要求

等到获取完成然后运行

#### 2.3运行WSL

![OracleLinux例子1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%901.gif)

整个就运行完成了。然后可以从Windows Terminal终端进入：

![OracleLinux例子2](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%902.gif)

我电脑上之前已经安装过了Ubuntu

### 3. WSL位置迁移

WSL在安装好以后，默认放在C盘，但是如果随着你使用的WSL越来越久会有很多文件什么的在系统中，这样会导致大量的C盘空间被占用。所以安装好以后把WSL的数据存放位置放在其他盘。

#### 3.1 查看系统中的WSL的版本

```powershell
wsl -l -v
```

![image-20220218222306752](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220218222306752.png)

#### 3.2 导出对应的发行版本

```powershell
wsl --export <分发版> <导出文件名(全路径最好)>

#例子
wsl --export OracleLinux_8_5 D:\OracleLinux_8_5.tar
```

导出的文件类型tar。 例如：D:\xxxx.tar

![OracleLinux例子3](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%903.gif)

#### 3.3 注销导出的分发版

```powershell
wsl  --unregister <分发版>

#例子
wsl  --unregister OracleLinux_8_5
```

![OracleLinux例子4](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%904.gif)

#### 3.4 重新导入导出的分发版

```powershell
wsl --import <分发版> <安装位置> <文件名(全路径)>
#例子
wsl --import OracleLinux_8_5 D:\wsl\OracleLinux_8_5 D:\OracleLinux_8_5.tar --version 2
```

![OracleLinux例子5](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%905.gif)

#### 3.5 删除导出版的文件

```powershell
del  xxx.tar

#例子
del D:\OracleLinux_8_5.tar
```

> Tips: 导入任何 Linux 分发版可以参照https://docs.microsoft.com/zh-cn/windows/wsl/use-custom-distro，这个讲述如何使用Docker来导入。我用了一下感觉不是很好用，大家各种体验。

![OracleLinux例子6](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%906.gif)

### 4. WSL使用

![OracleLinux例子7](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%907.gif)

进入系统完美使用

### 5. WSL使用技巧

在使用过程中，由于可以直接读取Windows下面的目录。这样就提供很大的方便。

- 可以直接下载Linux上面运行的程序到Windows目录中，然后在Linux上运行

  ![image-20220218225558289](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220218225558289.png)

  如上图下载了coredns的Linux的运行。然后就可以通过WSL来运行

  ![OracleLinux例子8](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/OracleLinux%E4%BE%8B%E5%AD%908.gif)

  上面运行成功。

- 在WSL子系统中Maven可以和Windows使用同一个maven仓库。所以就不用在子系统和windows系统用两个不同的maven本地仓库。只需要将Linux系统中的maven配置文件maven仓库配置成一样的就可以了。

  ![image-20220218230435445](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220218230435445.png)

  将磁盘都挂载了。能够直接访问Windows上面的资源

### 6. 总结

WSL解决了windows用户使用Linux的不方便。同时也给学习Linux开发提供方便。不需要装双系统或者VMware。



> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考文档：

- https://docs.microsoft.com/zh-cn/windows/wsl/about