---
title: "分布式ID生成器-美团Leaf"
linkTitle: "分布式ID生成器-美团Leaf“
date: 2022-04-10
weight: 202204102034
---

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1. 美团Leaf分布式ID生成器

美团Leaf 最早期需求是各个业务线的订单ID生成需求，具体Leaf 设计文档见：[ leaf 美团分布式ID生成服务](https://tech.meituan.com/MT_Leaf.html)。Leaf的特点：

- Leaf依赖了数据库或者ZK(这里依赖ZK实现的Snowflake是对Snowflake原有的方式的一种增强)。
- Leaf提供两种模式：Leaf-segment数据库模式和Leaf-snowflake模式两种。
- 对snowflake时间回拨做了优化。解决了时间回拨的问题。

### 2.Leaf的Java实现

在Github上美团有实现代码，下面我们跟进代码搭建一个本地项目跑起来。并且使用一下看看。

**Clone代码:**

```shell
git clone https://github.com/Meituan-Dianping/Leaf.git
```

**配置：**

进入leaf-server/src/main/resources/leaf.properties配置文件中设置

| 配置                      | 说明                                           | 默认值 |
| ------------------------- | ---------------------------------------------- | ------ |
| leaf.name                 | leaf service name                              |        |
| leaf.segment.enable       | whether segment mode is enabled                | false  |
| leaf.jdbc.url             | mysql url                                      |        |
| leaf.jdbc.username        | mysql username                                 |        |
| leaf.jdbc.password        | mysql password                                 |        |
| leaf.snowflake.enable     | whether snowflake mode is enabled              | false  |
| leaf.snowflake.zk.address | zk address under snowflake mode                |        |
| leaf.snowflake.port       | service registration port under snowflake mode |        |

我们开启**`leaf.segment.enable=true`** 。而**`leaf.snowflake.enable`** 由于需要使用到zk暂时不开起。leaf.properties设置：

```properties
leaf.name=mxsm
leaf.segment.enable=true
leaf.jdbc.url=jdbc:mysql://192.168.43.129:3306/leaf?useUnicode=true&characterEncoding=utf-8
leaf.jdbc.username=root
leaf.jdbc.password=sys123456
```

**执行脚本：**

```sql
CREATE TABLE `leaf_alloc` (
  `biz_tag` varchar(128)  NOT NULL DEFAULT '', -- your biz unique name
  `max_id` bigint(20) NOT NULL DEFAULT '1',
  `step` int(11) NOT NULL,
  `description` varchar(256)  DEFAULT NULL,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`biz_tag`)
) ENGINE=InnoDB;

insert into leaf_alloc(biz_tag, max_id, step, description) values('leaf-segment-test', 1, 2000, 'Test leaf Segment Mode Get Id')
```

![image-20220410211931372](https://raw.githubusercontent.com/mxsm/picture/main/architecture/image-20220410211931372.png)

**编译项目：**

```shell
cd Leaf
mvn clean install -DskipTests
```

**运行项目：**

```
cd leaf-server
mvn spring-boot:run
```

项目启动完成：

![image-20220410213923017](https://raw.githubusercontent.com/mxsm/picture/main/architecture/image-20220410213923017.png)

> Tips: 我使用的是mysql8.0所以修改了 mysql的connector版本以及druid的版本，不修改报错。jdk版本使用的是11

**测试：**

```shell
#segment
curl http://localhost:8080/api/segment/get/leaf-segment-test
#snowflake
curl http://localhost:8080/api/snowflake/get/test
```

![leaf测试](https://raw.githubusercontent.com/mxsm/picture/main/architecture/leaf%E6%B5%8B%E8%AF%95.gif)

完全可以使用。

> Tips: 代码自行分析，大体都差不多。

### 3. 总结

**`Leaf-segment`** 数据库模式结合数据库以及内存生成的有点。相当于之前文章中Redis实现的一种增强。这里在数据库发生错误后还能短暂的提供服务，但是服务的多长取决于 **`step`** 。如果步长设置的很大那么就能长时间的提供服务就算数据库发生错误。但是同样可能导致大量的浪费。

**`Leaf-snowflake`** 用ZK来实现对workId的分配。解决了需要手动指定的情况。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考资料：

- https://tech.meituan.com/2017/04/21/mt-leaf.html
- https://github.com/Meituan-Dianping/Leaf