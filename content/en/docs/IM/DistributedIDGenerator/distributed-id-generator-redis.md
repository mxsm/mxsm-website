---
title: "分布式ID生成器-Redis"
linkTitle: "分布式ID生成器-Redis“
date: 2022-04-07
weight: 202204072232
---

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1. Redis INCR

分布式ID基于Redis其实就是基于命令 **`INCR`** 。作用：将存储在key处的数字加1。如果该键不存在，则在执行操作前将其设置为0。如果键包含错误类型的值或包含不能用整数表示的字符串，则返回错误。此操作仅限于64位有符号整数。同时 **`INCR`** 操作是**原子操作** 。 这个是保证多线程高并发下生成数据不重复的原因。

### 2. 如何利用INCR做分布式ID生成器

```shell
redis:6379> SET mykey "10"
"OK"
redis:6379> INCR mykey
(integer) 11
redis:6379> GET mykey
"11"
redis:6379> 
```

1. 确定一个KEY作为分布式ID的生成器
2. 然后调用INCR命令获取对应KEY的返回的值，这个值就是全局ID的值

### 3. Java具体实现代码

```java
@RestController
@RequestMapping("/generator/redis")
public class Generator4MysqlController {

    @Autowired
    private RedisTemplate redisTemplate;

    @GetMapping("/id")
    public Long getDistributedId() {
        return  redisTemplate.opsForValue().increment("KEY");
    }
}
```

> Tips:代码地址https://github.com/mxsm/distributed-id-generator/tree/main/generator-redis

### 4. 优缺点

**优点：**

- 不依赖于数据库，灵活方便，且性能优于数据库。
- 实现起来简单，并发的工作不需要实现者来考虑，**`INCR`** 命令本身就是原子操作
- 需要进行业务分类来获取全局的分布式ID而言，只需要增加KEY值就可以了，用MySQL实现简单很多。

**缺点：**

- 如果系统中没有Redis需要，需要为这个引入Redis增加了故障点和系统的复杂程度。
- 相比本地生成增加了网络的消耗

> Tips:对于全局ID来说最重要的是不能出现重复，所以对于Redis就需要考虑持久化。Redis的持久化方式有两种 **`RDB`** 和 **`AOF`** 
>
> - RDB持久化方案是按照指定时间间隔对你的数据集生成的时间点快照, 将数据库的快照（snapshot）以二进制的方式保存到磁盘中。也就是定时快照，如果在连续自增但是Redis在下个快照生成之前发生了Redis宕机。那么在上一次快照生成到宕机生成的自增ID就没有被快照保存。重启Redis后就会出现ID重复的情况。
> - AOF 则以协议文本的方式，将所有对数据库进行过写入的命令（及其参数）记录到 AOF 文件，以此达到记录数据库状态的目的。所以即即使`Redis`挂掉了也不会出现ID重复的情况。但是 Redis 重启回复数据时间过长。建议分布式ID生成单独使用一套Redis
>
> 所以对比以上两种持久化以及分布式全局ID的不能重复的特殊性AOF持久化是不二的选择。

### 5. 总结

用Redis作为分布式ID生成器总的来说由于MySQL来实现。同样实现方式简单也可以达到很高并发性能更好。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

**参考资料：**

- https://redis.io/commands/incr/