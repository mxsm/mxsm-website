---
title: 常用的JDK工具命令
categories:
  - Java
  - JSE
  - JDK自带工具
tags:
  - Java
  - JSE
  - JDK自带工具
abbrlink: '3618693'
date: 2019-08-02 06:51:15
---
### JDK常用的工具--JDK8

| 工具名称  | 用途                        |
| --------- | --------------------------- |
| jps       | 列出已装载的JVM --- 常用    |
| jstack    | 打印线程堆栈信息 -- 常用    |
| jstat     | JVM监控统计信息 -- 常用     |
| jmap      | 打印JVM堆内对象情况 -- 常用 |
| jinfo     | 输出JVM配置信息-- 常用      |
| jconsole  | GUI监控工具                 |
| jvisualvm | GUI监控工具                 |
| jhat      | 堆离线分析工具              |
| jdb       | java进程调试工具            |
| jstatd    | 远程JVM监控统计信息         |

### jps命令

下面是我在自己Linux服务器上运行的(服务器上面跑了一个Tomcat)

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jps
25057 Bootstrap
25116 Jps
```

### jstack命令

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jstack --help
Usage:
    jstack [-l] <pid>
        (to connect to running process)
    jstack -F [-m] [-l] <pid>
        (to connect to a hung process)
    jstack [-m] [-l] <executable> <core>
        (to connect to a core file)
    jstack [-m] [-l] [server_id@]<remote server IP or hostname>
        (to connect to a remote debug server)

Options:
    -F  to force a thread dump. Use when jstack <pid> does not respond (process is hung)
    -m  to print both java and native frames (mixed mode)
    -l  long listing. Prints additional information about locks
    -h or -help to print this help message
```

上面是使用的说明，下面来看一下实际的使用的打印情况

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jstack -l 25057
2019-03-17 10:25:00
Full thread dump Java HotSpot(TM) 64-Bit Server VM (25.131-b11 mixed mode):

"Attach Listener" #44 daemon prio=9 os_prio=0 tid=0x00007f3738001800 nid=0x6253 waiting on condition [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

   Locked ownable synchronizers:
	- None

"ajp-nio-8009-Acceptor-0" #42 daemon prio=5 os_prio=0 tid=0x00007f376c6ff800 nid=0x620e runnable [0x00007f373c4bf000]
   java.lang.Thread.State: RUNNABLE
	at sun.nio.ch.ServerSocketChannelImpl.accept0(Native Method)
	at sun.nio.ch.ServerSocketChannelImpl.accept(ServerSocketChannelImpl.java:422)
	at sun.nio.ch.ServerSocketChannelImpl.accept(ServerSocketChannelImpl.java:250)
	- locked <0x00000000c5a99fc8> (a java.lang.Object)
	at org.apache.tomcat.util.net.NioEndpoint.serverSocketAccept(NioEndpoint.java:448)
	at org.apache.tomcat.util.net.NioEndpoint.serverSocketAccept(NioEndpoint.java:70)
	at org.apache.tomcat.util.net.Acceptor.run(Acceptor.java:95)
	at java.lang.Thread.run(Thread.java:748)

   Locked ownable synchronizers:
	- None

"ajp-nio-8009-ClientPoller-1" #41 daemon prio=5 os_prio=0 tid=0x00007f376c6fd800 nid=0x620d runnable [0x00007f373c5c0000]
   java.lang.Thread.State: RUNNABLE
	at sun.nio.ch.EPollArrayWrapper.epollWait(Native Method)
	at sun.nio.ch.EPollArrayWrapper.poll(EPollArrayWrapper.java:269)
	at sun.nio.ch.EPollSelectorImpl.doSelect(EPollSelectorImpl.java:93)
	at sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)
	- locked <0x00000000f4475350> (a sun.nio.ch.Util$3)
	- locked <0x00000000f4475340> (a java.util.Collections$UnmodifiableSet)
	- locked <0x00000000f4475208> (a sun.nio.ch.EPollSelectorImpl)
	at sun.nio.ch.SelectorImpl.select(SelectorImpl.java:97)
	at org.apache.tomcat.util.net.NioEndpoint$Poller.run(NioEndpoint.java:743)
	at java.lang.Thread.run(Thread.java:748)

   Locked ownable synchronizers:
	- None
```

```
jstack 可以用来定位死锁、死循环、线程阻塞等问题
```

### jstat命令

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jstat -help
Usage: jstat -help|-options
       jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]

Definitions:
  <option>      An option reported by the -options option
  <vmid>        Virtual Machine Identifier. A vmid takes the following form:
                     <lvmid>[@<hostname>[:<port>]]
                Where <lvmid> is the local vm identifier for the target
                Java virtual machine, typically a process id; <hostname> is
                the name of the host running the target Java virtual machine;
                and <port> is the port number for the rmiregistry on the
                target host. See the jvmstat documentation for a more complete
                description of the Virtual Machine Identifier.
  <lines>       Number of samples between header lines.
  <interval>    Sampling interval. The following forms are allowed:
                    <n>["ms"|"s"]
                Where <n> is an integer and the suffix specifies the units as
                milliseconds("ms") or seconds("s"). The default units are "ms".
  <count>       Number of samples to take before terminating.
  -J<flag>      Pass <flag> directly to the runtime system.
```

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jstat -options
-class
-compiler
-gc
-gccapacity
-gccause
-gcmetacapacity
-gcnew
-gcnewcapacity
-gcold
-gcoldcapacity
-gcutil
-printcompilation
```

使用例子：

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jstat -gc 25057
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT
9216.0 9216.0 1248.1  0.0   121856.0 79308.8   40960.0    15612.7   18560.0 18067.8 2176.0 1998.5      8    0.089   0      0.000    0.089
```

### jmap命令

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jmap
Usage:
    jmap [option] <pid>
        (to connect to running process)
    jmap [option] <executable <core>
        (to connect to a core file)
    jmap [option] [server_id@]<remote server IP or hostname>
        (to connect to remote debug server)

where <option> is one of:
    <none>               to print same info as Solaris pmap
    -heap                to print java heap summary
    -histo[:live]        to print histogram of java object heap; if the "live"
                         suboption is specified, only count live objects
    -clstats             to print class loader statistics
    -finalizerinfo       to print information on objects awaiting finalization
    -dump:<dump-options> to dump java heap in hprof binary format
                         dump-options:
                           live         dump only live objects; if not specified,
                                        all objects in the heap are dumped.
                           format=b     binary format
                           file=<file>  dump heap to <file>
                         Example: jmap -dump:live,format=b,file=heap.bin <pid>
    -F                   force. Use with -dump:<dump-options> <pid> or -histo
                         to force a heap dump or histogram when <pid> does not
                         respond. The "live" suboption is not supported
                         in this mode.
    -h | -help           to print this help message
    -J<flag>             to pass <flag> directly to the runtime system
```

看一下使用

```bash
[root@iZwz9jcjzd6wfh44nnnsv4Z ~]# jmap -heap 25057
Attaching to process ID 25057, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.131-b11

using thread-local object allocation.
Parallel GC with 2 thread(s)

Heap Configuration:
   MinHeapFreeRatio         = 0
   MaxHeapFreeRatio         = 100
   MaxHeapSize              = 994050048 (948.0MB)
   NewSize                  = 20971520 (20.0MB)
   MaxNewSize               = 331350016 (316.0MB)
   OldSize                  = 41943040 (40.0MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 0 (0.0MB)

Heap Usage:
PS Young Generation
Eden Space:
   capacity = 124780544 (119.0MB)
   used     = 84413336 (80.5028305053711MB)
   free     = 40367208 (38.497169494628906MB)
   67.64943739947151% used
From Space:
   capacity = 9437184 (9.0MB)
   used     = 1278016 (1.21881103515625MB)
   free     = 8159168 (7.78118896484375MB)
   13.542344835069445% used
To Space:
   capacity = 9437184 (9.0MB)
   used     = 0 (0.0MB)
   free     = 9437184 (9.0MB)
   0.0% used
PS Old Generation
   capacity = 41943040 (40.0MB)
   used     = 15987400 (15.246772766113281MB)
   free     = 25955640 (24.75322723388672MB)
   38.1169319152832% used

12505 interned Strings occupying 1754736 bytes.
```

