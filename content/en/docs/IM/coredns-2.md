---
title: "CoreDNS+ETCD实现DNS服务发现"
linkTitle: "CoreDNS+ETCD实现DNS服务发现"
date: 2022-02-17
weight: 202202172319
---

### 1. 引言

在前面的文章中讲了如何搭建一个内网的DNS服务，但是这里有个问题，mxsm-register.local表示局域网的注册中心域名，如果需要将每台部署了注册中心的IP地址写到CoreDNS的配置文件中。这样就需要我每次都去修改 **`Corefile`** 配置文件。那有没有一种方式我服务启动然后自动将注册中心所在机器的IP与mxsm-register.local进行绑定，注册中心下线对应的IP也从DNS服务器删除。下面就来讲一下如何利用CoreDNS+etcd来实现这个功能。

> Tips: 由于本人编码只会Java（Go计划学习中），后续涉及的代码都是Java来讲解

### 2. CoreDNS etcd 插件

**CoreDNS** 是一个高度灵活插件化的一个组件，其本身提供了很多插件官方的插件，同时也允许开发者进行插件的拓展。要实现上述的功能这里依赖了一个叫做 **etcd插件** ，这个插件有如下功能：实现了SkyDNS服务发现，它不适合作为一个通用的DNS区域数据插件。只实现了DNS记录类型的一个子集。

配置语法：

```properties
etcd [ZONES...] {
    fallthrough [ZONES...]
    path PATH
    endpoint ENDPOINT...
    credentials USERNAME PASSWORD
    tls CERT KEY CACERT
}
```

- fallthrough: 如果区域匹配但没有记录可以生成，将请求传递给下一个插件
- path: etcd中的路径，默认值/skydns
- endpoint: etcd endpoint
- credentials: etcd的用户名和密码
- tls： CA

### 3. 如何搭建

#### 3.1 环境准备

1.  CoreDNS搭建
2.  etcd环境搭建

这两个是前置条件。

#### 3.2 配置文件

这里使用之前的《[CoreDNS搭建内网DNS服务](https://juejin.cn/post/7065337264036904990)》 里面的配置进行修改，**`Corefile`** 文件：

```
. {
    forward . 8.8.8.8
}
mxsm.local {
	file mxsm.local { 
        reload 30s 
    }
}
etcd-mxsm.local:53 {
 etcd {
        path /mxsm
        endpoint http://172.22.50.98:2379   --- 这里根据自己的etcd部署进行填写
    }
}
```

启动CoreDNS进行验证

#### 3.3 etcd key值说明

etcd插件利用目录结构查询相关条目，已上面的 `etcd-mxsm.local` 为例，配置的etcd的path为 **`/mxsm`** ,  上面的条目就是如下：`/mxsm/local/etcd-mxsm/`  、`/mxsm/local/etcd-mxsm/x`  、 `/mxsm/local/etcd-mxsm/b` 等等。这种情况下就是查询 `etcd-mxsm.local` 。

#### 3.4 验证

利用 `etcdctl` 命令put：

```shell
$./etcdctl put /mxsm/local/etcd-mxsm/ '{"host":"172.22.50.28","ttl":60}'
$./etcdctl put /mxsm/local/etcd-mxsm/1 '{"host":"172.22.50.128","ttl":60}'
$./etcdctl put /mxsm/local/etcd-mxsm/2 '{"host":"172.22.50.228","ttl":60}'
```

然后用 **`dig`** 进行验证：

```shell
$ dig @127.0.0.1 a etcd-mxsm.local
```

![corednsetcd](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/corednsetcd.gif)

![image-20220217225950015](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/image-20220217225950015.png)

### 4. 如何将项目集成

项目集成就是替换上面手动操作 **`etcdctl`** 命令。增加maven依赖：

```xml
<dependency>
  <groupId>io.etcd</groupId>
  <artifactId>jetcd-core</artifactId>
  <version>0.6.1</version>
</dependency>
```

代码：

```java
public class Etcd {

    public static void main(String[] args) throws Exception {
        // create client using endpoints
        Client client = Client.builder().endpoints("xxxx地址自己的填写").build();

        KV kvClient = client.getKVClient();
        ByteSequence key = ByteSequence.from("/mxsm/local/etcd-mxsm/".getBytes());
        ByteSequence value = ByteSequence.from("{\"host\":\"172.22.50.98\",\"ttl\":60}".getBytes());
        PutResponse putResponse = kvClient.put(key, value).get();
        System.out.println(putResponse.toString());

        TimeUnit.SECONDS.sleep(20);
        DeleteResponse deleteResponse = kvClient.delete(key, DeleteOption.newBuilder().isPrefix(true).build()).get();
        System.out.println(deleteResponse);
    }
}
```

下面看一下代码的演示：

![corednsetcd1](https://raw.githubusercontent.com/mxsm/picture/main/java/concurrencemultithreading/corednsetcd1.gif)

可以看到结果和预期的一样

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

参考文档：

- https://github.com/etcd-io/jetcd
- https://etcd.io/
- https://coredns.io/plugins/etcd/