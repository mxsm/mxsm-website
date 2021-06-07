---
title: RocketMQ源码解析-Broker存储配置文件说明
date: 2021-06-07
weight: 202106072048
---

> RocketMQ版本4..8.0版本

### 1. Broker store config 下面的文件

在Broker启动后在 **`$HOME \store\config`** 路径下面有五个文件分别是：

- **consumerFilter.json**
- **consumerOffset.json**
- **delayOffset.json**
- **subscriptionGroup.json**
- **topics.json**

### 2. consumerFilter.json

### 3. consumerOffset.json

记录该broker上针对每个topic的每个consumer group的针对每个queue的消费位移

```json
{
	"offsetTable":{
		"%RETRY%please_rename_unique_group_name@please_rename_unique_group_name":{0:0
		},
		"TopicTest@please_rename_unique_group_name":{0:6,1:3,2:3,3:2
		}
	}
}
```

#### 4. delayOffset.json

记录该broker延迟队列的消费位移情况，1:1中1表示延迟粒度，1表示位移

```json
{
	"offsetTable":{1:1
	}
}
```

### 5. subscriptionGroup.json

记录该broker上各类订阅关系

```json
{
	"dataVersion":{
		"counter":1,
		"timestamp":1622907213308
	},
	"subscriptionGroupTable":{
		"SELF_TEST_C_GROUP":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"SELF_TEST_C_GROUP",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"CID_ONSAPI_OWNER":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"CID_ONSAPI_OWNER",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"CID_ONSAPI_PERMISSION":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"CID_ONSAPI_PERMISSION",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"please_rename_unique_group_name":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"please_rename_unique_group_name",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"TOOLS_CONSUMER":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"TOOLS_CONSUMER",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"CID_ONS-HTTP-PROXY":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"CID_ONS-HTTP-PROXY",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"FILTERSRV_CONSUMER":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"FILTERSRV_CONSUMER",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		},
		"CID_ONSAPI_PULL":{
			"brokerId":0,
			"consumeBroadcastEnable":true,
			"consumeEnable":true,
			"consumeFromMinEnable":true,
			"groupName":"CID_ONSAPI_PULL",
			"notifyConsumerIdsChangedEnable":true,
			"retryMaxTimes":16,
			"retryQueueNums":1,
			"whichBrokerWhenConsumeSlowly":1
		}
	}
}
```

### 6. topics.json

记录该broker上各topic信息，包括queue信息、读写权限

```json
{
	"dataVersion":{
		"counter":3,
		"timestamp":1622907213314
	},
	"topicConfigTable":{
		"SCHEDULE_TOPIC_XXXX":{
			"order":false,
			"perm":6,
			"readQueueNums":18,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"SCHEDULE_TOPIC_XXXX",
			"topicSysFlag":0,
			"writeQueueNums":18
		},
		"TopicTest":{
			"order":false,
			"perm":6,
			"readQueueNums":4,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"TopicTest",
			"topicSysFlag":0,
			"writeQueueNums":4
		},
		"SELF_TEST_TOPIC":{
			"order":false,
			"perm":6,
			"readQueueNums":1,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"SELF_TEST_TOPIC",
			"topicSysFlag":0,
			"writeQueueNums":1
		},
		"DefaultCluster":{
			"order":false,
			"perm":7,
			"readQueueNums":16,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"DefaultCluster",
			"topicSysFlag":0,
			"writeQueueNums":16
		},
		"DefaultCluster_REPLY_TOPIC":{
			"order":false,
			"perm":6,
			"readQueueNums":1,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"DefaultCluster_REPLY_TOPIC",
			"topicSysFlag":0,
			"writeQueueNums":1
		},
		"DESKTOP-B7KDPBT":{
			"order":false,
			"perm":7,
			"readQueueNums":1,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"DESKTOP-B7KDPBT",
			"topicSysFlag":0,
			"writeQueueNums":1
		},
		"RMQ_SYS_TRANS_HALF_TOPIC":{
			"order":false,
			"perm":6,
			"readQueueNums":1,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"RMQ_SYS_TRANS_HALF_TOPIC",
			"topicSysFlag":0,
			"writeQueueNums":1
		},
		"%RETRY%please_rename_unique_group_name":{
			"order":false,
			"perm":6,
			"readQueueNums":1,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"%RETRY%please_rename_unique_group_name",
			"topicSysFlag":0,
			"writeQueueNums":1
		},
		"TBW102":{
			"order":false,
			"perm":7,
			"readQueueNums":8,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"TBW102",
			"topicSysFlag":0,
			"writeQueueNums":8
		},
		"BenchmarkTest":{
			"order":false,
			"perm":6,
			"readQueueNums":1024,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"BenchmarkTest",
			"topicSysFlag":0,
			"writeQueueNums":1024
		},
		"OFFSET_MOVED_EVENT":{
			"order":false,
			"perm":6,
			"readQueueNums":1,
			"topicFilterType":"SINGLE_TAG",
			"topicName":"OFFSET_MOVED_EVENT",
			"topicSysFlag":0,
			"writeQueueNums":1
		}
	}
}
```

