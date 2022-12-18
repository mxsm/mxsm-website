---
title: String StringBuffer StringBuilder
date: 2018-07-18
---
### 1. 三者的对比

| 类                  | 是否可变   | 是否线程安全 | 效率 |
| ------------------- | ---------- | ------------ | ---- |
| **`String`**        | 对象不可变 | 线程安全     | 3    |
| **`StringBuilder`** | 对象可变   | 非线程安全   | 1    |
| **`StringBuffer`**  | 对象可变   | 线程安全     | 2    |

**`StringBuffer`** 和 **`StringBuilder`** 的公共父类  **`AbstractStringBuilder`**  
**`StringBuffer`** 的同步是通过在方法上面添加 **`synchronized`** 来实现。

### 2. String不可变
String对象的任何修改都不会影响原对象，任何相关的操作都会生成新的对象。
例子：

```java
public String substring(int beginIndex) {
        if (beginIndex < 0) {
            throw new StringIndexOutOfBoundsException(beginIndex);
        }
        int subLen = value.length - beginIndex;
        if (subLen < 0) {
            throw new StringIndexOutOfBoundsException(subLen);
        }
        return (beginIndex == 0) ? this : new String(value, beginIndex, subLen);
    }
```
**`String`** 的 **`substring`** 方法，返回的新的对象是通过new了一下新的String的对象返回。如果开始的index=0返回的是当前的对象

### 3. 使用的原则
1. 基本原则：如果要操作少量的数据，用String ；单线程操作大量数据，用 **`StringBuilder`** ；多线程操作大量数据，用 **`StringBuffer`**。
2. 不要使用String类的”+”来进行频繁的拼接，因为那样的性能极差的(每次都要生成新的类)例子如下：

```java
String result = "";
for (String s : hugeArray) {
result = result + s;
}
// 使用StringBuilder
StringBuilder sb = new StringBuilder();
for (String s : hugeArray) {
sb.append(s);
}
String result = sb.toString();
```
这样的情况显然用 **`StringBulider`** 比较好
3.  **`StringBuilder`** 一般使用在方法内部来完成类似”+”功能，因为是线程不安全的，所以用完以后可以丢弃。 **`StringBuffer`** 主要用在全局变量中
4. 相同情况下使用  **`StirngBuilder`**   相比使用  **`StringBuffer`**  仅能获得 10%~15% 左右的性能提升，但却要冒多线程不安全的风险。而在现实的模块化编程中，负责某一模块的程序员不一定能清晰地判断该模块是否会放入多线程的环境中运行，因此：除非确定系统的瓶颈是在 StringBuffer 上，并且确定你的模块不会运行在多线程模式下，才可以采用 **`StringBuilder`** ；否则还是用 **`StringBuffer`** 

### 4. 附JMH性能对比

```java
@BenchmarkMode(Mode.Throughput)
@Warmup(iterations = 1, time = 5)
@Measurement(iterations = 3, time = 5)
@Threads(16)
@Fork(3)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.SECONDS)
public class StringTest {

    @Param({"10000","100000"})
    private int counter;

    @Benchmark
    public void stringTest(Blackhole blackhole) {

        String st = new String();
        for(int i = 0;i < counter;++i){
            st += 0;
        }
        blackhole.consume(st);
    }

    @Benchmark
    public void stringBufferTest(Blackhole blackhole) {

        StringBuffer st = new StringBuffer();
        for(int i = 0;i < counter;++i){
            st.append(0);
        }
        blackhole.consume(st);
    }

    @Benchmark
    public void stringBuilderTest(Blackhole blackhole) {

        StringBuilder st = new StringBuilder();
        for(int i = 0;i < counter;++i){
            st.append(0);
        }
        blackhole.consume(st);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder().
            include(StringTest.class.getSimpleName())
            .result("result.json")
            .resultFormat(ResultFormatType.JSON).build();
        new Runner(opt).run();
    }
}
```

测试结果：

![image-20220215230524058](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220215230524058.png)

![stringjmhtest](E:\download\stringjmhtest.png)



> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！
