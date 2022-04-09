---
title: "分布式ID生成器-雪花算法"
linkTitle: "分布式ID生成器-雪花算法“
date: 2022-04-09
weight: 202204092058
---

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1. 雪花算法(Snowflake)

Twitter的Snowflake算法是在分布式系统中一种自增ID的算法，ID能够按照时间有序生成并且可以做到全局唯一。Twitter对雪花算法的需求：

**性能**

- 每个进程每秒至少10k个id
- 响应速率2ms(包括网络延迟)

**协调**

对于数据中心内部和跨数据中心的高可用性，生成id的机器无需进行集群协调。也就是说无需再每个服务之间进行通讯进行协调。

**直接排序**

无需加载整个对象ID就能排序(时间戳)

**紧凑**

生成的ID要紧凑，换句话说就是ID所占的长度需要适中在完成业务需要的基础上。

**高可用**

ID生成服务要高可用,例如：存储服务

> Tips: Twitter的雪花算法的说明https://github.com/twitter-archive/snowflake/tree/scala_28

#### 1.1 雪花算法的数据结构

雪花算法生产的ID所占8个字节64位，也就是长整型 **`long`** 的长度。

![雪花算法ID的结构](https://raw.githubusercontent.com/mxsm/picture/main/architecture/%E9%9B%AA%E8%8A%B1%E7%AE%97%E6%B3%95ID%E7%9A%84%E7%BB%93%E6%9E%84.png)

- 首位bit位表示符号位，生成ID都是正数所以最高位就是0

- 时间戳(41bit),毫秒级别时间戳。但是实际开发过程中使用的时间戳使用的是时间戳的差值。**`这个差值=当前时间戳 - 开发者设置的固定时间戳`** ，那么41位的时间戳可以使用69年

  > (1L << 41) / (1000L * 60 * 60 * 24 * 365)  算出来差不多69年

- 机器ID(10bit),一共可以配置1024台机器，如果有多个机房在10bit进行机房和机器好进行组合

- 序列号(12bit),每一台机器1ms可以生成4096(如果一台机器一毫秒内生成超过4096需要进行保护)

#### 1.2 系统时钟依赖

应该使用NTP来保持系统时钟的准确性。**`Snowflake`** 可以防止非单调时钟的影响，也就是时钟倒走。如果您的时钟运行得很快，并且NTP告诉它重复几毫秒，那么 **`Snowflake`** 将拒绝生成id，直到上次我们生成id之后的某个时间。在ntp不会让时钟倒转的模式下运行。

如果时间进行回拨那么生成的ID就有可能出现重复的情况。

### 2. 雪花算法Java实现

```java
/**
 * @author mxsm
 * @date 2022/4/9 21:17
 * @Since 1.0.0
 */
public class SnowflakeGenerator {

    private static final long FIXED_TIMESTAMP = 1649491204306L;

    private int machineId;

    private int sequenceNumber = 0;

    //最后一次生成ID时间
    private volatile long lastTimestamp = -1L;


    public SnowflakeGenerator(int machineId) {
        this.machineId = machineId;
    }

    public synchronized long nextId() {

        //获取当前时间
        long currentTimestamp = System.currentTimeMillis();

        //同一个毫秒内生成ID
        if(currentTimestamp == lastTimestamp){
            sequenceNumber += 1;
            //处理一秒超过4096个
            if(sequenceNumber > 4096){
                while (currentTimestamp <= lastTimestamp){
                    currentTimestamp = System.currentTimeMillis();
                }
                sequenceNumber = 0;
            }
        }else {
            //重置序列号
            sequenceNumber = 0;
        }
        lastTimestamp = currentTimestamp;

        return ( (currentTimestamp - FIXED_TIMESTAMP) << 22) | (machineId << 12) | sequenceNumber;
    }
}
```

> Tips: 代码地址https://github.com/mxsm/distributed-id-generator/tree/main/generator-snowflake

以上代码是简单的实现。

### 3.优缺点

**优点：**

- ID生成服务与服务之间没有协调。靠要单独进行工作。
- 在ID生成服务本地生成没有网络的消耗效率高，高性能高可用：生成时不依赖于数据库，完全在内存中生成
- 高吞吐：每秒钟能生成数百万的自增 ID

**缺点：**

- 依赖与系统时间的一致性，如果系统时间被回调，或者改变，可能会造成 ID 冲突或者重复。

> Tips: 在本人公司没有单独部署雪花算法的生产服务器，而是将生成器直接集成到了每个项目的代码中。机器ID是IP地址取模32后的值。所以在高并发下可能会出现小概率的重复情况。在可允许的范围内

### 4. 总结

雪花算法的服务集群没有服务之间的协调和同步。可以说是用单机组成的高可用分布式ID可用集群。雪花算法依赖时间戳，如果时间戳出现回拨的情况就有可能ID重复的情况。总体来说雪花算法相对于Redis实现 UUID 以及MySQL有更优。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢