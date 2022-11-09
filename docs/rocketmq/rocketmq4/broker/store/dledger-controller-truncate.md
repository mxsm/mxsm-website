---
title: "DLedger Controller模式下Broker文件截断"
linkTitle: "DLedger Controller模式下Broker文件截断"
date: 2022-08-31
weight: 202208312218
---

Broker Master和Slave的数据同步有两种模式：

- **SYNC: Master同步复制数据到Slave** 
- **ASYNC: Master异步复制数据到Slave**

这里说的数据同步是指Broker的Master数据同步到Slave的数据同步方式，也就是说Master收到Producer产生的数据