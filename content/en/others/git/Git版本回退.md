---
title: Git版本回退
categories:
  - 开发工具
  - git
tags:
  - git
  - 版本回退
abbrlink: 675ca355
date: 2020-04-05 19:34:56
---

### 使用命令

```shell
git reset [-q] [<tree-ish>] [--] <pathspec>…​
git reset [-q] [--pathspec-from-file=<file> [--pathspec-file-nul]] [<tree-ish>]
git reset (--patch | -p) [<tree-ish>] [--] [<pathspec>…​]
git reset [--soft | --mixed [-N] | --hard | --merge | --keep] [-q] [<commit>]
```

### 使用演示

首先建一个git仓库如下图：

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset1.png)

然后通过命令:

> git log --pretty=oneline

查看提交纪录

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset2.png)

常用的reset命令有两种：

> git reset --soft    保留之前的修改
>
> git reset --hard  丢弃所有的改变

#### git reset --hard

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset3.png)

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset4.png)

#### git reset --soft

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset5.png)

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset6.png)

#### 提交远程

![](https://raw.githubusercontent.com/mxsm/document/master/image/git/reset7.png)



> [git reset soft,hard,mixed之区别深解](https://www.cnblogs.com/kidsitcn/p/4513297.html) 可以看一下这篇文章，同样自己也可以用souretree去看一下。

