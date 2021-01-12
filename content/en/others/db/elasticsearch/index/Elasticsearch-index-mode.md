---
title: Elasticsearch-索引模式
categories:
  - 数据库
  - elasticsearch
  - index
tags:
  - 数据库
  - elasticsearch
  - 索引
abbrlink: c3654f9
date: 2020-02-14 23:14:00
---

> 注意：以下语法都是基于Elasticsearch的7.6版本

### 索引模式

之前介绍过，在ES中index相当于关系数据库中的数据库实例。下面来看一下index的一些设置

### 索引的设置

可以为每一个索引设置级别，如下：

- ***静态索引(static)***

  只能在创建索引或者在关闭的索引上面设置

- ***动态索引dynamic***

  可以使用[update-index-settings API](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-update-settings.html)在活动索引上更改它们。

> 注意：更改关闭索引上的静态或动态索引设置可能导致错误的设置，如果不删除和重新创建索引，就无法纠正这些错误

#### 静态索引设置

下面列举了所有的与任何特殊索引无关的静态索引的配置：

- **index.number_of_shards**

  索引应该具有的主分片数量， **默认值为：1，同时这个设置只能在索引创建的时候，不能再关闭了的索引上面进行修改。索引（index）分片的最大值为1024** 。  这个设置以防止由于资源分配而意外创建可能破坏集群稳定的索引。通过 **export ES_JAVA_OPTS="-Des.index.max_number_of_shards=128"** 来设置。

- **index.shard.check_on_startup**

  是否应该在打开之前检查分片是否损坏。当检测到损坏时，它将阻止碎片被打开

  - **false**

    默认值

  - **checksum**

    检查是否物理损坏

  - **true**

    检查物理损坏和逻辑损坏

  > 注意： 检查分片可能花费很多时间，在一个很大的索引上面

- **index.codec**

  默认值使用LZ4压缩压缩存储的数据，但是可以将这个值设置为best_compression，它使用DEFLATE获得更高的压缩比，代价是降低存储字段的性能。如果您正在更新压缩类型，则新的压缩类型将在段合并后应用。段合并可以使用强制合并来强制执行。

- **index.routing_partition_size**

  自定义路由值可以转到的碎片数。默认值为1，只能在创建索引时设置。这个值必须小于索引。除非索引是number_of_shards。number_of_shards的值也是1。有关如何使用此设置的详细信息，[请参阅路由到索引分区](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-routing-field.html#routing-index-partition)。

- **index.load_fixed_bitset_filters_eagerly**

  指示是否为嵌套查询预先加载缓存的筛选器。可能的值为true(默认值)和false。

#### 动态索引设置

- **index.number_of_replicas**

  每个主分片副本的数量，默认值：1

- **index.auto_expand_replicas**

  根据集群中数据节点的数量自动扩展副本的数量。设置为以破折号分隔的下界和上界(例如0-5)，或将all用于上界(例如0-all)。默认为false(即禁用)。注意auto-expanded数量的副本只需要配置过滤规则,但是忽略了其他的分配规则,如碎片分配每个节点感知和总碎片,这可能导致集群健康成为黄色如果适用的规则防止所有的副本分配。

- **index.search.idle.after**

  设置分片被认为搜索无效，不能接收搜索或获取请求的时间。（**默认值30s**）

- **index.refresh_interval**

  执行刷新操作的频率，使对索引的最新更改对搜索可见。默认为1。可以设置为-1以禁用刷新。如果没有显式设置此设置，则至少index.search.idle没有看到搜索流量的分片。秒后将不会收到背景刷新，直到他们收到一个搜索请求。在等待刷新的地方遇到空闲分片的搜索将等待下一次后台刷新(在1秒内)。此行为的目的是在不执行搜索的默认情况下自动优化批量索引。为了避免这种行为，应该将1s的显式值设置为刷新间隔。

- **`index.max_inner_result_window`**

  The maximum value of `from + size` for inner hits definition and top hits aggregations to this index. Defaults to `100`. Inner hits and top hits aggregation take heap memory and time proportional to `from + size` and this limits that memory.

- **`index.max_rescore_window`**

  The maximum value of `window_size` for `rescore` requests in searches of this index. Defaults to `index.max_result_window` which defaults to `10000`. Search requests take heap memory and time proportional to `max(window_size, from + size)` and this limits that memory.

- **`index.max_docvalue_fields_search`**

  The maximum number of `docvalue_fields` that are allowed in a query. Defaults to `100`. Doc-value fields are costly since they might incur a per-field per-document seek.

- **`index.max_script_fields`**

  The maximum number of `script_fields` that are allowed in a query. Defaults to `32`.

- **`index.max_ngram_diff`**

  The maximum allowed difference between min_gram and max_gram for NGramTokenizer and NGramTokenFilter. Defaults to `1`.

- **`index.max_shingle_diff`**

  The maximum allowed difference between max_shingle_size and min_shingle_size for ShingleTokenFilter. Defaults to `3`.

- **`index.blocks.read_only`**

  Set to `true` to make the index and index metadata read only, `false` to allow writes and metadata changes.

- **`index.blocks.read_only_allow_delete`**

  Similar to `index.blocks.read_only` but also allows deleting the index to free up resources. The [disk-based shard allocator](https://www.elastic.co/guide/en/elasticsearch/reference/current/disk-allocator.html) may add and remove this block automatically.

- **`index.blocks.read`**

  Set to `true` to disable read operations against the index.

- **`index.blocks.write`**

  Set to `true` to disable data write operations against the index. Unlike `read_only`, this setting does not affect metadata. For instance, you can close an index with a `write` block, but not an index with a `read_only` block.

- **`index.blocks.metadata`**

  Set to `true` to disable index metadata reads and writes.

- **`index.max_refresh_listeners`**

  Maximum number of refresh listeners available on each shard of the index. These listeners are used to implement [`refresh=wait_for`](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-refresh.html).

- **`index.analyze.max_token_count`**

  The maximum number of tokens that can be produced using _analyze API. Defaults to `10000`.

- **`index.highlight.max_analyzed_offset`**

  The maximum number of characters that will be analyzed for a highlight request. This setting is only applicable when highlighting is requested on a text that was indexed without offsets or term vectors. Defaults to `1000000`.

- **`index.max_terms_count`**

  The maximum number of terms that can be used in Terms Query. Defaults to `65536`.

- **`index.max_regex_length`**

  The maximum length of regex that can be used in Regexp Query. Defaults to `1000`.

- **`index.routing.allocation.enable`**

  Controls shard allocation for this index. It can be set to:`all` (default) - Allows shard allocation for all shards.`primaries` - Allows shard allocation only for primary shards.`new_primaries` - Allows shard allocation only for newly-created primary shards.`none` - No shard allocation is allowed.

- **`index.routing.rebalance.enable`**

  Enables shard rebalancing for this index. It can be set to:`all` (default) - Allows shard rebalancing for all shards.`primaries` - Allows shard rebalancing only for primary shards.`replicas` - Allows shard rebalancing only for replica shards.`none` - No shard rebalancing is allowed.

- **`index.gc_deletes`**

  The length of time that a [deleted document’s version number](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete.html#delete-versioning) remains available for [further versioned operations](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html#index-versioning). Defaults to `60s`.

- **`index.default_pipeline`**

  The default [ingest node](https://www.elastic.co/guide/en/elasticsearch/reference/current/ingest.html) pipeline for this index. Index requests will fail if the default pipeline is set and the pipeline does not exist. The default may be overridden using the `pipeline` parameter. The special pipeline name `_none` indicates no ingest pipeline should be run.

- **`index.final_pipeline`**

  The final [ingest node](https://www.elastic.co/guide/en/elasticsearch/reference/current/ingest.html) pipeline for this index. Index requests will fail if the final pipeline is set and the pipeline does not exist. The final pipeline always runs after the request pipeline (if specified) and the default pipeline (if it exists). The special pipeline name `_none` indicates no ingest pipeline will run.



