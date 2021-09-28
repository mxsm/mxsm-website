---
title: 五大基本算法之动态规划
date: 2021-09-20
weight: 202109201749
---

### 1. 动态规划是什么？

动态规划（Dynamic Programming，DP）是[运筹学](https://baike.sogou.com/lemma/ShowInnerLink.htm?lemmaId=168782&ss_c=ssc.citiao.link)的一个分支，是求解决策过程最优化的过程。

20世纪50年代初，美国数学家贝尔曼（R.Bellman）等人在研究多阶段决策过程的优化问题时，提出了著名的[最优化原理](https://baike.sogou.com/lemma/ShowInnerLink.htm?lemmaId=420583&ss_c=ssc.citiao.link)，从而创立了动态规划。动态规划的应用极其广泛，包括工程技术、经济、工业生产、军事以及自动化控制等领域，并在[背包问题](https://baike.sogou.com/lemma/ShowInnerLink.htm?lemmaId=7898479&ss_c=ssc.citiao.link)、生产经营问题、资金管理问题、资源分配问题、[最短路径问题](https://baike.sogou.com/lemma/ShowInnerLink.htm?lemmaId=1951740&ss_c=ssc.citiao.link)和复杂系统可靠性问题等中取得了显著的效果。

把多阶段过程转化为一系列单阶段问题，利用各阶段之间的关系，逐个求解，创立了解决这类过程优化问题的新方法——动态规划

> 1. 动态规划是运筹学一个分支
> 2. 将复杂问题简单化(化繁为简)
> 3. 适应于多阶段最优化策略问题解决

动态规划过程是：每次决策依赖于当前状态，又随即引起状态的转移。一个决策序列就是在变化的状态中产生出来的，所以，这种多阶段最优化决策解决问题的过程就称为动态规划。

### 2. 动态规划与递归

动态规划是自底向上，递归树是自顶向下。为什么动态规划一般都脱离了递归，而是由循环迭代完成计算。

#### 2.1 什么叫自顶向下？

用斐波那契数列来举例子，如果用递归来求解代码如下：

```java
    public int fibonacci(int n){
        if(n == 1 || n == 2){
            return 1;  //递归停止条件
        }
        return fibonacci(n-1) + fibonacci(n-2);
    }
```

递归这样的形式就是自顶向下。例如你输入n=8那么先算7和6，一直递归下去到n=1和n=2的情况。

#### 2.2 什么叫自底向上？

反过来，我们直接从最底下，最简单，问题规模最小的 f(1) 和 f(2) 开始往上推，直到推到我们想要的答案 f(20)，这就是动态规划的思路，这也是为什么动态规划一般都脱离了递归，而是由循环迭代完成计算。

```java
    public int fibonacci(int n){
        if(n == 1 || n == 2){
            return 1;
        }
        int[] dp = new int[n+1];
        dp[1] = dp[2] = 1;
        for(int i = 3; i <= n; ++i){
            dp[i] = dp[i-1] + dp[i-2];
        }
        return dp[n];
    }
```

### 3. 力扣例子解析

#### 3.1 最小路径和-力扣64

[最小路径和-力扣64](https://leetcode-cn.com/problems/minimum-path-sum/)









参考文献:

- https://www.cxyxiaowu.com/8536.html
- https://houbb.github.io/2020/01/23/data-struct-learn-07-base-dp#dynamic-programming
