---
title: '虚拟机VMware的Linux系统挂起后 docker中的mysql容器无法访问'
date: 2021-08-28
weigth: 202108281026
---

### 1. 问题描述

vm虚拟机挂起再开启后，宿住机便无法访问虚拟机中的docker容器， 但是宿主机是可以ping通linux虚拟机的。 搞得每次都得重启虚拟机

### 2. 解决方式

```shell
vim /usr/lib/sysctl.d/00-system.conf 
```

