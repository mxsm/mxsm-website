---
title: 深入理解mybatis原理-SQL的执行过程
categories:
  - ORM框架
  - mybatis
tags:
  - ORM框架
  - mybatis
  - MyBatis原理
  - SQL的执行过程
abbrlink: 4b75ed66
date: 2020-03-01 14:40:00
---

> 以下分析基于mybatis 3.5.2版本

### Mybatis框架

MyBatis框架主要完成的是以下2件事情：

1. 根据JDBC规范建立与数据库的连接
2. 通过反射打通Java对象与数据库参数交互之间相互转换的关系

这个就是mybatis以及ORM框架主要做的两件事情

### Mybatis 主要类介绍

- **Configuration**

  MyBatis所有的配置信息都维持在Configuration对象之中，在也就是mybatis的xml，configuration节点

- **SqlSession**

  作为MyBatis工作的主要顶层API，表示和数据库交互的会话，完成必要数据库增删改查功能

  ```java
  package org.apache.ibatis.session;
  
  import java.io.Closeable;
  import java.sql.Connection;
  import java.util.List;
  import java.util.Map;
  
  import org.apache.ibatis.cursor.Cursor;
  import org.apache.ibatis.executor.BatchResult;
  
  public interface SqlSession extends Closeable {
  
    <T> T selectOne(String statement);
  
    <T> T selectOne(String statement, Object parameter);
  
    <E> List<E> selectList(String statement);
  
    <E> List<E> selectList(String statement, Object parameter);
  
    <E> List<E> selectList(String statement, Object parameter, RowBounds rowBounds);
  
    <K, V> Map<K, V> selectMap(String statement, String mapKey);
  
    <K, V> Map<K, V> selectMap(String statement, Object parameter, String mapKey);
  
    <K, V> Map<K, V> selectMap(String statement, Object parameter, String mapKey, RowBounds rowBounds);
  
    <T> Cursor<T> selectCursor(String statement);
  
    <T> Cursor<T> selectCursor(String statement, Object parameter);
  
    <T> Cursor<T> selectCursor(String statement, Object parameter, RowBounds rowBounds);
  
    void select(String statement, Object parameter, ResultHandler handler);
  
    void select(String statement, ResultHandler handler);
  
    void select(String statement, Object parameter, RowBounds rowBounds, ResultHandler handler);
  
    int insert(String statement);
  
    int insert(String statement, Object parameter);
  
    int update(String statement);
  
    int update(String statement, Object parameter);
  
    int delete(String statement);
  
    int delete(String statement, Object parameter);
      
    void commit();
  
    void commit(boolean force);
  
    void rollback();
  
    void rollback(boolean force);
  
    List<BatchResult> flushStatements();
      
    @Override
    void close();
  
    void clearCache();
  
    Configuration getConfiguration();
  
    <T> T getMapper(Class<T> type);
  
    Connection getConnection();
  }
  
  ```

- **Executor**

  MyBatis执行器，是MyBatis 调度的核心，负责SQL语句的生成和查询缓存的维护

  ```java
  public interface Executor {
  
    ResultHandler NO_RESULT_HANDLER = null;
  
    int update(MappedStatement ms, Object parameter) throws SQLException;
  
    <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey cacheKey, BoundSql boundSql) throws SQLException;
  
    <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException;
  
    <E> Cursor<E> queryCursor(MappedStatement ms, Object parameter, RowBounds rowBounds) throws SQLException;
  
    List<BatchResult> flushStatements() throws SQLException;
  
    void commit(boolean required) throws SQLException;
  
    void rollback(boolean required) throws SQLException;
  
    CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql);
  
    boolean isCached(MappedStatement ms, CacheKey key);
  
    void clearLocalCache();
  
    void deferLoad(MappedStatement ms, MetaObject resultObject, String property, CacheKey key, Class<?> targetType);
  
    Transaction getTransaction();
  
    void close(boolean forceRollback);
  
    boolean isClosed();
  
    void setExecutorWrapper(Executor executor);
  
  }
  ```

- **StatementHandler**

  封装了JDBC Statement操作，负责对JDBC statement 的操作，如设置参数、将Statement结果集转换成List集合

  ```java
  public interface StatementHandler {
  
    Statement prepare(Connection connection, Integer transactionTimeout)
        throws SQLException;
  
    void parameterize(Statement statement)
        throws SQLException;
  
    void batch(Statement statement)
        throws SQLException;
  
    int update(Statement statement)
        throws SQLException;
  
    <E> List<E> query(Statement statement, ResultHandler resultHandler)
        throws SQLException;
  
    <E> Cursor<E> queryCursor(Statement statement)
        throws SQLException;
  
    BoundSql getBoundSql();
  
    ParameterHandler getParameterHandler();
  
  }
  ```

- **ParameterHandler**

  负责对用户传递的参数转换成JDBC Statement 所需要的参数

  ```java
  public interface ParameterHandler {
  
    Object getParameterObject();
  
    void setParameters(PreparedStatement ps)
        throws SQLException;
  
  }
  ```

- **ResultSetHandler**

  负责将JDBC返回的ResultSet结果集对象转换成List类型的集合(单个查询是通过列表查询得来的)

  ```java
  public interface ResultSetHandler {
  
    <E> List<E> handleResultSets(Statement stmt) throws SQLException;
  
    <E> Cursor<E> handleCursorResultSets(Statement stmt) throws SQLException;
  
    void handleOutputParameters(CallableStatement cs) throws SQLException;
  
  }
  ```

- **TypeHandler**

  负责java数据类型和jdbc数据类型之间的映射和转换

  ```java
  public interface TypeHandler<T> {
  
    void setParameter(PreparedStatement ps, int i, T parameter, JdbcType jdbcType) throws SQLException;
  
    /**
     * @param columnName Colunm name, when configuration <code>useColumnLabel</code> is <code>false</code>
     */
    T getResult(ResultSet rs, String columnName) throws SQLException;
  
    T getResult(ResultSet rs, int columnIndex) throws SQLException;
  
    T getResult(CallableStatement cs, int columnIndex) throws SQLException;
  
  }
  ```

- **MappedStatement**

  MappedStatement维护了一条<select|update|delete|insert>节点的封装

- **SqlSource**

  负责根据用户传递的parameterObject，动态地生成SQL语句，将信息封装到BoundSql对象中，并返回

  ```java
  public interface SqlSource {
  
    BoundSql getBoundSql(Object parameterObject);
  
  }
  ```

- **BoundSql**

  表示动态生成的SQL语句以及相应的参数信息

  ```java
  public class BoundSql {
  
    private final String sql;
    private final List<ParameterMapping> parameterMappings;
    private final Object parameterObject;
    private final Map<String, Object> additionalParameters;
    private final MetaObject metaParameters;
  
    public BoundSql(Configuration configuration, String sql, List<ParameterMapping> parameterMappings, Object parameterObject) {
      this.sql = sql;
      this.parameterMappings = parameterMappings;
      this.parameterObject = parameterObject;
      this.additionalParameters = new HashMap<>();
      this.metaParameters = configuration.newMetaObject(additionalParameters);
    }
  
    public String getSql() {
      return sql;
    }
  
    public List<ParameterMapping> getParameterMappings() {
      return parameterMappings;
    }
  
    public Object getParameterObject() {
      return parameterObject;
    }
  
    public boolean hasAdditionalParameter(String name) {
      String paramName = new PropertyTokenizer(name).getName();
      return additionalParameters.containsKey(paramName);
    }
  
    public void setAdditionalParameter(String name, Object value) {
      metaParameters.setValue(name, value);
    }
  
    public Object getAdditionalParameter(String name) {
      return metaParameters.getValue(name);
    }
  }
  ```

  ![](https://img-blog.csdn.net/20141028140852531?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbHVhbmxvdWlz/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

  图片来源：https://blog.csdn.net/luanlouis/article/details/40422941

- **Interceptor**

  拦截器，MyBatis 允许你在已映射语句执行过程中的某一点进行拦截调用。默认情况下，MyBatis 允许使用插件来拦截的方法调用包括：

  - Executor (update, query, flushStatements, commit, rollback, getTransaction, close, isClosed)
  - ParameterHandler (getParameterObject, setParameters)
  - ResultSetHandler (handleResultSets, handleOutputParameters)
  - StatementHandler (prepare, parameterize, batch, update, query)

### SQL的执行流程

> 示例的代码：https://github.com/mxsm/spring-sample/tree/master/mxsm-mybatis

![示例图](https://github.com/mxsm/document/blob/master/image/orm%E6%A1%86%E6%9E%B6/mybatis/%E7%A4%BA%E4%BE%8B%E4%BB%A3%E7%A0%81.png?raw=true)

上图是项目的目录结构和主要的代码：

```java
public class ApplicationStart {

    public static void main(String[] args) throws Exception{
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        RoleMapper roleMapper = sqlSessionFactory.openSession().getMapper(RoleMapper.class);
        Roles roles = roleMapper.select("ROLE_ADMIN");
        System.out.println(roles.getUsername());
    }
}
```

通过上面的代码以 **`SqlSessionFactory`** 方式创建，主要有两个步骤：

- [解析mybatis的配置文件](#解析mybatis的配置文件)
- [执行Mapper中的方法](#执行Mapper中的方法)

解析从这个两个方面来根据源码来分析整个执行的SQL的过程。

### 解析mybatis的配置文件

跟进 `SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);` 这段代码可以发现。代码中主要调用了下面的方法：

```java
  public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
    try {
      XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
      return build(parser.parse());
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error building SqlSession.", e);
    } finally {
      ErrorContext.instance().reset();
      try {
        inputStream.close();
      } catch (IOException e) {
        // Intentionally ignore. Prefer previous error.
      }
    }
  }
```

这个方法在 **SqlSessionFactoryBuilder#build** 中。通过 **`XMLConfigBuilder`** 解析出来 **`Configuration`** 来构建 **`SqlSessionFactory`** 。

> **`Configuration`**  在上面的主要类中说明了，这个是mybatis的一个重要的类。

#### XMLConfigBuilder#parse方法解析

```java
public Configuration parse() {
    if (parsed) {
      throw new BuilderException("Each XMLConfigBuilder can only be used once.");
    }
    parsed = true;
    parseConfiguration(parser.evalNode("/configuration"));
    return configuration;
  }
```

在 **XMLConfigBuilder#parse** 方法中主要调用 **XMLConfigBuilder#parseConfiguration** (这个过程有把xml文档解析成Document的过程这里不做分析)

```java
private void parseConfiguration(XNode root) {
    try {
      //issue #117 read properties first
      propertiesElement(root.evalNode("properties"));
      Properties settings = settingsAsProperties(root.evalNode("settings"));
      loadCustomVfs(settings);
      loadCustomLogImpl(settings);
      typeAliasesElement(root.evalNode("typeAliases"));
      pluginElement(root.evalNode("plugins"));
      objectFactoryElement(root.evalNode("objectFactory"));
      objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
      reflectorFactoryElement(root.evalNode("reflectorFactory"));
      settingsElement(settings);
      // read it after objectFactory and objectWrapperFactory issue #631
      environmentsElement(root.evalNode("environments"));
      databaseIdProviderElement(root.evalNode("databaseIdProvider"));
      typeHandlerElement(root.evalNode("typeHandlers"));
      mapperElement(root.evalNode("mappers"));
    } catch (Exception e) {
      throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);
    }
  }
```

这个方法把mybatis的配置xml中的配置节点解析为Java对应的类。根据上面的我们看一下主要的几个

- [plugins解析](#plugins)
- [typeHandlers](#typeHandlers)
- [mappers](#mappers--最重要的)

##### plugins

主要是一个拦截器：

```java
  private void pluginElement(XNode parent) throws Exception {
    if (parent != null) {
      for (XNode child : parent.getChildren()) {
        String interceptor = child.getStringAttribute("interceptor");
        Properties properties = child.getChildrenAsProperties();
        Interceptor interceptorInstance = (Interceptor) resolveClass(interceptor).newInstance();
        interceptorInstance.setProperties(properties);
        configuration.addInterceptor(interceptorInstance);
      }
    }
  }
```

生成的拦截器添加到 **Configuration** 类的实例中去。

##### typeHandlers

类型处理器，返回的类型处理：

```java
private void typeHandlerElement(XNode parent) {
    if (parent != null) {
      for (XNode child : parent.getChildren()) {
        if ("package".equals(child.getName())) {
          String typeHandlerPackage = child.getStringAttribute("name");
          typeHandlerRegistry.register(typeHandlerPackage);
        } else {
          String javaTypeName = child.getStringAttribute("javaType");
          String jdbcTypeName = child.getStringAttribute("jdbcType");
          String handlerTypeName = child.getStringAttribute("handler");
          Class<?> javaTypeClass = resolveClass(javaTypeName);
          JdbcType jdbcType = resolveJdbcType(jdbcTypeName);
          Class<?> typeHandlerClass = resolveClass(handlerTypeName);
          if (javaTypeClass != null) {
            if (jdbcType == null) {
              typeHandlerRegistry.register(javaTypeClass, typeHandlerClass);
            } else {
              typeHandlerRegistry.register(javaTypeClass, jdbcType, typeHandlerClass);
            }
          } else {
            typeHandlerRegistry.register(typeHandlerClass);
          }
        }
      }
    }
  }
```

添加类型处理器有两种方式：

- package
- typeHandler

同样这些实例化的对象都保存到 **Configuration** 类的实例中去了。

##### mappers--最重要的

mapper主要把接口的文件和SQL的xml结合起来，下面来看一下代码：

```java
private void mapperElement(XNode parent) throws Exception {
    if (parent != null) {
      for (XNode child : parent.getChildren()) {
        if ("package".equals(child.getName())) {
          String mapperPackage = child.getStringAttribute("name");
          configuration.addMappers(mapperPackage);
        } else {
          String resource = child.getStringAttribute("resource");
          String url = child.getStringAttribute("url");
          String mapperClass = child.getStringAttribute("class");
          if (resource != null && url == null && mapperClass == null) {
            ErrorContext.instance().resource(resource);
            InputStream inputStream = Resources.getResourceAsStream(resource);
            XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, resource, configuration.getSqlFragments());
            mapperParser.parse();
          } else if (resource == null && url != null && mapperClass == null) {
            ErrorContext.instance().resource(url);
            InputStream inputStream = Resources.getUrlAsStream(url);
            XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, url, configuration.getSqlFragments());
            mapperParser.parse();
          } else if (resource == null && url == null && mapperClass != null) {
            Class<?> mapperInterface = Resources.classForName(mapperClass);
            configuration.addMapper(mapperInterface);
          } else {
            throw new BuilderException("A mapper element may only specify a url, resource or class, but not more than one.");
          }
        }
      }
    }
  }
```

上面代码也给了两种注入方式：

- package

  这个是以包的方式添加

- mapper

  这种是以单一的方式添加xml文件或者mapper接口文件

对于mapper如果是xml的话，  **`XMLMapperBuilder`** 主要是用来解析mybatis的mapperxml的。下面就解析来分析。

###  XMLMapperBuilder源码解析

同样XMLMapperBuilder主要是调用parse方法：

```java
  public void parse() {
    if (!configuration.isResourceLoaded(resource)) {
      configurationElement(parser.evalNode("/mapper"));
      configuration.addLoadedResource(resource);
      bindMapperForNamespace();
    }

    parsePendingResultMaps();
    parsePendingCacheRefs();
    parsePendingStatements();
  }
```

通过代码可以看出来上面的代码主要做了五件事情：

1. **加载mapper资源**

   ```java
     private void configurationElement(XNode context) {
       try {
         String namespace = context.getStringAttribute("namespace");
         if (namespace == null || namespace.equals("")) {
           throw new BuilderException("Mapper's namespace cannot be empty");
         }
         builderAssistant.setCurrentNamespace(namespace);
         cacheRefElement(context.evalNode("cache-ref"));
         cacheElement(context.evalNode("cache"));
         //官网介绍已经废弃了parameterMap--具体可看一下官网的说明
         parameterMapElement(context.evalNodes("/mapper/parameterMap")); 
         resultMapElements(context.evalNodes("/mapper/resultMap"));
         sqlElement(context.evalNodes("/mapper/sql"));
         buildStatementFromContext(context.evalNodes("select|insert|update|delete"));
       } catch (Exception e) {
         throw new BuilderException("Error parsing Mapper XML. The XML location is '" + resource + "'. Cause: " + e, e);
       }
     }
   ```

   处理mapper下面的所有节点。

2. **绑定Mapper和配置的namespace**

   绑定Mapper xml和配置的 mapper接口

3. **解析准备ResultMap节点**

4. **解析准备缓存引用**

5. **解析准备Statement**

> 这里通过源码分析可以看出来，在解析mapper xml的时候，如果namespace配置的接口类不存在是不会抛错的。

### 执行Mapper中的方法

首先看一下代码：

```java
RoleMapper roleMapper = sqlSessionFactory.openSession().getMapper(RoleMapper.class);
```

先看一下 **`openSession`** 方法：

```java
  @Override
  public SqlSession openSession() {
    return openSessionFromDataSource(configuration.getDefaultExecutorType(), null, false);
  }
  private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    try {
      final Environment environment = configuration.getEnvironment();
      final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
      tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
      final Executor executor = configuration.newExecutor(tx, execType);
      return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
      closeTransaction(tx); // may have fetched a connection so lets call close()
      throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
```

这个的默认实现 **`DefaultSqlSessionFactory`** 返回的是一个默认的 **`DefaultSqlSession`** 。下面来看一下获取 **`getMapper`** 方法源代码：

```java
  @Override
  public <T> T getMapper(Class<T> type) {
    return configuration.getMapper(type, this);
  }

```

通过代码发现是调用了 **`Configuration.getMapper`** 方法：

```java
  public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    return mapperRegistry.getMapper(type, sqlSession);
  }
  public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    final MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
    if (mapperProxyFactory == null) {
      throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
    }
    try {
      return mapperProxyFactory.newInstance(sqlSession);
    } catch (Exception e) {
      throw new BindingException("Error getting mapper instance. Cause: " + e, e);
    }
  }
```

通过研究代码发现是 **`mapperRegistry`** 变量中根据Mapper的接口类type获取 **`MapperProxyFactory`** 的代理工厂，然后通过  **`MapperProxyFactory#newInstance`**  创建 **Mapper** 接口的代理类。获取Mapper的接口对象来执行SQL可以看出来，这里获取的是代理类。那么这个 **`MapperProxyFactory`** 什么时候创建的添加到 **`mapperRegistry`** 对象中去的。 在前面分析解析mybatis文件的时候有解析mapper配置的时候有这样的一段代码(XMLMapperBuilder#bindMapperForNamespace)：

```java
  private void bindMapperForNamespace() {
    String namespace = builderAssistant.getCurrentNamespace();
    if (namespace != null) {
      Class<?> boundType = null;
      try {
        boundType = Resources.classForName(namespace);
      } catch (ClassNotFoundException e) {
        //ignore, bound type is not required
      }
      if (boundType != null) {
        if (!configuration.hasMapper(boundType)) {
          // Spring may not know the real resource name so we set a flag
          // to prevent loading again this resource from the mapper interface
          // look at MapperAnnotationBuilder#loadXmlResource
          configuration.addLoadedResource("namespace:" + namespace);
          configuration.addMapper(boundType);
        }
      }
    }
  }
```

 这段代码有这样一段代码： **configuration.addMapper(boundType)** ，下面来看这段代码：

```java
  public <T> void addMapper(Class<T> type) {
    mapperRegistry.addMapper(type);
  }
```

这里面调用了 **`MapperRegistry#addMapper`** 方法：

```java
  public <T> void addMapper(Class<T> type) {
    if (type.isInterface()) {
      if (hasMapper(type)) {
        throw new BindingException("Type " + type + " is already known to the MapperRegistry.");
      }
      boolean loadCompleted = false;
      try {
        //在这里创建了MapperProxyFactory并且添加
        knownMappers.put(type, new MapperProxyFactory<>(type));
        // It's important that the type is added before the parser is run
        // otherwise the binding may automatically be attempted by the
        // mapper parser. If the type is already known, it won't try.
        MapperAnnotationBuilder parser = new MapperAnnotationBuilder(config, type);
        parser.parse();
        loadCompleted = true;
      } finally {
        if (!loadCompleted) {
          knownMappers.remove(type);
        }
      }
    }
  }
```

通过代理来执行数据库的逻辑。