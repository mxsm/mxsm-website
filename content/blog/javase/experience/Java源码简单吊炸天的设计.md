---
title: Java源码简单吊炸天的设计
categories:
  - Java
  - Java心得
tags:
  - Java
  - Java心得
abbrlink: 9e3fbfae
date: 2019-02-17 08:43:18
---
### `HashMap`中tableSizeFor函数

函数的作用：计算出给出值离他最近的2的幂次方值

代码如下：

```java
static final int tableSizeFor(int cap) {
        int n = cap - 1;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }
```

