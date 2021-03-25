---
title: 看懂UML图
date: 2019-12-11
---
### 1. 类UML图

![图](https://github.com/mxsm/document/blob/master/image/designmode/uml_class_struct.jpg?raw=true)

- 车的类图结构为<<abstract>>(Java可以是interface)，表示车是一个抽象类；
- 它有两个继承类：小汽车和自行车；它们之间的关系为实现关系，使用带空心箭头的虚线表示；
- 小汽车为与SUV之间也是继承关系，它们之间的关系为泛化关系，使用带空心箭头的实线表示；
- 小汽车与发动机之间是组合关系，使用带实心箭头的实线表示；
- 学生与班级之间是聚合关系，使用带空心箭头的实线表示；
- 学生与身份证之间为关联关系，使用一根实线表示
- 学生上学需要用到自行车，与自行车是一种依赖关系，使用带箭头的虚线表示；

### 2. 类与类之间关系的表示方式

#### 2.1 关联关系

关联关系又可进一步分为单向关联、双向关联和自关联。

##### （1）单向关联

![](https://github.com/mxsm/picture/blob/main/designmode/%E5%8D%95%E9%A1%B9%E5%85%B3%E8%81%94.png?raw=true)

##### (2) 双向关联

![](https://github.com/mxsm/picture/blob/main/designmode/%E5%8F%8C%E5%90%91%E5%85%B3%E8%81%94.png?raw=true)

##### (3) 自关联

![](https://github.com/mxsm/picture/blob/main/designmode/%E8%87%AA%E5%85%B3%E8%81%94.png?raw=true)

#### 2.2 聚合关系

![](https://github.com/mxsm/picture/blob/main/designmode/%E8%81%9A%E5%90%88%E5%85%B3%E7%B3%BB.png?raw=true)

#### 2.3 组合关系

![](https://github.com/mxsm/picture/blob/main/designmode/%E7%BB%84%E5%90%88%E5%85%B3%E7%B3%BB.png?raw=true)

> 聚合关系强调是“整体”包含“部分”，但是“部分”可以脱离“整体”而单独存在。组合关系与聚合关系见得最大不同在于：这里的“部分”脱离了“整体”便不复存在。



#### 2.4 依赖关系

![](https://github.com/mxsm/picture/blob/main/designmode/%E4%BE%9D%E8%B5%96.png?raw=true)

#### 2.5 继承关系

![](https://github.com/mxsm/picture/blob/main/designmode/%E7%BB%A7%E6%89%BF%E5%85%B3%E7%B3%BB.png?raw=true)

#### 2.6 接口实现关系

![](https://github.com/mxsm/picture/blob/main/designmode/%E6%8E%A5%E5%8F%A3%E5%AE%9E%E7%8E%B0.png?raw=true)

