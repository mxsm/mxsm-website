---
title: "IntelliJ IDEA那些不常用但很有用技巧"
linkTitle: "IntelliJ IDEA那些不常用但很有用技巧"
date: 2022-01-26
weight: 202201261650
---

IntelliJ IDEA作为开发工具的一霸这个是没有争议的，作为一个Java开发者用习惯了这个软件就没办法用其他的了(正版有点小贵)，今天来说一下我自己在使用IntelliJ IDEA中一些小的功能和技巧，不常用但是很有用的技巧

### 1. Debug断点按条件过滤

想必大家肯定会遇到这样的情况，例如：一个for循环从0到100，但是我观察的时候可能需要只需要观察30这个数值的后续操作。一般的人操作如下图：

![debug1](C:\Users\mxsm\Desktop\pic\debug1.gif)

就会不停的按F8进行下一步。但是在IDEA中有一个Debug的小技巧就是在断点处右键出现下图所示：

![image-20220126170446784](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220126170446784.png)

弹出标号1所示的弹窗，然后你在标号2处就可以增加条件来过滤不符合条件的数据。上图所示的条件表示：i等于30的时候匹配到断点。

![debug1](C:\Users\mxsm\Desktop\pic\debug2.gif)

> Tips: 这里只是一个简单的例子，条件可以根据自己的需要定。当为true的话就会匹配到

### 2. Debug实时插入打印

在开发过程Debug程序的时候需要打印一些列数据，但是引入的Jar包又不能修改源码的情况，在IDEA中有一个很好用的功能就能够解决，第一步在需要打印数据的地方右键鼠标：

![image-20220126173648141](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220126173648141.png)

然后点击 **Add Inline Watch**：

![image-20220126173815363](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220126173815363.png)

然后确定。接下来我new 一个Date试下

![image-20220126173922182](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220126173922182.png)

### 3. 一键去除无用导入类

在Java开发中有的时候在一个类中导入类，但是可能又没用到，如果没有良好的习惯一般情况下很多类中都会存在这个情况。一个个去检查渠道很是麻烦，哪怕用快捷键 **`Ctrl+alt+o`** （windows，别喷我没有Mac）。 我们可以使用鼠标左键选择要一键清除多余的类的项目或者包都可以。然后使用 **`Ctrl+alt+o`** 就可以一键清除下面所有的文件中导入的无用的类。

![debug3](C:\Users\mxsm\Desktop\pic\debug3.gif)

### 4. 类的使用处过滤

在源码阅读的时候选择某个类然后 **`Ctrl+左键`** 就会有弹框出来，显示该类在哪些类中被应用引用了

![类引用](C:\Users\mxsm\Desktop\pic\类引用.gif)

这里出现了很多一些我们不希望看到的使用的地方，包括测试类等等。可以通过选择下拉来过滤自己的需要

![类引用1](C:\Users\mxsm\Desktop\pic\类引用1.gif)