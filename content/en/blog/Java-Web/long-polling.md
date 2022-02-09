---
Servlet异步应用长轮询实现
---

「这是我参与2022首次更文挑战的第22天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

### 1. 短轮询、长轮询、长连接

首先这里有三个概念需要弄清楚：

- 什么是短轮询？
- 什么是长轮询？
- 什么是长连接？

> 长轮询和短轮询都是基于HTTP协议

#### 1.1 短轮询

**轮询**（**Polling**）是一种[CPU](https://zh.wikipedia.org/wiki/CPU)决策如何提供周边设备服务的方式，又称“**程控输入输出**”（**Programmed I/O**）。轮询法的概念是：由CPU定时发出询问，依序询问每一个周边设备是否需要其服务，有即给予服务，服务结束后再问下一个周边，接着不断周而复始。--来自维基百科

可以理解为CPU的一种提供服务的策略。在实际的应用中可以看一下现在淘宝、微信等网站扫码登录，会发现有定时去请求一个接口地址来判断当前的二维码是不是有效，这就是轮询的一种实现(也叫短轮询)：

![淘宝二维码轮询](C:\Users\mxsm\Desktop\pic\淘宝二维码轮询.gif)

#### 1.2 长轮询

长轮询和短轮询是相对的，都是属于轮询的一种。总的来说是为了提升实时和效率。长轮询就是一个请求到后端服务器在设置的一段超时时间内如果请求的数据有变动就立刻返回，如果没有变动就等待直到超时返回空的数据或者没有变动的数据(这个看具体业务，超时时间也是看开发者自己设定)。通过长轮询就能达到类似于实时推送的效果。

#### 1.3 长连接

长连接，指在一个连接上可以连续发送多个数据包，在连接保持期间，如果没有数据包发送，需要双方发链路检测包---来自百度百科

通俗一点说就是：连接建立好了以后在没有异常的情况下是一直维持的。下次想发数据包直接用之前建立的重新发。无需重新新建连接。

### 2. 基于Servlet异步长轮询的实现

在之前的文章《[Servlet异步请求如何开启](https://juejin.cn/post/7060323697298505741)》讲了如何开启Servlet异步，这里我们通过Servlet异步来实现长轮询。

#### 2.1 环境准备

从Spring官方的脚手架网站https://start.spring.io/创建一个SpringBoot web项目。(版本自己选择)

#### 2.2 代码编写

```java
/**
 * @author mxsm
 * @Date 2021/3/16
 * @Since
 */
@RestController
@RequestMapping("/longPolling")
public class LongPollingController {

    private ScheduledExecutorService service = new ScheduledThreadPoolExecutor(10);
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private Queue<Task> queue = new ConcurrentLinkedQueue<>();

    private BlockingQueue<Boolean> blockingQueue = new LinkedBlockingQueue<>(1000);

    @PostConstruct
    public void init(){
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("init");
               for (;;){
                   try {
                       blockingQueue.take();
                       Task poll = null;
                       do{
                           poll = queue.poll();
                           if(poll != null){
                               poll.execute();
                           }
                       }while (poll != null);
                   } catch (InterruptedException e) {
                       e.printStackTrace();
                   }
               }
            }
        }, "thread-mxsm").start();
    }

    @GetMapping("/time")
    public void async(HttpServletRequest request, HttpServletResponse response) {
       final AsyncContext asyncContext = request.startAsync();
        executorService.execute(new Task(asyncContext));
    }

    @GetMapping("/update")
    public void update() {
        blockingQueue.offer(true);
    }

    class Task implements Runnable {
        private AsyncContext asyncContext;
        public Task(AsyncContext asyncContext) {
            this.asyncContext = asyncContext;
        }
        @Override
        public void run() {
                service.schedule(new Runnable() {
                    @Override
                    public void run() {
                        boolean remove = queue.remove(Task.this);
                        System.out.println(remove);
                        try {
                            HttpServletResponse response = (HttpServletResponse) asyncContext.getResponse();
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.getWriter().println("22222");
                            System.out.println(123);
                            asyncContext.complete();
                        } catch (IOException e) {
                            e.printStackTrace();
                            asyncContext.complete();
                        }
                    }
                }, 10, TimeUnit.MINUTES);
            queue.add(this);
            System.out.println(3333);
        }

        public void execute(){
            try {
                HttpServletResponse response = (HttpServletResponse) asyncContext.getResponse();
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().println("333333");
                System.out.println(123);
                asyncContext.complete();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

}


```

代码说明：

- async方法长轮询的接入方法
- update模拟在长轮询过程中数据更新
- 这里没有写客户端，客户端直接用手点浏览器代替看一下效果

**测试1：正常的轮询一个时间片**

![长轮询测试1](C:\Users\mxsm\Desktop\pic\长轮询测试1.gif)

**测试2：长轮询时间片过程中更新数据**

![长轮询测试2](C:\Users\mxsm\Desktop\pic\长轮询测试2.gif)

长轮询后端就就实现完成了

> 代码地址：https://github.com/mxsm/spring-sample/blob/master/spring-boot/src/main/java/com/github/mxsm/controller/LongPollingController.java

### 3. 总结

- 长轮询相对于短轮询性能好很多，但是相比长连接还是不那么好。但是优势在于可以借助HTTP的一些特性来实现快速开发
- 从轮询通过后台的一些巧妙实现也能做到及时更新数据给前端