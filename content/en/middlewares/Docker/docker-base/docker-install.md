---
title: "Centos8 Docker安装"
linkTitle: "Centos8 Docker安装"
date: 2021-08-22
weight: 202108221505
---

### 1. 系统要求

系统必须是Centos7或者Centos8

### 2. 卸载系统的旧版本

```shell
 sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

### 3. 安装Docker

在安装Docker之前需要做一些安装的准备

#### 3.1 设置仓库

```shell
 sudo yum install -y yum-utils
 
 sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```

#### 3.2 安装Docker

```shell
 sudo yum install docker-ce docker-ce-cli containerd.io
```



参考文档:

- https://docs.docker.com/engine/install/centos/