---
title: RocketMQ源码解析-Broker消息存储CommitLog
categories:
  - MQ
  - RocketMQ
  - Broker
tags:
  - MQ
  - RocketMQ
  - Broker源码解析
  - 消息存储机制
  - CommitLog
abbrlink: 6c818462
date: 2020-03-21 23:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### 1 CommitLog格式

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/CommitLog%E8%AE%B0%E5%BD%95%E6%A0%BC%E5%BC%8F.png?raw=true)

### 2 CommitLog持久化过程

这里我们通过分析源码来看一下从生产者把数据提交到Broker然后如何写入到磁盘上的CommitLog文件中的。

首先Broker模块中BrokerStartu类作为主启动类：

```java
public static void main(String[] args) {
    start(createBrokerController(args));
}
```

通过调用 **`createBrokerController`** 方法来创建BrokerController。在 **`createBrokerController`** 方法中有一个有这样一段代码：

```java
 final BrokerController controller = new BrokerController(
                brokerConfig,
                nettyServerConfig,
                nettyClientConfig,
                messageStoreConfig);
            // remember all configs to prevent discard
            controller.getConfiguration().registerConfig(properties);
			
            boolean initResult = controller.initialize();
```

通过 **`controller.initialize()`** 来对 **BrokerController** 来进行初始化。在初始的过程中，创建了用来处理处理生产者发送的MQ消息数据的类，这个类叫做 **`SendMessageProcessor`** 。这个类在 **controller.initialize()** 通过 **BrokerController.registerProcessor** 方法来注入。

```java
public boolean initialize() throws CloneNotSupportedException {
    
    //省略代码
   this.registerProcessor();
    
    //省略代码
    
}


public void registerProcessor() {
        /**
         * SendMessageProcessor
         */
        SendMessageProcessor sendProcessor = new SendMessageProcessor(this);
        sendProcessor.registerSendMessageHook(sendMessageHookList);
        sendProcessor.registerConsumeMessageHook(consumeMessageHookList);

        this.remotingServer.registerProcessor(RequestCode.SEND_MESSAGE, sendProcessor, this.sendMessageExecutor);
        this.remotingServer.registerProcessor(RequestCode.SEND_MESSAGE_V2, sendProcessor, this.sendMessageExecutor);
        this.remotingServer.registerProcessor(RequestCode.SEND_BATCH_MESSAGE, sendProcessor, this.sendMessageExecutor);
        this.remotingServer.registerProcessor(RequestCode.CONSUMER_SEND_MSG_BACK, sendProcessor, this.sendMessageExecutor);
        this.fastRemotingServer.registerProcessor(RequestCode.SEND_MESSAGE, sendProcessor, this.sendMessageExecutor);
        this.fastRemotingServer.registerProcessor(RequestCode.SEND_MESSAGE_V2, sendProcessor, this.sendMessageExecutor);
        this.fastRemotingServer.registerProcessor(RequestCode.SEND_BATCH_MESSAGE, sendProcessor, this.sendMessageExecutor);
        this.fastRemotingServer.registerProcessor(RequestCode.CONSUMER_SEND_MSG_BACK, sendProcessor, this.sendMessageExecutor);
 
 	//后续代码省略
 }
```

 所以通过上面的分析处理消息主要是通过 **`SendMessageProcessor`** 来进行处理。

接下来看一下 **`SendMessageProcessor`** 的源码：

```java
public class SendMessageProcessor extends AbstractSendMessageProcessor implements NettyRequestProcessor {
	
}
```

主要是通过继承 **AbstractSendMessageProcessor** 抽象类和实现 **NettyRequestProcessor** 两个接口。数据处理主要是通过实现 **`NettyRequestProcessor.processRequest`** 方法来处理各种不同类型的消息。看一下 **`SendMessageProcessor.processRequest`** 的实现：

```java
@Override
    public RemotingCommand processRequest(ChannelHandlerContext ctx,
                                          RemotingCommand request) throws RemotingCommandException {
        RemotingCommand response = null;
        try {
            response = asyncProcessRequest(ctx, request).get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("process SendMessage error, request : " + request.toString(), e);
        }
        return response;
    }
```

> 两个参数：
>
> - ctx ： netty的相关参数
> - request： 类型RemotingCommand，这个是RocketMQ的消息协议的抽象(rocketmq-模块设计的文章)

然后调用 **`asyncProcessRequest`** 来获取结果。接下来看一下这个方法的实现：

> 注意： 从方法名称来看是一个异步的调用过程，但是通过等待返回值来达到一个同步的过程。其实在后台的很多实现都是异步调用，然后通过等待返回结果实现同步的过程。

```java
public CompletableFuture<RemotingCommand> asyncProcessRequest(ChannelHandlerContext ctx,
                                                                  RemotingCommand request) throws RemotingCommandException {
        final SendMessageContext mqtraceContext;
        switch (request.getCode()) {
                ///这个分支是消费失败将消息重新发回Broker才会走
            case RequestCode.CONSUMER_SEND_MSG_BACK:
                return this.asyncConsumerSendMsgBack(ctx, request);
            default:
                SendMessageRequestHeader requestHeader = parseRequestHeader(request);
                if (requestHeader == null) {
                    return CompletableFuture.completedFuture(null);
                }
                mqtraceContext = buildMsgContext(ctx, requestHeader);
                //SendMessageHook 接口的处理
                this.executeSendMessageHookBefore(ctx, request, mqtraceContext);
                if (requestHeader.isBatch()) {
                    //批量消息处理
                    return this.asyncSendBatchMessage(ctx, request, mqtraceContext, requestHeader);
                } else {
                    //单个消息处理
                    return this.asyncSendMessage(ctx, request, mqtraceContext, requestHeader);
                }
        }
    }
```

上面处理数据就是两大类数据：

- 消费失败的数据RequestCode.CONSUMER_SEND_MSG_BACK
- 生产者的发送数据，这个数据又包含两大类
  - RequestCode.SEND_BATCH_MESSAGE 批量数据
  - RequestCode.SEND_MESSAGE_V2 和 RequestCode.SEND_MESSAGE 单个数据 (只是版本不一样)

所以上面主要有两类处理一个是单个消息 **`asyncSendMessage`** f方法和 **`asyncSendBatchMessage`** 处理批量发送的数据。这里只分析单个数据的存储(多个数据原理差不多)。

首先是对数据进行处理和一些前期的校验如下代码：

```java
final RemotingCommand response = preSend(ctx, request, requestHeader);
        final SendMessageResponseHeader responseHeader = (SendMessageResponseHeader)response.readCustomHeader();

        if (response.getCode() != -1) {
            return CompletableFuture.completedFuture(response);
        }

        final byte[] body = request.getBody();

        int queueIdInt = requestHeader.getQueueId();
        TopicConfig topicConfig = this.brokerController.getTopicConfigManager().selectTopicConfig(requestHeader.getTopic());

        if (queueIdInt < 0) {
            queueIdInt = randomQueueId(topicConfig.getWriteQueueNums());
        }
```

然后构建 **`MessageExtBrokerInner`** 在Broker内部使用的对象类,这里主要是设置一些Broker的信息到消息中如下：

```java
MessageExtBrokerInner msgInner = new MessageExtBrokerInner();
        msgInner.setTopic(requestHeader.getTopic());
        msgInner.setQueueId(queueIdInt);

        if (!handleRetryAndDLQ(requestHeader, response, request, msgInner, topicConfig)) {
            return CompletableFuture.completedFuture(response);
        }

        msgInner.setBody(body);
        msgInner.setFlag(requestHeader.getFlag());
        MessageAccessor.setProperties(msgInner, MessageDecoder.string2messageProperties(requestHeader.getProperties()));
        msgInner.setPropertiesString(requestHeader.getProperties());
        msgInner.setBornTimestamp(requestHeader.getBornTimestamp());
        msgInner.setBornHost(ctx.channel().remoteAddress());
        msgInner.setStoreHost(this.getStoreHost());
        msgInner.setReconsumeTimes(requestHeader.getReconsumeTimes() == null ? 0 : requestHeader.getReconsumeTimes());
```

然后就是存储消息处理：

```java
CompletableFuture<PutMessageResult> putMessageResult = null;
Map<String, String> origProps = MessageDecoder.string2messageProperties(requestHeader.getProperties());
String transFlag = origProps.get(MessageConst.PROPERTY_TRANSACTION_PREPARED);
//判断是否为事务消息
if (transFlag != null && Boolean.parseBoolean(transFlag)) {
    if (this.brokerController.getBrokerConfig().isRejectTransactionMessage()) {
        response.setCode(ResponseCode.NO_PERMISSION);
        response.setRemark(
                "the broker[" + this.brokerController.getBrokerConfig().getBrokerIP1()
                        + "] sending transaction message is forbidden");
        return CompletableFuture.completedFuture(response);
    }
    putMessageResult = this.brokerController.getTransactionalMessageService().asyncPrepareMessage(msgInner);
} else {
    putMessageResult = this.brokerController.getMessageStore().asyncPutMessage(msgInner);
}
return handlePutMessageResultFuture(putMessageResult, response, request, msgInner, responseHeader, mqtraceContext, ctx, queueIdInt);
```

这里有消息分为两种：

- 事务消息(以后分析处理)
- 普通消息

存储通过调用 **`MessageStore.asyncPutMessage`** 方法，而 **`MessageStore`** 的实现为 **DefaultMessageStore** 。 看一下 **`DefaultMessageStore.asyncPutMessage`** 实现：

```java
    @Override
    public CompletableFuture<PutMessageResult> asyncPutMessage(MessageExtBrokerInner msg) {

        //检测存储状态
        PutMessageStatus checkStoreStatus = this.checkStoreStatus();
        if (checkStoreStatus != PutMessageStatus.PUT_OK) {
            return CompletableFuture.completedFuture(new PutMessageResult(checkStoreStatus, null));
        }

        //校验消息的topic和Properties
        PutMessageStatus msgCheckStatus = this.checkMessage(msg);
        if (msgCheckStatus == PutMessageStatus.MESSAGE_ILLEGAL) {
            return CompletableFuture.completedFuture(new PutMessageResult(msgCheckStatus, null));
        }

        long beginTime = this.getSystemClock().now();
        //消息处理
        CompletableFuture<PutMessageResult> putResultFuture = this.commitLog.asyncPutMessage(msg);

        putResultFuture.thenAccept((result) -> {
            long elapsedTime = this.getSystemClock().now() - beginTime;
            if (elapsedTime > 500) {
                log.warn("putMessage not in lock elapsed time(ms)={}, bodyLength={}", elapsedTime, msg.getBody().length);
            }
            this.storeStatsService.setPutMessageEntireTimeMax(elapsedTime);

            if (null == result || !result.isOk()) {
                this.storeStatsService.getPutMessageFailedTimes().incrementAndGet();
            }
        });

        return putResultFuture;
    }
```

通过 **`CommitLog.asyncPutMessage`** 方法来持久化数据，在这个方法中主要主要做了三件事情：

- 设置消息Body的CRC校验，后期读取数据要用到。

  ```java
  public CompletableFuture<PutMessageResult> asyncPutMessage(final MessageExtBrokerInner msg) {
          //设置存储的时间
          msg.setStoreTimestamp(System.currentTimeMillis());
          //设置CRC的校验值
          msg.setBodyCRC(UtilAll.crc32(msg.getBody()));
      
      // ..........省略代码
  }
  ```

- 延迟消息的处理

  ```java
  public CompletableFuture<PutMessageResult> asyncPutMessage(final MessageExtBrokerInner msg) {
  
      //省略代码
      if (tranType == MessageSysFlag.TRANSACTION_NOT_TYPE
                  || tranType == MessageSysFlag.TRANSACTION_COMMIT_TYPE) {
              // Delay Delivery
              if (msg.getDelayTimeLevel() > 0) {
                  if (msg.getDelayTimeLevel() > this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel()) {
                      msg.setDelayTimeLevel(this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel());
                  }
  
                  topic = ScheduleMessageService.SCHEDULE_TOPIC;
                  queueId = ScheduleMessageService.delayLevel2QueueId(msg.getDelayTimeLevel());
  
                  // Backup real topic, queueId
                  MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_TOPIC, msg.getTopic());
                  MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_QUEUE_ID, String.valueOf(msg.getQueueId()));
                  msg.setPropertiesString(MessageDecoder.messageProperties2String(msg.getProperties()));
  
                  msg.setTopic(topic);
                  msg.setQueueId(queueId);
              }
          }
      
      //省略代码
  }
  ```

  这里是处理不同延迟等级的延迟消费消息的数据。

- CommitLog的数据处理

  message消息的处理也分为了三步：

  1. CommitLog的提交

     ```java
      public CompletableFuture<PutMessageResult> asyncPutMessage(final MessageExtBrokerInner msg) {
          //省略代码
          putMessageLock.lock(); //spin or ReentrantLock ,depending on store config
             try {
                 long beginLockTimestamp = this.defaultMessageStore.getSystemClock().now();
                 this.beginTimeInLock = beginLockTimestamp;
     
                 // Here settings are stored timestamp, in order to ensure an orderly
                 // global
                 msg.setStoreTimestamp(beginLockTimestamp);
     
                 if (null == mappedFile || mappedFile.isFull()) {
                     mappedFile = this.mappedFileQueue.getLastMappedFile(0); // Mark: NewFile may be cause noise
                 }
                 if (null == mappedFile) {
                     log.error("create mapped file1 error, topic: " + msg.getTopic() + " clientAddr: " + msg.getBornHostString());
                     beginTimeInLock = 0;
                     return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, null));
                 }
     			//关键代码--添加CommitLog日志消息
                 result = mappedFile.appendMessage(msg, this.appendMessageCallback);
                 switch (result.getStatus()) {
                     case PUT_OK:
                         break;
                     case END_OF_FILE:
                         unlockMappedFile = mappedFile;
                         // Create a new file, re-write the message
                         mappedFile = this.mappedFileQueue.getLastMappedFile(0);
                         if (null == mappedFile) {
                             // XXX: warn and notify me
                             log.error("create mapped file2 error, topic: " + msg.getTopic() + " clientAddr: " + msg.getBornHostString());
                             beginTimeInLock = 0;
                             return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, result));
                         }
                         result = mappedFile.appendMessage(msg, this.appendMessageCallback);
                         break;
                     case MESSAGE_SIZE_EXCEEDED:
                     case PROPERTIES_SIZE_EXCEEDED:
                         beginTimeInLock = 0;
                         return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.MESSAGE_ILLEGAL, result));
                     case UNKNOWN_ERROR:
                         beginTimeInLock = 0;
                         return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.UNKNOWN_ERROR, result));
                     default:
                         beginTimeInLock = 0;
                         return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.UNKNOWN_ERROR, result));
                 }
     
                 elapsedTimeInLock = this.defaultMessageStore.getSystemClock().now() - beginLockTimestamp;
                 beginTimeInLock = 0;
             } finally {
                 putMessageLock.unlock();
             }
          //省略代码
      }
     ```

  2. CommitLog的刷盘(同步刷盘和异步刷盘两种)

     ```java
     CompletableFuture<PutMessageStatus> flushResultFuture = submitFlushRequest(result, putMessageResult, msg);
     
         public CompletableFuture<PutMessageStatus> submitFlushRequest(AppendMessageResult result, PutMessageResult putMessageResult,
                                                                       MessageExt messageExt) {
             // 判断刷盘的方式---默认值为FlushDiskType.ASYNC_FLUSH 异步刷盘的方式
             if (FlushDiskType.SYNC_FLUSH == this.defaultMessageStore.getMessageStoreConfig().getFlushDiskType()) {
                 final GroupCommitService service = (GroupCommitService) this.flushCommitLogService;
                 if (messageExt.isWaitStoreMsgOK()) {
                     GroupCommitRequest request = new GroupCommitRequest(result.getWroteOffset() + result.getWroteBytes(),
                             this.defaultMessageStore.getMessageStoreConfig().getSyncFlushTimeout());
                     service.putRequest(request);
                     return request.future();
                 } else {
                     service.wakeup();
                     return CompletableFuture.completedFuture(PutMessageStatus.PUT_OK);
                 }
             }
             // Asynchronous flush
             else {
                 if (!this.defaultMessageStore.getMessageStoreConfig().isTransientStorePoolEnable()) {
                     flushCommitLogService.wakeup();
                 } else  {
                     commitLogService.wakeup();
                 }
                 return CompletableFuture.completedFuture(PutMessageStatus.PUT_OK);
             }
         }
     ```

     通过配置文件可以配置刷盘的方式，默认的刷盘方式为异步刷盘方式(根据官网的说明如果使用防止消息的丢失可以使用同步刷盘方式但是同步刷盘会影响并发)。

  3. 提交给Slave同步(同步和异步两种)

     ```java
     CompletableFuture<PutMessageStatus> replicaResultFuture = submitReplicaRequest(result, putMessageResult, msg);
     
     public CompletableFuture<PutMessageStatus> submitReplicaRequest(AppendMessageResult result, PutMessageResult putMessageResult,
                                                             MessageExt messageExt) {
         	//默认的是BrokerRole.ASYNC_MASTER 所以也是异步的方式
             if (BrokerRole.SYNC_MASTER == this.defaultMessageStore.getMessageStoreConfig().getBrokerRole()) {
                 HAService service = this.defaultMessageStore.getHaService();
                 if (messageExt.isWaitStoreMsgOK()) {
                     if (service.isSlaveOK(result.getWroteBytes() + result.getWroteOffset())) {
                         GroupCommitRequest request = new GroupCommitRequest(result.getWroteOffset() + result.getWroteBytes(),
                                 this.defaultMessageStore.getMessageStoreConfig().getSyncFlushTimeout());
                         service.putRequest(request);
                         service.getWaitNotifyObject().wakeupAll();
                         return request.future();
                     }
                     else {
                         return CompletableFuture.completedFuture(PutMessageStatus.SLAVE_NOT_AVAILABLE);
                     }
                 }
             }
             return CompletableFuture.completedFuture(PutMessageStatus.PUT_OK);
         }
     ```

上面可以通过官网的一个图片来说明这两种情况：

![](https://github.com/apache/rocketmq/raw/master/docs/cn/image/rocketmq_design_2.png)

通过上面的代码分析可以知道主要是通过：

```java
result = mappedFile.appendMessage(msg, this.appendMessageCallback);
```

这段代码把message持久化，在RocketMQ的所有的文件都是通过 **`MappedFile`** 包装进行处理的。下面来看一下 **`MappedFile.appendMessage`** 方法：

```java
    public AppendMessageResult appendMessage(final MessageExtBrokerInner msg, final AppendMessageCallback cb) {
        return appendMessagesInner(msg, cb);
    }
```

**`appendMessage`** 方法调用了 **`MappedFile.appendMessagesInner`** 的内部方法。

```java
    public AppendMessageResult appendMessagesInner(final MessageExt messageExt, final AppendMessageCallback cb) {
        assert messageExt != null;
        assert cb != null;

        int currentPos = this.wrotePosition.get();
		//当前偏移量和文件大小做比较
        if (currentPos < this.fileSize) {
            ByteBuffer byteBuffer = writeBuffer != null ? writeBuffer.slice() : this.mappedByteBuffer.slice();
            byteBuffer.position(currentPos);
            AppendMessageResult result;
            //同样这里区分了处理批量消息和单个消息
            if (messageExt instanceof MessageExtBrokerInner) {
                result = cb.doAppend(this.getFileFromOffset(), byteBuffer, this.fileSize - currentPos, (MessageExtBrokerInner) messageExt);
            } else if (messageExt instanceof MessageExtBatch) {
                result = cb.doAppend(this.getFileFromOffset(), byteBuffer, this.fileSize - currentPos, (MessageExtBatch) messageExt);
            } else {
                return new AppendMessageResult(AppendMessageStatus.UNKNOWN_ERROR);
            }
            this.wrotePosition.addAndGet(result.getWroteBytes());
            this.storeTimestamp = result.getStoreTimestamp();
            return result;
        }
        log.error("MappedFile.appendMessage return null, wrotePosition: {} fileSize: {}", currentPos, this.fileSize);
        return new AppendMessageResult(AppendMessageStatus.UNKNOWN_ERROR);
    }
```

通过代码发现代码里面通过调用 **`AppendMessageCallback.doAppend`** 来处理数据， 在 **`CommitLog`** 类**`AppendMessageCallback`** 中有一个 的内部类的实现 **`DefaultAppendMessageCallback`** 。

```java
public AppendMessageResult doAppend(final long fileFromOffset, final ByteBuffer byteBuffer, final int maxBlank,
            final MessageExtBrokerInner msgInner) {
            // STORETIMESTAMP + STOREHOSTADDRESS + OFFSET <br>

            // PHY OFFSET
            long wroteOffset = fileFromOffset + byteBuffer.position();

            int sysflag = msgInner.getSysFlag();

            int bornHostLength = (sysflag & MessageSysFlag.BORNHOST_V6_FLAG) == 0 ? 4 + 4 : 16 + 4;
            int storeHostLength = (sysflag & MessageSysFlag.STOREHOSTADDRESS_V6_FLAG) == 0 ? 4 + 4 : 16 + 4;
            ByteBuffer bornHostHolder = ByteBuffer.allocate(bornHostLength);
            ByteBuffer storeHostHolder = ByteBuffer.allocate(storeHostLength);

            this.resetByteBuffer(storeHostHolder, storeHostLength);
            String msgId;
            if ((sysflag & MessageSysFlag.STOREHOSTADDRESS_V6_FLAG) == 0) {
                msgId = MessageDecoder.createMessageId(this.msgIdMemory, msgInner.getStoreHostBytes(storeHostHolder), wroteOffset);
            } else {
                msgId = MessageDecoder.createMessageId(this.msgIdV6Memory, msgInner.getStoreHostBytes(storeHostHolder), wroteOffset);
            }

            // Record ConsumeQueue information
            keyBuilder.setLength(0);
            keyBuilder.append(msgInner.getTopic());
            keyBuilder.append('-');
            keyBuilder.append(msgInner.getQueueId());
            String key = keyBuilder.toString();
            Long queueOffset = CommitLog.this.topicQueueTable.get(key);
            if (null == queueOffset) {
                queueOffset = 0L;
                CommitLog.this.topicQueueTable.put(key, queueOffset);
            }

            // Transaction messages that require special handling
            final int tranType = MessageSysFlag.getTransactionValue(msgInner.getSysFlag());
            switch (tranType) {
                // Prepared and Rollback message is not consumed, will not enter the
                // consumer queuec
                case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
                case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
                    queueOffset = 0L;
                    break;
                case MessageSysFlag.TRANSACTION_NOT_TYPE:
                case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
                default:
                    break;
            }

            /**
             * Serialize message
             */
            final byte[] propertiesData =
                msgInner.getPropertiesString() == null ? null : msgInner.getPropertiesString().getBytes(MessageDecoder.CHARSET_UTF8);

            final int propertiesLength = propertiesData == null ? 0 : propertiesData.length;

            if (propertiesLength > Short.MAX_VALUE) {
                log.warn("putMessage message properties length too long. length={}", propertiesData.length);
                return new AppendMessageResult(AppendMessageStatus.PROPERTIES_SIZE_EXCEEDED);
            }

            final byte[] topicData = msgInner.getTopic().getBytes(MessageDecoder.CHARSET_UTF8);
            final int topicLength = topicData.length;

            final int bodyLength = msgInner.getBody() == null ? 0 : msgInner.getBody().length;

            final int msgLen = calMsgLength(msgInner.getSysFlag(), bodyLength, topicLength, propertiesLength);

            // Exceeds the maximum message
            if (msgLen > this.maxMessageSize) {
                CommitLog.log.warn("message size exceeded, msg total size: " + msgLen + ", msg body size: " + bodyLength
                    + ", maxMessageSize: " + this.maxMessageSize);
                return new AppendMessageResult(AppendMessageStatus.MESSAGE_SIZE_EXCEEDED);
            }

            // Determines whether there is sufficient free space
            if ((msgLen + END_FILE_MIN_BLANK_LENGTH) > maxBlank) {
                this.resetByteBuffer(this.msgStoreItemMemory, maxBlank);
                // 1 TOTALSIZE
                this.msgStoreItemMemory.putInt(maxBlank);
                // 2 MAGICCODE
                this.msgStoreItemMemory.putInt(CommitLog.BLANK_MAGIC_CODE);
                // 3 The remaining space may be any value
                // Here the length of the specially set maxBlank
                final long beginTimeMills = CommitLog.this.defaultMessageStore.now();
                byteBuffer.put(this.msgStoreItemMemory.array(), 0, maxBlank);
                return new AppendMessageResult(AppendMessageStatus.END_OF_FILE, wroteOffset, maxBlank, msgId, msgInner.getStoreTimestamp(),
                    queueOffset, CommitLog.this.defaultMessageStore.now() - beginTimeMills);
            }

            // Initialization of storage space
            this.resetByteBuffer(msgStoreItemMemory, msgLen);
            // 1 TOTALSIZE
            this.msgStoreItemMemory.putInt(msgLen);
            // 2 MAGICCODE
            this.msgStoreItemMemory.putInt(CommitLog.MESSAGE_MAGIC_CODE);
            // 3 BODYCRC
            this.msgStoreItemMemory.putInt(msgInner.getBodyCRC());
            // 4 QUEUEID
            this.msgStoreItemMemory.putInt(msgInner.getQueueId());
            // 5 FLAG
            this.msgStoreItemMemory.putInt(msgInner.getFlag());
            // 6 QUEUEOFFSET
            this.msgStoreItemMemory.putLong(queueOffset);
            // 7 PHYSICALOFFSET
            this.msgStoreItemMemory.putLong(fileFromOffset + byteBuffer.position());
            // 8 SYSFLAG
            this.msgStoreItemMemory.putInt(msgInner.getSysFlag());
            // 9 BORNTIMESTAMP
            this.msgStoreItemMemory.putLong(msgInner.getBornTimestamp());
            // 10 BORNHOST
            this.resetByteBuffer(bornHostHolder, bornHostLength);
            this.msgStoreItemMemory.put(msgInner.getBornHostBytes(bornHostHolder));
            // 11 STORETIMESTAMP
            this.msgStoreItemMemory.putLong(msgInner.getStoreTimestamp());
            // 12 STOREHOSTADDRESS
            this.resetByteBuffer(storeHostHolder, storeHostLength);
            this.msgStoreItemMemory.put(msgInner.getStoreHostBytes(storeHostHolder));
            // 13 RECONSUMETIMES
            this.msgStoreItemMemory.putInt(msgInner.getReconsumeTimes());
            // 14 Prepared Transaction Offset
            this.msgStoreItemMemory.putLong(msgInner.getPreparedTransactionOffset());
            // 15 BODY
            this.msgStoreItemMemory.putInt(bodyLength);
            if (bodyLength > 0)
                this.msgStoreItemMemory.put(msgInner.getBody());
            // 16 TOPIC
            this.msgStoreItemMemory.put((byte) topicLength);
            this.msgStoreItemMemory.put(topicData);
            // 17 PROPERTIES
            this.msgStoreItemMemory.putShort((short) propertiesLength);
            if (propertiesLength > 0)
                this.msgStoreItemMemory.put(propertiesData);

            final long beginTimeMills = CommitLog.this.defaultMessageStore.now();
            // Write messages to the queue buffer
            byteBuffer.put(this.msgStoreItemMemory.array(), 0, msgLen);

            AppendMessageResult result = new AppendMessageResult(AppendMessageStatus.PUT_OK, wroteOffset, msgLen, msgId,
                msgInner.getStoreTimestamp(), queueOffset, CommitLog.this.defaultMessageStore.now() - beginTimeMills);

            switch (tranType) {
                case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
                case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
                    break;
                case MessageSysFlag.TRANSACTION_NOT_TYPE:
                case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
                    // The next update ConsumeQueue information
                    CommitLog.this.topicQueueTable.put(key, ++queueOffset);
                    break;
                default:
                    break;
            }
            return result;
        }
```

这个方法讲解CommitLog的整个数据组装。

### 3 CommitLog持久化过程中的重要类

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RocketMQLevel.png?raw=true)

以上的图片说明了RocketMQ的不同分层的。

#### 3.1 CommitLog

对CommitLog日志的抽象和处理类

#### 3.2 MappedFileQueue

映射的文件队列，用来处理文件映射的队列数据。比如CommitLog日志文件

#### 3.3 MappedFile

大文件的磁盘操作

