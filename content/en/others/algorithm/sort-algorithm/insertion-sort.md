---
title: 插入排序
categories:
  - 算法
  - 排序算法
tags:
  - 算法
  - 排序算法
abbrlink: 96555fb2
date: 2018-07-04 04:47:14
---
### 插入排序(Insertion Sort)

插入排序（Insertion-Sort）的算法描述是一种简单直观的排序算法。它的工作原理是通过构建有序序列，对于未排序数据，在已排序序列中从后向前扫描，找到相应位置并插入。

- **算法描述**

  一般来说，插入排序都采用in-place在数组上实现。具体算法描述如下：

  - 从第一个元素开始，该元素可以认为已经被排序；
  - 取出下一个元素，在已经排序的元素序列中从后向前扫描；
  - 如果该元素（已排序）大于新元素，将该元素移到下一位置；
  - 重复步骤3，直到找到已排序的元素小于或者等于新元素的位置；
  - 将新元素插入到该位置后；
  - 重复步骤2~5。

- **动态演示**

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E6%8F%92%E5%85%A5%E6%8E%92%E5%BA%8F%E5%8A%A8%E6%80%81%E5%9B%BE.gif?raw=true)

- **Java代码实现**

  ```
  public class InsertionSort {
  
    public static void insertionSort(int[] arrays){
          for(int i = 1; i < arrays.length; ++i){
              int preIndex = i - 1;
              int current = arrays[i];
              while (preIndex >= 0 && arrays[preIndex] > current){
                  arrays[preIndex+1] = arrays[preIndex];
                  preIndex--;
              }
              arrays[preIndex+1] = current;
          }
      }
  
      public static void main(String[] args) {
          int[] array = new int[10];
  
          for(int i = 0; i < 10; ++i){
              array[i] = (int)(Math.random() * 20);
          }
          insertionSort(array);
  
          for(int item: array){
              System.out.println(item);
          }
      }
  }
  ```
  
  