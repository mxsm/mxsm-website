---
title: "基于JMeter的RocketMQ压测"
linkTitle: "基于JMeter的RocketMQ压测"
weight: 202305132305
description: 基于JMeter的RocketMQ压测
---

Rocketmq是一款高性能、高可靠的分布式消息中间件，广泛应用于各种场景中。在实际应用中，为了保证Rocketmq的稳定性和可靠性，我们需要对其进行压测。而JMeter是一款常用的压测工具，可以用于测试Web应用、Web服务、数据库以及各种协议。本文将介绍如何使用JMeter进行Rocketmq压测，并通过编写插件来实现对Rocketmq生产者的压测。

## 1. 准备工作

在进行Rocketmq压测前，需要准备好以下内容：

1. 安装并启动Rocketmq服务端，可以参考官方文档进行安装配置；
2. 下载并安装JMeter，可以从官网下载最新版本；
3. 下载并安装Rocketmq JMS 客户端，可以从官网下载最新版本。

## 2. 编写JMeter插件

首先引入依赖：

```xml
<dependency>
    <groupId>org.apache.jmeter</groupId>
    <artifactId>ApacheJMeter_core</artifactId>
    <version>5.4.3</version>
</dependency>
<dependency>
    <groupId>org.apache.jmeter</groupId>
    <artifactId>ApacheJMeter_java</artifactId>
    <version>5.4.3</version>
</dependency>
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-client</artifactId>
    <version>5.1.0</version>
</dependency>
```

为了实现对Rocketmq生产者的压测，我们需要编写一个JMeter插件。下面是一个简单的示例代码：

```java
import org.apache.jmeter.config.Arguments;
import org.apache.jmeter.protocol.java.sampler.AbstractJavaSamplerClient;
import org.apache.jmeter.protocol.java.sampler.JavaSamplerContext;
import org.apache.jmeter.samplers.SampleResult;
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.common.message.Message;

public class RocketmqProducerSampler extends AbstractJavaSamplerClient {
    private DefaultMQProducer producer;
    private String serverUrl;
    private String topic;
    private String tags;
    private String keys;
    private String body;

    @Override
    public void setupTest(JavaSamplerContext context) {
        serverUrl = context.getParameter("serverUrl");
        topic = context.getParameter("topic");
        tags = context.getParameter("tags");
        keys = context.getParameter("keys");
        body = context.getParameter("body");

        producer = new DefaultMQProducer("jmeter");
        producer.setNamesrvAddr(serverUrl);
        try {
            producer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void teardownTest(JavaSamplerContext context) {
        producer.shutdown();
    }

    @Override
    public SampleResult runTest(JavaSamplerContext context) {
        SampleResult result = new SampleResult();
        try {
            Message msg = new Message(topic, tags, keys, body.getBytes());
            result.sampleStart();
            SendResult send = producer.send(msg);
            result.sampleEnd();
            result.setSuccessful(true);
            result.setResponseMessage(send.toString());
            result.setSamplerData(body);
        } catch (Exception e) {
            //e.printStackTrace();
            result.sampleEnd();
            result.setSuccessful(false);
        }

        return result;
    }

    @Override
    public Arguments getDefaultParameters() {
        Arguments params = new Arguments();
        params.addArgument("serverUrl", "localhost:9876");
        params.addArgument("topic", "test_topic");
        params.addArgument("tags", "test_tag");
        params.addArgument("keys", "test_key");
        params.addArgument("body", "test_body");
        return params;
    }
}
```

该插件是一个Rocketmq生产者的示例代码，它通过JMeter对Rocketmq进行压测。其中，setupTest()方法用于初始化Producer对象，并连接到Rocketmq服务端；runTest()方法用于发送消息；teardownTest()方法用于关闭Producer对象。另外，getDefaultParameters()方法用于设置默认参数，例如Rocketmq服务端的地址等。

## 3. 在JMeter中使用插件

完成插件的编写后，我们需要将其加入到JMeter中进行使用。下面是具体步骤：

1. 将插件的class文件和依赖的jar包放到JMeter的lib/ext目录下；

   这里有个地方需要注意将项目打成Jar包，同时需要将Jar依赖的Jar包也需要放到JMeter的lib/ext。

   ```xml
           <plugins>
   
               <plugin>
                   <groupId>org.apache.maven.plugins</groupId>
                   <artifactId>maven-assembly-plugin</artifactId>
                   <version>3.5.0</version>
                   <configuration>
                       <archive>
                           <manifest>
                               <mainClass>com.xxg.Main</mainClass>
                           </manifest>
                       </archive>
                       <descriptorRefs>
                           <descriptorRef>jar-with-dependencies</descriptorRef>
                       </descriptorRefs>
                       <finalName>${project.name}</finalName>
   
                   </configuration>
                   <executions>
                       <execution>
                           <id>make-assembly</id>
                           <phase>package</phase>
                           <goals>
                               <goal>single</goal>
                           </goals>
                       </execution>
                   </executions>
               </plugin>
   
           </plugins>
   ```

   为了将依赖和代码打成一个jar包

   ![QQ截图20230514090145](https://raw.githubusercontent.com/mxsm/picture/main/java/java-tools/QQ%E6%88%AA%E5%9B%BE20230514090145.jpg)

   ![QQ截图20230514090216](https://raw.githubusercontent.com/mxsm/picture/main/java/java-tools/QQ%E6%88%AA%E5%9B%BE20230514090216.jpg)

2. 启动JMeter，并创建一个线程组；

3. 在线程组下创建一个Java请求；

   ![image-20230514091331584](https://raw.githubusercontent.com/mxsm/picture/main/java/java-tools/image-20230514091331584.png)

4. 在Java请求中，选择刚才编写的插件类（例如com.example.RocketmqProducerSampler）；

   ![image-20230514091409198](https://raw.githubusercontent.com/mxsm/picture/main/java/java-tools/image-20230514091409198.png)

5. 在Java请求中设置插件的参数，例如Rocketmq服务端的地址等；

6. 运行JMeter即可开始压测。

   ![image-20230514091849575](https://raw.githubusercontent.com/mxsm/picture/main/java/java-tools/image-20230514091849575.png)

## 4. 注意事项

在使用JMeter进行Rocketmq压测时，需要注意以下几点：

1. 确保Rocketmq服务端已经启动，并且正确配置了Broker和NameServer；
2. 确保Rocketmq JMS 客户端已经正确安装，并且可以被JMeter正常调用；
3. 在JMeter中设置好压测的参数，例如消息发送间隔、消息大小等；
4. 在运行JMeter之前，最好先进行一次简单的压测，以确保配置正确，并排除可能存在的问题。

## 5. 总结

本文介绍了如何使用JMeter对Rocketmq进行压测，并通过编写插件来实现对Rocketmq生产者的压测。在实际应用中，可以根据具体需求进行参数设置和插件编写，以满足不同的压测场景。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)~谢谢!