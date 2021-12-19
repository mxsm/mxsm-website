---
title: "Java微基准测试工具-JMH"
linkTitle: "Java微基准测试工具-JMH"
date: 2021-12-19
weight: 202112192144
---



### 1. JMH介绍

**JMH** 的全名是 Java Microbenchmark Harness，它是由 **Java 虚拟机团队**开发的一款用于 Java **微基准测试工具**。说白了就是一个测试工具。用来测试接口的性能

> PS: 我第一次关注到这个是在spring-framework框架中有用到

Github地址：https://github.com/openjdk/jmh

**Java的基准测试需要注意的几点**：

- 测试预热
- 防止无效代码
- 并发测试
- 测试结果呈现

**使用JMH的典型场景：**

- 方法优化前后的对比，可以用JMH优化前后的结果进行定量分析
- 接口方法的不同实现的性能对比(序列化/反序列化的时间：fastjson和Jackson)
- 函数执行的时间和输入的值之间的关系(例如：HashMap设置初始值还是不设置初始值)

### 2. JMH概念

- **Iteration - iteration 是 JMH 进行测试的最小单位，测量迭代次数。**
- **Warmup-预热，在实际进行 benchmark 前先进行预热。因为某个函数被调用多次之后，JIT 会对其进行编译，通过预热可以使测量结果更加接近真实情况**

### 3. 快速开始

引入Maven依赖

```xml
    <dependencies>
        <dependency>
            <groupId>org.openjdk.jmh</groupId>
            <artifactId>jmh-core</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.openjdk.jmh</groupId>
            <artifactId>jmh-generator-annprocess</artifactId>
            <version>${project.version}</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
```

增加打包工具：

```xml
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-shade-plugin</artifactId>
        <version>3.2.1</version>
        <executions>
          <execution>
            <phase>package</phase>
            <goals>
              <goal>shade</goal>
            </goals>
            <configuration>
              <transformers>
                <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                  <mainClass> 这里填写Main类 </mainClass>
                </transformer>
              </transformers>
            </configuration>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
```

测试代码：

```java
@BenchmarkMode(Mode.AverageTime)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 5)
@Threads(4)
@Fork(1)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
public class MapTest {

    @Param(value = {"1022", "5121", "10241"})
    private int length;

    @Benchmark
    public void mapWithSize(Blackhole blackhole) {
        Map<Integer,Integer> map = new HashMap<>(length);
        for (int i = 0; i < length; i++) {
            map.put(i, i);
        }
        blackhole.consume(map);
    }

    @Benchmark
    public void mapWithoutSize(Blackhole blackhole) {
        Map<Integer,Integer> map = new HashMap<>();
        for (int i = 0; i < length; i++) {
            map.put(i, i);
        }
        blackhole.consume(map);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
            .include(MapTest.class.getSimpleName())
            .result("result.json")
            .resultFormat(ResultFormatType.JSON).build();
        new Runner(opt).run();
    }
}
```

执行Maven命令：

```shell
mvn clear package
jar -jar target\xxxx.jar
```

### 4. 注解介绍

![](https://raw.githubusercontent.com/mxsm/picture/main/java/test/JMH%E6%B3%A8%E8%A7%A3.png)

#### 4.1 @BenchmarkMode

基准测试类型，可以有几种选择：

- Throughput: 整体吞吐量
- AverageTime: 调用的平均时间
- SampleTime: 随机取样，最后输出取样结果的分布
- SingleShotTime: 以上模式都是默认一次 iteration 是 1s，唯有 SingleShotTime 是只运行一次。往往同时把 warmup 次数设为0，用于测试冷启动时的性能。
- All 上面的所有情况

#### 4.2 Warmup

进行基准测试前需要进行预热。为什么需要预热？因为JVM的JIT机制存在如果某个函数被调用多次之后，JVM 会尝试将其编译成为机器码从而提高执行速度。

- iterations：迭代次数
- time：每一次时间
- timeUnit： 时间单位
- batchSize：每个操作调用基准测试方法的数量

#### 4.3 @Measurement

测量的一些基本参数：

- iterations：进行测试的轮次
- time： 每轮进行的时长
- timeUnit： 时长单位

#### 4.4 @Threads

每个进程中的测试线程，一般为cpu核数*2

#### 4.5 @Fork

进行 fork 的次数。如果 fork 数是2的话，则 JMH 会 fork 出两个进程来进行测试

#### 4.6 @OutputTimeUnit

基准测试结果的时间类型。一般选择秒、毫秒、微秒

#### 4.7 @Benchmark

表示该方法是需要进行 benchmark 的对象，用法和 JUnit 的 @Test 类似

#### 4.8 @Param

@Param 可以用来指定某项参数的多种情况。特别适合用来测试一个函数在不同的参数输入的情况下的性能，例如上面代码设置Map的初始化大小

#### 4.9 @Setup

注解的作用就是我们需要在测试之前进行一些准备工作，比如对一些数据的初始化之类的，这个也和Junit的@Before

#### 4.10 @TearDown

在测试之后进行一些结束工作，主要用于资源回收

#### 4.11@State

State 用于声明某个类是一个”状态”，然后接受一个 Scope 参数用来表示该状态的共享范围。 因为很多 benchmark 会需要一些表示状态的类，JMH 允许你把这些类以依赖注入的方式注入到 benchmark 函数里。Scope 主要分为三种。

1. Thread: 该状态为每个线程独享。
2. Group: 该状态为同一个组里面所有线程共享。
3. Benchmark: 该状态在所有线程间共享。

> Tips: 例子可以参照官网：https://github.com/openjdk/jmh/tree/master/jmh-samples

### 5. JMH可视化

JMH生成数据后可以存放在文件中，然后可以通过网上提供的可视化网站上传测试数据进行可视化。