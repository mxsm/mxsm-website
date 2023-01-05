---
title: "Dockfile"
linkTitle: "Dockfile"
date: 2021-11-21
weight: 202111212107
---

### 1. 什么是Dockerfile

Docker 通过从一个Dockerfile包含所有命令的文本文件中读取指令来自动构建镜像，该 文件按顺序包含构建给定镜像所需的所有命令

```dockerfile
# syntax=docker/dockerfile:1
FROM ubuntu:18.04
COPY ../../.. /app
RUN make /app
CMD python /app/app.py
```
每条指令创建一层：

- `FROM`从`ubuntu:18.04`Docker 镜像创建一个层。
- `COPY` 从 Docker 客户端的当前目录添加文件。
- `RUN`使用`make`.
- `CMD` 指定要在容器内运行的命令。

当你运行一个镜像并生成一个容器时，你会 在底层的顶部添加一个新的*可写层*（“容器层”）。对正在运行的容器所做的所有更改，例如写入新文件、修改现有文件和删除文件，都将写入此可写容器层。

### 2. Dockerfile指令

这些建议旨在帮助您创建一个高效和可维护的Dockerfile。

#### 2.1 FROM

```dockerfile
FROM [--platform=<platform>] <image> [AS <name>]
```

```dockerfile
FROM [--platform=<platform>] <image>[:<tag>] [AS <name>]
```

```dockerfile
FROM [--platform=<platform>] <image>[@<digest>] [AS <name>]
```

> Tips:只要有可能，请使用当前的官方图像作为您的图像的基础。我们推荐Alpine映像，因为它是严格控制的，而且体积很小(目前小于6 MB)，同时仍然是一个完整的Linux发行版。

FROM指令初始化一个新的构建阶段，并为后续指令设置基本映像。因此，一个有效的Dockerfile必须以FROM指令开始。映像可以是任何有效的映像—从公共存储库中取出映像特别容易。

- **`ARG`** 是Dockerfile中唯一可能先于 **`FROM`** 的指令

  FROM指令支持由发生在第一个FROM之前的任何ARG指令声明的变量

  ```
  ARG  CODE_VERSION=latest
  FROM base:${CODE_VERSION}
  CMD  /code/run-app
  
  FROM extras:${CODE_VERSION}
  CMD  /code/run-extras
  ```

  在FROM之前声明的ARG在构建阶段之外，所以它不能在FROM之后的任何指令中使用。要使用在第一个FROM之前声明的ARG的默认值，在构建阶段使用一个没有值的ARG指令:

  ```dockerfile
  ARG VERSION=latest
  FROM busybox:$VERSION
  ARG VERSION
  RUN echo $VERSION > image_version
  ```

- FROM可以在一个Dockerfile中出现多次，以创建多个映像或使用一个构建阶段作为另一个构建阶段的依赖项。只需在每个新的FROM指令之前记录提交的最后一个镜像ID输出。每个FROM指令清除前面指令创建的任何状态。

- 可以通过在FROM指令中添加AS名称来为新的构建阶段指定一个名称。这个名称可以用于后面的FROM和COPY。参考在此阶段构建的映像的说明

- tag或digest值是可选的。如果省略其中任何一个，构造器默认采用最新的标记。如果不能找到标记值，构造器将返回一个错误。

- 可选的——platform标志可用于在FROM引用多平台图像的情况下指定图像的平台。例如:linux/amd64、linux/arm64或windows/amd64。默认情况下，将使用构建请求的目标平台。全局构建参数可以在这个标志的值中使用，例如，自动平台arg允许你强制一个阶段本地构建平台(——platform=$BUILDPLATFORM)，并使用它在阶段内部交叉编译到目标平台。

#### 2.2 RUN

- **`RUN <command>`** (Shell形式，命令在Shell中运行，默认情况下是 **`/bin/sh -c`** 在Linux上面或者 **`cmd /S /C`** 在windows上面)
- **`RUN ["executable", "param1", "param2"]`**

RUN指令将在当前镜像上方的新层中执行任何命令，并提交结果。生成的提交映像将用于Dockerfile中的下一步。

分层RUN指令和生成提交符合Docker的核心概念，其中提交很便宜，容器可以从映像历史的任何点创建，就像源代码控制一样。

exec表单可以避免shell字符串被修改，并且可以使用不包含指定shell可执行文件的基本映像来运行命令。

shell表单的默认shell可以使用shell命令更改。

在shell形式中，您可以使用 \ (反斜杠)来将单个RUN指令继续到下一行。例如，考虑这两行:

```dockerfile
RUN /bin/bash -c 'source $HOME/.bashrc; \
echo $HOME'
```

它们合在一起相当于这一行:

```dockerfile
RUN /bin/bash -c 'source $HOME/.bashrc; echo $HOME'
```

要使用不同的shell，而不是' /bin/sh '，请使用exec表单传入所需的shell。例如:

```dockerfile
RUN ["/bin/bash", "-c", "echo hello"]
```

#### 2.4 LABEL

```dockerfile
LABEL <key>=<value> <key>=<value> <key>=<value> ...
```

LABEL指令向镜像添加元数据。 LABEL是一个键值对。 要在LABEL值中包含空格，请像在命令行解析中那样使用引号和反斜杠。 一些用法示例:  

```dockerfile
LABEL "com.example.vendor"="ACME Incorporated"
LABEL com.example.label-with-value="foo"
LABEL version="1.0"
LABEL description="This text illustrates \
that label-values can span multiple lines."

LABEL multi.label1="value1" multi.label2="value2" other="value3"

LABEL multi.label1="value1" \
      multi.label2="value2" \
      other="value3"
```

基映像或父映像(FROM行中的映像)中包含的标签由映像继承。 如果标签已经存在，但有不同的值，则最近应用的值将覆盖以前设置的值。  

要查看图像的标签，使用docker image inspect命令。 您可以使用——format选项只显示标签;  

```json
{
  "com.example.vendor": "ACME Incorporated",
  "com.example.label-with-value": "foo",
  "version": "1.0",
  "description": "This text illustrates that label-values can span multiple lines.",
  "multi.label1": "value1",
  "multi.label2": "value2",
  "other": "value3"
}
```

#### 2.5 EXPOSE

```dockerfile
EXPOSE <port> [<port>/<protocol>...]
```

EXPOSE指令通知Docker容器在运行时侦听指定的网络端口。 可以指定端口监听的是TCP还是UDP，如果没有指定协议，默认为TCP。  

EXPOSE指令实际上并不发布端口。 它可以作为构建映像的人和运行容器的人之间的一种文档，说明要发布哪些端口。 要在运行容器时实际发布端口，可以在docker run上使用-p标志来发布和映射一个或多个端口，或者使用-p标志发布所有暴露的端口并将它们映射到高阶端口。  缺省情况下，EXPOSE采用TCP协议。 你也可以指定UDP:选项只显示标签;  

```dockerfile
EXPOSE 80/udp
EXPOSE 80/tcp
```

在这种情况下，如果您在运行docker时使用-P，则端口将分别对TCP和UDP公开一次。请记住，-P在主机上使用一个临时的高顺序主机端口，因此TCP和UDP的端口不相同。无论EXPOSE设置如何，您都可以在运行时使用-p标志覆盖它们。例如

```shell
 docker run -p 80:80/tcp -p 80:80/udp ...
```

#### 2.6 ENV

```dockerfile
ENV <key>=<value> ...
```

ENV指令设置环境变量key value;。该值将在构建阶段的所有后续指令的环境中，并且可以在许多指令中内联替换。该值将被解释为其他环境变量，因此如果引号字符没有转义，它们将被删除。像命令行解析一样，引号和反斜杠可以用于在值中包含空格。

```dockerfile
ENV MY_NAME="John Doe"
ENV MY_DOG=Rex\ The\ Dog
ENV MY_CAT=fluffy
```

ENV可以在Dockerfile中使用多次

当镜像运行容器时，使用ENV设置的环境变量将持续存在。您可以使用docker inspect查看值，并使用docker run --env \<key\>=\<value\>

> ENV指令还允许使用另一种语法
>
> ```
> ENV MY_VAR my-value
> ```
>
> 他的语法不允许在一条ENV指令中设置多个环境变量，这可能会令人困惑。例如，下面设置了一个环境变量(ONE)，其值为“TWO= THREE=world”:
>
> ```
> ENV ONE TWO= THREE=world
> 
> ```

#### 2.7 ADD

```shell
ADD [--chown=<user>:<group>] <src>... <dest>    1
ADD [--chown=<user>:<group>] ["<src>",... "<dest>"]   2
```

对于包含空格的路径，使用第二种形式

> Note: --chown特性只支持用于构建Linux容器的Dockerfiles，而不适用于Windows容器。由于用户和组所有权的概念不能在Linux和Windows之间转换，使用/etc/passwd和/etc/group将用户和组名转换为id，限制了该特性只能在基于Linux操作系统的容器中有效。

#### 2.8 COPY

```dockerfile
COPY [--chown=<user>:<group>] <src>... <dest>
COPY [--chown=<user>:<group>] ["<src>",... "<dest>"]
```

> Note:
>
> --chown特性只支持用于构建Linux容器的Dockerfiles，而不适用于Windows容器。由于用户和组所有权的概念不能在Linux和Windows之间转换，使用/etc/passwd和/etc/group将用户和组名转换为id，限制了该特性只能在基于Linux操作系统的容器中有效。

#### 2.9 ENTRYPOINT

两种格式：

```shell
ENTRYPOINT ["executable", "param1", "param2"]

ENTRYPOINT command param1 param2
```

#### 2.10 VOLUME

```dockerfile
VOLUME ["/data"]
```

VOLUME指令使用指定的名称创建一个挂载点，并将其标记为保存来自本机主机或其他容器的外部挂载卷。可以是JSON数组，VOLUME ["/var/log/"]，也可以是带多个参数的纯字符串，如VOLUME /var/log或VOLUME /var/log/ var/db

#### 2.11 USER

```dockerfile
USER <user>[:<group>]

USER <UID>[:<GID>]
```

#### 2.12 WORKDIR

```dockerfile
WORKDIR /path/to/workdir
```

WORKDIR指令为Dockerfile中跟随它的任何RUN、CMD、ENTRYPOINT、COPY和ADD指令设置工作目录。如果WORKDIR不存在，它将被创建，即使它没有在任何后续Dockerfile指令中使用。

WORKDIR指令可以在Dockerfile中多次使用。如果提供了一个相对路径，它将相对于前一个WORKDIR指令的路径。例如:

```dockerfile
WORKDIR /a
WORKDIR b
WORKDIR c
RUN pwd
```

pwd显示的值是： **`/a/b/c`** 

#### 2.13 ARG

```dockerfile
ARG <name>[=<default value>]
```

ARG定义了一个变量，配合**`docker build --build-arg <varname>=<varvalue>`** 

#### 2.14 ONBUILD

```dockerfile
ONBUILD <INSTRUCTION>
```

#### 2.15 STOPSIGNAL

```dockerfile
STOPSIGNAL signal
```

#### 2.16 HEALTHCHECK

格式：

- `HEALTHCHECK [选项] CMD <命令>`：设置检查容器健康状况的命令
- `HEALTHCHECK NONE`：如果基础镜像有健康检查指令，使用这行可以屏蔽掉其健康检查指令

`HEALTHCHECK` 指令是告诉 Docker 应该如何进行判断容器的状态是否正常，这是 Docker 1.12 引入的新指令。

在没有 `HEALTHCHECK` 指令前，Docker 引擎只可以通过容器内主进程是否退出来判断容器是否状态异常。很多情况下这没问题，但是如果程序进入死锁状态，或者死循环状态，应用进程并不退出，但是该容器已经无法提供服务了。在 1.12 以前，Docker 不会检测到容器的这种状态，从而不会重新调度，导致可能会有部分容器已经无法提供服务了却还在接受用户请求。

而自 1.12 之后，Docker 提供了 `HEALTHCHECK` 指令，通过该指令指定一行命令，用这行命令来判断容器主进程的服务状态是否还正常，从而比较真实的反应容器实际状态。

当在一个镜像指定了 `HEALTHCHECK` 指令后，用其启动容器，初始状态会为 `starting`，在 `HEALTHCHECK` 指令检查成功后变为 `healthy`，如果连续一定次数失败，则会变为 `unhealthy`。

`HEALTHCHECK` 支持下列选项：

- `--interval=<间隔>`：两次健康检查的间隔，默认为 30 秒；
- `--timeout=<时长>`：健康检查命令运行超时时间，如果超过这个时间，本次健康检查就被视为失败，默认 30 秒；
- `--retries=<次数>`：当连续失败指定次数后，则将容器状态视为 `unhealthy`，默认 3 次。

和 `CMD`, `ENTRYPOINT` 一样，`HEALTHCHECK` 只可以出现一次，如果写了多个，只有最后一个生效。

在 `HEALTHCHECK [选项] CMD` 后面的命令，格式和 `ENTRYPOINT` 一样，分为 `shell` 格式，和 `exec` 格式。命令的返回值决定了该次健康检查的成功与否：`0`：成功；`1`：失败；`2`：保留，不要使用这个值。

#### 2.17 SHELL

```dockerfile
SHELL ["executable", "parameters"]
```

参考文档：

- https://docs.docker.com/engine/reference/builder/