---
title: Redis持久化
categories:
  - 缓存技术
  - Redis
tags:
  - 缓存技术
  - Redis
abbrlink: 119ed1dc
date: 2019-10-17 03:49:04
---
### RDB 持久化 --Redis默认

在指定的时间间隔能对你的数据进行快照存储。**RDB**是默认的持久方式

- **RDB持久化的步骤**

  - **Redis**主进程会fork一个子进程出来。
  - 由子进程将内存中的所有数据写入到一个临时的 **RDB** 文件中。
  - 完成写入操作后，旧的会被新的RDB文件替换。

  Copy-On-Write的模型

- **优点：**

  - RDB是一个非常紧凑的文件，适合灾难恢复。
  - RDB在保存RDB文件时父进程唯一需要做的就是fork出一个子进程,接下来的工作全部由子进程来做，父进程不需要再做其他IO操作，所以RDB持久化方式可以最大化redis的性能.
  - 与AOF相比,在恢复大的数据集的时候，RDB方式会更快一些.

- **缺点：**

  - 在 Linux 系统中，fork 会拷贝进程的 page table。随着进程占用的内存越大，进程的 page table 也会越大，那么 fork 也会占用更多的时间。 如果 Redis 占用的内存很大 (例如 20 GB)，那么在 fork 子进程时，会出现明显的停顿现象（无法处理 client 的请求）。另外，在不同机器上，fork 的性能是不同的，可以参见 [Fork time in different systems](https://redis.io/topics/latency#fork-time-in-different-systems)。
  - Linux fork 子进程采用的是 copy-on-write 的方式。在 Redis 执行 RDB 持久化期间，如果 client 写入数据很频繁，那么将增加 Redis 占用的内存，最坏情况下，内存的占用将达到原先的两倍。
  - 如果业务场景很看重数据的持久性 (durability)，那么不应该采用 RDB 持久化。



### AOF 持久化

可以使用`appendonly yes`配置项来开启 AOF 持久化。Redis 执行 AOF 持久化时，会将接收到的写命令追加到 AOF 文件的末尾，因此 Redis 只要对 AOF 文件中的命令进行回放，就可以将数据库还原到原先的状态。
　　与 RDB 持久化相比，AOF 持久化的一个明显优势就是，它可以提高数据的持久性 (durability)。因为在 AOF 模式下，Redis 每次接收到 client 的写命令，就会将命令`write()`到 AOF 文件末尾。
　　然而，在 Linux 中，将数据`write()`到文件后，数据并不会立即刷新到磁盘，而会先暂存在 OS 的文件系统缓冲区。在合适的时机，OS 才会将缓冲区的数据刷新到磁盘（如果需要将文件内容刷新到磁盘，可以调用`fsync()`或`fdatasync()`）。
　　通过`appendfsync`配置项，可以控制 Redis 将命令同步到磁盘的频率：

- `always`：每次 Redis 将命令`write()`到 AOF 文件时，都会调用`fsync()`，将命令刷新到磁盘。这可以保证最好的数据持久性，但却会给系统带来极大的开销。
- `no`：Redis 只将命令`write()`到 AOF 文件。这会让 OS 决定何时将命令刷新到磁盘。
- `everysec`：除了将命令`write()`到 AOF 文件，Redis 还会每秒执行一次`fsync()`。在实践中，推荐使用这种设置，一定程度上可以保证数据持久性，又不会明显降低 Redis 性能。

　　然而，AOF 持久化并不是没有缺点的：Redis 会不断将接收到的写命令追加到 AOF 文件中，导致 AOF 文件越来越大。过大的 AOF 文件会消耗磁盘空间，并且导致 Redis 重启时更加缓慢。为了解决这个问题，在适当情况下，Redis 会对 AOF 文件进行重写，去除文件中冗余的命令，以减小 AOF 文件的体积。在重写 AOF 文件期间， Redis 会启动一个子进程，由子进程负责对 AOF 文件进行重写。
　　可以通过下面两个配置项，控制 Redis 重写 AOF 文件的频率：

- `auto-aof-rewrite-min-size 64mb`
- `auto-aof-rewrite-percentage 100`

　　上面两个配置的作用：当 AOF 文件的体积大于 64MB，并且 AOF 文件的体积比上一次重写之后的体积大了至少一倍，那么 Redis 就会执行 AOF 重写。

### 持久化选择

- 如果数据库的数据没有什么重要的就不需要持久化
- 如果能容忍一定程度的丢失就用RDB的持久化模式
- 如果不能容忍丢失就用AOF+RDB两种一起的模式