---
title: 冒泡排序
date: 2019-12-05
---
一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第17天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

### 1. 冒泡排序(Bubble Sort)

冒泡排序是一种简单的排序算法。它重复地走访过要排序的数列，一次比较两个元素，如果它们的顺序错误就把它们交换过来。走访数列的工作是重复地进行直到没有再需要交换，也就是说该数列已经排序完成。这个算法的名字由来是因为越小的元素会经由交换慢慢“浮”到数列的顶端。 

- **算法描述**

  - 比较相邻的两个元素。如果第一个比第二个大，就交换两个的位置。
  - 对每一个相邻元素进行同样的工作，从开始第一对到结尾最后一对。这样在最后的元素应该会是最大数。
  - 针对所有的元素重复以上的步骤，除了最后一个
  - 重复以上三个步骤直到完成排序

  **上面的排序方式是顺序排序(从小到大排序)，倒序排序就是假定第一个为最小的然后做交换。** 

- **动图演示**

  ![图解](https://github.com/mxsm/document/blob/master/image/arithmetic/sort/%E5%86%92%E6%B3%A1%E6%8E%92%E5%BA%8F%E5%8A%A8%E5%9B%BE%E6%BC%94%E7%A4%BA.gif?raw=true)

冒泡排序的本质：根据事先设定的条件对相邻两个数据的交换。

### 2. Java代码实现

```java
public class BubbleSort {


    public static void bubbleSortASC(int[] array){

        for(int i = array.length; i > 1; --i){
            int temp;
            for(int j = 0; j < i-1; ++j){
              //升序的控制条件
               if((temp = array[j]) > array[j+1]){
                   array[j] = array[j+1];
                   array[j+1] = temp;
               }
            }
        }

    }

    public static void bubbleSortDESC(int[] array){

        for(int i = array.length; i > 1; --i){
            int temp;
            for(int j = 0; j < i-1; ++j){
              	//倒序的控制条件
                if((temp =array[j]) < array[j+1]){
                    array[j] = array[j+1];
                    array[j+1] = temp;
                }
            }
        }

    }

    public static void main(String[] args) {

        int[] array = new int[10];

        for(int i = 0; i < 10; ++i){
            array[i] = (int)(Math.random() * 20);
        }

        bubbleSortDESC(array);

        for(int item: array){
            System.out.println(item);
        }

    }
}
```

代码的关键：相邻两个数据的大小相比来确定是降序还是升序。

### 3. 总结

- **主要是两个for循环来控制每一次对比**
- **前后两个值的大小判断来控制倒序还是逆序**

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

**参考资料：**

- https://visualgo.net/en/sorting