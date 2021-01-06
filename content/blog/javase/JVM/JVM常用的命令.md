---
title: JVM常用的命令
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
abbrlink: 9242f220
date: 2018-09-29 02:30:04
---
### 查看JVM默认垃圾收集器

命令：

```
java -XX:+PrintCommandLineFlags -version
```

JDK8的打印结果：

```
$ java -XX:+PrintCommandLineFlags -version
-XX:InitialHeapSize=134177280 -XX:MaxHeapSize=2146836480 -XX:+PrintCommandLineFlags -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:-UseLargePagesIndividualAllocation -XX:+UseParallelGC
java version "1.8.0_151"
Java(TM) SE Runtime Environment (build 1.8.0_151-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.151-b12, mixed mode)

```

JDK11的打印结果：

```
$ ./java -XX:+PrintCommandLineFlags -version
-XX:G1ConcRefinementThreads=4 -XX:GCDrainStackTargetSize=64 -XX:InitialHeapSize=134177280 -XX:MaxHeapSize=2146836480 -XX:+PrintCommandLineFlags -XX:ReservedCodeCacheSize=251658240 -XX:+SegmentedCodeCache -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseG1GC -XX:-UseLargePagesIndividualAllocation
java version "11.0.2" 2019-01-15 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.2+9-LTS)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.2+9-LTS, mixed mode)

```

### JVM打印GC日志详情

命令：

```
-XX:+PrintGCDetails
```

### 查看非标准的参数命令

```
java -XX:+PrintFlagsInitial  查看-XX的
java -X 参看-X的
```

