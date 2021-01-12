---
title: 希尔排序
categories:
  - 算法
  - 排序算法
tags:
  - 算法
  - 排序算法
abbrlink: 1ac49179
date: 2019-06-05 07:46:58
---
### 希尔排序(Shell Sort)

**希尔排序是把记录按下标的一定增量分组，对每组使用直接插入排序算法排序；随着增量逐渐减少，每组包含的关键词越来越多，当增量减至1时，整个文件恰被分成一组，算法便终止。**

- **算法描述**

  先将整个待排序的记录序列分割成为若干子序列分别进行直接插入排序，具体算法描述：

  - 选择一个增量序列t1，t2，…，tk，其中ti>tj，tk=1
  - 按增量序列个数k，对序列进行k 趟排序
  - 每趟排序，根据对应的增量ti，将待排序列分割成若干长度为m 的子序列，分别对各子表进行直接插入排序。仅增量因子为1 时，整个序列作为一个表来处理，表长度即为整个序列的长度

- **动态演示**

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%B8%8C%E5%B0%94%E6%8E%92%E5%BA%8F%E5%8A%A8%E6%80%81%E5%9B%BE%E8%A7%A3.gif?raw=true)

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%B8%8C%E5%B0%94%E6%8E%92%E5%BA%8F%E5%9B%BE%E8%A7%A3.png?raw=true)

- **Java代码实现**

  ```java
  public class ShellSort {
  
      public static void shellSort(int[] arrays){
  
          for(int gap = arrays.length/2; gap > 0; gap /= 2){
              for(int i = gap; i < arrays.length; ++i){
                  int j = i;
                  int temp = arrays[i];
                  if(arrays[j] < arrays[j-gap]){
                      while(j-gap >= 0 && temp <arrays[j-gap]){
                          arrays[j] = arrays[j-gap];
                          j -= gap;
                      }
                      arrays[j] = temp;
                  }
              }
          }
      }
  
      public static void main(String[] args) {
          int[] array = new int[10];
  
          for(int i = 0; i < 10; ++i){
              array[i] = (int)(Math.random() * 100);
          }
          shellSort(array);
  
          for(int item: array){
              System.out.println(item);
          }
      }
  }
  ```

  