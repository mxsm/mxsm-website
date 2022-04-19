---
title: "开发中分布式锁和本地锁如何取舍？"
linkTitle: "开发中分布式锁和本地锁如何取舍？"
date: 2022-04-19
weight: 202204192154
---

### 1.背景

最近接手了一个提桶同事的项目，项目有对接钉钉的相关功能。看到项目中有获取钉钉Access Token的代码，但是代码并没有任何的并发处理。而钉钉获取AccessToken有次数限制。需要本地进行缓存。缓存失效后需要重新从钉钉获取Access Token。这里就会存在并发，处理并发就会用到锁。这里就来聊一下分布式系统中锁的使用，主要从以下几个方面聊：

- **什么情况下需要处理并发？**
- **使用分布式锁还是本地锁?**

### 2. 什么情况下需要处理并发?

已获取钉钉的Access Token为例，钉钉给出了Access Token的使用注意事项：

> 在使用access_token时，请注意：
>
> - access_token的有效期为7200秒（2小时），有效期内重复获取会返回相同结果并自动续期，过期后获取会返回新的access_token。
> - 开发者需要缓存access_token，用于后续接口的调用。因为每个应用的access_token是彼此独立的，所以进行缓存时需要区分应用来进行存储。
> - 不能频繁调用gettoken接口，否则会受到频率拦截。

从上面的说明可以看的出来：Access Token有有效期，获取的Access Token的接口不能频繁调用，Access Token需要应用进行缓存。这种情况下就需要处理并发。为什么这种情况下就需要处理并发？

首先假设你部署一个服务，那么获取Access Token的流程如下：

![流程图1](https://raw.githubusercontent.com/mxsm/picture/main/other/%E6%B5%81%E7%A8%8B%E5%9B%BE1.png)

这样多个线程会同时向钉钉服务器发送请求Access Token。而钉钉规定获取Access Token不能频繁调用。所以去钉钉服务器发送请求Access Token需要加锁。只能让一个线程去服务器获取Access Token减少接口调用频次。

如果不是单服务部署而是部署多个服务，那么获取Access Token的流程如下：

![流程图2](https://raw.githubusercontent.com/mxsm/picture/main/other/%E6%B5%81%E7%A8%8B%E5%9B%BE2.png)

在不加锁的情况所有的服务的说所有线程都会去获取Access Token，如果单个加锁，那么集群中每个服务就会有一个线程去钉钉获取Access Token。这个就是下面需要讨论的问题： **使用分布式锁还是本地锁?**

### 3. 使用分布式锁还是本地锁?

对于使用分布式锁还是本地锁这个也是需要看具体的需求和部署。已上面的例子来说

**情况1：** 部署一个服务

> 部署一个服务，那么只需要使用本地的本地锁即可，只需要有一个线程去钉钉服务获取Access_token

**情况2：** 集群部署服务

> 集群部署是否需要用到分布式锁也需要看情况：
>
> - 如果集群规模部署不是特别大，每个服务单独使用本地锁就会出现最多同一时刻有服务数量的线程去获取Access Token,但是只要一天获取次数和小于限制次数就能满足(使用本地锁的前提是，钉钉有说明：**有效期内重复获取会返回相同结果并自动续期**)。
> - 如果集群部署特别大，每个服务单独去获取一次，一天的获取次数和大于了限制的次数那么这里就需要使用到分布式锁。让所有的机器只有一台去钉钉服务器获取Access Token（这里其实还可以本地锁+分布式锁的方式进一步降低分布式锁的并发）

所以从上面的例子分析可以知道，使用分布式锁还是本地锁需要根据具体情况进行分析，不是所有的集群部署都需要使用分布式锁，本地锁也可以解决问题。笔者接收的项目就是使用本地锁进行实现：

```java
    private String getAccessTokenFromCacheOrElse(Supplier<String> supplier) {

        String accessToken = redisTemplate.opsForValue().get(ACCESS_TOKEN_KEY);
        if (StringUtils.isEmpty(accessToken) && supplier != null) {
            //并发控制
            synchronized (lock) {
                accessToken = redisTemplate.opsForValue().get(ACCESS_TOKEN_KEY);
                if (StringUtils.isEmpty(accessToken)) {
                    //从钉钉服务器获取
                    accessToken = supplier.get();
                    redisTemplate.opsForValue()
                        .set(ACCESS_TOKEN_KEY, accessToken, ACCESS_TOKEN_VALID, TimeUnit.SECONDS);
                    log.info("AccessToken:{}", accessToken);
                }
            }
        }
        return accessToken;
    }
```

这个服务生产的部署数量2个，所以本地锁就能满足。

### 4. 总结

在现在微服务横行天下的时代，本地锁用的越来越少。但是不是说本地锁就不能解决分布式的问题。上面的代码就很好的解决了。分布式锁也可以解决。但是分布式锁的引入同样会增加系统的复杂程度。如果资源存在竞争关系就需要用到锁，但是是本地锁还是分布式锁就需要根据业务需求进行具体分析。找到解决问题的最佳方案。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！