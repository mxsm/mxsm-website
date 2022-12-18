---
title: "Netty源码解析-SizeClasses"
linkTitle: "Netty源码解析-sizeClasses"
date: 2022-01-08
weight: 202201081448
---

> Netty版本：4.1.72.Final

Netty的内存对齐类SizeClasses，它为Netty内存池中的内存块提供大小对齐，索引计算等服务方法。 **`4.1.72.Final`** 是 **`jemalloc4`** 的实现。**`jemalloc4`** 进一步优化了内存碎片的问题。jemalloc4 相较于 jemalloc3 最大的提升是进一步优化内存碎片问题，因为在 jemalloc3 中最多可能会导致 50% 内存碎片，但 jemalloc4 通过划分更细粒度的内存规格在一定程度上改善了这一问题，这也是 SizeClasses 的由来。

> Tips: https://github.com/netty/netty/issues/3910 (Netty Issues) 这里说明了jemalloc4的提升

### 1. Netty内存规格

这里讲的是基于 **`jemalloc4`** 实现的内存分配。

![Netty内存规格2](https://github.com/mxsm/picture/blob/main/netty/Netty%E5%86%85%E5%AD%98%E8%A7%84%E6%A0%BC2.png?raw=true)

**`jemalloc4`** 取消了 **`Tiny`** 内存的规格。只保留了 **`small`** 、 **`normal`** 、 **`huge`** 三种规格。下面要分析的 **`SizeClasses`** 就是记录了 small和normal规格值的一张表。以及一些其他的有用的信息

### 2. SizeClasses解析

先看一下 **`SizeClasses`** 类的说明。

#### 2.1 SizeClasses关键字段说明

- **LOG2_SIZE_CLASS_GROUP**： 每次大小加倍时，size类计数的对数。值为：2
- **LOG2_MAX_LOOKUP_SIZE**：
- **index**： 内存块size的索引
- **log2Group**：内存块分组
- **log2Delta**：增量大小的log2值
- **nDelta**：增量乘数
- **isMultiPageSize**：表示size是否为page的倍数
- **isSubPage**：表示是否为一个subPage类型
- **smallMaxSizeIdx**：小规格内存的最小Index
- **sizeClasses**:元组表 [index, log2Group, log2Delta, nDelta, isMultiPageSize,isSubPage, log2DeltaLookup] 

看一下在Debug模式下 **`SizeClasses`** 相关的属性值

![sizeClassesdebug相关值](https://raw.githubusercontent.com/mxsm/picture/main/netty/sizeClassesdebug%E7%9B%B8%E5%85%B3%E5%80%BC.png)

#### 2.2 sizeClasses格式

下面来看一下 **`sizeClasses`** 下保存了什么。

> 源码的介绍中也给了一些说明，但是如果需要一个完整的要怎么办呢？ 同样我们可以写写一个简单的Netty项目，然后启动把debug的断点打在类里面如下图方式获取：
>
> ![nettySizeClasses](https://raw.githubusercontent.com/mxsm/picture/main/netty/nettySizeClasses.gif)

表格的数据如下：

| index | log2Group | log2Delta | nDelta | isMultiPageSize | isSubPage | log2DeltaLookup | size |
| :--: | :--: | :--: | :--: | :--: | :--: | :--: | ---- |
|0|4|4|0|0|1|4|16B|
|1|4|4|1|0|1|4|32B|
|2|4|4|2|0|1|4|48B|
|3|4|4|3|0|1|4|64B|
|4|6|4|1|0|1|4|80B|
|5|6|4|2|0|1|4|96B|
|6|6|4|3|0|1|4|112B|
|7|6|4|4|0|1|4|128B|
|8|7|5|1|0|1|5|160B|
|9|7|5|2|0|1|5|192B|
|10|7|5|3|0|1|5|224B|
|11|7|5|4|0|1|5|256B|
|12|8|6|1|0|1|6|320B|
|13|8|6|2|0|1|6|384B|
|14|8|6|3|0|1|6|448B|
|15|8|6|4|0|1|6|512B|
|16|9|7|1|0|1|7|640B|
|17|9|7|2|0|1|7|768B|
|18|9|7|3|0|1|7|896B|
|19|9|7|4|0|1|7|1024B|
|20|10|8|1|0|1|8|1280B|
|21|10|8|2|0|1|8|1536B|
|22|10|8|3|0|1|8|1792B|
|23|10|8|4|0|1|8|2048B|
|24|11|9|1|0|1|9|2560B|
|25|11|9|2|0|1|9|3072B|
|26|11|9|3|0|1|9|3584B|
|27|11|9|4|0|1|9|4096B|
|28|12|10|1|0|1|0|5120B|
|29|12|10|2|0|1|0|6144B|
|30|12|10|3|0|1|0|7168B|
|31|12|10|4|1|1|0|8K(PageSize)|
|32|13|11|1|0|1|0|10K|
|33|13|11|2|0|1|0|12KB|
|34|13|11|3|0|1|0|14KB|
|35|13|11|4|1|1|0|16KB|
|36|14|12|1|0|1|0|20KB|
|37|14|12|2|1|1|0|24KB|
|38|14|12|3|0|1|0|28KB|
|39|14|12|4|1|0|0|32KB|
|40|15|13|1|1|0|0|40KB|
|41|15|13|2|1|0|0|48KB|
|42|15|13|3|1|0|0|56KB|
|43|15|13|4|1|0|0|64KB|
|44|16|14|1|1|0|0|80KB|
|45|16|14|2|1|0|0|96KB|
|46|16|14|3|1|0|0|112KB|
|47|16|14|4|1|0|0|128KB|
|48|17|15|1|1|0|0|160KB|
|49|17|15|2|1|0|0|192KB|
|50|17|15|3|1|0|0|224KB|
|51|17|15|4|1|0|0|256KB|
|52|18|16|1|1|0|0|320KB|
|53|18|16|2|1|0|0|384KB|
|54|18|16|3|1|0|0|448KB|
|55|18|16|4|1|0|0|512KB|
|56|19|17|1|1|0|0|640KB|
|57|19|17|2|1|0|0|768KB|
|58|19|17|3|1|0|0|896KB|
|59|19|17|4|1|0|0|1.0MB|
|60|20|18|1|1|0|0|1.25MB|
|61|20|18|2|1|0|0|1.5MB|
|62|20|18|3|1|0|0|1.75MB|
|63|20|18|4|1|0|0|2MB|
|64|21|19|1|1|0|0|2.5MB|
|65|21|19|2|1|0|0|3MB|
|66|21|19|3|1|0|0|3.5MB|
|67|21|19|4|1|0|0|4MB|
|68|22|20|1|1|0|0|5MB|
|69|22|20|2|1|0|0|6MB|
|70|22|20|3|1|0|0|7MB|
|71|22|20|4|1|0|0|8MB|
|72|23|21|1|1|0|0|10MB|
|73|23|21|2|1|0|0|12MB|
|74|23|21|3|1|0|0|14MB|
|75|23|21|4|1|0|0|16MB|

> 表格最后面的size如何获取呢？简单的方式还是用debug的方式获取：
>
> ![image-20220108163159653](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220108163159653.png)
>
> 使用IDEA的 **`Add Inline Watch`** 增加如下的打印
>
> ![image-20220108163134197](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220108163134197.png)

表格说明：

- 不管是Small和normal的内存规格的内存，分割的粒度更小。
- 从 **`isSubPage`** 列可以看出来， 内存小于等于 **`28K`** 表示Subpage

#### 2.3 源码分析

![image-20220108170650412](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220108170650412.png)

**`SizeClasses#sizeClasses`** 方法负责 计算 **`sizeClasses`** 表格。**`SizeClasses`** 主要负责根据请求的分配的内存大小规范到最接近 **`sizeClasses`** 表格中的最接近的大小。

### 3. 总结

- **`SizeClasses`** 主要是 **`jemalloc4`** 的实现，为了更细粒度的管理内存，减少内存碎片的产生
- **`jemalloc4`** 没有做深入的研究，如果有想研究的可以去[Github]( https://github.com/jemalloc/jemalloc) 研究C 的实现
- **`jemalloc4`** 的内存规格减少了Tiny类型，这个也提现在Netty的实现中，在 **`SizeClass`** 枚举类中也去掉了 **`Tiny`** 类型

