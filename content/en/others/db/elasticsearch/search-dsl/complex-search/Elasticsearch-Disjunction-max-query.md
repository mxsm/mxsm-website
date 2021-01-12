---
title: Elasticsearch复合查询-Disjunction max query
categories:
  - 数据库
  - elasticsearch
  - 查询DSL
  - 复合查询
tags:
  - 数据库
  - elasticsearch
  - 布尔查询
  - DSL
  - 复合查询
  - Elasticsearch复合查询
  - Elasticsearch-最佳匹配查询
abbrlink: 8507d54f
date: 2020-02-14 23:15:00
---

> 注意：以下语法都是基于Elasticsearch的7.6版本

### Disjunction max query(最佳匹配查询)

返回与一个或多个包装查询(称为查询子句或子句)匹配的文档。

如果返回的文档匹配多个查询子句，dis_max查询将从任何匹配子句中为文档分配最高的相关性得分，并为任何其他匹配子查询分配一个打破平局的增量。

您可以使用dis_max在映射了不同boost因子的字段中搜索一个术语。下面看一下官方的例子：

```json
GET /_search
{
    "query": {
        "dis_max" : {
            "queries" : [
                { "term" : { "title" : "Quick pets" }},
                { "term" : { "body" : "Quick pets" }}
            ],
            "tie_breaker" : 0.7
        }
    }
}
```

- **queries**

  (必须参数，查询对象数组)包含一个或多个查询子句。返回的文档必须匹配一个或多个这些查询。如果文档匹配多个查询，则Elasticsearch使用最高的相关性得分。

- **tie_breaker**

  0到1.0之间的浮点数，用于增加匹配多个查询子句的文档的相关性得分。默认为0.0。您可以使用tie_breaker值为在多个字段中包含相同术语的文档分配较高的相关性分数，而不是只在多个字段中包含该术语的文档中最好的一个，而不会将其与多个字段中两个不同术语的较好情况相混淆。如果一个文档匹配多个子句，dis_max查询将计算该文档的相关分数，如下所示:

  1. 从具有最高分数的匹配子句中获取关联分数。
  2. 将任何其他匹配子句的得分乘以tie_breaker值。
  3. 把最高的分数加到相乘的分数上。

  如果tie_breaker值大于0.0，所有匹配的子句都算数，但是分数最高的子句算数最多。

### 例子

```
#1、创建索引
PUT /dismaxmxsm
{
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1
    },
    "mappings": {
            "properties": {
                "title": {
                    "type":"text"
                },
                "content": {
                    "type":"text"
                }
        }
    }
}

#2、创建数据
PUT  /dismaxmxsm/_doc/1 
{
  "title" : "Java",  
  "content" : "Javajava" 
}
PUT  /dismaxmxsm/_doc/2
{
  "title" : "GO", 
  "content" : "Development GO"
}
PUT  /dismaxmxsm/_doc/3
{
  "title" :"python", 
  "content" :"Python development beginner"
}
```

#### 用should查询

```json
GET dismaxmxsm/_search
{
    "query": {
        "bool": {
            "should": [
                { "match": { "title": "java " }},
                { "match": { "content":  "java beginner" }}
            ]
        }
    }
}
```

结果：

```
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 0.9808291,
    "hits" : [
      {
        "_index" : "dismaxmxsm",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.9808291,
        "_source" : {
          "title" : "Java",
          "content" : "Javajava"
        }
      },
      {
        "_index" : "dismaxmxsm",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.81427324,
        "_source" : {
          "title" : "python",
          "content" : "Python development beginner"
        }
      }
    ]
  }
}
```

#### 用dis_max查询

```json
GET dismaxmxsm/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "title": "java" }},
                { "match": { "content":  "java beginner" }}
            ]
            , "tie_breaker": 0.7
        }
    }
}
```

结果：

```
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 0.9808291,
    "hits" : [
      {
        "_index" : "dismaxmxsm",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.9808291,
        "_source" : {
          "title" : "Java",
          "content" : "Javajava"
        }
      },
      {
        "_index" : "dismaxmxsm",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.81427324,
        "_source" : {
          "title" : "python",
          "content" : "Python development beginner"
        }
      }
    ]
  }
}

```

