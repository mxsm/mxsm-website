---
title: "Docker Compose file"
linkTitle: "Docker Compose file"
date: 2021-11-23
weight: 202111231534

---

> Docker Compose file 版本V3

### 1. Docker Compose是什么?

       Docker Compose是Docker编排服务的一部分，Compose可以让用户在集群中部署分布式应用。Docker Compose是一个属于“应用层”的服务，用户可以定义哪个容器组运行哪个应用，它支持动态改变应用，并在需要时扩展。

> Tips：安装就不在这里说了具体参照: [Docker Compose安装](https://docs.docker.com/compose/install/)

### 2. Docker Compose file

Docker Compose file 文件类型为yaml文件，这个文件可以用来定义服务，网络，以及卷等等，默认的路径和名称为 **`./docker-compose.yml`** 。

> Tips: 文件的后缀可以是.yml或者.yaml

### 3. 服务配置

本节包含版本3中服务定义支持的所有配置选项的列表。

#### 3.1 build

在构建时应用的配置选项。 **`build`** 可以指定为包含构建上下文路径的字符串

例子：

```yaml
version: "3.9"
services:
  webapp:
    build: ./dir
```

作为一个对象，在context下指定路径，Dockerfile和args是可选的

```yaml
version: "3.9"
services:
  webapp:
    build:
      context: ./dir
      dockerfile: Dockerfile-alternate
      args:
        buildno: 1
```