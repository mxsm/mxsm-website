---
title: 线程的状态
categories:
  - Java
  - JSE
  - 并发和多线程
tags:
  - Java
  - JSE
  - 并发和多线程
abbrlink: bdf09a3
date: 2019-10-16 17:32:48
---
### 线程状态

线程状态图解如下：

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/Java%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E5%9B%BE.png)

线程有五个状态：新生状态，可运行状态，运行状态，阻塞状态，死亡状态

- **初始状态**:创建了一个对象，但是还没有调用start()方法
- **可运行(runnable)**：线程对象创建后，其他线程(比如main线程）调用了该对象的start()方法。该状态的线程位于可运行线程池中，等待被线程调度选中，获取cpu 的使用权 。
- **运行(running)**：可运行状态(runnable)的线程获得了cpu 时间片（timeslice） ，执行程序代码
- **阻塞(block)**：阻塞状态是指线程因为某种原因放弃了cpu 使用权，也即让出了cpu timeslice，暂时停止运行。直到线程进入可运行(runnable)状态，才有机会再次获得cpu timeslice 转到运行(running)状态。阻塞的情况分三种:
  1. 等待阻塞：运行(running)的线程执行o.wait()方法，JVM会把该线程放入等待队列(waitting queue)中。
  2. 同步阻塞：运行(running)的线程在获取对象的同步锁时，若该同步锁被别的线程占用，则JVM会把该线程放入锁池(lock pool)中。
  3. 其他阻塞：运行(running)的线程执行Thread.sleep(long ms)或t.join()方法，或者发出了I/O请求时，JVM会把该线程置为阻塞状态。当sleep()状态超时、join()等待线程终止或者超时、或者I/O处理完毕时，线程重新转入可运行(runnable)状态。
- **死亡(dead)**：线程run()、main() 方法执行结束，或者因异常退出了run()方法，则该线程结束生命周期。死亡的线程不可再次复生。

