---
title: 类加载器和双亲委派模型
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
abbrlink: '62812392'
date: 2019-11-11 01:27:31
---
### 类加载器

每一个类加载器拥有一个独立的类命名空间，通俗的说：比较两个类是否相等只有两个类是同一个类加载器才有意义。

#### JVM预定义类加载器分为三种：

- **启动类加载器（Bootstrap ClassLoader）—C++写的二进制代码而不是字节码**

  启动类加载器主要加载的是JVM自身需要的类，这个类加载使用C++语言实现的，是虚拟机自身的一部分，它负责将 `<JAVA_HOME>/lib` 路径下的核心类库或`-Xbootclasspath`参数指定的路径下的jar包加载到内存中，注意必由于虚拟机是按照文件名识别加载jar包的，如rt.jar，如果文件名不被虚拟机识别，即使把jar包丢到lib目录下也是没有作用的(出于安全考虑，Bootstrap启动类加载器只加载包名为java、javax、sun等开头的类)。

  >在我们测试System.class.getClassLoader()的时候结果为null的原因，并不是表示System这个没有类加载器，而是他的加载器比较特殊。BootstrapClassLoader不是Java类而是C++代码编写的。所以返回为空。

- **拓展(Extension)类加载器**

  扩展类加载器是指Sun公司(已被Oracle收购)实现的`sun.misc.Launcher$ExtClassLoader`类，由Java语言实现的，是Launcher的静态内部类，它负责加载`<JAVA_HOME>/lib/ext`目录下或者由系统变量-Djava.ext.dir指定位路径中的类库，开发者可以直接使用标准扩展类加载器。

- **应用程序(Application)类加载器**

  也称应用程序加载器是指 Sun公司实现的`sun.misc.Launcher$AppClassLoader`。它负责加载系统类路径`java -classpath`或`-Djava.class.path `指定路径下的类库，也就是我们经常用到的classpath路径，开发者可以直接使用系统类加载器，一般情况下该类加载是程序中默认的类加载器，通过`ClassLoader#getSystemClassLoader()`方法可以获取到该类加载器。 

#### 自定义加载类

自定义类加载器可以直接或间接继承自类 **`java.lang.ClassLoader`** 。在 **`java.lang.ClassLoader`** 类的常用方法中，一般来说，自己开发的类加载器只需要覆写  **`findClass(String name)`** 方法即可

java.lang.ClassLoader类的方法 loadClass()封装了代理模式的实现。

- 该方法会首先调用 findLoadedClass()方法来检查该类是否已经被加载过；
- 如果没有加载过的话，会调用父类加载器的 loadClass()方法来尝试加载该类；
- 如果父类加载器无法加载该类的话，就调用 findClass()方法来查找该类。



### 双亲委派模型

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/%E5%8F%8C%E4%BA%B2%E5%A7%94%E6%B4%BE%E6%A8%A1%E5%9E%8B%E5%9B%BE.png)

```
这里的类加载器之间的父子关系一般不通过继承（Inheritance）来实现，而是通过组合（Composition）关系来服用父加载器代码。
双亲委派模型并不是一个强制性约束，而是Java设计者推荐给开发者的一种类加载实现方式。
```

#### 双亲委派模型的工作过程

- 如果一个类加载器收到了类加载的请求，它不会先自己尝试处理这个请求，而是委派给它的父类加载器，所有的请求最终都会传送到顶层的启动类加载器。
- 只有当父类反馈自己无法完成该请求（它的搜索范围中没有找到所需的类，即抛ClassNotFoundException）时，子加载器才会尝试自己加载。

#### 为什么用双亲委派模型？

**为了保证JVM内存中相同的类只有一个，防止出现多个。**

使用双亲委派模型可以使得Java类随着它的类加载器一起具备了一种**带有优先级的层次关系** 。

```java
     */
    protected Class<?> loadClass(String name, boolean resolve)
        throws ClassNotFoundException
    {
        synchronized (getClassLoadingLock(name)) {
            // 首先检查是否已经加载
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                long t0 = System.nanoTime();
                try {
                    if (parent != null) {
                        c = parent.loadClass(name, false);
                    } else {
                        c = findBootstrapClassOrNull(name);
                    }
                } catch (ClassNotFoundException e) {
                    
                }

                if (c == null) {
                   //如果一直没有找到就调用findClassc方法查找
                   //findClass 方法需要自己做override,如果没有直接
                  	//抛出 ClassNotFoundException
                    long t1 = System.nanoTime();
                    c = findClass(name);

                    // this is the defining class loader; record the stats
                    sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                    sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                    sun.misc.PerfCounter.getFindClasses().increment();
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }
```

### 自定义类加载器

```java
package com.github.mxsm;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;

public class MxsmClassLoader extends ClassLoader {

    private String classLoaderName;

    private String path;

    private static final String SUFFIX =  ".class";

    public MxsmClassLoader(String classLoaderName) {
        this.classLoaderName = classLoaderName;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] b = new byte[0];
        try {
            b = loadClassData(name);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return defineClass(name, b, 0, b.length);
    }

    private byte[] loadClassData(String name) throws IOException {

        return FileUtils.readFileToByteArray(new File(getPath() + name.replace(".", "\\")+SUFFIX));

    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    @Override
    public String toString() {
        return "MxsmClassLoader{" +
                "classLoaderName='" + classLoaderName + '\'' +
                '}';
    }
}
```

这个自定义类加载器的模板可以在 **`ClassLoader`** 类的说明上面找到。这样就实现了自定义的类加载器。

### 自定义类加载器的父类说明

下图是我运行当前代码的结果：

![](https://github.com/mxsm/document/blob/master/image/JSE/ClassLoader.gif?raw=true)

1. 第一种情况A在ClassPath下面，所以加载类是通过AppClassLoader加载的。
2. 第二种情况把ClassPath下面的类删除，重新存放。到另一个地方。然后打印发现A加载是通过自定义的 **`MxsmClassLoader`** 加载的。

这里就很好的说明了[双亲委派模型的工作原理](#双亲委派模型的工作过程)

### 类加载器的命名空间

**每个类加载器都有自己的命名空间，命名空间由该加载器及所有的父加载器所加载的类组成。** 

1. 在同一个命名空间里面不允许出现两个完全一样的类
2. 不同的命名空间可以出现两个完全一样的类，相互无感知也就是说两个Class不一样
3. 子加载器所加载的类可以看见父加载器加载的类，但是父加载器所加载的类无法看见子加载器加载的类

下面运行代码来验证，首先在ClassPath下面不删除A查看运行结果：

![](https://github.com/mxsm/document/blob/master/image/JSE/ClassLoaderNamspace1.gif?raw=true)

这里是没有报错的。

我们把ClassPath的A删除然后运行：

![](https://github.com/mxsm/document/blob/master/image/JSE/ClassLoaderNamspace2.gif?raw=true)

看一下报错：

```java
Exception in thread "main" java.lang.reflect.InvocationTargetException
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at com.github.mxsm.App2.main(App2.java:23)
Caused by: java.lang.ClassCastException: com.github.mxsm.algorithm.A cannot be cast to com.github.mxsm.algorithm.A
	at com.github.mxsm.algorithm.A.setA(A.java:12)
	... 5 more
```

这里报 java.lang.ClassCastException: com.github.mxsm.algorithm.A cannot be cast to com.github.mxsm.algorithm.A 这是为什么？

原因就在于A的加载是不同的类加载器加载，由于有类加载器命名空间的存在。所以其实加载的是两个不同的类。所以在进行强行转换的时候回出现 A 不能转换 A的情况。