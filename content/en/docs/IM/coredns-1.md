---
title: "CoreDNS搭建内网DNS服务"
linkTitle: "CoreDNS搭建内网DNS服务"
date: 2022-02-17
weight: 202202172318
---

### 1. 背景

因为自己有在开发一个聊天的服务，注册中心设计参考了RocketMQ的NameServer。注册中心都是单独部署，注册中心和注册中心之间没有数据交互。注册中心只有和接入服务和消息服务有交互。也就是每个注册中心都链接所有的接入服务和消息服务。通过心跳协议维持连接：

![IM技术架构图](C:\Users\mxsm\Desktop\pic\IM技术架构图.png)

但是这样存在一个问题，例如我新增一个注册中心，在不停机的情况下只有在注册中心新增后新增的接入服务和消息处理服务才可能将信息同步到注册中心，前面的接入服务和消息处理服务就注册中心的IP是写死在配置文件没有做动态加载(动态加载也会很麻烦需要修改每台机器部署的服务的注册中心IP地址)。然后就想到DNS，DNS拥有域名和IP对应关系，只需要确定好注册中心的域名，然后获取到DNS中域名对应的IP地址就可以实现动态的将接入服务和消息处理服务动态的同步到新增的注册中心：

![IM网络图](E:\download\IM网络图.png)

由于我这个是一个内网的域名服务，所以DNS服务需要自己搭建，在研究Nacos的时候发现了一个CoreDNS的域名服务。然后通过研究发现CoreDNS可以作为一个内网自建的域名服务，同时在K8s有应用。

### 2. CoreDNS安装

安装有两种方式：

- **直接下载编译好的压缩包**

  > 下载地址：https://github.com/coredns/coredns/releases

  这种方式就是不关心自定义插件的开发，只是想搭建一个环境比较适合

- **源码编译**

  通过源码编译安装，下面来讲这种方式

#### 2.1 本地源码编译

CoreDNS用Go编写，所以在编译之前确保已经安装了GO的开发环境

> GO的版本需要大于1.17

从Github上面Check out下来项目，然后使用 **`make`** 编译项目：

```shell
$ git clone https://github.com/coredns/coredns
$ cd coredns
$ make
```

### 2.2 Docker编译

```shell
$ docker run --rm -i -t -v $PWD:/v -w /v golang:1.17 make
```

golang的Docker镜像版本可以选择

### 3. 配置例子

#### 3.1 官方版Hello Word配置

根据官网的直接启动

```shell
$ ./coredns
```

![image-20220216233915743](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220216233915743.png)

查询CoreDNS 服务：

```shell
dig @127.0.0.1 -p 53 www.example.com
```

![image-20220216234138713](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220216234138713.png)

解析成功。

#### 3.2 自定义域名解析

配置文件放在和 **`coredns`** 命令相同的 **`Corefile`** 文件中

语法：

```
# define a snippet
(snip) {
    prometheus
    log
    errors
}

. {
    whoami
    import snip
}
```

自定义配置：

```
. {
    forward . 8.8.8.8
}
mxsm.local {
	file mxsm.local { 
        reload 30s 
    }
}
```

配置一个mxsm.local文件：

```
@                       IN SOA   mxsm.local. devops.mxsm.local. (
                                     20200202 ; SERIAL
                                     7200     ; REFRESH
                                     600      ; RETRY
                                     3600000  ; EXPIRE
                                     60)      ; MINIMUM
@                       IN NS    dns1.mxsm.local.   
mxsm.local.             IN A     192.168.43.128         


redis.mxsm.local.         IN A     192.168.43.128
mysql.mxsm.local.         IN A     192.168.43.128
elasticsearch.mxsm.local. IN A     192.168.43.128
ftp                          IN A     192.168.43.128 
```

重新运行coredns服务，验证：

![image-20220216235311444](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220216235311444.png)

外网解析验证

![image-20220216235339131](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220216235339131.png)

到这里就搭建完成了

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！



参考文档：

- https://coredns.io/