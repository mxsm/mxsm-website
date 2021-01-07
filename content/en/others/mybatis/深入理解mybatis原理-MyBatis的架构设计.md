---
title: 深入理解mybatis原理-MyBatis的架构设计
categories:
  - ORM框架
  - mybatis
tags:
  - ORM框架
  - mybatis
  - MyBatis的架构设计
abbrlink: 5059aab7
date: 2020-02-11 15:37:31
---
 MyBatis是目前非常流行的ORM框架，它的功能很强大，然而其实现却比较简单、优雅。这里会更加网上的找到的现有资料和结合MyBatis([mybatis-3.5.4](https://github.com/mybatis/mybatis-3/releases/tag/mybatis-3.5.4))的版本来进行分析。

### MyBatis的框架设计

这个框架设计图来源于https://blog.csdn.net/luanlouis/article/details/40422941这个博客。

![](https://img-blog.csdn.net/20141028232313593?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbHVhbmxvdWlz/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)
