---
title: "如何将本地已有项目关联到github的新建的项目中"
linkTitle: "如何将本地已有项目关联到github的新建的项目中"
date: 2022-04-04
weight: 202204041654
---

一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第5天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

### 1.背景

很多使用Git的人会遇到这样的情况，我在本地新建了一个项目(以Java项目举例)。此时这个Java项目还没有用Git进行管理。然后我们这个时候会去GitHub或者其他你想用来管理项目的Git后台创建一个项目。这个时候如何将本地的项目推送到服务器上？

一般的做法就是首先 **`GitHub`** 上建的项目 **`Clone`** 到本地。然后把新建的项目手动拷贝到项目中，然后把文件用Git进行管理。最后把文件 **`Push`** 到Github。其次我们还可以使用命令进行操作。下面就来说一说如何用命令的方式直接把两者关联进行管理。这个也是我们比较常见的方式。

###  2. 关联步骤

#### 2.1Github创建项目

本地项目如下：

![image-20220405200549240](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405200549240.png)

然后在Github上面创建名称和本地一样的项目：

![image-20220405200646074](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405200646074.png)

#### 2.2 Git初始化本地项目

用命令初始化本地项目：

```
git init
git add .
git commit -m "project init"
```

![image-20220405201219092](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405201219092.png)

#### 2.3 关联GitHub项目

命令：

```shell
 git remote add <name> <url>
```

例如：

```shell
git remote add origin git@github.com:mxsm/distributed-id-generator.git
```

![image-20220405202603586](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405202603586.png)

此时已经关联起来了。

#### 2.4 pull远程库

命令：

```
git pull origin main --allow-unrelated-histories
```

![image-20220405205318418](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405205318418.png)

#### 2.5 提交代码

```
git push -u origin main 
```

![image-20220405205419581](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405205419581.png)

到这里就完成了本地项目关联到GitHub的项目。

#### 2.6 验证

打开GitHub项目进行验证：

![image-20220405205707203](https://raw.githubusercontent.com/mxsm/picture/main/other/git/image-20220405205707203.png)

以及提交关联了。

> Tips: 以上操作是GitHub已经添加了SSH key的情况下进行操作的。没有添加的可以自行进行添加

### 3. 总结

本地将本地已有项目关联到github的新建的项目中主要使用的是命令：**git remote add \<name\> \<url\>** 。平时工作中也用的比较多。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

**参考资料：**

- https://docs.github.com/cn/authentication/connecting-to-github-with-ssh/checking-for-existing-ssh-keys
- https://docs.github.com/cn/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account