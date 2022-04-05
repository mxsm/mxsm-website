---
title: "分布式文件系统MinIO环境的搭建"
linkTitle: "分布式文件系统MinIO环境的搭建"
date: 2022-04-03
weight: 202204031013
---

一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第3天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

### 1.前言

公司开始使用的分布式文件系统是阿里云的OSS用来存储图片，出于安全的考虑和业务方的需求公司开始自建分布式文件系统，之前公司也有使用[fastDNS](https://github.com/happyfish100/fastdfs) 。最近开始准备用[MinIO](https://github.com/minio/minio) 来搭建一套公司使用的分布式文件系统。自己也来学习一下MinIO的使用。在本地搭建一套环境。

### 2. MinIO有哪些优势？

#### 2.1 文档全面社区活跃

MinIO作为一款基于Golang 编程语言开发的一款高性能的分布式式存储方案的开源项目，有十分完善的官方文档。同时通过Github的❤的数量可以知道社区是相当的活跃。

官方文档(英文)：https://docs.min.io/docs/

中文文档：http://docs.minio.org.cn/docs/

#### 2.2 对原生有良好的支持

MinIO本身是用Golang编写，对于K8S等有着良好的支持。

### 3.环境搭建

Linux本机环境和Docker容器两种方式分别搭建。

#### 3.1 Linux本机搭建

> Tips:使用的Window的WSL作为本机环境

**第一步：** 下载MinIO的Server安装包

二进制安装包：

```shell
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
```

rpm安装包：

```shell
dnf install https://dl.min.io/server/minio/release/linux-amd64/minio-20220401034139.0.0.x86_64.rpm

```

**第二步：** 启动服务

```shell
#二进制启动
export MINIO_ROOT_USER=admin 
export MINIO_ROOT_PASSWORD=password 
./minio server /mnt/data --console-address ":9001"

#rpm包安装启动
export MINIO_ROOT_USER=admin 
export MINIO_ROOT_PASSWORD=password 
minio server /mnt/data --console-address ":9001"
```

> Tips: MINIO_ROOT_USER的最小长度至少未3，MINIO_ROOT_PASSWORD最小长度至少为8，如果小于就会报下面错误
>
> ![MinIO启动错误](https://raw.githubusercontent.com/mxsm/picture/main/other/minioMinIO%E5%90%AF%E5%8A%A8%E9%94%99%E8%AF%AF.png)

启动后：

![image-20220403143459778](https://raw.githubusercontent.com/mxsm/picture/main/other/minioimage-20220403143459778.png)

**第三步：** 打开web界面

![image-20220403143707690](https://raw.githubusercontent.com/mxsm/picture/main/other/minioimage-20220403143707690.png)

搭建完成

#### 3.2 Docker环境搭建

**第一步：** 下载MinIO Docker镜像

![image-20220403150809283](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220403150809283.png)

**第二部：** 启动minio

```shell
docker run -p 9000:9000 -p 9001:9001 --name mxsmMinIO -e MINIO_ROOT_USER=mxsm -e MINIO_ROOT_PASSWORD=mxsm123456    minio/minio server /data --console-address ":9001"

#例子：
docker run -p 9000:9000 -p 9001:9001 --name mxsmMinIO -e MINIO_ROOT_USER=mxsm -e MINIO_ROOT_PASSWORD=mxsm123456 -v /mnt/e/minio/data1:/data    minio/minio server /data --console-address ":9001"
```

![image-20220403152424899](https://raw.githubusercontent.com/mxsm/picture/main/other/minioimage-20220403152424899.png)

**第三步：** 打开web页面

![image-20220403152503196](https://raw.githubusercontent.com/mxsm/picture/main/other/minioimage-20220403152503196.png)

到这里为止单机版搭建完成。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考文档：

- https://docs.min.io/docs/
- https://min.io/download#/kubernetes
