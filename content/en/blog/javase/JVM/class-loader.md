---
title: 类的加载
categories:
  - Java
  - JSE
  - JVM
tags:
  - Java
  - JSE
  - JVM
abbrlink: 807bd2a4
date: 2019-04-27 01:15:32
---
### 1. 虚拟机类的加载

虚拟机加类的生命周期几个阶段图解如下：

![图解](https://raw.githubusercontent.com/mxsm/document/master/image/JSE/JVM%E8%99%9A%E6%8B%9F%E6%9C%BA%E7%9A%84%E7%B1%BB%E5%8A%A0%E8%BD%BD.png)

虚拟机加载类的的三个阶段(加载--->连接--->初始化)：

- **加载**

  **加载** 是 **类加载** (**`Class Loading`**)过程的一个阶段在这阶段需要做三件事情：

  1. 通过一个**类的全限定名(带包名)**来获取定义此类的二进制字节流。
  2. 将这个字节的流所代表的静态存储结构转化成为方法区的运行时数据结构
  3. 在内存中生成一个代表这个类的 **`java.lang.Class`** 对象，作为方法区这个类的各种数据访问入口

- **连接**

  连接又分为三个阶段：

  - **验证**

    - 文件格式验证
      - **`Java`** 文件是否已魔数开头
      - 主次版本号是否在当前虚拟机处理范围内
      - 常量池中的常量是否有不被支持的类型
      - ......

    - 元数据的验证
      - 是否有父类
      - 等等.....
    - 字节码验证
    - 符号应用验证

  - **准备**

    正式为类的变量分配内存并设置类变量初始值阶段，这些变量锁使用的内存都将在方法区中进行分配。(**这里的分配对象的内存景包括类变量--也就是被static修饰的变量，不包括实例变量**)

  - **解析**

    解析阶段是JVM将常量池内的符号引用替换为直接引用的过程。

    - **符号引用**

      符号引用以一组符号来描述所引用的目标，符号可以是任何形式的字面量，只要使用时能够无歧义的定位到目标即可。例如，在Class文件中它以CONSTANT_Class_info、CONSTANT_Fieldref_info、CONSTANT_Methodref_info等类型的常量出现。符号引用与虚拟机的内存布局无关，引用的目标并不一定加载到内存中。在Java中，一个java类将会编译成一个class文件。在编译时，java类并不知道所引用的类的实际地址，因此只能使用符号引用来代替。比如org.simple.People类引用了org.simple.Language类，在编译时People类并不知道Language类的实际内存地址，因此只能使用符号org.simple.Language（假设是这个，当然实际中是由类似于CONSTANT_Class_info的常量来表示的）来表示Language类的地址。各种虚拟机实现的内存布局可能有所不同，但是它们能接受的符号引用都是一致的，因为符号引用的字面量形式明确定义在Java虚拟机规范的Class文件格式中。(**总结一下：就是类似于占位符用一个能唯一标识自己的符号占着**)

    - **直接引用**

      直接指向目标的指针，相对偏移量，一个能间接定位到目标的句柄

    - **类或者接口的解析**

    - **字段的解析**

    - **类方法的解析**

    - **接口方法的解析**

- **初始化**

  在类初始化之前的准备阶段虚拟机会将**类变量（static 修饰的变量）**分配内存并设置默认值。初始化阶段：

  - 编译器会在将 `.java` 文件编译成 `.class` 文件时，收集所有类初始化代码和 `static {}` 域的代码，收集在一起成为 `<cinit>()` 方法 (**注意：静态代码块只能访问代码块之前的变量，定义之后的变量只能赋值不能访问**)

    ```java
        static String aaa;
        
        static {
            aaa = "123";
            bbb = "234";
            System.out.println(bbb); // 在ideal中会报错 但是上面一个语句可以
        }
    
        static String bbb;
    ```

  - 子类初始化时会首先调用父类的  **`<cinit>()`**  方法

    ```java
    public class Animals {
    
        private static String animals;
    
        static {
            animals = "animals";
            System.out.println(animals);
        }
    
    }
    
    public class Cat extends Animals{
    
        private static String cat;
    
        static {
            cat = "Cat";
            System.out.println(cat);
        }
    }
    
    public class App {
    
        public static void main( String[] args ) {
            new Cat();
        }
    }
    ```

    打印的结果：

    ```
    animals
    Cat
    ```

  - **多线程环境下保证线程的安全**

- **使用**

- **卸载**