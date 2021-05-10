---
title: Spring事务处理源码解析  
linkTitle: Spring事务处理源码解析  
date: 2021-04-29  
weight: 202104291429  
---

> 基于spring 5.3.5版本源码分析

事务处理的逻辑主要在 ***MethodInterceptor*** 中，下面通过源码来解析Spring是如何处理事务的。

### 1. 入口方法MethodInterceptor#invoke
这个方法是事务执行的入口:

```java
@Override
@Nullable
public Object invoke(MethodInvocation invocation) throws Throwable {

	Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);
    
    //事务处理的主要逻辑
	return invokeWithinTransaction(invocation.getMethod(), targetClass, new CoroutinesInvocationCallback() {
		@Override
		@Nullable
		public Object proceedWithInvocation() throws Throwable {
			return invocation.proceed();
		}
		@Override
		public Object getTarget() {
			return invocation.getThis();
		}
		@Override
		public Object[] getArguments() {
			return invocation.getArguments();
		}
	});
}
```
### 2. TransactionAspectSupport#invokeWithinTransaction方法
这个方法主要包含了两部分：
- 响应式编程事务支持(ReactiveTransactionManager类添加与Spring5.2版本)
- 标准的的事务支持

响应式后续分析。我们来分析一下标准的事务支持：  

```java
// 重点：是否需要创建事务
TransactionInfo txInfo = createTransactionIfNecessary(ptm, txAttr, joinpointIdentification);

Object retVal;
try {
	// 这是一个around advice: 调用链中的下一个拦截器.
	// 这通常会导致调用目标对象.
	retVal = invocation.proceedWithInvocation();
}
catch (Throwable ex) {
	// 事务的异常处理
	completeTransactionAfterThrowing(txInfo, ex);
	throw ex;
}
finally {
    //清理事务的信息
	cleanupTransactionInfo(txInfo);
}

if (retVal != null && vavrPresent && VavrDelegate.isVavrTry(retVal)) {
	// Set rollback-only in case of Vavr failure matching our rollback rules...
	TransactionStatus status = txInfo.getTransactionStatus();
	if (status != null && txAttr != null) {
		retVal = VavrDelegate.evaluateTryFailure(retVal, txAttr, status);
	}
}
//提交事务
commitTransactionAfterReturning(txInfo);
return retVal;
```
事务主要是通过 ***TransactionAspectSupport#createTransactionIfNecessary*** 方法获取，然后执行目标方法获取方法返回结果。如果有问题处理问题，根据情况(配置的事务传递性和事务回滚的Execption)是否对事务进行回滚。  

```java
protected TransactionInfo createTransactionIfNecessary(@Nullable PlatformTransactionManager tm,
		@Nullable TransactionAttribute txAttr, final String joinpointIdentification) {

	// 处理txAttr没有名字的情况
	if (txAttr != null && txAttr.getName() == null) {
		txAttr = new DelegatingTransactionAttribute(txAttr) {
			@Override
			public String getName() {
				return joinpointIdentification;
			}
		};
	}

	TransactionStatus status = null;
	if (txAttr != null) {
		if (tm != null) {
			//重点：通过PlatformTransactionManager管理获取事务状态
			status = tm.getTransaction(txAttr);
		}
		else {
			if (logger.isDebugEnabled()) {
				logger.debug("Skipping transactional joinpoint [" + joinpointIdentification +
						"] because no transaction manager has been configured");
			}
		}
	}
	//将TransactionStatus包装成TransactionInfo
	return prepareTransactionInfo(tm, txAttr, joinpointIdentification, status);
}
```

### 3. 事务传播
在通过注解@Transactional管理事务的时候需要配置Propagation的值。默认为Propagation.REQUIRED,下面来看一下AbstractPlatformTransactionManager#getTransaction。方法主要逻辑为两个：
1. 存在事务如何处理
2. 没有存在事务如何处理

这里就涉及到了根据事务的传播方式来处理事务。

```java
@Override
public final TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
		throws TransactionException {

	// Use defaults if no transaction definition given.
	TransactionDefinition def = (definition != null ? definition : TransactionDefinition.withDefaults());

	Object transaction = doGetTransaction();
	boolean debugEnabled = logger.isDebugEnabled();

	//重点：判断是否存在事务
	if (isExistingTransaction(transaction)) {
		// 存在事务 -> 检查 propagation 来决定如何处理.
		return handleExistingTransaction(def, transaction, debugEnabled);
	}

	//重点： 下面就是处理没有事务，根据propagation决定如何处理
	if (def.getTimeout() < TransactionDefinition.TIMEOUT_DEFAULT) {
		throw new InvalidTimeoutException("Invalid transaction timeout", def.getTimeout());
	}

	if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {
		throw new IllegalTransactionStateException(
				"No existing transaction found for transaction marked with propagation 'mandatory'");
	}
	else if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRED ||
			def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW ||
			def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
		SuspendedResourcesHolder suspendedResources = suspend(null);
		if (debugEnabled) {
			logger.debug("Creating new transaction with name [" + def.getName() + "]: " + def);
		}
		try {
			return startTransaction(def, transaction, debugEnabled, suspendedResources);
		}
		catch (RuntimeException | Error ex) {
			resume(null, suspendedResources);
			throw ex;
		}
	}
	else {
		// Create "empty" transaction: no actual transaction, but potentially synchronization.
		if (def.getIsolationLevel() != TransactionDefinition.ISOLATION_DEFAULT && logger.isWarnEnabled()) {
			logger.warn("Custom isolation level specified but no actual transaction initiated; " +
					"isolation level will effectively be ignored: " + def);
		}
		boolean newSynch
```
#### 3.1 当前存在事务的传播属性
方法主要是 AbstractPlatformTransactionManager#handleExistingTransaction：  

- NEVER

  存在事务就报错

  ```java
  if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NEVER) {
  	throw new IllegalTransactionStateException(
  			"Existing transaction found for transaction marked with propagation 'never'");
  }
  ```

- NOT_SUPPORTED

  把当前事务挂起,强制不在事务中运行

  ```java
  if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NOT_SUPPORTED) {
  	//挂起当前事务
  	Object suspendedResources = suspend(transaction);
  	boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
  	return prepareTransactionStatus(
  			definition, null, false, newSynchronization, debugEnabled, suspendedResources);
  }
  ```

- REQUIRES_NEW

  挂起当前事务，创建一个新事务

  ```java
  if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW) {
  	//挂起已有事务
  	SuspendedResourcesHolder suspendedResources = suspend(transaction);
  	try {
  	    //开启一个新的事务
  		return startTransaction(definition, transaction, debugEnabled, suspendedResources);
  	}
  	catch (RuntimeException | Error beginEx) {
  		resumeAfterBeginException(transaction, suspendedResources, beginEx);
  		throw beginEx;
  	}
  }
  ```

- NESTED

  在当前事务中创建一个嵌套事务

  ```java
  if (definition.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
      //判断是否允许嵌套事务
  	if (!isNestedTransactionAllowed()) {
  		throw new NestedTransactionNotSupportedException(
  				"Transaction manager does not allow nested transactions by default - " +
  				"specify 'nestedTransactionAllowed' property with value 'true'");
  	}
  	if (useSavepointForNestedTransaction()) {
  		// 已存在的事务创建savepoint通过TransactionStatus的SavepointManager API来实现
  		//通常使用JDBC 3.0保存点。从不激活Spring同步
  		DefaultTransactionStatus status =
  				prepareTransactionStatus(definition, transaction, false, false, debugEnabled, null);
  		status.createAndHoldSavepoint();
  		return status;
  	}
  	else {
  		//JTA通过提交和回滚
  		return startTransaction(definition, transaction, debugEnabled, null);
  	}
  }
  ```

- REQUIRED、SUPPORTS、MANDATORY

  这三个都是使用当前事务

#### 3.2 不存在事务的传播性
- MANDATORY

  抛异常

  ```java
  if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {
  	throw new IllegalTransactionStateException(
  			"No existing transaction found for transaction marked with propagation 'mandatory'");
  }
  ```

- REQUIRED、REQUIRES_NEW、NESTED

  新建事务

  ```java
  else if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRED ||
  		def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW ||
  		def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
  	SuspendedResourcesHolder suspendedResources = suspend(null);
  	try {
  		return startTransaction(def, transaction, debugEnabled, suspendedResources);
  	}
  	catch (RuntimeException | Error ex) {
  		resume(null, suspendedResources);
  		throw ex;
  	}
  }
  ```
  
- SUPPORTS、NOT_SUPPORTED、NEVER

  以非事务的方式运行

  ```java
  else {
  	// Create "empty" transaction: no actual transaction, but potentially synchronization.
  	boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
  	return prepareTransactionStatus(def, null, true, newSynchronization, debugEnabled, null);
  }
  ```
  

### 4. 事务类型传播终结

|               | 不存在事务 |             存在事务             |
| :------------ | :--------: | :------------------------------: |
| REQUIRED      |  新建事务  |           使用当前事务           |
| REQUIRES_NEW  |  新建事务  |  挂起当前事务，创建一个新的事务  |
| NESTED        |  新建事务  |   在当前事务中创建一个嵌套事务   |
| MANDATORY     |   抛异常   |           使用当前事务           |
| SUPPORTS      | 非事务运行 |           使用当前事务           |
| NOT_SUPPORTED | 非事务运行 | 挂起当前事务，强制不在事务中运行 |
| NEVER         | 非事务运行 |              抛异常              |

### 5. 事务回滚

当设置了事务如果存在执行方法出现错误，就会对事务进行回滚。下面看一下 **`TransactionAspectSupport#completeTransactionAfterThrowing`** 方法主要负责回滚事务：

```java
protected void completeTransactionAfterThrowing(@Nullable TransactionInfo txInfo, Throwable ex) {
	if (txInfo != null && txInfo.getTransactionStatus() != null) {

		if (txInfo.transactionAttribute != null && txInfo.transactionAttribute.rollbackOn(ex)) {
			try {
				//回滚事务
				txInfo.getTransactionManager().rollback(txInfo.getTransactionStatus());
			}
			catch (TransactionSystemException ex2) {
				logger.error("Application exception overridden by rollback exception", ex);
				ex2.initApplicationException(ex);
				throw ex2;
			}
			catch (RuntimeException | Error ex2) {
				logger.error("Application exception overridden by rollback exception", ex);
				throw ex2;
			}
		}
		else {
			//不想回滚当前exception提交事务
			try {
				txInfo.getTransactionManager().commit(txInfo.getTransactionStatus());
			}
			catch (TransactionSystemException ex2) {
				logger.error("Application exception overridden by commit exception", ex);
				ex2.initApplicationException(ex);
				throw ex2;
			}
			catch (RuntimeException | Error ex2) {
				logger.error("Application exception overridden by commit exception", ex);
				throw ex2;
			}
		}
	}
}
```

### 6. 事务提交

当方法执行完成，需要提交事务，提交是由 **`TransactionAspectSupport#commitTransactionAfterReturning`**  处理事务提交：

```java
protected void commitTransactionAfterReturning(@Nullable TransactionInfo txInfo) {
	if (txInfo != null && txInfo.getTransactionStatus() != null) {
		txInfo.getTransactionManager().commit(txInfo.getTransactionStatus());
	}
}
```

