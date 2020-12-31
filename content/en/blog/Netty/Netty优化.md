---
title: Netty优化
categories:
  - Netty
tags:
  - Netty
abbrlink: 25b752cd
date: 2018-09-07 22:18:31
---
### backlog的设置

socket接收的所有连接都是存放在队列类型的数据结构中。其中的长度可以进行设置分别是下面的两个内核参数

- /proc/sys/net/ipv4/tcp_max_syn_backlog

  指定所能接受SYN同步包的最大客户端数量，即半连接上限。

- /proc/sys/net/core/somaxconn

  指服务端所能accept即处理数据的最大客户端数量，即完成连接上限

CentOS7 tcp_max_syn_backlog默认值8192， somaxconn 默认值1024

Netty backlog 设置的就是最大的连接数。内核会根据传入的backlog参数与系统参数somaxconn，取二者的较小值。

注意：

```
tcp_max_syn_backlog >= somaxconn
```

