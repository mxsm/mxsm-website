---
title: "业务开发中巧妙运用位运算"
linkTitle: "业务开发中巧妙运用位运算"
date: 2022-02-25
weight: 202202252050
---

### 1.引言

运算符是每个程序员开始学编程的时候都会接触到的。运算符大致可以分为一下几类：

- 算术运算符

  `+，-，*， /` 等等

- 赋值运算符

  `=、+=` 等等

- 关系运算符

  `==、!=、>`  等等

- 逻辑运算

  `&&、||，!`

- 位运算

  `＆、|` 等等

对于位运算，很多时候看到的都是技术性比较强的代码中，如果研究过HashMap源码以及线程池源码的人都会看到源码中使用了位运算。在业务开发中基本上看不到位运算，是不是业务中就不适合使用位运算，当然不是。下面个如何使用位运算的例子让你的业务代码看起来瞬间高大上。基础知识在业务代码中也能玩出技术项目的感觉。业务开发中巧妙运用位运算让你业务代码瞬间高大上！

### 2.示例

下面通过自己在开发过程中使用的方式来进行举例。

场景：提供一个查询用户信息的Restful接口给外部使用，用户信息包含：id, 名称，年龄，性别，手机号码，家庭地址。但是对于不同的接入方来说可能要的数据不同,接入方1:需要id,名称，年龄，接入方2：需要id,名称，手机号码。这种情况服务提供方当然可以将接口的全部字段给到双方。但是严格来说对方要什么给什么？那么如何提供解决方案。

**方案1：**

直接给双方单独提供接口，简单快捷。但是如果有10个接口需求方的字段都相同那么要提供十个接口给不同的接入方。显然这样是不合适的。

**方案2：**

提供一个全量的接口，这个接口包含了十个对接方的字段，从集合角度看就是取10个对接方的并集。这种方式就是回复到前端的数据量会增大。如果是列表增大的数据量会更多。

**方案3：**

通过巧妙的位运算来解决。

下面通过代码来演示一下如何实现：

```java
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {

    private Long id;

    private String name;

    private Integer age;

    private Short sex;

    private String moblie;

    private String address;
	//省略get set代码
}
```

Controller接口代码如下：

```java
@RestController
@RequestMapping("/user")
public class UserController {


    /**
     * type: 把type看成一个32bit,从低位到高位分别表示id, 名称，年龄，性别，手机号码，家庭地址。
     * 每一位0表示不显示数据到前端，1表示显示数据到前端。
     * 例子:
     * 二进制:111111表示全部显示换算成十进制整数为63,表示全部显示
     * 二进制:101111表示全部显示换算成十进制整数为47,除了名称其他都显示
     *
     * 前端用或运算来传入：int sum = 0;
     * sum |= (1<<2) --这个表示显示性别
     *
     * @param id
     * @param type
     * @return
     */
    @GetMapping("/{id}")
    public User getUserById(@PathVariable("id") String id, @RequestParam(value = "type", defaultValue = "63") int type){

        //根据设计那么type如何处理呢？
        User user = new User();

        //判断是否显示家庭住址
        if((type & 1) != 0){
            //拼接SQL--模拟
            user.setAddress("家庭住址");
        }

        //判读是否显示手机号码
        if((type & (1<<1)) != 0){
            //拼接SQL--模拟
            user.setMoblie("手机号码");
        }

        //判读是否显示性别
        if((type & (1<<2)) != 0){
            //拼接SQL--模拟
            user.setSex((short) 1);
        }

        //判读是否显示年龄
        if((type & (1<<3)) != 0){
            //拼接SQL--模拟
            user.setAge(10);
        }

        //判读是否显示名称
        if((type & (1<<4)) != 0){
            //拼接SQL--模拟
            user.setName("蚂蚁背大象");
        }

        //判读是否ID
        if((type & (1<<5)) != 0){
            //拼接SQL
            user.setId(100L);
        }

        return user;
    }

}
```

上面代码是实现的思想。我们运行代码看一下效果：

![位运算如何在业务中使用](C:\Users\mxsm\Desktop\pic\位运算如何在业务中使用.gif)

和前面的设想一样

> Tips: 位运算在接口的使用只是提供一种思路，除了接口设计其他地方也可以用到

代码位置：https://github.com/mxsm/spring-sample/blob/master/spring-boot/src/main/java/com/github/mxsm/controller/UserController.java

### 3. 总结

- 传参使用或运算(|)来传入最终的值
- 后端通过且运算(&)来处理
- 运算符的解决方案在这种情况下有限制，因为一位要么0要么1。所有只能是有两种选择才可以。

总的来说这样使用避免了你写每个组合的情况用一个整数表示。用位表示搭配位运算瞬间解决问题。让你的业务代码瞬间高大上起来。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢