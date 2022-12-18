---
title: "Netty四大组件之ByteBuf"
linkTitle: "Netty四大组件之ByteBuf"
date: 2022-01-16
weight: 202201161638
---



ByteBuf作为Netty的数据容器，网络通信涉及到字节序列的移动。高效易用的数据结构必不可少。替换了Java NIO的ByteBuffer,主要是ByteBuf更加高效和易用，实现了自动扩容等等一些ByteBuffer不具备的功能

### 1. ByteBuf数据结构

ByteBuf的特点：

- 通过工具类Unpooled创建

- 索引随机访问
- 索引顺序访问
- 搜索操作
- 索引的Mark和Reset
- 派生缓冲区
- ByteBuf和JDK ByteBuffer能够灵活的转换

在ByteBuf实现的中（AbstractByteBuf），维护了两个变量：

- readerIndex -- 读的当前索引位置
- writerIndex -- 写的当前索引位置

![](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220113222211485.png)

名称已 **`read`** 和 **`write`** 开头的 **`ByteBuf`** 方法， 将会推进对应的索引。而以 **`get`** 和 **`set`** 开头的则不会。 **`ByteBuf`** 默认真的最大容量为 **`Integer.MAX_VALUE`**

![image-20220113222344519](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220113222344519.png)

readXXX和writeXXX分别推进readerIndex和writeIndex。

### 2. ByteBuf操作

#### 2.1 随机访问索引

通过 **`getBytes`** 系列接口来对ByteBuf进行随机访问。

```java
 ByteBuf buffer = Unpooled.buffer(3,3);
 buffer.writeBoolean(true);
 buffer.writeBoolean(true);
 buffer.getBytes(0, new byte[1]);
 System.out.println(buffer.readerIndex());
```

> Tips: 用getBytes随机访问不会改变readerIndex

#### 2.2 顺序访问索引

![ByteBuf索引顺序存取](https://raw.githubusercontent.com/mxsm/picture/main/netty/ByteBuf%E7%B4%A2%E5%BC%95%E9%A1%BA%E5%BA%8F%E5%AD%98%E5%8F%96.png)

通过 **`readerIndex()`** 和 **`writerIndex()`** 获取读Index和写Index。

#### 2.3 可丢弃字节

标记为可丢弃字节的分段包含了已经被读过的字节。通过调用 **`discardReadBytes()`** 方法， 可以丢弃它们并回收空间。这个分段的初始大小为 0，存储在 readerIndex 中，会随着 read 操作的执行而增加（ get操作不会移动 readerIndex）。但是这个可以丢弃并不是字节把已经读的字段的字节不要了，而是把尚未读的字节数移到最开始。(这样做可能会导致内存复制)

![ByteBuf丢弃字节](https://raw.githubusercontent.com/mxsm/picture/main/netty/ByteBuf%E4%B8%A2%E5%BC%83%E5%AD%97%E8%8A%82.png)

#### 2.4 可读字节和可写字节

![image-20220116155146649](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220116155146649.png)

#### 2.5 读写索引管理

通过调用 **`markReaderIndex()`** 、 **`markWriterIndex()`** 、 **`resetWriterIndex()`** 和 **`resetReaderIndex()`** 来标记和重置 **`ByteBuf`** 的 **`readerIndex`** 和 **`writerIndex`** 。

也可以通过调用 **`readerIndex(int)`** 或者 **`writerIndex(int)`** 来将索引移动到指定位置。 试图将任何一个索引设置到一个无效的位置都将导致一个 **`IndexOutOfBoundsException`** 。

可以通过调用 clear()方法来将 readerIndex 和 writerIndex 都设置为 0。注意， **这并不会清除内存中的内容。(内容还依然存并不是全部清空数据)**

![ByteBufclear](https://raw.githubusercontent.com/mxsm/picture/main/netty/ByteBufclear.png)

### 3. ByteBuf的实现源码解析

**`ByteBuf`** 的实现可以从三个纬度来看：

- **Pooled和Unpooled**
  - Pooled：每次申请内存都是从预先分配好的内从空间中取出连续的一段，用完后放回去。类似于线程池的操作
  - Unpooled：每次都是申请新的内存
- **Unsafe和非Unsafe**
  - Unsafe: 通过Unsafe类直接操作内存，内存管理由开发人员
  - 非Unsafe：通过JDK的API操作内存，也就是内存的管理有JVM来管理
- **Heap和Direct**
  - Heap: JVM的堆内存
  - Direct: 堆外内存也叫直接内存，通过调用Unsafe的API进行物理内存的分配，不在JVM堆内，所以需要使用者自己手动释放

![ByteBuf实现](https://raw.githubusercontent.com/mxsm/picture/main/netty/ByteBuf%E5%AE%9E%E7%8E%B0.png)

**`ByteBuf`** 主要的有八个主要的具体实现。

#### 3.1 池化ByteBuf和非池化ByteBuf

池化内存主要是由Netty进行管理，使用完成后重写放回内存池。而非池化内存每次都创建新的使用后进行释放。

#### 3.2 ByteBufAllocator

**`ByteBufAllocator`** 接口是分配 **`ByteBuf`** 的顶层接口，负责所有类型的 **`ByteBuf`** 类型的内存分配，同时对于实现需要线程安全。

**`ByteBufAllocator`** 重要方法：

```java
//堆内还堆外取取决于具体实现
ByteBuf buffer();
ByteBuf buffer(int initialCapacity);
ByteBuf buffer(int initialCapacity, int maxCapacity);

//堆外内存分配ByteBuf
ByteBuf directBuffer();
ByteBuf directBuffer(int initialCapacity);
ByteBuf directBuffer(int initialCapacity, int maxCapacity);

//堆内存分配ByteVBuf
ByteBuf heapBuffer();
ByteBuf heapBuffer(int initialCapacity);
ByteBuf heapBuffer(int initialCapacity, int maxCapacity);
```

![image-20220116162623793](https://raw.githubusercontent.com/mxsm/picture/main/netty/image-20220116162623793.png)

下面通过源码来看一下具体使用何种规则来进行分配，策略是什么？看一下 **`AbstractByteBufAllocator`**

```java
public abstract class AbstractByteBufAllocator implements ByteBufAllocator {
    
    
    protected AbstractByteBufAllocator() {
        this(false);  //默认使用的是Heap分配方式
    }
    
    //通过preferDirect来判断是否使用堆外内存分配的方式
    protected AbstractByteBufAllocator(boolean preferDirect) {
        directByDefault = preferDirect && PlatformDependent.hasUnsafe(); //是否支持Unsafe方式分配内存
        emptyBuf = new EmptyByteBuf(this);
    }
    
    //省略部分代码
}
```

从上面可以看出来堆内分配还堆外分配 **`ByteBuf`** 取决于构造函数参数 **`preferDirect`** 为 true 还是 false， 在true的情况下然后在判断平台是否依赖 **`Unsafe`** 。

```java
//具体类实现
protected abstract ByteBuf newHeapBuffer(int initialCapacity, int maxCapacity);

//具体类实现
protected abstract ByteBuf newDirectBuffer(int initialCapacity, int maxCapacity);
```

**`AbstractByteBufAllocator#newHeapBuffer`** 和 **`AbstractByteBufAllocator#newDirectBuffer`** 为抽象方法，具体的执行依赖于实现。实现的类有两个

- **PooledByteBufAllocator**
- **UnpooledByteBufAllocator**

这两个实现区分了池化和非池化。而对于是使用Unsafe还是非Unsafe是自动进行判断的。

#### 3.3 非池化内存分配

**`UnpooledByteBufAllocator`** 实现了非池化的 **`ByteBuf`** 分配策略，具体的实现有两个：

- 堆内内存分配
- 堆外内存分配

##### 3.3.1 非池化堆内内存分配

**`UnpooledByteBufAllocator#newHeapBuffer`** 负责分配堆内内存：

```java
    @Override
    protected ByteBuf newHeapBuffer(int initialCapacity, int maxCapacity) {
        return PlatformDependent.hasUnsafe() ?
                new InstrumentedUnpooledUnsafeHeapByteBuf(this, initialCapacity, maxCapacity) :
                new InstrumentedUnpooledHeapByteBuf(this, initialCapacity, maxCapacity);
    }
```

通过 **`PlatformDependent.hasUnsafe`** 来判断操作系统是否支持 **`Unsafe`** （最终调用的判断方法）:

```java
    private static Throwable unsafeUnavailabilityCause0() {
        if (isAndroid()) {
            logger.debug("sun.misc.Unsafe: unavailable (Android)");
            return new UnsupportedOperationException("sun.misc.Unsafe: unavailable (Android)");
        }

        if (isIkvmDotNet()) {
            logger.debug("sun.misc.Unsafe: unavailable (IKVM.NET)");
            return new UnsupportedOperationException("sun.misc.Unsafe: unavailable (IKVM.NET)");
        }

        Throwable cause = PlatformDependent0.getUnsafeUnavailabilityCause();
        if (cause != null) {
            return cause;
        }

        try {
            boolean hasUnsafe = PlatformDependent0.hasUnsafe();
            logger.debug("sun.misc.Unsafe: {}", hasUnsafe ? "available" : "unavailable");
            return hasUnsafe ? null : PlatformDependent0.getUnsafeUnavailabilityCause();
        } catch (Throwable t) {
            logger.trace("Could not determine if Unsafe is available", t);
            // Probably failed to initialize PlatformDependent0.
            return new UnsupportedOperationException("Could not determine if Unsafe is available", t);
        }
    }
```

- 支持Unsafe创建 **`InstrumentedUnpooledUnsafeHeapByteBuf`**

  **`InstrumentedUnpooledUnsafeHeapByteBuf`** 调用的是 **`UnpooledUnsafeHeapByteBuf#allocateArray`** 方法：

  ```java
  //这个类是UnpooledByteBufAllocator的内部类
  private static final class InstrumentedUnpooledUnsafeHeapByteBuf extends UnpooledUnsafeHeapByteBuf {
       	//省略部分代码
          @Override
          protected byte[] allocateArray(int initialCapacity) {
              //分配内存
              byte[] bytes = super.allocateArray(initialCapacity);
              ((UnpooledByteBufAllocator) alloc()).incrementHeap(bytes.length);
              return bytes;
          }
       
   }
  
  
  public class UnpooledUnsafeHeapByteBuf extends UnpooledHeapByteBuf {
      @Override
      protected byte[] allocateArray(int initialCapacity) {
          //分配内存
          return PlatformDependent.allocateUninitializedArray(initialCapacity);
      }
  }
  ```

  最终是通过 **`PlatformDependent#allocateUninitializedArray`** 的方法来分配内存

  ```java
      public static byte[] allocateUninitializedArray(int size) {
          return UNINITIALIZED_ARRAY_ALLOCATION_THRESHOLD < 0 || UNINITIALIZED_ARRAY_ALLOCATION_THRESHOLD > size ?
                  new byte[size] : PlatformDependent0.allocateUninitializedArray(size);
      }
  ```

- 不支持Unsafe创建 **`InstrumentedUnpooledHeapByteBuf`**

  **`InstrumentedUnpooledHeapByteBuf`** 调用的是 **`UnpooledHeapByteBuf#allocateArray`** 方法：

  ```java
      protected byte[] allocateArray(int initialCapacity) {
          return new byte[initialCapacity];
      }
  ```

  直接通过 **`new`** 方式创建 byte数组分配内存

**说明：**

- **对于支持Unsafe分配堆内内存，所有的读写操作都依赖Unsafe。**
- **不支持Unsafe，通过new byte[initialCapacity]的方式创建字节数字，读写都是通过索引，内存释放都是依赖JVM**

##### 3.3.1 非池化堆外内存分配

**`UnpooledByteBufAllocator#newDirectBuffer`** 负责分配堆外内存：

```java
    @Override
    protected ByteBuf newDirectBuffer(int initialCapacity, int maxCapacity) {
        final ByteBuf buf;
        if (PlatformDependent.hasUnsafe()) {
            buf = noCleaner ? new InstrumentedUnpooledUnsafeNoCleanerDirectByteBuf(this, initialCapacity, maxCapacity) :
                    new InstrumentedUnpooledUnsafeDirectByteBuf(this, initialCapacity, maxCapacity);
        } else {
            buf = new InstrumentedUnpooledDirectByteBuf(this, initialCapacity, maxCapacity);
        }
        return disableLeakDetector ? buf : toLeakAwareBuffer(buf);
    }

```

在非池化堆外内存分配同样判断操作系统是否支持Unsafe

- 支持Unsafe

  - noCleaner为true,创建 **`InstrumentedUnpooledUnsafeNoCleanerDirectByteBuf`** 
  - noCleaner为false,创建 **`InstrumentedUnpooledUnsafeDirectByteBuf`** 

- 不支持Unsafe

  创建 **`InstrumentedUnpooledDirectByteBuf`**

对于 **`InstrumentedUnpooledDirectByteBuf`** 而言调用了 **`UnpooledDirectByteBuf#allocateDirect`** 方法，底层是JavaNIO的 **`ByteBuffer#allocateDirect`** 来创建，最终是 **`new DirectByteBuffer(capacity)`** 对象返回。

#### 3.4 池化内存分配 

​	池化内存主要由 **`PooledByteBufAllocator`** 进行分配，具体的实现可以参照 《[Netty源码解析-池化内存管理解析](https://blog.ljbmxsm.com/middlewares/netty/netty-source-code-analysis/netty-source-analysis-pooled-manage/)》

### 4. 总结

- Netty 强大的数据容器 ByteBuf，它不仅解决了 JDK NIO 中 ByteBuffer 的缺陷，而且提供了易用性更强的接口。还能够转换成ByteBuffer
- ByteBuf读写采用了不同的指针，读写模式可以随意切换
- 容量可以按需动态扩展,支持池化

