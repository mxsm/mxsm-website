---
title: 广度优先搜索-BFS
date: 2021-10-06
weight: 202110061632
---

### 1. 广度优先搜索(DFS)是什么？

广度优先搜索算法（英语：Breadth-First Search，缩写为BFS），又译作宽度优先搜索，或横向优先搜索，是一种图形搜索算法。简单的说，BFS是从根节点开始，沿着树的宽度遍历树的节点。如果所有节点均被访问，则算法中止。广度优先搜索的实现一般采用open-closed表。

### 2.  广度优先搜索的代码实现

从算法的观点，所有因为展开节点而得到的子节点都会被加进一个[先进先出](https://zh.wikipedia.org/wiki/先進先出)的[队列](https://zh.wikipedia.org/wiki/队列)中。一般的实现里，其邻居节点尚未被检验过的节点会被放置在一个被称为 *open* 的容器中（例如队列或是[链表](https://zh.wikipedia.org/wiki/連結串列)），而被检验过的节点则被放置在被称为 *closed* 的容器中。（open-closed表）

1. 首先将根节点放入队列中。
2. 从队列中取出第一个节点，并检验它是否为目标。
   - 如果找到目标，则结束搜索并回传结果。
   - 否则将它所有尚未检验过的直接子节点加入队列中。
3. 若队列为空，表示整张图都检查过了——亦即图中没有欲搜索的目标。结束搜索并回传“找不到目标”。
4. 重复步骤2。

以力扣的上面的 [二叉树的层序遍历](https://leetcode-cn.com/problems/binary-tree-level-order-traversal/) 为例子：

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if(root == null){
        return result;
    }
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    do{
        List<Integer> it = new ArrayList<>();
        int currentLevelSize = queue.size();
        for(int i = 0; i < currentLevelSize;++i){
            TreeNode poll = queue.poll();
            it.add(poll.val);
            if(poll.left != null){
                queue.add(poll.left);
            }
            if(poll.right != null){
                queue.add(poll.right);
             }
        }
        result.add(it);
    }while(!queue.isEmpty());
    
    return result;
}
```

参考文档:

- https://zh.wikipedia.org/wiki/%E6%B7%B1%E5%BA%A6%E4%BC%98%E5%85%88%E6%90%9C%E7%B4%A2

