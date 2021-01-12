---
title: 归并排序
categories:
  - 算法
  - 排序算法
tags:
  - 算法
  - 排序算法
abbrlink: 1599bffe
date: 2019-08-29 09:17:31
---
### 归并排序(Merge Sort)

归并排序是建立在归并操作上的一种有效的排序算法。该算法是采用分治法（Divide and Conquer）的一个非常典型的应用。将已有序的子序列合并，得到完全有序的序列；即先使每个子序列有序，再使子序列段间有序。若将两个有序表合并成一个有序表，称为2-路归并。

> 归并排序（MERGE-SORT）是利用归并的实现实现的一种排序方法。该算法采用经典的分治(divide-and-conquer)策略(分治法将问题**分**(divide)成一些小的问题然后递归求解，而**治(conquer)**的阶段则将分的阶段得到的各答案"修补"在一起，即分而治之)

**分治：**

![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BD%92%E5%B9%B6%E6%8E%92%E5%BA%8F%E5%88%86%E8%80%8C%E6%B2%BB%E4%B9%8B%E7%9A%84%E6%80%9D%E6%83%B3%E5%9B%BE%E8%A7%A3.png?raw=true)

可以看到这种结构很像一棵完全二叉树，本文的归并排序我们采用递归去实现（也可采用迭代的方式去实现）。**分**阶段可以理解为就是递归拆分子序列的过程，递归深度为log2n

**合并相邻的子序列：**

再来看看**治**阶段，我们需要将两个已经有序的子序列合并成一个有序序列，比如上图中的最后一次合并，要将[4,5,7,8]和[1,2,3,6]两个已经有序的子序列，合并为最终序列[1,2,3,4,5,6,7,8]，来看下实现步骤。

![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BD%92%E5%B9%B6%E6%8E%92%E5%BA%8F%E5%90%88%E5%B9%B6%E7%9B%B8%E9%82%BB%E5%AD%90%E5%BA%8F%E5%88%97%E5%9B%BE%E8%A7%A3.png?raw=true)

![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BD%92%E5%B9%B6%E6%8E%92%E5%BA%8F%E5%90%88%E5%B9%B6%E7%9B%B8%E9%82%BB%E5%AD%90%E5%BA%8F%E5%88%97%E5%9B%BE%E8%A7%A32.png?raw=true)



- **算法描述**

  - 把长度为n的输入序列分成两个长度为n/2的子序列
  - 对这两个子序列分别采用归并排序
  - 将两个排序好的子序列合并成一个最终的排序序列

- **动态图演示**

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BD%92%E5%B9%B6%E6%8E%92%E5%BA%8F%E5%8A%A8%E6%80%81%E5%9B%BE%E6%BC%94%E7%A4%BA.gif?raw=true)

- **Java代码实现**、

  ```java
  public class MergeSort {
  
      public static void mergeSort(int[] arrays){
  
          mergeSort(arrays,0,arrays.length-1,new int[arrays.length]);
  
      }
  
      private static void mergeSort(int[] arrays, int start, int end, int[] temp){
  
          if(start < end){
              int mid = ( start + end)/2;
              //处理左边
              mergeSort(arrays,start,mid,temp);
              //处理右边
              mergeSort(arrays,mid+1,end,temp);
              //归并操作
              merge(arrays, start, mid, end, temp);
          }
  
      }
  
      //治函数也就是合并的子序列的函数
      private static  void merge(int[] arrays, int start, int mid, int end, int[] temp){
          int i = start; //左序列起始指针
          int j = mid+1; //右序列起始指针
          int t = 0; //临时数组指针
  
          while (i <=mid && j <= end){
              //决定排序的方式
              if(arrays[i]<arrays[j]){
                  temp[t++] = arrays[i++];
              }else{
                  temp[t++] = arrays[j++];
              }
          }
          //处理剩下的
          while(i<=mid){//将左边剩余元素填充进temp中
              temp[t++] = arrays[i++];
          }
          while(j<=end){//将右序列剩余元素填充进temp中
              temp[t++] = arrays[j++];
          }
          t = 0;
          //排序完成分段的数据
          while (start <= end){
              arrays[start++] = temp[t++];
          }
      }
  
      public static void main(String[] args) {
          int[] array = new int[10];
  
          for(int i = 0; i < 10; ++i){
              array[i] = (int)(Math.random() * 20);
          }
          mergeSort(array);
  
          for(int item: array){
              System.out.println(item);
          }
      }
  
  }
  ```

  