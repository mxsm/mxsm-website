---
title: 快速排序
categories:
  - 算法
  - 排序算法
tags:
  - 算法
  - 排序算法
abbrlink: ff8068c0
date: 2019-05-11 03:26:28
---
### 快速排序(Quick Sort)

快速排序由C. A. R. Hoare在1962年提出。它的基本思想是：通过一趟排序将要排序的数据分割成独立的两部分，其中一部分的所有数据都比另外一部分的所有数据都要小，然后再按此方法对这两部分数据分别进行快速排序，整个排序过程可以递归进行，以此达到整个数据变成有序序列。

- **算法描述**

  快速排序使用分治法来把一个串（list）分为两个子串（sub-lists）。具体算法描述如下：

  - 从数列中挑出一个元素，称为 “基准”（pivot）
  - 重新排序数列，所有元素比基准值小的摆放在基准前面，所有元素比基准值大的摆在基准的后面（相同的数可以到任一边）。在这个分区退出之后，该基准就处于数列的中间位置。这个称为分区（partition）操作
  - 递归地（recursive）把小于基准值元素的子数列和大于基准值元素的子数列排序

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA1.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA2.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA3.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA4.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA5.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA6.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA7.png?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%9B%BE%E7%A4%BA8.png?raw=true)

- **动态图演示**

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F%E5%8A%A8%E6%80%81%E5%9B%BE%E6%BC%94%E7%A4%BA.gif?raw=true)

- **Java代码实现**

  ```java
  public class QuickSort {
  
      public static void quickSort(int[] arrays){
          quickSort1(arrays,0,arrays.length-1);
      }
  
  
  
      private static void quickSort1(int[] arrays, int left, int right){
  
          if(left > right){
              return;
          }
  
          int i = left;
          int j = right;
          int temp = arrays[left];
          int t;
          while (i < j){
              //从右往左找到小于6的
              while (temp <= arrays[j] && i < j){
                  --j;
              }
              //从左往右找到大于6的
              while (temp >= arrays[i] && i < j){
                  ++i;
              }
              //交换
              if(i < j){
                  t = arrays[i];
                  arrays[i] = arrays[j];
                  arrays[j] = t;
              }
          }
          arrays[left] = arrays[i];
          arrays[i] = temp;
  
          quickSort1(arrays,left, i -1);
          quickSort1(arrays, i+1, right);
  
      }
  
  
  
      public static void main(String[] args) {
          int size = 5;
          int[] array = new int[size];
  
          for(int i = 0; i < size; ++i){
              array[i] = (int)(Math.random() * 100);
          }
          quickSort(array);
  
          for(int item: array){
              System.out.println(item);
          }
      }
  }
  ```

  