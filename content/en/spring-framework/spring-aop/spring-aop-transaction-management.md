---
title: "Spring AOP应用之Spring事务管理"
linkTitle: "Spring AOP应用之Spring事务管理"
date: 2021-12-11
weight: 202112111507
---

> Spring framework版本 5.3.x

### 1. 核心对象的关系

![//tu](https://github.com/mxsm/picture/blob/main/spring/aop/%E4%BA%8B%E5%8A%A1%E7%9B%B8%E5%85%B3%E7%B1%BB%E7%9A%84%E5%8A%9F%E8%83%BD%E5%9B%BE.png?raw=true)

如上图可以看出来注解 **`@EnableTransactionManagement`** 负责开启事务管理，然后通过 **`TransactionManagementConfigurationSelector`** 注入下面两个类：

- AutoProxyRegistrar

  负责创建代理类

- ProxyTransactionManagementConfiguration

  负责创建事务管理的逻辑(Spring AOP)

  - BeanFactoryTransactionAttributeSourceAdvisor

    Spring AOP中的Advisor

  - TransactionAttributeSource

    Spring AOP中的Pointcut

  - TransactionInterceptor

    Spring AOP中的advice

这样就能看得出来事务管理其实就是Spring AOP的一个应用实现。

### 2. 注解事务运行流程

Spring注解事务管理运行流程图：

![](https://github.com/mxsm/picture/blob/main/spring/aop/%E4%BA%8B%E5%8A%A1%E5%90%AF%E5%8A%A8%E6%89%A7%E8%A1%8C%E6%B5%81%E7%A8%8B.png?raw=true)

### 3. 源码解析

源码从事务管理AOP的三个组件来分析，下面就会分别是：

- [TransactionAttributeSource (Poincut)](#3.1 TransactionAttributeSource 源码解析)
- [TransactionInterceptor(Advice)](#3.2 TransactionInterceptor源码解析)
- BeanFactoryTransactionAttributeSourceAdvisor(Advisor)

#### 3.1 TransactionAttributeSource 源码解析

```java
public class AnnotationTransactionAttributeSource extends AbstractFallbackTransactionAttributeSource
		implements Serializable {
    
    private final boolean publicMethodsOnly;
    
	//省略代码
    public AnnotationTransactionAttributeSource() {
		this(true);
	}
    
    public AnnotationTransactionAttributeSource(boolean publicMethodsOnly) {
		this.publicMethodsOnly = publicMethodsOnly;
		if (jta12Present || ejb3Present) {
			this.annotationParsers = new LinkedHashSet<>(4);
			this.annotationParsers.add(new SpringTransactionAnnotationParser());
			if (jta12Present) {
				this.annotationParsers.add(new JtaTransactionAnnotationParser());
			}
			if (ejb3Present) {
				this.annotationParsers.add(new Ejb3TransactionAnnotationParser());
			}
		}
		else {
			this.annotationParsers = Collections.singleton(new SpringTransactionAnnotationParser());
		}
	}
}
```

查看 **`ProxyTransactionManagementConfiguration`** 创建 **`AnnotationTransactionAttributeSource`** 是使用的无参构造函数。

> Tips: 这里调用的是AnnotationTransactionAttributeSource(boolean publicMethodsOnly) 构造函数。这里也就是事务管理只能处理public方法

里面最重要的类就是 **`SpringTransactionAnnotationParser`** 注释解析类，其他两个是为了支持java的其他规范。主要的作用就是用来判断当前执行的方法或者类是否包含 **`@javax.transaction.Transactional，@javax.ejb.TransactionAttribute， @org.springframework.transaction.annotation.Transactional`** 注解。

看到这里就会有人问了不是说好的 **`TransactionAttributeSource`** 相当于 **`Pointcut`** 也没用看到实现了  **`Pointcut`** 接口。别急下面来看一下 **`ProxyTransactionManagementConfiguration`** 类中有这样的一段代码：

```java
	@Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor(
			TransactionAttributeSource transactionAttributeSource, TransactionInterceptor transactionInterceptor) {

		BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();
		advisor.setTransactionAttributeSource(transactionAttributeSource);
		advisor.setAdvice(transactionInterceptor);
		if (this.enableTx != null) {
			advisor.setOrder(this.enableTx.<Integer>getNumber("order"));
		}
		return advisor;
	}
```

将 **`TransactionAttributeSource`** 的实现类设置为 **`BeanFactoryTransactionAttributeSourceAdvisor`** 的一个属性。(这里其实就是AnnotationTransactionAttributeSource的实例)。下面看一下 **`BeanFactoryTransactionAttributeSourceAdvisor`** 类里面有这样的一段代码：

```java
	private final TransactionAttributeSourcePointcut pointcut = new TransactionAttributeSourcePointcut() {
		@Override
		@Nullable
		protected TransactionAttributeSource getTransactionAttributeSource() {
			return transactionAttributeSource;
		}
	};
```

这不就变成了 **`Pointcut`** 了。不是直接继承了接口 **`Pointcut`** 而是通过上面代码的方式间接的变成Poincut。看一下**`TransactionAttributeSourcePointcut`** 代码

```java
abstract class TransactionAttributeSourcePointcut extends StaticMethodMatcherPointcut implements Serializable {
	//省略代码
}
```

通过包装了 **`AnnotationTransactionAttributeSource`** 变成 Pointcut

#### 3.2 TransactionInterceptor源码解析

```java
public class TransactionInterceptor extends TransactionAspectSupport implements MethodInterceptor, Serializable {
    //省略代码
}
```

从上面可以看到实现了接口 **`MethodInterceptor`** ，那么主要的逻辑就在 **`MethodInterceptor#invoke`** 方法中。 TransactionInterceptor实现了 invoke 接口：

```java
@Override
@Nullable
public Object invoke(MethodInvocation invocation) throws Throwable {
	//获取到目标类
	Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);

	// Adapt to TransactionAspectSupport's invokeWithinTransaction...
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

找到调用的目标类，然后调用 **`TransactionAspectSupport`** 类的 **`invokeWithinTransaction`** 方法。 这个方法也是主要的处理逻辑：

![](https://github.com/mxsm/picture/blob/main/spring/aop/TransactionAspectSupport%23invokeWithinTransaction%E6%89%A7%E8%A1%8C%E6%B5%81%E7%A8%8B.png?raw=true)

根据 **`TransactionAttributeSource`** 来决定使用 **`ReactiveTransactionManager`** 还是  **`PlatformTransactionManager`** （这里只分析PlatformTransactionManager）。

```java
TransactionInfo txInfo = createTransactionIfNecessary(ptm, txAttr, joinpointIdentification);
```

根据 PlatformTransactionManager，TransactionAttributeSource和切入点方法去处理事务管理如何创建，下面看一下 TransactionAspectSupport#createTransactionIfNecessary方法，里面有一段代码：

```java
	protected TransactionInfo createTransactionIfNecessary(@Nullable PlatformTransactionManager tm,
			@Nullable TransactionAttribute txAttr, final String joinpointIdentification) {
		//省略部分代码
		TransactionStatus status = null;
		if (txAttr != null) {
			if (tm != null) {
                //这段代码
				status = tm.getTransaction(txAttr);
			}
			else {
				
			}
		}
		return prepareTransactionInfo(tm, txAttr, joinpointIdentification, status);
	}
```

事务管理器根据 **`TransactionAttributeSource`** 获取事务状态 **`TransactionStatus`** 。  

**`status = tm.getTransaction(txAttr)`** 这段代码里面说明了根据注解 **`@Transactional`** 当中的属性如何创建事务，最好包装成  **`TransactionStatus`** 。下面来分析这一段代码，由 **`AbstractPlatformTransactionManager`** 实现了方法  **`getTransaction`** 。

```java
	@Override
	public final TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
			throws TransactionException {

		// 没有事务定义给出就使用默认的
		TransactionDefinition def = (definition != null ? definition : TransactionDefinition.withDefaults());

        //获取事务
		Object transaction = doGetTransaction();
		boolean debugEnabled = logger.isDebugEnabled();
		
        //判断事务是否存在
		if (isExistingTransaction(transaction)) {
			// Existing transaction found -> check propagation behavior to find out how to behave.
			return handleExistingTransaction(def, transaction, debugEnabled);
		}

		// 检查新的事务配置
		if (def.getTimeout() < TransactionDefinition.TIMEOUT_DEFAULT) {
			throw new InvalidTimeoutException("Invalid transaction timeout", def.getTimeout());
		}

		// No existing transaction found -> check propagation behavior to find out how to proceed.
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
			boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
			return prepareTransactionStatus(def, null, true, newSynchronization, debugEnabled, null);
		}
	}
```

上面就是根据设置的事务的传播行为来对事务作出处理。事务的传播行为如下：

- @Transactional(propagation=Propagation.REQUIRED) ：如果有事务, 那么加入事务, 没有的话新建一个(默认情况下)


- @Transactional(propagation=Propagation.NOT_SUPPORTED) ：以非事务方式执行，如果存在当前事务，则挂起当前事务


- @Transactional(propagation=Propagation.REQUIRES_NEW) ：不管是否存在事务,都创建一个新的事务,原来的挂起,新的执行完毕,继续执行老的事务


- @Transactional(propagation=Propagation.MANDATORY) ：必须在一个已有的事务中执行,否则抛出异常


- @Transactional(propagation=Propagation.NEVER) ：以非事务方式执行，如果存在事务则抛出异常。


- @Transactional(propagation=Propagation.SUPPORTS) ：如果其他bean调用这个方法,在其他bean中声明事务,那就用事务.如果其他bean没有声明事务,那就不用事务.


- @Transactional(propagation=Propagation.NESTED) ： 如果当前存在事务，则在嵌套事务内执行。如果当前没有事务，则进行PROPAGATION_REQUIRED类似的操作。

创建完成 **`TransactionInfo`** 后就开始执行业务逻辑方法，如果执行业务逻辑报错那么就执行：

```java
completeTransactionAfterThrowing(txInfo, ex);
```

然后在 finally 代码块中执行：

```java
cleanupTransactionInfo(txInfo);
```

清除事务的信息，提交事务。到这里整个事务就基本上完成了。

#### 3.3 BeanFactoryTransactionAttributeSourceAdvisor源码解析

```java
public class BeanFactoryTransactionAttributeSourceAdvisor extends AbstractBeanFactoryPointcutAdvisor {

	@Nullable
	private TransactionAttributeSource transactionAttributeSource;

	private final TransactionAttributeSourcePointcut pointcut = new TransactionAttributeSourcePointcut() {
		@Override
		@Nullable
		protected TransactionAttributeSource getTransactionAttributeSource() {
			return transactionAttributeSource;
		}
	};


	/**
	 * Set the transaction attribute source which is used to find transaction
	 * attributes. This should usually be identical to the source reference
	 * set on the transaction interceptor itself.
	 * @see TransactionInterceptor#setTransactionAttributeSource
	 */
	public void setTransactionAttributeSource(TransactionAttributeSource transactionAttributeSource) {
		this.transactionAttributeSource = transactionAttributeSource;
	}

	/**
	 * Set the {@link ClassFilter} to use for this pointcut.
	 * Default is {@link ClassFilter#TRUE}.
	 */
	public void setClassFilter(ClassFilter classFilter) {
		this.pointcut.setClassFilter(classFilter);
	}

	@Override
	public Pointcut getPointcut() {
		return this.pointcut;
	}

}
```

这个类比较简单就是将Advice和Pointcut组装成Advisor

### 4. 总结

Spring事务管理底层使用的是AOP的原理来实现。结合数据库的事务来的。