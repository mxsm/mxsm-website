---
title: elasticsearch基本概念
categories:
  - 数据库
  - elasticsearch
tags:
  - 数据库
  - elasticsearch
  - elasticsearch基本概念
abbrlink: 30e5d631
date: 2020-02-14 14:27:00
---



### 基本概念

首先了解一下ES的几个基本概念。

#### 索引(index)

ElasticSearch把数据存放到一个或者多个索引(indices)中。如果用关系型数据库模型对比，索引(index)的地位与数据库实例(database)相当。索引存放和读取的基本单元是文档(Document)。我们也一再强调，ElasticSearch内部用Apache Lucene实现索引中数据的读写。读者应该清楚的是：在ElasticSearch中被视为单独的一个索引(index)，在Lucene中可能不止一个。这是因为在分布式体系中，ElasticSearch会用到分片(shards)和备份(replicas)机制将一个索引(index)存储多份。

#### 文档(Document)

在ElasticSearch的世界中，文档(Document)是主要的存在实体(在Lucene中也是如此)。所有的ElasticSearch应用需求到最后都可以统一建模成一个检索模型：检索相关文档。文档(Document)由一个或者多个域(Field)组成，每个域(Field)由一个域名(此域名非彼域名)和一个或者多个值组成(有多个值的值称为多值域(multi-valued))。在ElasticSeach中，每个文档(Document)都可能会有不同的域(Field)集合；也就是说文档(Document)是没有固定的模式和统一的结构。文档(Document)之间保持结构的相似性即可(Lucene中的文档(Document)也秉持着相同的规定)。实际上，ElasticSearch中的文档(Document)就是Lucene中的文档(Document)。从客户端的角度来看，文档(Document)就是一个JSON对象(关于JSON格式的相关信息,请参看hhtp://en.wikipedia.org/wiki/JSON)。

#### 参数映射(Mapping)

所有的文档(Document)在存储之前都必须经过分析(analyze)流程。用户可以配置输入文本分解成Token的方式；哪些Token应该被过滤掉；或者其它的的处理流程，比如去除HTML标签。此外，ElasticSearch提供的各种特性，比如排序的相关信息。保存上述的配置信息，这就是参数映射(Mapping)在ElasticSearch中扮演的角色。尽管ElasticSearch可以根据域的值自动识别域的类型(field type)，在生产应用中，都是需要自己配置这些信息以避免一些奇的问题发生。要保证应用的可控性。

#### 文档类型(Type)

每个文档在ElasticSearch中都必须设定它的类型。文档类型使得同一个索引中在存储结构不同文档时，只需要依据文档类型就可以找到对应的参数映射(Mapping)信息，方便文档的存取。

### ES和关系型数据库的比较

一个ES集群可以包含多个索引（数据库），每个索引又包含了很多类型（表），类型中包含了很多文档（行），每个文档使用 JSON 格式存储数据，包含了很多字段（列）。

| 关系型数据库  | 数据库      | 表          | 行              | 列           |
| :------------ | ----------- | ----------- | --------------- | ------------ |
| ElasticSearch | 索引(index) | 类型(Types) | 文档(Documents) | 字段(Fields) |

 