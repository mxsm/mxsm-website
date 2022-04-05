---
title: "分布式ID生成器-UUID"
linkTitle: "分布式ID生成器-UUID“
date: 2022-04-04
weight: 202204041649
---

![常用分布式ID生成器](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-Generation%E5%B8%B8%E7%94%A8%E5%88%86%E5%B8%83%E5%BC%8FID%E7%94%9F%E6%88%90%E5%99%A8.png)

### 1.什么是UUID？

UUID全称：Universally Unique Identifier，即通用唯一识别码。UUID是由一组32位数的16进制数字所构成(一共128bit)。

![UUID位图](https://raw.githubusercontent.com/mxsm/picture/main/architecture/Distributed%20ID-GenerationUUID%E4%BD%8D%E5%9B%BE.png)

所以理论的总数为16^32基本上用不完。UUID的标准型式包含32个16进制数字，以连字号分为五段，形式为 8-4-4-4-12 的36个字符(32 个字母数字字符和 4 个连字符)。示例：

```
71f3f653-41eb-4c4c-8913-211d8e92d023
```

|                 名称                  | 长度 （字节） | 长度（16进制数字码长） |                             说明                             |
| :-----------------------------------: | :-----------: | :--------------------: | :----------------------------------------------------------: |
|               time_low                |       4       |           8            |                   整数：低位 32 bits 时间                    |
|               time_mid                |       2       |           4            |                  整数：中间位 16 bits 时间                   |
|         time-high-and-version         |       2       |           4            |     最高有效位中的 4 bits“版本”，后面是高 12 bits 的时间     |
| clock-seq-and-reserved和clock-seq-low |       2       |           4            |     最高有效位为 1-3 bits“变体”，后跟13-15 bits 时钟序列     |
|                 node                  |       6       |           12           | 48 bits 节点 ID，全局唯一的IEEE机器识别号，如果有网卡，从网卡MAC地址获得，没有网卡以其他方式获得 |

> Tips: clock-seq-and-reserved和clock-seq-low合并成两个直接一起显示

**UUID的作用：**

UUID的是让分布式系统中的所有元素都能有唯一的辨识信息，而不需要通过中央控制端来做辨识信息的指定（去集群化）。

### 2. Java如何生成UUID

Java JDK提供了生产UUID的工具类：

```java
public class UUIDCreate {

    public static void main(String[] args) {
        System.out.println(UUID.randomUUID());
    }
    
}
```

运行后生成的UUID如下：

```
71f3f653-41eb-4c4c-8913-211d8e92d023
```

符合之前所说的格式 8-4-4-4-12 。

### 3. 优缺点

**优点：**

- 去集群化，不需中央控制本地生成。
- 生成足够简单，本地生成没有网络的消耗，同时还具有唯一性

**缺点：**

- 无序的字符串，并且不具备趋势自增，如果作为ID存入MySQL随着插入的数据增加会导致MySQL的性能降低。因为MySQLinnodb会对主键进行物理排序。因为uuid是杂乱无章的，每次插入的主键位置是不确定的，可能在开头，也可能在中间，在进行主键物理排序的时候，势必会造成大量的 IO操作影响效率，在数据量不停增长的时候，特别是数据量上了千万记录的时候，读写性能下降的非常厉害。
- UUID的长度太长，且不具备任何业务属性。如果作为主键存入MySQL,这样会导致索引很大。占用大量的空间。同时MySQL建议主键索引尽量字节数越少越好(前提是能满足业务需求的情况下)

这样看下来有点少但是缺点一堆是不是大多数场合不适合使用？其实不然，这个需要看具体的场景。如果你只是需要标记一个资源或者某个东西唯一UUID是一个不错的选择，例如：在分布式环境中标记一个服务节点的唯一，这种情况下没必要写一个分布式ID生成服务来表示。直接用UUID即可

### 4. 总结

UUID的生成直接在本地不需要部署中央服务，去集群化能够在本地实现具有唯一性的ID。生成速度是UUID的最大优势。使用的时候需要考虑存储和生产速度以及便利性的考量。同样这样的本地生成也可以为我们自己设计一个分布式ID生成器提供了思路(后续会自己设计一个分布式ID生成器)。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

**参考资料：**

- https://datatracker.ietf.org/doc/html/rfc4122