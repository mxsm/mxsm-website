---
title: 查看线程的CPU使用
categories:
  - Java
  - JSE
  - Java查问题
tags:
  - Java
  - JSE
  - Java查问题
abbrlink: dbdfb061
date: 2018-05-29 03:46:33
---
#### 1 查看Java程序运行的进程号

```
jps
或者
top 命令查看
或者
ps -ef | grep java
```

![图解](https://github.com/mxsm/document/blob/master/image/JSE/%E7%BA%BF%E4%B8%8A%E6%9F%A5%E9%97%AE%E9%A2%98/jps%E5%91%BD%E4%BB%A4.jpg?raw=true)

#### 2 查看Java进程下面的线程

```
top  -p pid -H
```

![图](https://github.com/mxsm/document/blob/master/image/JSE/%E7%BA%BF%E4%B8%8A%E6%9F%A5%E9%97%AE%E9%A2%98/%E6%9F%A5%E7%9C%8BJava%E8%BF%9B%E7%A8%8B%E4%B8%8B%E7%9A%84%E7%BA%BF%E7%A8%8B.jpg?raw=true)

#### 3 用jstack命令查询

```
jstack pid | grep -A 10 线程的Id
```

![图](https://github.com/mxsm/document/blob/master/image/JSE/%E7%BA%BF%E4%B8%8A%E6%9F%A5%E9%97%AE%E9%A2%98/%E6%9F%A5%E7%9C%8Bjava%E7%BA%BF%E7%A8%8B%E7%9A%84%E6%83%85%E5%86%B5.jpg?raw=true)

以上的截图都是基于阿里云的ESC服务器，和有些需要转换成16进制的有点不一样。大体的解决思路是一样的。分为三步：

1. **获取需要关注的Java工程的运行PID**
2. **查看用`top  -p pid -H`Java线程下面进程的情况，主要关注CPU的使用率**
3. **用`jstack pid | grep -A 10` 线程的Id 命令找到对应的在Java中的位置**

