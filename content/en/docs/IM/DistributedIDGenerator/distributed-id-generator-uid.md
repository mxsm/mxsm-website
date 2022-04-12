---
title: "分布式ID生成器-百度UidGenerator"
linkTitle: "分布式ID生成器-百度UidGenerator“
date: 2022-04-11
weight: 202204112034
---

一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第12天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1.UidGenerator

UidGenerator由百度基于[Snowflake](https://github.com/twitter/snowflake)算法的唯一ID生成器的Java实现。但是和[Snowflake](https://github.com/twitter/snowflake)算法又有所区别：

- [Snowflake](https://github.com/twitter/snowflake)算法的 **`time(41bit)、machine id(10bit)、sequence number (12bit)`** 这个三个段所占的位数是固定的，而UidGenerator的设计让这三个变成了可配置。可以灵活的调整。下面是位数对比图

  ![img](https://raw.githubusercontent.com/baidu/uid-generator/master/doc/snowflake.png)

  ![雪花算法ID的结构](https://raw.githubusercontent.com/mxsm/picture/main/architecture/雪花算法ID的结构.png)

  [Snowflake](https://github.com/twitter/snowflake)算法是固定的。

- 时间标识在[Snowflake](https://github.com/twitter/snowflake)算法中是相对时间毫秒，UidGenerator中使用的是秒

- UidGenerator的 **`machine id(worker id)`** 默认是由数据库分配。每启动一次往表WORKER_NODE中插入一条数据，然后获取ID作为 **`machine id(worker id)`** 。 mysql数据库不是必须依赖的。同时支持自定义worker id的位数以及初始化策略。很好的支持了容器化技术

> Tips: 每次启动都会往WORKER_NODE表中插入数据

在百度UidGenerator的实现细节原理可以查看文档：https://github.com/baidu/uid-generator/blob/master/README.zh_cn.md。

> Tips: 在这个实现里面降到了一个FalseSharing问题(为共享)，这个有兴趣的可以去网上查询相关的资料。后续有时间补上这一块的知识，我也是第一次遇到这个知识点。

### 2. UidGenerator Java实现

#### 2.1 服务运行

**clone代码：**

```shell
git clone https://github.com/baidu/uid-generator.git
```

**执行脚本：**

从代码中scripts/WORKER_NODE.sql 获取脚本

```sql
CREATE TABLE WORKER_NODE
(
ID BIGINT NOT NULL AUTO_INCREMENT COMMENT 'auto increment id',
HOST_NAME VARCHAR(64) NOT NULL COMMENT 'host name',
PORT VARCHAR(64) NOT NULL COMMENT 'port',
TYPE INT NOT NULL COMMENT 'node type: ACTUAL or CONTAINER',
LAUNCH_DATE DATE NOT NULL COMMENT 'launch date',
MODIFIED TIMESTAMP NOT NULL COMMENT 'modified time',
CREATED TIMESTAMP NOT NULL COMMENT 'created time',
PRIMARY KEY(ID)
)
 COMMENT='DB WorkerID Assigner for UID Generator',ENGINE = INNODB,CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

![image-20220412222650552](https://raw.githubusercontent.com/mxsm/picture/main/architecture/image-20220412222650552.png)

上述脚本增加  **CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci**

**配置mysql.properties文件：**

mysql.properties在test的目录下面，只需要配置和数据库相关的即可

```properties
jdbc.url=jdbc:mysql://192.168.43.129:3306/leaf?useUnicode=true&characterEncoding=utf-8
jdbc.username=root
jdbc.password=sys123456
```

**运行UnitTest：**

执行CachedUidGeneratorTest测试类：

![image-20220412224113321](https://raw.githubusercontent.com/mxsm/picture/main/architecture/image-20220412224113321.png)

数据库里面的数据：

![image-20220412224149930](https://raw.githubusercontent.com/mxsm/picture/main/architecture/image-20220412224149930.png)

> Tips: 每次启动都往数据插入数据，这里个人觉得可以优化。

### 3.总结

百度UidGenerator是雪花算法另外一种实现，相比雪花算法固定了每个段的长度。这里设计成可调整给使用者提供更加灵活。同时接入数据库的自增来实现Worker Id的设置(这里也可以自行拓展)。但是这个也有一个不足就是你不停的重启服务数据库表WORKER_NODE中的数据会越来越多。UidGenerator做成一个jar包集成到本地服务。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

**参考资料：**

- https://github.com/baidu/uid-generator
- https://github.com/baidu/uid-generator/blob/master/README.zh_cn.md