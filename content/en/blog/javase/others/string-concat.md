---
title: 字符串拼接那些事
categories:
  - Java
  - JSE
  - 字符串的那些事
tags:
  - Java
  - JSE
  - 字符串的那些事
abbrlink: ed36e955
date: 2019-06-01 06:37:32
---
### 1. 代码中字符串最常用的拼接方法

- **`+`** 拼接
- **`apache`** 的工具类 **`StringUtils.join`** 方法
- **`String`** 类的对象方法 **`concat`**
- **`StringBuffer`** 类的对象方法 **`append`**
- **`StringBuilder`**  类的对象方法  **`append`**

等等一些组合方式。以上几种是编码过程中最常见的。下面就来看看这几种方式的字符串拼接的实现和效率

### 2.  **`+`** 操作符的拼接

```java
public class StringConcatTest {

    public static void main(String[] args) {
        String wc = "aaaaa";
        String wc1 = "bbbbbb";
        String ct = wc + "," + wc1;
    }

}
```

查看 **`.class`** 文件后的反编译代码如下

```java
package com.mxsm.cglib.enhancer;

public class StringConcatTest {
    public StringConcatTest() {
    }

    public static void main(String[] args) {
        String wc = "aaaaa";
        String wc1 = "bbbbbb";
        (new StringBuilder()).append(wc).append(",").append(wc1).toString();
    }
}
```

代码 **` String ct = wc + "," + wc1;`** —> **`(new StringBuilder()).append(wc).append(",").append(wc1).toString();`**

转换成了 **`StringBuilder`** 的 **`append`** 方法。

在阿里巴巴的Java开发手册中不建议循环体中使用 **`+`** 进行字符串拼接原因是什么？

**原因就在于 `+` 每次创建一个 `StringBuilder` 对象然后 `toString()` 返回字符串对象，造成内存资源的浪费** 

### 3. **`String`** 的 **`concat`** 方法

```java
public class StringConcatTest {
    public static void main(String[] args) {
        String wc = "aaaaa";
        String wc1 = "bbbbbb";
        String ct = wc.concat(",").concat(wc1);
    }
}
```

接下来看一下 **`concat`** 的源码是怎么实现拼接的

```java

public String concat(String str) {
    	//获取长度
        int otherLen = str.length();
        if (otherLen == 0) {
            return this;
        }
    	//获取原有字段的长处
        int len = value.length;
    	//字符串的拷贝
        char buf[] = Arrays.copyOf(value, len + otherLen);
        str.getChars(buf, len);
    	//返回一个new String的新对象
        return new String(buf, true);
    }
```

### 4. **`StringBuffer`** 和 **`StringBuilder`** 的 **`append`** 方法

- **`StringBuffer`** 的 **`append`** 方法

  ```java
      @Override
      public synchronized StringBuffer append(String str) {
          toStringCache = null;
          //调用的是父类的append方法
          super.append(str);
          return this;
      }
   public AbstractStringBuilder append(String str) {
          if (str == null)
              return appendNull();
          int len = str.length();
          ensureCapacityInternal(count + len);
          str.getChars(0, len, value, count);
          count += len;
          return this;
      }
  ```

  注意：**`StringBuffer`** 的 **`append`** 方法带有关键字 **`synchronized`** 说明是线程安全的。

- **`StringBuilder`** 的 **`append`** 方法

  ```java
  @Override
  public StringBuilder append(String str) {
      super.append(str);
      return this;
  }
  
   public AbstractStringBuilder append(String str) {
          if (str == null)
              return appendNull();
          int len = str.length();
          ensureCapacityInternal(count + len);
          str.getChars(0, len, value, count);
          count += len;
          return this;
      }
  ```

从上面的源码可以看出来 **`StringBuffer`** 和 **`StringBuilder`** 的底层实现都是 调用了父类 **`AbstractStringBuilder`** 的 **`append`**方法。唯一的区别就是 **`StringBuffer`** 线程安全 ， **`StringBuilder`** 非线程安全。所以想要线程安全 就用 **`StringBuffer`** 没有线程安全的问题的考虑就用 **`StringBuilder`** 。 

### 5. **`StringUtils.join`** 

这里源码自行参考 **`apache`** 工具类 的源码

### 6. 各自的效率

重中之重的来了，那就是各个方法的拼接效率怎么样？为什么阿里巴巴的Java规范中不提倡用 **`+`** 进行字符串拼接

下面我们上代码来说明明天，看看到底谁牛逼速度快。

```java
public class StringConcatTest {

    public static void main(String[] args) {

        int count = 66666;

        long t1 = System.currentTimeMillis();
        String s1 = "1";
        for(int i = 0; i < count; ++i){
            s1 = s1 + "1";
        }
        System.out.println("+ "+(System.currentTimeMillis()-t1)+"ms");


        long t2 = System.currentTimeMillis();
        StringBuffer s2 = new StringBuffer("1");
        for(int i = 0; i < count; ++i){
            s2.append("1");
        }
        System.out.println("StringBuffer "+(System.currentTimeMillis()-t2)+"ms");

        long t3 = System.currentTimeMillis();
        StringBuilder s3 = new StringBuilder("1");
        for(int i = 0; i < count; ++i){
            s3.append("1");
        }
        System.out.println("StringBuilder "+(System.currentTimeMillis()-t3)+"ms");

        long t4 = System.currentTimeMillis();
        String s4 = "1";
        for(int i = 0; i < count; ++i){
            s4 = s4.concat("1");
        }
        System.out.println("concat "+(System.currentTimeMillis()-t4)+"ms");

    }

}
```

运行的打印结果：

```
+ 2949ms
StringBuffer 2ms
StringBuilder 1ms
concat 693ms
```

