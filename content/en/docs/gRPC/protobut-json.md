---
title: "Protobuf与JSON的优劣-用数据说话"
linkTitle: "Protobuf与JSON的优劣-用数据说话"
date: 2022-01-25
weight: 202201252255
---



JSON因为其轻量和易阅读，对开发者友好逐步替代了XML,所以现在大多数的前后端交互都是使用的JSON，但是由于容器化、K8s的崛起。有Google设计的Protobuf作为一种跨平台的序列化结构化数据的协议慢慢的开始了展露头角。同时gRPC在对Protobuf的应用也让Protobuf快速崛起。国内很多的开源的项目如：Nacos、Dubbo3、RocketMQ5 都已gRPC作为基础。那么Protobuf既然好处这么多我们平时的开发中为什么还是用JSON比较多。从以下几个方面分析：

![Protobuf和JSON比较](E:\download\Protobuf和JSON比较.png)

- **序列化和反序列化的时间**
- **相同结构化的数据反序列化内存占用**
- **对开发者的友好程度**

### 1. 序列化和反序列化的时间

定一个简单User数据结构,首先是Protobuf的定义

```java
syntax = "proto3";

option java_multiple_files = true;
option java_package = "com.github.mxsm.grpc.login";

message UserProto{

  string name = 1;

  int32 age = 2;

  string address = 3;

  string email = 4;

  string phone = 5;
}
```

Java类的定义

```java
public class UserJson {

    private String name;

    private int age;

    private String address;

    private String email;

    private String phone;
	//省略了get set方法

}
```

编写序列化的测试程序

```java
@BenchmarkMode(Mode.AverageTime)
@Warmup(iterations = 2, time = 5)
@Measurement(iterations = 3, time = 5)
@Threads(1)
@Fork(1)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
public class ProtobufJsonTest {


    @Param({"100000","1000000"})
    private int counter;

    private UserJson userJson;

    private UserProto userProto;

    private byte[] userJsonBytes;

    private byte[] userProtoBytes;

    @Setup
    public void init(){

        Faker faker = new Faker(new Locale("zh-CN"));
        String name = faker.name().fullName();
        int age = faker.number().numberBetween(1, 100);
        String address = faker.address().fullAddress();
        String email = faker.internet().emailAddress();
        String phone = faker.phoneNumber().cellPhone();

        userJson = new UserJson();
        userJson.setName(name);
        userJson.setAge(age);
        userJson.setAddress(address);
        userJson.setEmail(email);
        userJson.setPhone(phone);

        userJsonBytes = JSON.toJSONBytes(userJson);

        userProto = UserProto.newBuilder().setName(name).setAge(age).setAddress(address).setEmail(email)
            .setPhone(phone).build();

        userProtoBytes = userProto.toByteArray();
    }


    @Benchmark
    public void protobufSerializable(Blackhole blackhole) {

        byte[] bytes = null;
        int i  = 0;
        for(;i < counter;++i){
            bytes = userProto.toByteArray();
        }
        blackhole.consume(bytes);
    }

    @Benchmark
    public void jsonSerializable(Blackhole blackhole) {

        int i  = 0;
        byte[] bytes = null;
        for(;i < counter;++i){
            bytes = JSON.toJSONBytes(userJson);
        }
        blackhole.consume(bytes);
    }


    @Benchmark
    public void protobufDeserialization(Blackhole blackhole) throws InvalidProtocolBufferException {

        UserProto up = null;
        int i  = 0;
        for(;i < counter;++i){
            up = UserProto.parseFrom(userProtoBytes);
        }
        blackhole.consume(up);
    }

    @Benchmark
    public void jsonDeserialization(Blackhole blackhole) {

        int i  = 0;
        UserJson aaa = null;
        for(;i < counter;++i){
            aaa = JSON.parseObject(userJsonBytes, UserJson.class);
        }
        blackhole.consume(aaa);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder().
            include(ProtobufJsonTest.class.getSimpleName())
            .result("result.json")
            .resultFormat(ResultFormatType.JSON).build();
        new Runner(opt).run();
    }
}
```

> Tips：这里测试还是用到了JMH和Faker，JSON序列化和反序列化使用的Fastjson

代码运行结果：

![image-20220125224526677](E:\download\image-20220125224526677.png)

![protobufjson对比](E:\download\protobufjson对比.png)

从上图可以看出来**protobuf的序列化和反序列化的性能都优于JSON**（不同的JSON序列化工具可能速度不一样，但是fastjson是较快的序列化工具了）

### 2. 占用的内存

对比一下序列化生成byte数组占用的大小。测试代码：

```java
public class MemeryTest {

    public static void main(String[] args) {
        Faker faker = new Faker(new Locale("zh-CN"));
        String name = faker.name().fullName();
        int age = faker.number().numberBetween(1, 100);
        String address = faker.address().fullAddress();
        String email = faker.internet().emailAddress();
        String phone = faker.phoneNumber().cellPhone();
        System.out.println(name = " "+ age + " " + address + " "+ email+ " "+phone);
        UserJson  userJson = new UserJson();
        userJson.setName(name);
        userJson.setAge(age);
        userJson.setAddress(address);
        userJson.setEmail(email);
        userJson.setPhone(phone);

        byte[] userJsonBytes = JSON.toJSONBytes(userJson);

        UserProto userProto = UserProto.newBuilder().setName(name).setAge(age).setAddress(address).setEmail(email)
            .setPhone(phone).build();

        byte[] userProtoBytes = userProto.toByteArray();

        System.out.println("userJsonBytes="+userJsonBytes.length + ";userProtoBytes="+userProtoBytes.length);
    }
}
```

运行结果：

![image-20220125220932902](E:\download\image-20220125220932902.png)

Protobuf比JSON少了45个byte。**Protobuf比JSON序化以后占用的字节数更少，在网络传输的过程中Protobuf更具有优势。**

### 3. 对开发者的友好程度

测试代码还是使用 **MemeryTest** 的测试代码在最后加两句打印：

```java
System.out.println(new String(userJsonBytes));
System.out.println(new String(userProtoBytes));
```

运行结果：

![image-20220125221428571](E:\download\image-20220125221428571.png)

发现 JSON 开发者能够很好的识别，而Protobuf会出现乱码的情况。这里说明了一个问题：在对程序员的友好程度上JSON优于Protobuf。

另外还有一个JSON和对应的Bean之间是可以互相转换，而Protobuf需要先在 **`proto`** 文件中定义结构化的数据，然后通过编译工具转换为对应语言的数据结构，使用起来比较繁琐。

### 4. 总结

- protobuf在序列化和反序列的速度领先于JSON,而序列化以后的内存占用有少于JSON。所以总的来说protobuf由于JSON
- 由于对开发者的友好程度不如JSON，使用过程比较繁琐。这可能是JSON的普及率大于Protobuf的原因，但是在一些对于性能和传输数据有极高要求的项目Protobuf可能更加的适合，例如IM的数据交互。
- 将Protobuf和JSON相结合可能是一个不错的选择(这个没有进行测试)