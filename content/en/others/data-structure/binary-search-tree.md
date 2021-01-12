---
title: 二叉搜索树
categories:
  - 数据结构
tags:
  - 数据结构
abbrlink: 7cab1e06
date: 2019-07-20 21:18:13
---
### **二叉查找树**

**二叉查找树**（英语：Binary Search Tree），也称为**二叉搜索树**、**有序二叉树**（ordered binary tree）或**排序二叉树**（sorted binary tree）

数据结构(Java)：

```java
public class BinTreeNode {

    //节点值
    private int value;

    //节点的父节点
    private BinTreeNode parent;

    //左右孩子节点
    private BinTreeNode left, right;
}
```

**二叉查找树性质：**

- 若任意节点的左子树不空，则左子树上所有节点的值均小于它的根节点的值(左子树的最大值为左子树的最有叶子节点)。
- 若任意节点的右子树不空，则右子树上所有节点的值均大于它的根节点的值(右子树的最小值为右子树的最左叶子节点)。
- 任意节点的左、右子树也分别为二叉查找树。
- 没有键值相等的节点。



**二叉树的查找算法**

在二叉搜索树b种查找x的过程：

1. 若b是空树，则搜索失败，否则
2. 若x等于b的根节点数据域之值，则查找成功；否则
3. 若x小于b的根节点的数据域值，则搜索左子树(根据若任意节点的左子树不空，则左子树上所有节点的值均小于它的根节点的值)；否则
4. 查找右子树

查找代码：

```java
public BinTreeNode find(BinTreeNode treeNode, BinTreeNode node){

        //若treeNode是空树，则搜索失败
        if(treeNode == null){
            return null;
        }
        BinTreeNode left, right,find =null;

        if(treeNode.value == node.value){
            return treeNode;
        }else if(treeNode.value > node.value){
            if((left = treeNode.left) != null){
                find = find(left,node);
            }
        }else if(treeNode.value < node.value){
            if((right = treeNode.right) != null){
                find = find(right,node);
            }
        }
        return find;
    }
```

**二叉搜索树插入节点的算法**

向一个二叉搜索树b中插入一个节点s的算法，过程为：

1. 若b是空树，则将s所指节点作为根节点插入，否则、
2. 若s->data等于b的根节点的数据域之值，则返回，否则
3. 若s->data小于b的根节点的数据域之值，则把s所指节点插入到左子树中，否则
4. 把s所指节点插入到右子树中

图解：

![图片](https://github.com/mxsm/document/blob/master/image/datastructure/20190216092448.gif?raw=true)

**BST 的插入算法的复杂度与查找算法的复杂度是一样的：最佳情况是 O(log­2n)，而最坏情况是 O(n)** 因为它们对节点的查找定位策略是相同的

```java
public void insert(BinTreeNode treeNode, BinTreeNode newNode){

        //树为空将新插入的节点作为根节点
        if(treeNode == null){
            treeNode = newNode;
        }
        BinTreeNode left, right;
        if(treeNode.value == newNode.value){
            //不做处理直接返回
            return;
        }else if(treeNode.value > newNode.value){
            //插入左子树
            if((left = treeNode.left) != null)
                insert(left, newNode);
            else
                treeNode.left=newNode;
                newNode.parent=treeNode;
        }else if(treeNode.value < newNode.value){
            if((right = treeNode.right) != null)
                insert(right, newNode);
            else
                treeNode.right=newNode;
                newNode.parent=treeNode;
        }
    }
```

**二叉查找树删除节点的算法**

从BST中删除节点比插入节点更困难，删除一个非叶子节点必须选择其他的节点来填补因为删除节点造成的树的断裂。

- **情况1：**如果删除的节点没有右孩子，那么就选择它的左孩子来代替原来的节点。二叉查找树的性质保证了被删除节点的左子树必然符合二叉查找树的性质。因此左子树的值要么都大于，要么都小于被删除节点的父节点的值，这取决于被删除节点是左孩子还是右孩子。因此用被删除节点的左子树来替代被删除节点，是完全符合二叉搜索树的性质的
- **情况 2：**如果被删除节点的右孩子没有左孩子，那么这个右孩子被用来替换被删除节点。因为被删除节点的右孩子都大于被删除节点左子树的所有节点，同时也大于或小于被删除节点的父节点，这同样取决于被删除节点是左孩子还是右孩子。因此，用右孩子来替换被删除节点，符合二叉查找树的性质。
- **情况 3：**如果被删除节点的右孩子有左孩子，就需要用被删除节点右孩子的左子树中的最下面的节点来替换它，就是说，我们用被删除节点的右子树中最小值的节点来替换**。**

![](https://github.com/mxsm/document/blob/master/image/datastructure/20190216092447.gif?raw=true)

```java
/**
     * 删除节点
     * @param treeNode
     * @param dNode
     */
    public void delete(BinTreeNode treeNode, BinTreeNode dNode){

        BinTreeNode delNode = find(treeNode, dNode);
        //没有找到要删除的节点
        if(delNode == null){
            return;
        }
        BinTreeNode right=delNode.right;
        BinTreeNode left=delNode.left;
        BinTreeNode parent = delNode.parent;

        if(left == null && right == null){
            if(parent != null){
                if(parent.left == delNode){
                    parent.left = null;
                }else{
                    parent.right = null;
                }
            }else{
                treeNode = null;
            }
            return;
        }

        if(right == null){
            //删除的节点没有右孩子--左孩子来代替原来的节点
            left.parent = parent;
            if(parent != null){
                if(parent.left == delNode){
                    parent.left = left;
                }else{
                    parent.right = left;
                }
            }
            return;
        }

        if(right.left == null){
            delNode.value = right.value;
            delNode.right = right.right;
            right.right = null;
            right.parent = null;
            return;
        }
        //右孩子的左子树中的最最小的
        BinTreeNode min = findMin(right.left);
        //处理最小节点
        delNode.value = min.value;
        if(min.left == null && min.right == null){
            min.parent.left = null;
            min.parent = null;
        }else if(min.left == null && min.right != null){
            min.value = min.right.value;
            min.left =  min.right.left;
            min.right = min.right.right;
        }

    }
```

全部代码：

```java
package com.mxsm.edas.resource;

public class BinTreeNode {
    private int value;

    private BinTreeNode parent;

    private BinTreeNode left, right;

    public BinTreeNode() {

    }

    public BinTreeNode(int value) {
        this.value = value;
    }

    public BinTreeNode(int value, BinTreeNode parent, BinTreeNode left, BinTreeNode right) {
        this.value = value;
        this.parent = parent;
        this.left = left;
        this.right = right;
    }

    /**
     * 构建树
     * @param treeNode
     * @param newNode
     */
    public void insert(BinTreeNode treeNode, BinTreeNode newNode){

        //树为空将新插入的节点作为根节点
        if(treeNode == null){
            treeNode = newNode;
        }
        BinTreeNode left, right;
        if(treeNode.value == newNode.value){
            //不做处理直接返回
            return;
        }else if(treeNode.value > newNode.value){
            //插入左子树
            if((left = treeNode.left) != null)
                insert(left, newNode);
            else
                treeNode.left=newNode;
            newNode.parent=treeNode;
        }else if(treeNode.value < newNode.value){
            if((right = treeNode.right) != null)
                insert(right, newNode);
            else
                treeNode.right=newNode;
            newNode.parent=treeNode;
        }
    }

    public BinTreeNode find(BinTreeNode treeNode, BinTreeNode node){

        //若treeNode是空树，则搜索失败
        if(treeNode == null){
            return null;
        }
        BinTreeNode left, right,find =null;

        if(treeNode.value == node.value){
            return treeNode;
        }else if(treeNode.value > node.value){
            if((left = treeNode.left) != null){
                find = find(left,node);
            }
        }else if(treeNode.value < node.value){
            if((right = treeNode.right) != null){
                find = find(right,node);
            }
        }
        return find;
    }

    /**
     * 删除节点
     * @param treeNode
     * @param dNode
     */
    public void delete(BinTreeNode treeNode, BinTreeNode dNode){

        BinTreeNode delNode = find(treeNode, dNode);
        //没有找到要删除的节点
        if(delNode == null){
            return;
        }
        BinTreeNode right=delNode.right;
        BinTreeNode left=delNode.left;
        BinTreeNode parent = delNode.parent;

        if(left == null && right == null){
            if(parent != null){
                if(parent.left == delNode){
                    parent.left = null;
                }else{
                    parent.right = null;
                }
            }else{
                treeNode = null;
            }
            return;
        }

        if(right == null){
            //删除的节点没有右孩子--左孩子来代替原来的节点
            left.parent = parent;
            if(parent != null){
                if(parent.left == delNode){
                    parent.left = left;
                }else{
                    parent.right = left;
                }
            }
            return;
        }

        if(right.left == null){
            delNode.value = right.value;
            delNode.right = right.right;
            right.right = null;
            right.parent = null;
            return;
        }
        //右孩子的左子树中的最最小的
        BinTreeNode min = findMin(right.left);
        //处理最小节点
        delNode.value = min.value;
        if(min.left == null && min.right == null){
            min.parent.left = null;
            min.parent = null;
        }else if(min.left == null && min.right != null){
            min.value = min.right.value;
            min.left =  min.right.left;
            min.right = min.right.right;
        }

    }

    public BinTreeNode findMin(BinTreeNode treeNode){

        if(treeNode == null){
            return null;
        }

        for(BinTreeNode p = treeNode;;){
            if(p.left == null){
                return p;
            }
            p = p.left;
        }
    }

    public static void traverseLDR (BinTreeNode tree){

        if(tree == null){
            return;
        }
        BinTreeNode left,right;
        if((left = tree.left) != null){
            traverseLDR(left);
        }
        System.out.print(tree.value + " ");
        if ((right=tree.right) != null){
            traverseLDR(right);
        }
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }

    public BinTreeNode getParent() {
        return parent;
    }

    public void setParent(BinTreeNode parent) {
        this.parent = parent;
    }

    public BinTreeNode getLeft() {
        return left;
    }

    public void setLeft(BinTreeNode left) {
        this.left = left;
    }

    public BinTreeNode getRight() {
        return right;
    }

    public void setRight(BinTreeNode right) {
        this.right = right;
    }

    @Override
    public String toString() {
        return "BinTreeNode{" +
                "value=" + value +
                '}';
    }
}

```

