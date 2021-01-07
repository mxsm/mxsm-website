---
title: Elasticsearch复合查询-boosting query查询
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
  - boosting query查询
  - Elasticsearch复合查询
abbrlink: '140492e8'
date: 2020-02-15 14:36:00
---

> 注意：以下语法都是基于Elasticsearch的7.6版本

### boosting query

在前面的boolean的复合查询我们可以通过`must_not+must` 先剔除不想匹配的文档，再获取匹配的文档，但是有一种场景就是我并不需要完全剔除，而是把需要剔除的那部分文档的分数降低。这个时候就可以使用boosting query。下面会举例说明（官方例子）：

```json
GET /_search
{
    "query": {
        "boosting" : {
            "positive" : {
                "term" : {
                    "text" : "apple"
                }
            },
            "negative" : {
                 "term" : {
                     "text" : "pie tart fruit crumble tree"
                }
            },
            "negative_boost" : 0.5
        }
    }
}
```

```
说明`boosting需要搭配三个关键字 `positive` , `negative` , `negative_boost
```

只有匹配了 **positive查询** 的文档才会被包含到结果集中，但是同时匹配了**negative查询** 的文档会被降低其相关度，通过将文档原本的`_score和negative_boost`参数进行

相乘来得到新的_score。因此，`negative_boost参数一般小于1.0`。在上面的例子中，任何包含了指定负面词条的文档的`_score`都会是其原本_score的一半。