---
title: "Docker常见的命令"
linkTitle: "Docker常见的命令"
date: 2021-08-22
weight: 202108221520
---

### 1. 镜像搜索

```shell
docker search --help

Usage:  docker search [OPTIONS] TERM

Search the Docker Hub for images

Options:
  -f, --filter filter   Filter output based on conditions provided
      --format string   Pretty-print search using a Go template
      --limit int       Max number of search results (default 25)
      --no-trunc        Don't truncate output
```

例子:

```shell
docker search mysql
```

### 2. 查看镜像

```shell
docker images
```

### 3. 查看运行的镜像

```java
docker ps
```

### 4. 查看容器的信息

```shell
[root@192 ~]# docker inspect --help

Usage:  docker inspect [OPTIONS] NAME|ID [NAME|ID...]

Return low-level information on Docker objects

Options:
  -f, --format string   Format the output using the given Go template
  -s, --size            Display total file sizes if the type is container
      --type string     Return JSON for specified type
```

