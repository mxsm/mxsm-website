---
title: Elasticsearch复合查询-Constant score query查询
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
  - Constant score query
  - Elasticsearch复合查询
abbrlink: '49285978'
date: 2020-02-15 14:48:00
---

> 注意：以下语法都是基于Elasticsearch的7.6版本

### Constant score query

包装筛选器查询，并返回每个匹配的文档，其相关性得分等于boost参数值。

```json
POST twitter/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "match": {
         "content":"apple"
        }
      },
      "boost": 100
    }
  }
}
```

- **filter**

  (必选，查询对象)筛选您希望运行的查询。任何返回的文档都必须匹配此查询。过滤查询不计算相关分数。为了提高性能，Elasticsearch自动缓存常用的过滤查询。

- **boost**

  (可选，浮点数)浮点数用作与筛选器查询匹配的每个文档的常数相关分数。默认为1.0。

结果：

```json
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 3,
    "successful" : 3,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 100.0,
    "hits" : [
      {
        "_index" : "twitter",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 100.0,
        "_source" : {
          "content" : "Apple iPad"
        }
      },
      {
        "_index" : "twitter",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 100.0,
        "_source" : {
          "content" : "Apple employee like Apple Pie and Apple Juice"
        }
      },
      {
        "_index" : "twitter",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 100.0,
        "_source" : {
          "content" : "Apple Mac"
        }
      }
    ]
  }
}

```

