---
title: Elasticsearch-元数据
categories:
  - 数据库
  - elasticsearch
  - Mapping
tags:
  - 数据库
  - elasticsearch
  - 索引
  - Mapping
  - 元数据
abbrlink: 3ecb808c
date: 2020-02-15 19:05:00
---

> 注意：以下语法都是基于Elasticsearch的7.6版本

### 元数据字段

每个文档都有与之相关联的元数据，比如 \_index、mapping \_type和 \_id元字段。在创建映射类型时，可以定制其中一些元字段的行为。

#### 身份元数据

| 元数据     | 说明             |
| ---------- | ---------------- |
| **_index** | 文档属于那个索引 |
| **_type**  | 文档所属类型     |
| **_id**    | 文档的唯一标识   |

#### 文档元数据

| 元数据      | 说明                   |
| ----------- | ---------------------- |
| **_source** | 表示文档主体的原始JSON |
| **_size**   | _source字段的大小      |

#### 索引的元数据

| 元数据           | 说明                             |
| ---------------- | -------------------------------- |
| **_field_names** | 文档中包含非空值的所有字段       |
| **_ignored**     | 在索引时被忽略的文档中的所有字段 |

#### 路由元数据

| 元数据       | 说明                               |
| ------------ | ---------------------------------- |
| **_routing** | 自定义路由值将文档路由到特定的分片 |

#### 其他元数据

| 元数据    | 说明                   |
| --------- | ---------------------- |
| **_meta** | 应用程序的特定元数据。 |

### 元数据详解

下面来一一说明这些元数据。

#### _index元数据

在跨多个索引执行查询时，有时需要添加仅与特定索引的文档相关联的查询子句。_index字段允许对索引到的文档的索引进行匹配。它的值可以在某些查询和聚合中访问，也可以在排序或编写脚本时访问：

```json
PUT index_1/_doc/1
{
  "text": "Document in index 1"
}

PUT index_2/_doc/2?refresh=true
{
  "text": "Document in index 2"
}

GET index_1,index_2/_search
{
  "query": {
    "terms": {
      "_index": ["index_1", "index_2"] 
    }
  },
  "aggs": {
    "indices": {
      "terms": {
        "field": "_index", 
        "size": 10
      }
    }
  },
  "sort": [
    {
      "_index": { 
        "order": "asc"
      }
    }
  ],
  "script_fields": {
    "index_name": {
      "script": {
        "lang": "painless",
        "source": "doc['_index']" 
      }
    }
  }
}

```

