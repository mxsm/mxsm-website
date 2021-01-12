---
title: Elasticsearch复合查询-Boolean查询
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
abbrlink: ee006fe
date: 2020-02-14 23:15:00
---

> 注意：以下语法都是基于Elasticsearch的7.6版本

### 布尔查询

Bool查询语法有以下特点

1. 子查询可以任意顺序出现
2. 可以嵌套多个查询，包括bool查询
3. 如果bool查询中没有must条件，should中必须至少满足一条才会返回结果。

匹配文档与其他查询的布尔组合的查询。bool查询映射到Lucene BooleanQuery。它是使用一个或多个布尔子句构建的，每个子句都有一个类型化的出现，发生类型

| 发生类型   | 描述                                                         |
| ---------- | ------------------------------------------------------------ |
| `must`     | 子句(查询)必须出现在匹配的文档中，并对分数有贡献(**必须匹配。贡献算分**) |
| `filter`   | 子句(查询)必须出现在匹配的文档中。但是与“必须”不同的是，查询的分数将被忽略。筛选器子句在筛选器上下文中执行，这意味着忽略评分，并考虑子句用于缓存。(**过滤子句，必须匹配，但不贡献算分**) |
| `should`   | 子句(查询)应该出现在匹配的文档中（**选择性匹配，至少满足一条。贡献算分**） |
| `must_not` | 子句(查询)不能出现在匹配的文档中。子句在筛选器上下文中执行，这意味着忽略评分，而子句用于缓存。因为忽略了评分，所以返回所有文档的“0”评分。(**过滤子句，必须不能匹配，但不贡献算分**) |

bool查询采用的是“匹配越多越好”的方法，因此来自每个匹配的must或should子句的分数将被添加到一起，以提供每个文档的最终_score。例子：

```json
POST _search
{
  "query": {
    "bool" : {
      "must" : {
        "term" : { "user" : "kimchy" }
      },
      "filter": {
        "term" : { "tag" : "tech" }
      },
      "must_not" : {
        "range" : {
          "age" : { "gte" : 10, "lte" : 20 }
        }
      },
      "should" : [
        { "term" : { "tag" : "wow" } },
        { "term" : { "tag" : "elasticsearch" } }
      ],
      "minimum_should_match" : 1,
      "boost" : 1.0
    }
  }
}
```

#### 使用minimum_should_match

可以使用minimum_should_match参数指定返回的文档必须匹配的should子句的数量或百分比。如果bool查询包含至少一个should子句和没有 must或filter子句，则默认值为1。否则，默认值为0。其他的值[minimum_should_match](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-minimum-should-match.html)。

#### 用bool.filter评分

在筛选器元素下指定的查询对评分没有影响—返回的分数为0。分数只受指定查询的影响。例如，以下三个查询都返回status字段中包含术语active的所有文档。第一个查询为所有文档赋值0分，因为没有指定打分查询：

```json
GET _search
{
  "query": {
    "bool": {
      "filter": {
        "term": {
          "status": "active"
        }
      }
    }
  }
}
```

这个bool查询有一个match_all查询，它为所有文档赋值1.0

```json
GET _search
{
  "query": {
    "bool": {
      "must": {
        "match_all": {}
      },
      "filter": {
        "term": {
          "status": "active"
        }
      }
    }
  }
}
```

这个constant_score查询的行为与上面的第二个示例完全相同。constant_score查询为筛选器匹配的所有文档分配1.0分。

```json
GET _search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "status": "active"
        }
      }
    }
  }
}
```

