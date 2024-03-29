---
title: 深度优先搜索-DFS
date: 2021-10-06
weight: 202110061032
---

### 1. 深度优先搜索(DFS)是什么？

深度优先搜索算法（英语：Depth-First-Search，DFS）是一种用于遍历或搜索树或图的算法。这个算法会尽可能深的搜索树的分支。当节点v的所在边都己被探寻过，搜索将回溯到发现节点v的那条边的起始节点。这一过程一直进行到已发现从源节点可达的所有节点为止。如果还存在未被发现的节点，则选择其中一个作为源节点并重复以上过程，整个进程反复进行直到所有节点都被访问为止。这种算法不会根据图的结构等信息调整执行策略

#### 1.1 DFS解决的问题

深度优先搜索是图论中的经典算法，利用深度优先搜索算法可以产生目标图的[拓扑排序](https://zh.wikipedia.org/wiki/拓扑排序)表，利用拓扑排序表可以方便的解决很多相关的[图论](https://zh.wikipedia.org/wiki/图论)问题，如无权最长路径问题等等。

### 2. 深度优先搜索的代码实现

用力扣的一道简单的题目[二叉树的前序遍历](https://leetcode-cn.com/problems/binary-tree-preorder-traversal/)来说明实现。大家都知道对于二叉树的遍历有两种实现：

- 递归实现
- 栈实现

#### 2.1 深度优先搜索-递归

```java
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();

        dfs(root, result);

        return result;
    }

    private void dfs(TreeNode node, List<Integer> result) {
        if (node == null) {
            return;
        }
        result.add(node.val);
        if (node.left != null) {
            dfs(node.left, result);
        }
        if (node.right != null) {
            dfs(node.right, result);
        }
    }
```

#### 2.2 深度优先搜索-栈

```
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if(null == root){
            return result;
        }
        Stack<TreeNode> stack = new Stack<>();
        stack.push(root);
        while(!stack.isEmpty()){
            TreeNode pop = stack.pop();
            result.add(pop.val);
            if(pop.right != null){
                stack.add(pop.right);
            }
            if(pop.left != null){
                stack.add(pop.left);
            }
        }
        return result;
    }
```

参考文档:

- https://zh.wikipedia.org/wiki/%E6%B7%B1%E5%BA%A6%E4%BC%98%E5%85%88%E6%90%9C%E7%B4%A2

