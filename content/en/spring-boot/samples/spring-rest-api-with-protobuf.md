---
title: "Spring Rest API数据交互除了JSON还有Protobuf"
linkTitle: "Spring Rest API数据交互除了JSON还有Protobuf"
date: 2022-01-28
weight: 202201281440
---

平时Spring web开发的时候使用的都是JSON作为数据交互，今天我们来学习一点不一样的，使用Protobuf来作为数据交互，同时来比较一下JSON作为数据交互和Protobuf作为数据交互的快慢以及优缺点。

![Spring Rest API使用Protobuf](https://raw.githubusercontent.com/mxsm/picture/main/java/jvm/Spring%20Rest%20API%E4%BD%BF%E7%94%A8Protobuf.png)

**使用前准备**：

1. **新建一个maven Spring Boot项目(版本2.6.3)**

2. **pom.xml配置文件增加Protobuf编译配置插件，以及Protobuf相关maven依赖**

   ```xml
   <dependencies>
       <dependency>
         <groupId>com.google.protobuf</groupId>
         <artifactId>protobuf-java</artifactId>
         <version>3.19.2</version>
       </dependency>
   </dependencies>
   
   <plugins>
         <plugin>
           <groupId>org.xolstice.maven.plugins</groupId>
           <artifactId>protobuf-maven-plugin</artifactId>
           <version>0.6.1</version>
           <configuration>
             <protoSourceRoot>${basedir}/src/main/resources</protoSourceRoot>
             <protocArtifact>com.google.protobuf:protoc:3.19.1:exe:${os.detected.classifier}</protocArtifact>
             <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.43.1:exe:${os.detected.classifier}</pluginArtifact>
             <outputDirectory>src/main/java</outputDirectory>
             <clearOutputDirectory>false</clearOutputDirectory>
             <pluginId>grpc-java</pluginId>
           </configuration>
           <executions>
             <execution>
               <goals>
                 <goal>compile</goal>
                 <goal>compile-custom</goal>
               </goals>
             </execution>
           </executions>
         </plugin>
         <plugin>
           <groupId>org.springframework.boot</groupId>
           <artifactId>spring-boot-maven-plugin</artifactId>
         </plugin>
       </plugins>
     </build>
   ```

   ### 1. Spring 接入Protobuf

   原理和JSON的原理一样：通过消息转换器将服务器的返回数据转换成对应的格式。

   > Protobuf的使用详情参考官网：https://developers.google.com/protocol-buffers

   #### 1.1 定义proto文件

   proto文件是用来定义Java类似的Bean。下面就定义一个mxsm.proto文件

   ```java
   syntax = "proto3";
   package mxsm;
   option java_package = "com.github.mxsm.springboot.protobuf";
   option java_outer_classname = "ProtobufMessage";
   
   message Course {
       int32 id = 1;
       string course_name = 2;
       repeated Student student = 3;
   }
   message Student {
       int32 id = 1;
       string first_name = 2;
       string last_name = 3;
       string email = 4;
       repeated PhoneNumber phone = 5;
       message PhoneNumber {
           string number = 1;
           PhoneType type = 2;
       }
       enum PhoneType {
           MOBILE = 0;
           LANDLINE = 1;
       }
   }
   ```

   #### 1.2 将proto文件编译为Java类

   通过前面配置的Protobuf maven编译成Java Bean.

   ![protobuf编译成javabean](C:\Users\mxsm\Desktop\pic\protobuf编译成javabean.gif)

通过这样就编译完成了，生成了 **`ProtobufMessage`** 类

#### 1.3 配置Spring消息转换器

```java
@Configuration
public class Config {
    @Bean
    public ProtobufHttpMessageConverter protobufHttpMessageConverter() {
        return new ProtobufHttpMessageConverter();
    }
}
```

**`ProtobufHttpMessageConverter`**  Spring提供了支持。

到这里就完成了整个的配置过程：

![Spring集成protobuf步骤](E:\download\Spring集成protobuf步骤.png)

#### 1.4 测试Protobuf

```java
@SpringBootTest(classes = SpringProtobufBootstrap.class)
public class ApplicationTest {
    // Other declarations
    private static final String COURSE1_URL = "http://localhost:8080/courses/2";


    private RestTemplate restTemplate = new RestTemplate();

    @Test
    public void whenUsingRestTemplate_thenSucceed() {
        List<HttpMessageConverter<?>> list = new ArrayList<>();
        list.add(new ProtobufHttpMessageConverter());
        restTemplate.setMessageConverters(list);
        ResponseEntity<Course> course = restTemplate.getForEntity(COURSE1_URL, Course.class);
        System.out.println(course.toString());
    }
}
```

测试结果：

![image-20220128175416020](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220128175416020.png)

### 2. Spring JSON和Protobuf性能比较

接口的测试工具用的Apache JMeter.

首先编写测试接口

```java
@RestController
public class JsonProtobufController {

    @RequestMapping("/student/{id}")
    Student protobuf(@PathVariable Integer id) {
        return Student.newBuilder().setId(id).setFirstName("maxsm").setLastName("sdfsdfsdfsdfsdfsdsdfsdfsdfsdfsdfsdfsdfsdf")
            .setEmail("1224sdfsfsdf344552@163.com").addPhone(Student.PhoneNumber.newBuilder().setNumber("12345sdfsdfsd6566666").setType(
                Student.PhoneType.MOBILE).build()).build();
    }


    @RequestMapping("/studentjson/{id}")
    StudentJson json(@PathVariable Integer id) {

        StudentJson json = new StudentJson();
        json.setId(id);
        json.setFirstName("maxsm");
        json.setLastName("sdfsdfsdfsdfsdfsd");
        json.setEmail("1224344552@163.com");
        json.setPhoneNumber(new PhoneNumber("123456566666",PhoneType.MOBILE));

        return json;
    }
}
```

JSON的测试结果：

![image-20220128214351616](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220128214351616.png)

Protobuf测试结果：

![image-20220128220255988](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220128220255988.png)

对比两者的性能测试结果Protobuf优于JSON。 这个之前文章《[Protobuf与JSON的优劣-用数据说话](https://juejin.cn/post/7057156703904596004)》中的JSON与Protobuf的性能对比一致。

### 3. JSON和Protobuf的优缺点

- JSON有点在于对开发者友好，而Protobuf的有点在于序列化的时间以及相同的数据JSON的空间比Protobuf大。这就导致Protobuf在网络传输更加具有优势
- Protobuf的劣势在于，需要定义一个proto文件，在接收方和发送方都需要同样的一个proto文件然后编译成为对应的平台数据结构。增加了开发的复杂度。同时也增加上手的难度。

对于两者的优缺点能不能尝试把JSON的有点和Protobuf的有点结合起来，取一个折中的办法。取JSON的对开发者的友好和Protobuf的序列化占用空间小的特点。

