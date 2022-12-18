---
title: "RocketMQ Docker部署"
linkTitle: "RocketMQ Docker部署"
date: 2021-12-25
weight: 202112252056
---

> 目前官方 RocketMQ 镜像 `hub.docker.com` 最新版本为[4.6.0](https://hub.docker.com/layers/apacherocketmq/rocketmq/4.6.0/images/sha256-4c640187427b68c832b821cf7f4dcbb3004089cdda9e2079e9070179d0ce86df?context=explore)，但是现在RocketMQ的最新版本已经到了4.9.2。所以4.6.0往上的新版本就不能直接通过DockerHub进行安装。那么RocketMQ只能自己在本地打包镜像。
>
> 这里我基于RocketMQ 4.9.2版本来进行全套的打包部署

### 1. 镜像制作前准备

#### 1.1 clone rocketmq-docker项目的代码

```shell
#官方的docker地址
git clone https://github.com/apache/rocketmq-docker.git
```

执行上面命令克隆下来这项目的代码。

### 2. 构建镜像

这里需要构建的镜像有两个

- rocketmq-dashboard镜像(web控制台)
- rocketmq镜像(NameSrv和Broker)

#### 2.1 rocketmq镜像构建

```shell
cd image-build
sh build-image.sh RMQ-VERSION BASE-IMAGE
```

> 原理：通过版本和BASE-IMAGE(支持centos, alpine)来判断是使用 Dockerfile-centos文件还是Dockerfile-alpine文件来构建镜像。

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/rocketmq-centos%E9%95%9C%E5%83%8F%E6%9E%84%E5%BB%BA.png)

等待镜像构建完成，然后通过docker命令查看

```shell
docker image ls
```

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/rocketmq%E5%88%9B%E5%BB%BA%E5%A5%BD%E7%9A%84%E9%95%9C%E5%83%8F.png)

#### 2.2 rocketmq-dashboard镜像构建

和构建rocketmq镜像一样，我们依葫芦画瓢构建rocketmq-dashboard镜像

```shell
cd image-build
sh build-image-dashboard.sh dashboard-VERSION BASE-IMAGE
```

> BASE-IMAGE只支持centos

![](https://github.com/mxsm/picture/blob/main/rocketmq/build-image-dashboard.png?raw=true)

等待镜像构建完成。

```shell
docker image ls
```

![](https://github.com/mxsm/picture/blob/main/rocketmq/web%E6%8E%A7%E5%88%B6%E5%8F%B0%E6%89%93%E5%8C%85%E9%95%9C%E5%83%8F%E5%AE%8C%E6%88%90.png?raw=true)

### 3. Docker-compose 安装

这里为什么用Docker-compose 安装呢？因为RocketMQ的安装的东西有三个部分：**namesrv、broker、rocketmq-dashboard** ，用Docker-compose安装起来比较方便。

#### 3.1 环境准备

> 本地已经有了rocketmq-dashboard镜像和rocketmq镜像

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/%E5%B7%B2%E7%BB%8F%E5%87%86%E5%A4%87%E5%A5%BD%E7%9A%84%E9%95%9C%E5%83%8F.png)

#### 3.2 RockerMQ 单机部署

##### 3.2.1 NameSrv的Docker宿主机环境

主要配置的是日志路径以及存储路径。(挂载路径)

```shell
mkdir -p /root/rocketmq/data/namesrv/logs

mkdir -p /root/rocketmq/data/namesrv/store
```

##### 3.2.2 Broker的Docker宿主机环境

主要创建日志、数据存储、以及配置存放的挂载路径

```shell
mkdir -p /root/rocketmq/data/broker/logs
mkdir -p /root/rocketmq/data/broker/store
mkdir -p /root/rocketmq/etc/broker
```

##### 3.2.3 Broker配置文件创建

```shell
nano /root/rocketmq/etc/broker/broker.conf
```

文件内容如下:

```properties
brokerClusterName = mxsm-docker
brokerName = mxsm-docker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
# Docker环境需要设置成宿主机IP
#brokerIP1 = {docker宿主机IP}
brokerIP1 = 192.168.43.128
```

> 例如：在Docker宿主机通过命令查询到的IP地址为 **`192.168.43.128`** 那么这个地方就设置为 **`192.168.43.128`** 

##### 3.2.4 编写Docker-compose文件

> 这里编写Docker-compose文件版本使用的3，有的人docker可能版本没这么高，可以使用2看个人调整。

```yaml
version: '3'
services:
  #Service for nameserver
  namesrv:
    image: apacherocketmq/rocketmq:4.9.2
    container_name: rocketmq-namesrv
    ports:
      - 9876:9876
    environment:
      - JAVA_OPT_EXT=-server -Xms256m -Xmx256m -Xmn256m
    volumes:
      - /root/rocketmq/data/namesrv/logs:/root/logs
    command: sh mqnamesrv

  #Service for broker
  broker:
    image: apacherocketmq/rocketmq:4.9.2
    container_name: rocketmq-broker
    links:
      - namesrv
    depends_on:
      - namesrv
    ports:
      - 10909:10909
      - 10911:10911
      - 10912:10912
    environment:
      - NAMESRV_ADDR=namesrv:9876
      - JAVA_OPT_EXT=-server -Xms512m -Xmx512m -Xmn256m
    volumes:
      - /root/rocketmq/data/broker/logs:/home/rocketmq/logs
      - /root/rocketmq/data/broker/store:/home/rocketmq/store
      - /root/rocketmq/etc/broker/broker.conf:/home/rocketmq/conf/broker.conf
    command: sh mqbroker -c /home/rocketmq/conf/broker.conf

  #Service for rocketmq-dashboard
  dashboard:
    image: apache/rocketmq-dashboard:1.0.0-centos
    container_name: rocketmq-dashboard
    ports:
      - 8080:8080
    links:
      - namesrv
    depends_on:
      - namesrv
    environment:
      - NAMESRV_ADDR=namesrv:9876
```

运行命令：

```shell
docker-compose -f ./docker-compose.yml up
```

然后查看运行的情况。

> 在运行的过程中总是发现有这样的一个问题：rocketmq-broker exited with code 253，也没日志打印。这里可能是挂载路径没有权限的问题。加上权限即可。

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/%E8%BF%90%E8%A1%8C%E6%88%90%E5%8A%9F.png)

然后在本地登录web控制台进行验证

![](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq/web%E6%8E%A7%E5%88%B6%E5%8F%B0.png)

### 4. 总结

- 总的来说大家可以根据官方的 **`rocketmq-docker`** 项目来进行docker部署。这里也存在一些问题，我开始用官方的创建镜像很慢，特别是下载和编译的时候。这里也可以在本地将项目进行编译然后修改一下从本地进行镜像构建。这样构建有一个好处，在本地能够构建正在开发的版本镜像。
- 官方的Docker-compose没有将rocketmq-dashboard控制台进行运行。
