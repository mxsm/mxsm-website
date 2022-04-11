---
title: "分布式ID生成器-Tinyid"
linkTitle: "分布式ID生成器-Tinyid“
date: 2022-04-11
weight: 202204112034
---

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1. Tinyid

inyid是用Java开发的一款分布式id生成系统，基于数据库号段算法实现(由滴滴开发)。这个算法和美团的Leaf分布式的Leaf-segment数据库方案相似。没有提供雪花算法的实现。Tinyid的特点：

- 提供生成的是一个long类型的ID,这个和美团的Leaf，雪花算法生成的ID是一样的。
- 提供了Http的方式访问，也提供了Java-client方式。这个client方式即使在Http不能使用的时候也可以在本地生成。(可用性取决于步长)。Java-client让生成数据的性能有很大的提升。
- 不适用订单类似的场景这个和美团的Leaf一样。容易被预测订单量。

### 2.Tinyid Java实现

#### 2.1 Tinyid 服务

**clone代码：**

```shell
git clone https://github.com/didi/tinyid.git
```

**执行脚本：**

```sql
CREATE TABLE `tiny_id_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `biz_type` varchar(63) NOT NULL DEFAULT '' COMMENT '业务类型，唯一',
  `begin_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '开始id，仅记录初始值，无其他含义。初始化时begin_id和max_id应相同',
  `max_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '当前最大id',
  `step` int(11) DEFAULT '0' COMMENT '步长',
  `delta` int(11) NOT NULL DEFAULT '1' COMMENT '每次id增量',
  `remainder` int(11) NOT NULL DEFAULT '0' COMMENT '余数',
  `create_time` timestamp NOT NULL DEFAULT '2010-01-01 00:00:00' COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT '2010-01-01 00:00:00' COMMENT '更新时间',
  `version` bigint(20) NOT NULL DEFAULT '0' COMMENT '版本号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_biz_type` (`biz_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT 'id信息表';

CREATE TABLE `tiny_id_token` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `token` varchar(255) NOT NULL DEFAULT '' COMMENT 'token',
  `biz_type` varchar(63) NOT NULL DEFAULT '' COMMENT '此token可访问的业务类型标识',
  `remark` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  `create_time` timestamp NOT NULL DEFAULT '2010-01-01 00:00:00' COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT '2010-01-01 00:00:00' COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT 'token信息表';

INSERT INTO `tiny_id_info` (`id`, `biz_type`, `begin_id`, `max_id`, `step`, `delta`, `remainder`, `create_time`, `update_time`, `version`)
VALUES
	(1, 'test', 1, 1, 100000, 1, 0, '2018-07-21 23:52:58', '2018-07-22 23:19:27', 1);

INSERT INTO `tiny_id_info` (`id`, `biz_type`, `begin_id`, `max_id`, `step`, `delta`, `remainder`, `create_time`, `update_time`, `version`)
VALUES
	(2, 'test_odd', 1, 1, 100000, 2, 1, '2018-07-21 23:52:58', '2018-07-23 00:39:24', 3);


INSERT INTO `tiny_id_token` (`id`, `token`, `biz_type`, `remark`, `create_time`, `update_time`)
VALUES
	(1, '0f673adf80504e2eaa552f5d791b644c', 'test', '1', '2017-12-14 16:36:46', '2017-12-14 16:36:48');

INSERT INTO `tiny_id_token` (`id`, `token`, `biz_type`, `remark`, `create_time`, `update_time`)
VALUES
	(2, '0f673adf80504e2eaa552f5d791b644c', 'test_odd', '1', '2017-12-14 16:36:46', '2017-12-14 16:36:48');
```

> Tips: 数据修改了CHARSET，utf8变成了utf8mb4

![image-20220411214259191](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220411214259191.png)

**修改配置：**

修改tinyid-server/src/main/resources/offline/application.properties

```properties
datasource.tinyid.type=org.apache.tomcat.jdbc.pool.DataSource

datasource.tinyid.primary.driver-class-name=com.mysql.jdbc.Driver
datasource.tinyid.primary.url=jdbc:mysql://192.168.43.129:3306/leaf?useUnicode=true&characterEncoding=utf-8
datasource.tinyid.primary.username=root
datasource.tinyid.primary.password=sys123456
```

我使用的是mysql8，所以修改了代码中的 **`mysql-connector-java`** 的依赖版本为8.0.28。

**启动服务：**

```shell
cd tinyid-server/
sh build.sh offline
java -jar output/tinyid-server-0.1.0-SNAPSHOT.jar
```

启动后：

![image-20220411215142859](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220411215142859.png)

#### 2.2 REST API

```shell
nextId:
curl 'http://localhost:9999/tinyid/id/nextId?bizType=test&token=0f673adf80504e2eaa552f5d791b644c'
response:{"data":[2],"code":200,"message":""}

nextId Simple:
curl 'http://localhost:9999/tinyid/id/nextIdSimple?bizType=test&token=0f673adf80504e2eaa552f5d791b644c'
response: 3

with batchSize:
curl 'http://localhost:9999/tinyid/id/nextIdSimple?bizType=test&token=0f673adf80504e2eaa552f5d791b644c&batchSize=10'
response: 4,5,6,7,8,9,10,11,12,13

Get nextId like 1,3,5,7,9...
bizType=test_odd : delta is 2 and remainder is 1
curl 'http://localhost:9999/tinyid/id/nextIdSimple?bizType=test_odd&batchSize=10&token=0f673adf80504e2eaa552f5d791b644c'
response: 3,5,7,9,11,13,15,17,19,21
```

![image-20220411215839324](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220411215839324.png)

tinyid提供了单个ID生产以及批量的生成。

> Tips: 批量生成提高了效率，但是会存在如果调用方使用没有使用完生成的批量ID就会造成浪费的情况。

#### 2.3 Java-client使用

我们可以使用tinyid项目的java-client的测试类：

![image-20220411220851976](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220411220851976.png)

修改 **tinyid_client.properties** ：

```properties
tinyid.server=172.27.53.158:9999
tinyid.token=0f673adf80504e2eaa552f5d791b644c
```

### 3. 总结

tinyid的中的思想是通过分段来实现与美团Leaf的分段模式差不多。对美团的分段模式进行了改进。同时提供了客户端模式，客户端模式增加了生成ID的效率同时提高了容错率。如果HTTP不能使用但是本地的客户端在一段时间内还是可以使用的。使用的时间长短同样取决于step的长度和消耗ID的速率。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

**参考资料：**

- https://github.com/didi/tinyid
- https://github.com/didi/tinyid/wiki/Tinyid%E5%8E%9F%E7%90%86%E4%BB%8B%E7%BB%8D