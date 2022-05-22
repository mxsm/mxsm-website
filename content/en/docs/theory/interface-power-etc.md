---
title: "什么是接口幂等，接口幂等如何保证"
linkTitle: "什么是接口幂等，接口幂等如何保证"
date: 2022-05-08
weight: 202205081622
---

### 1.什么是接口幂等？

幂等性原本是数学上的概念，用在接口上就可以理解为：对于同一操作发起的一次请求或者多次请求的结果是一致的。不会因为多次请求而产生副作用。例如：服务消费MQ消息，MQ生产者发送了多个相同消息体的MQ消息，消费这个消息的接口多次消费相同的消息结果应该一样。不会因为多消费几次而产生多条记录。

接口幂等主要发生在一下两类接口：

- 插入数据接口，多次请求可能产生多个数据

- 更新接口，多次更新可能导致数据混乱，例如：

```sql
 UPDATE mxsm_allocation SET max_id = max_id + step * #{stepLength}  WHERE biz_code = #{bizCode}
```

### 2.接口幂等解决方案

下面来看一下在日常工作中经常用到的接口幂等的解决方案：

<img src="https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/%E6%8E%A5%E5%8F%A3%E5%B9%82%E7%AD%89%E6%96%B9%E6%A1%88.png" alt="接口幂等方案" style="zoom:50%;" />

#### 2.1 数据库主键/唯一索引

数据库主键/唯一索引主要是利用数据库的特性，相同主键和唯一索引的数据插入数据库直接抛错。流程如下：

<img src="https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%BB%E9%94%AE_%E5%94%AF%E4%B8%80%E7%B4%A2%E5%BC%95%E6%B5%81%E7%A8%8B%E5%9B%BE.png" alt="数据库主键_唯一索引流程图" style="zoom:50%;" />

**优点：**

- 实现简单无需代码进行过多处理只是依赖数据库

**缺点：**

- 如果数据库中的数据存在软删除，那么数据库表就不能创建唯一索引。利用唯一索引做幂等就不能使用。
- 如果数据库表的ID每次都是生成，那么数据库主键接口幂也不适用。

在上面的缺点中提到了数据如果存在软删除，数据表就不能建立唯一索引。同时很多表的主键ID都是往表里面插入数据生成的，而不是沿用待处理数据的ID。那么这种利用 **`数据库主键/唯一索引`** 就不适用了。这样就可以用到下面这种方式。

#### 2.2 数据库悲观锁+数据状态(逻辑删除)

**`数据库悲观锁+数据状态(逻辑删除)`** 这种方式主要是用于解决数据库中标的数据使用的软删除这种情况。用一个例子来说明,表结构如下：

```sql
CREATE TABLE `mxsm_allocation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `biz_code` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '业务编码(用户ID,使用业务方编码)',
  `max_id` bigint NOT NULL DEFAULT '1' COMMENT '最大值',
  `step` int NOT NULL COMMENT '步长',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '' COMMENT '说明',
  `create_time` timestamp NOT NULL COMMENT '创建时间',
  `update_time` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` bit(1) DEFAULT b'1' COMMENT '删除状态：0删除，1正常',
  PRIMARY KEY (`id`),
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

biz_code+max_id+step 相同表示数据相同，deleted表示数据删除状态。

处理流程图如下：

<img src="https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/%E5%B9%82%E7%AD%89%E6%96%B9%E6%A1%882.png" alt="幂等方案2" style="zoom:50%;" />

通过数据库的悲观锁，来防止在高并发的情况下让相同的数据插入到数据库表。

**优点：**

- 分布式锁的实现简单，由数据库的悲观锁实现。无需开发者自己实现
- 无需引入其他的中间件，降低了系统的复杂度

**缺点：**

- 由于是软删除数据库中表的数据数据会随着时间推移越来越多，查询时间会变长，同时影响接口的执行速度
- 数据库悲观锁降低了整个接口的性能

> Tips: 笔者公司的表设计都是用的这种软删除。但是个人认为没有需要回溯历史的在后台看的数据没必要进行这种软删除设计。例如：你一个资源表这种类型的数据更加适合物理删除。

#### 2.3 数据库悲观锁

 **`数据库悲观锁`** 和 **`数据库悲观锁+数据状态(逻辑删除)`** 两者实现差不多。在没有数据逻辑删除的情况下可以增加唯一索引，悲观锁用于更新。如果是数据插入数据可以直接利用唯一索引和主键。


#### 2.4 数据库乐观锁

数据库乐观锁主要为了解决悲观锁的性能问题。比较适合更新的场景，以更新账号的信息为例子：

```sql
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '名称',
  `account` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '账号',
  `version` int NOT NULL COMMENT '步长',
  PRIMARY KEY (`id`),
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

步骤1：通过用户id查询获取版本：

```sql
select * from user where id = xxxx
```

步骤2：通过前面查询版本和ID更新数据：

```sql
update user set name = xxxx,version += 1 where id = xxx and version = xxx
```

这里就会存在两个结果：更新成功影响一行数据，更新失败(版本不对)。

更新失败说明存在多次提交相同的数据，这个时候有两种处理方式：

- 直接丢弃调更新失败的操作的信息
- 循环执行步骤1、步骤2直到更新成功


```java
    //伪代码实现
    @Transactional(rollbackFor = Exception.class)
    public void doHander(String message) {

        //处理消息
        Map<String, String> data = JSON.parseObject(message, new TypeReference<Map<String, String>>() {
        });
        Integer effectedRow = null;
        do {
            Integer version = getVersion(); //select * from user where id = xxxx  -- 获取版本
            if (version == null) {
                break;
            }
            effectedRow = update(); // //根据版本号进行更新-update user set name = xxxx,version += 1 where id = xxx and version = xxx
        } while (effectedRow == null || effectedRow == 0);

    }
```
以上两种处理方式也是根据业务逻辑而定。

<img src="https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B9%90%E8%A7%82%E9%94%81.png" alt="数据库乐观锁" style="zoom: 50%;" />


#### 2.5 建防重表过滤数据

通过对一类业务数据建立防重表来过滤数据。这种方法主要可用于MQ消息消费，不太适合直接用HTTP调用的接口。案例说明：将人事系统的账号信息同步到权限系统，在这个过程中从人事系统可能发送多个消息体一样的MQ消息到权限系统。那么权限系统如何处理！ 这个时候能建一张防重过滤表来过滤数据，过滤的规则根据业务来确定。以上面账号为例子我们可以把账号的手机号码一样就表示数据相同。如果防重表中存在就直接丢弃消息。流程图如下：

<img src="https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/%E5%BB%BA%E7%AB%8B%E9%98%B2%E9%87%8D%E8%A1%A8.png" alt="建立防重表" style="zoom: 50%;" />

#### 2.6 分布式锁