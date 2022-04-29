---
title: "分布式ID生成器-MySQL数据库自增"
linkTitle: "分布式ID生成器-MySQL数据库自增"
date: 2022-04-05
weight: 202204051649
---

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1. MySQL字段自增

在使用MySQL数据库的时候，如果需要某一列的整型数字有序递增。就可以使用MySQL的自增列。该列的值可由 MySQL 服务器自动生成，并且是一个按升序增长的正整数序列。自增列能够被用来为表的新行产生唯一的标识。自增列的特点：

- 自增列不能使用全部的数据类型，它只适用于整数或者浮点数类型，包括： `TINYINT`, `SMALLINT`, `INT`，`MEDIUMINT`, `BIGINT`, `DECIMAL`, `FLOAT`, `DOUBLE`。字符类型不适用
- 自增必须是主键或者唯一键，并且每一张表只能存在一个自增列。(如果用来做分布式ID生成器主键居多)
- 自增的初始值是1

### 2. 自增ID如何作为分布式ID生成器

基于MySQL数据的 **`AUTO_INCREMENT`** 自增的ID可以充当分布式ID生成器，具体实现如下：

单独建一张表来生成ID,表如下：

```sql
CREATE TABLE `distributed_id_generator`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `remark` varchar(255) NULL DEFAULT '' COMMENT '说明',
  PRIMARY KEY (`id`)
);
```

每次往表中插入一条数据，然后获取到数据返回的ID，这个ID就是全局唯一的ID。

> Tips: ID生成并发的保证是由MySQL保证

### 3. 基于mysql实现

```java
@Service
public class DistributedIdGeneratorService {

    @Autowired
    private DistributedIdGeneratorDao dao;

    public long generatorId() {
        DistributedIdGeneratorEntity entity = new DistributedIdGeneratorEntity();
        dao.insertDistributedIdGenerator(entity);
        return entity.getId();
    }
}

public interface DistributedIdGeneratorDao {

    Long insertDistributedIdGenerator(@Param("entity") DistributedIdGeneratorEntity entity);

}
```

mybatis的xml文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.github.mxsm.mysql.dao.DistributedIdGeneratorDao">
    <insert id="insertDistributedIdGenerator" keyProperty="id" useGeneratedKeys="true" parameterType="com.github.mxsm.mysql.entity.DistributedIdGeneratorEntity">
        insert into distributed_id_generator (remark) values (#{entity.remark})
    </insert>
</mapper>
```

这样就完成了实现。

> Tips:代码地址https://github.com/mxsm/distributed-id-generator/tree/main/generator-mysql

### 4.优缺点

**优点：**

- 实现简单，主要是由MySQL来实现
- 并发控制无需开发者自己实现，MySQL提供并发控制保证生成的ID唯一性

**缺点：**

- 并发取决于MySQL数据库，MySQL数据库不能通过集群部署来提高并发。
- 使用一段时间后，作为生成ID的表的数据会上升，表中的数据达到一定量级后会影响性能。作为ID生成器的表无法进行分库分表
- 一旦MySQL数据库不能使用，整个ID生成器就无法进行工作。所以保证数据库的安全运行是使用这个方案生成的关键(主从模式)。

> Tips: 对于数据库的表数据过多，可以使用定时任务对数据进行清理

### 5. 总结

使用MySQL的**`AUTO_INCREMENT`** 来实现分布式ID生成器，性能瓶颈主要在MySQL上面。如果对于并发要求不高可以使用这种方式来实现。只需要保证MySQL数据库能够正常工作(例如主从的模式)。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
