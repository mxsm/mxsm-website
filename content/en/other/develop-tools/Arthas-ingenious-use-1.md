---
title: "Arthas使用实践-方法性能调优"
linkTitle: "Arthas使用实践-方法性能调优"
date: 2022-02-04
weight: 202202041416
---

Arthas由阿里出品，是一个Java 应用诊断利器，功能很多。我们来看一下如何通过Arthas来实现方法的性能调优。

> Github地址：https://github.com/alibaba/arthas
>
> 官网地址：https://arthas.aliyun.com/zh-cn/

### 1. 前言

平时我们在开发的时候想要输出一个方法的执行时间一般都会有如下代码：

```java
public class ArthasServiceImpl {

    public void testArthas(){
        long currentTimeMillis = System.currentTimeMillis();
        doHandle1();
        System.out.println("方法doHandle1耗时："+(System.currentTimeMillis()-currentTimeMillis));
    }

    private void doHandle1(){
        StringBuilder builder = new StringBuilder();
        for(int i = 0; i < 100000; i++){
            builder.append(i);
        }
    }
}
```

增加时间输出打印。这样缺点很明显：

1. 需要增加额外的代码来打印执行的时间，上线的时候有需要把这些无用的代码去掉
2. 不同的方法需要多次编写时间打印的代码，繁琐

下面来如何利用Arthas来实现监控每个方法的代码执行时间

### 2. 环境准备

编写一个测试代码然后启动，我这里已Spring Boot的web项目为例

```java
//编写一个Controller
@RestController
@RequestMapping("/arthas")
public class ArthasController {

     @Autowired
    private ArthasServiceImpl arthasService;

    @GetMapping("")
    public long arthas(){
        arthasService.testArthas();
        return System.currentTimeMillis();
    }

}

//编写一个服务
@Service
@Service
public class ArthasServiceImpl {

    public void testArthas(){
        doHandle1();
    }

    private void doHandle1(){
        StringBuilder builder = new StringBuilder();
        for(int i = 0; i < 1000000; i++){
            builder.append(i);
        }
    }
}

```

然后启动服务

![arthas测试程序启动验证](https://raw.githubusercontent.com/mxsm/picture/main/others/developtools/arthas%E6%B5%8B%E8%AF%95%E7%A8%8B%E5%BA%8F%E5%90%AF%E5%8A%A8%E9%AA%8C%E8%AF%81.gif)

### 3. 启动Arthas

Linux启动方式：

```shell
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar
```

Windows启动方式：

从Github Releases页下载

https://github.com/alibaba/arthas/releases

在解压后，在文件夹里有`arthas-boot.jar`，直接用`java -jar`的方式启动：

```shell
java -jar arthas-boot.jar
```

启动如下图：

![arthas启动](https://raw.githubusercontent.com/mxsm/picture/main/others/developtools/arthas%E5%90%AF%E5%8A%A8.gif)

### 4. 如何监控方法的执行时间

**命令**：**`trace`**

详细的使用方式可以使用 **`trace --help`** 来获取

例如我需要看一下 **com.github.mxsm.controllerArthasController#arthas** 方法的执行调用链：

```shell
trace com.github.mxsm.controller.ArthasController arthas
或者
trace com.github.mxsm.controller.* *
```

![arthas-trace命令](https://raw.githubusercontent.com/mxsm/picture/main/others/developtools/arthas-trace%E5%91%BD%E4%BB%A4.gif)

通过命令就可以监控到了方法花了多少时间。如果一个方法中调用了多个方法这样就可以对比每一个方法的占用时间。找出占用时间最长的方法。然后对方法进行优化。

> Tips: 如果耗时很长的方法中还调用多个方法，只需要监控对应的方法逐个进行分析即可。

### 5. 总结

使用Arthas的trace命令的好处：

- 可以直接在线上进行方法耗时的测试无需要发版
- 能够灵活的观察需要观察的方法，而无效进行编码



> 文章对你有帮助可以点个赞关注我，你的点赞、关注是我前进的动力，文章有不正确的地方请您斧正留言评论~谢谢！