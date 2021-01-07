---
title: 选择排序
categories:
  - 算法
  - 排序算法
tags:
  - 算法
  - 排序算法
abbrlink: 43d00a99
date: 2018-09-30 19:06:26
---
### 选择排序(Selection Sort)

选择排序(Selection-sort)是一种简单直观的排序算法。它的工作原理：**首先在未排序序列中找到最小（大）元素，存放到排序序列的起始位置，然后，再从剩余未排序元素中继续寻找最小（大）元素，然后放到已排序序列的末尾。以此类推，直到所有元素均排序完毕。**

- **算法描述**

  n个记录的直接选择排序可经过n-1趟直接选择排序得到有序结果。具体算法描述如下：

  - 初始状态：无序区为R[1..n]，有序区为空；
  - 第i趟排序(i=1,2,3…n-1)开始时，当前有序区和无序区分别为R[1..i-1]和R(i..n）。该趟排序从当前无序区中-选出关键字最小的记录 R[k]，将它与无序区的第1个记录R交换，使R[1..i]和R[i+1..n)分别变为记录个数增加1个的新有序区和记录个数减少1个的新无序区；
  - n-1趟结束，数组有序化了。

- **动态演示**

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E9%80%89%E6%8B%A9%E6%8E%92%E5%BA%8F%E5%8A%A8%E6%80%81%E5%9B%BE.gif?raw=true)

- **Java代码实现**

  ```java
  public class SelectionSort {
  
      public static void  selectionSortASC(int[] array){
  
         for(int i = 0; i < array.length; ++i){
             int current=array[i];
             int index = i;
             for(int j = i; j < array.length; ++j){
                 //升序条件判断
                 if(current > array[j]){
                     current = array[j];
                     index = j;
                 }
             }
             int temp = array[i];
             array[i] = array[index];
             array[index] = temp;
         }
      }
  
      public static void  selectionSortDESC(int[] array){
  
          for(int i = 0; i < array.length; ++i){
              int current=array[i];
              int index = i;
              for(int j = i; j < array.length; ++j){
                 ////降序条件判断
                  if(current < array[j]){
                      current = array[j];
                      index = j;
                  }
              }
              int temp = array[i];
              array[i] = array[index];
              array[index] = temp;
          }
      }
  
      public static void main(String[] args) {
          int[] array = new int[10];
  
          for(int i = 0; i < 10; ++i){
              array[i] = (int)(Math.random() * 20);
          }
          selectionSortASC(array);
  
          for(int item: array){
              System.out.println(item);
          }
      }
  }
  ```

### 总结

- 表现最稳定的排序算法之一，因为无论什么数据进去都是O(n2)的时间复杂度，所以用到它的时候，数据规模越小越好。唯一的好处可能就是不占用额外的内存空间了吧。理论上讲，选择排序可能也是平时排序一般人想到的最多的排序方法了吧。

  