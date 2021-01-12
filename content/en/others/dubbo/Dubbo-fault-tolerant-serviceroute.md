---
title: Dubbo容错四大利器之— 服务路由
categories:
  - RPC
  - Dubbo
tags:
  - RPC
  - Dubbo
abbrlink: 92a725e4
date: 2019-06-04 15:30:59
---
### 1 什么是服务路由？

**服务路由包含一条路由规则，路由规则决定了服务消费者的调用目标，即规定了服务消费者可调用哪些服务提供者。**

- **条件路由 — ConditionRouter** 最常用的路由
- **脚本路由 — ScriptRouter**
- **标签路由 — TagRouter** 标签路由是一个新的实现

![继承图](https://github.com/mxsm/document/blob/master/image/RPC/Dubbo/Dubbo-Router%E8%B7%AF%E7%94%B1%E7%BB%A7%E6%89%BF%E5%9B%BE.jpg?raw=true)

### 2 条件路由的分析

#### 2.1组成条件路由的两个条件

- **服务消费者匹配条件**
- **服务提供者匹配条件**

例如下面这样

```
[服务消费者匹配条件] => [服务提供者匹配条件]
```

- 服务消费者匹配为空，表示不对服务消费者进行限制
- 服务通知匹配条件为空，表示对某些服务消费者禁用服务

工作流程：

- 需要先对用户配置的路由规则进行解析，得到一系列的条件
- 根据条件对服务进行路由

#### 2.2 ConditionRouter的源码分析

**路由的规则的解析：**

首先来看一下 **`ConditionRouter`** 的构造函数

```java
   public ConditionRouter(String rule, boolean force, boolean enabled) {
       //当路由结果为空时，是否强制执行，如果不强制执行，路由结果为空的路由规则将自动失效，可不填，缺省为 false 
       this.force = force;
       // 当前路由规则是否生效
        this.enabled = enabled;
        //调用方法初始化规则
        this.init(rule);
    }

    public ConditionRouter(URL url) {
        this.url = url;
        this.priority = url.getParameter(Constants.PRIORITY_KEY, 0);
        this.force = url.getParameter(Constants.FORCE_KEY, false);
        this.enabled = url.getParameter(Constants.ENABLED_KEY, true);
        init(url.getParameterAndDecoded(Constants.RULE_KEY));
    }
```

在构造函数中调用了 **`init`** 方法，从方法来看主要是解析出路由规则，得到一系列的条件

```java
public void init(String rule) {
        try {
            if (rule == null || rule.trim().length() == 0) {
                throw new IllegalArgumentException("Illegal route rule!");
            }
            rule = rule.replace("consumer.", "").replace("provider.", "");
            int i = rule.indexOf("=>");
            //获取 => 前面的部分 服务消费者的规则
            String whenRule = i < 0 ? null : rule.substring(0, i).trim();
             //获取 => 后面面的部分 服务提供者的规则
            String thenRule = i < 0 ? rule.trim() : rule.substring(i + 2).trim();
            Map<String, MatchPair> when = StringUtils.isBlank(whenRule) || "true".equals(whenRule) ? new HashMap<String, MatchPair>() : parseRule(whenRule);
            Map<String, MatchPair> then = StringUtils.isBlank(thenRule) || "false".equals(thenRule) ? null : parseRule(thenRule);
            // NOTE: It should be determined on the business level whether the `When condition` can be empty or not.
            this.whenCondition = when;
            this.thenCondition = then;
        } catch (ParseException e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }
```

看一下方法 **`parseRule`** 如何具体根据规则字符串解析出来规则

```java
    private static Map<String, MatchPair> parseRule(String rule)
            throws ParseException {
        Map<String, MatchPair> condition = new HashMap<String, MatchPair>();
        if (StringUtils.isBlank(rule)) {
            return condition;
        }
       
        MatchPair pair = null;
        
        Set<String> values = null;
        //根据Pattern.compile("([&!=,]*)\\s*([^&!=,\\s]+)");正则来匹配
        final Matcher matcher = ROUTE_PATTERN.matcher(rule);
        while (matcher.find()) { // Try to match one by one
            String separator = matcher.group(1);
            String content = matcher.group(2);
            // Start part of the condition expression.
            if (StringUtils.isEmpty(separator)) {
                pair = new MatchPair();
                condition.put(content, pair);
            }
            // The KV part of the condition expression
            else if ("&".equals(separator)) {
                if (condition.get(content) == null) {
                    pair = new MatchPair();
                    condition.put(content, pair);
                } else {
                    pair = condition.get(content);
                }
            }
            // The Value in the KV part.
            else if ("=".equals(separator)) {
                if (pair == null) {
                    throw new ParseException("Illegal route rule \""
                            + rule + "\", The error char '" + separator
                            + "' at index " + matcher.start() + " before \""
                            + content + "\".", matcher.start());
                }

                values = pair.matches;
                values.add(content);
            }
            // The Value in the KV part.
            else if ("!=".equals(separator)) {
                if (pair == null) {
                    throw new ParseException("Illegal route rule \""
                            + rule + "\", The error char '" + separator
                            + "' at index " + matcher.start() + " before \""
                            + content + "\".", matcher.start());
                }

                values = pair.mismatches;
                values.add(content);
            }
            // The Value in the KV part, if Value have more than one items.
            else if (",".equals(separator)) { // Should be separated by ','
                if (values == null || values.isEmpty()) {
                    throw new ParseException("Illegal route rule \""
                            + rule + "\", The error char '" + separator
                            + "' at index " + matcher.start() + " before \""
                            + content + "\".", matcher.start());
                }
                values.add(content);
            } else {
                throw new ParseException("Illegal route rule \"" + rule
                        + "\", The error char '" + separator + "' at index "
                        + matcher.start() + " before \"" + content + "\".", matcher.start());
            }
        }
        return condition;
    }
```

例如 host = 2.2.2.2 & host != 1.1.1.1 & method = hello 循环结束后的内容

```
{
    "host": {
        "matches": ["2.2.2.2"],
        "mismatches": ["1.1.1.1"]
    },
    "method": {
        "matches": ["hello"],
        "mismatches": []
    }
}
```

**服务路由：**

服务路由的入口方法是 **`ConditionRouter`** 的 **`router`** 方法，该方法定义在 **`Router`** 接口中。实现代码如下：

```java
    @Override
    public <T> List<Invoker<T>> route(List<Invoker<T>> invokers, URL url, Invocation invocation)
            throws RpcException {
        //判断是否生效，如果enabled设置的为false直接返回
        if (!enabled) {
            return invokers;
        }

        if (CollectionUtils.isEmpty(invokers)) {
            return invokers;
        }
        try {
            // 先对服务消费者条件进行匹配，如果匹配失败，表明服务消费者 url 不符合匹配规则，
        // 无需进行后续匹配，直接返回 Invoker 列表即可。比如下面的规则：
        //     host = 10.20.153.10 => host = 10.0.0.10
        // 这条路由规则希望 IP 为 10.20.153.10 的服务消费者调用 IP 为 10.0.0.10 机器上的服务。
        // 当消费者 ip 为 10.20.153.11 时，matchWhen 返回 false，表明当前这条路由规则不适用于
        // 当前的服务消费者，此时无需再进行后续匹配，直接返回即可。
            if (!matchWhen(url, invocation)) {
                return invokers;
            }
            List<Invoker<T>> result = new ArrayList<Invoker<T>>();
            //服务提供者匹配条件未配置，表明对指定的服务消费者禁用服务，也就是服务消费者在黑名单中
            //这个也在前面讲路由条件组成的情况下，服务通知匹配条件为空，表示对某些服务消费者禁用服务
            if (thenCondition == null) {

                return result;
            }
            for (Invoker<T> invoker : invokers) {
                // 若匹配成功，表明当前 Invoker 符合服务提供者匹配规则。
            // 此时将 Invoker 添加到 result 列表中
                if (matchThen(invoker.getUrl(), url)) {
                    result.add(invoker);
                }
            }
            if (!result.isEmpty()) {
                return result;
            } else if (force) {
                return result;
            }
        } catch (Throwable t) {
			//.....省略了打印日志
        }
        return invokers;
    }
```

### 3. 总结

- **路由规则**
- **路由规则获取对应的Invoke**

