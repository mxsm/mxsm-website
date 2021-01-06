---
title: 线程池
categories:
  - Java
  - JSE
  - 并发和多线程
tags:
  - Java
  - JSE
  - 并发和多线程
abbrlink: de7c53fe
date: 2018-11-12 18:20:15
---
### 1. 线程池的继承关系

![图片](https://github.com/mxsm/document/blob/master/image/JSE/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E7%9A%84%E7%BB%A7%E6%89%BF%E5%85%B3%E7%B3%BB.png?raw=true)

从上图可以看出来最顶层的接口为 **`Executor`** ,下面看一下这个接口中的方法

```java
public interface Executor {
	//只有一个方法execute
    void execute(Runnable command);
}
```

 从代码中可以看出来只有一个 **`execute`** 方法。这也是我常用的一个来运行 **`Runable`** 的一种方式。然后看一下继承了 **`Executor`** 接口的 **`ExecutorService`** 接口中有哪些我们熟悉的而常用的方法

```java
public interface ExecutorService extends Executor {
	
    // 关闭线程池，已提交的任务继续执行，不接受继续提交新任务
    //写例子的时候用到(PS在实际的项目组基本上没有用到，反正我是没有)
    void shutdown();
	
    //关闭线程池，尝试停止正在执行的所有任务，不接受继续提交新任务
     //这个也是基本上没用到
    List<Runnable> shutdownNow();

    // 线程池是否已关闭
   	// 还是没有用到
    boolean isShutdown();

    // 这个方法必须在调用shutdown或shutdownNow方法之后调用才会返回true
    //尴尬没用过
    boolean isTerminated();

    //一脸懵逼没用过
    boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException;

   //带返回值的
    <T> Future<T> submit(Callable<T> task);

    //带返回值的 -- 这个很少用
    <T> Future<T> submit(Runnable task, T result);

    //带返回值---(成功返回值为null 有兴趣的可以去尝试一下，源码的英文注释上面有说明)
    Future<?> submit(Runnable task);

    //批量全部执行
    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException;

    //批量全部执行--在规定的时间内
    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
                                  long timeout, TimeUnit unit)
        throws InterruptedException;

   //任意一个先执行完就返回
    <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException;

    //任意一个先执行完就返回
    <T> T invokeAny(Collection<? extends Callable<T>> tasks,
                    long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

演示代码：

```java
public class InvokeAllTest {

    public static void main(String[] args) throws  Exception{
        ExecutorService service = Executors.newFixedThreadPool(10);
        Collection<Test> a = new ArrayList<>();
        for(int i = 0; i < 10; ++i){
            a.add(new Test());
        }
        //System.out.println( service.invokeAny(a));
        System.out.println( service.invokeAll(a));
    }

}

class Test implements Callable<String>{

    /**
     * Computes a result, or throws an exception if unable to do so.
     *
     * @return computed result
     * @throws Exception if unable to compute a result
     */
    @Override
    public String call() throws Exception {

        TimeUnit.SECONDS.sleep((int)(Math.random()*10));

        return Thread.currentThread().getName();
    }
}
```

看一下最后一个接口 **`ScheduledExecutorService`** 计划执行接口，从命名上就不难看出来这个用于执行任务的。

```java
public interface ScheduledExecutorService extends ExecutorService {

    /**
     * 创建并执行在给定延迟之后启用的一次性操作。
     */
    public ScheduledFuture<?> schedule(Runnable command,
                                       long delay, TimeUnit unit);

    /**
     * 创建并执行在给定延迟之后启用的一次性操作。返回ScheduledFuture<V>
     */
    public <V> ScheduledFuture<V> schedule(Callable<V> callable,
                                           long delay, TimeUnit unit);

    /**
     * 按指定频率周期执行某个任务。
     */
    public ScheduledFuture<?> scheduleAtFixedRate(Runnable command,
                                                  long initialDelay,
                                                  long period,
                                                  TimeUnit unit);

    /**
     * 按指定频率间隔执行某个任务。
     */
    public ScheduledFuture<?> scheduleWithFixedDelay(Runnable command,
                                                     long initialDelay,
                                                     long delay,
                                                     TimeUnit unit);

}
```

另外，由于线程池支持**获取线程执行的结果**，所以，引入了 Future 接口，RunnableFuture 继承自此接口，然后我们最需要关心的就是它的实现类 FutureTask。到这里，记住这个概念，在线程池的使用过程中，我们是往线程池提交任务（task），使用过线程池的都知道，我们提交的每个任务是实现了 Runnable 接口的，其实就是先将 Runnable 的任务包装成 FutureTask，然后再提交到线程池。这样，读者才能比较容易记住 FutureTask 这个类名：它首先是一个任务（Task），然后具有 Future 接口的语义，即可以在将来（Future）得到执行的结果。



### 2.  **`AbstractExecutorService`**

接着来看一下在抽象类 **`AbstractExecutorService`** 实现了哪些方法

```java
public abstract class AbstractExecutorService implements ExecutorService {

    /**
     * Runnable 转换为 Callable 的方法带指定返回值
     */
    protected <T> RunnableFuture<T> newTaskFor(Runnable runnable, T value) {
        return new FutureTask<T>(runnable, value);
    }

    /**
     * Runnable 转换为 Callable 的方法，不带指定返回值
     */
    protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable) {
        return new FutureTask<T>(callable);
    }

    /**
     * 
     */
    public Future<?> submit(Runnable task) {
        if (task == null) throw new NullPointerException();
        //这里看一看出来在Runnable submit方法返回值为Future get的值为null
        RunnableFuture<Void> ftask = newTaskFor(task, null);
        execute(ftask);
        return ftask;
    }

    public <T> Future<T> submit(Runnable task, T result) {
        if (task == null) throw new NullPointerException();
         //这里看一看出来在Runnable submit方法返回值为Future get的值为result
        RunnableFuture<T> ftask = newTaskFor(task, result);
        execute(ftask);
        return ftask;
    }

    /**
     * Callable类型
     */
    public <T> Future<T> submit(Callable<T> task) {
        if (task == null) throw new NullPointerException();
        RunnableFuture<T> ftask = newTaskFor(task);
        execute(ftask);
        return ftask;
    }

    /**
     * 返回任意一个执行完成的结果
     */
    private <T> T doInvokeAny(Collection<? extends Callable<T>> tasks,
                              boolean timed, long nanos)
        throws InterruptedException, ExecutionException, TimeoutException {
        if (tasks == null)
            throw new NullPointerException();
        int ntasks = tasks.size();
        if (ntasks == 0)
            throw new IllegalArgumentException();
        //Future列表
        ArrayList<Future<T>> futures = new ArrayList<Future<T>>(ntasks);
        ExecutorCompletionService<T> ecs =
            new ExecutorCompletionService<T>(this);
        try {
            
            ExecutionException ee = null;
            //截止时间---0就是没有截止时间
            final long deadline = timed ? System.nanoTime() + nanos : 0L;
            Iterator<? extends Callable<T>> it = tasks.iterator();

           
            futures.add(ecs.submit(it.next()));
            --ntasks;
            int active = 1;

            for (;;) {
                //返回已经完成的任务Future<T> 没有就返回null -- 不停的循环轮询
                Future<T> f = ecs.poll();
                if (f == null) {
                    if (ntasks > 0) {
                        --ntasks;
                        futures.add(ecs.submit(it.next()));
                        ++active;
                    }
                    else if (active == 0)
                        break;
                    else if (timed) {
                        f = ecs.poll(nanos, TimeUnit.NANOSECONDS);
                        if (f == null)
                            throw new TimeoutException();
                        nanos = deadline - System.nanoTime();
                    }
                    else
                        f = ecs.take();
                }
                if (f != null) {
                    --active;
                    try {
                        return f.get();
                    } catch (ExecutionException eex) {
                        ee = eex;
                    } catch (RuntimeException rex) {
                        ee = new ExecutionException(rex);
                    }
                }
            }

            if (ee == null)
                ee = new ExecutionException();
            throw ee;

        } finally {
            for (int i = 0, size = futures.size(); i < size; i++)
                futures.get(i).cancel(true);
        }
    }

    public <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException {
        try {
            return doInvokeAny(tasks, false, 0);
        } catch (TimeoutException cannotHappen) {
            assert false;
            return null;
        }
    }

    public <T> T invokeAny(Collection<? extends Callable<T>> tasks,
                           long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException {
        return doInvokeAny(tasks, true, unit.toNanos(timeout));
    }

    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException {
        if (tasks == null)
            throw new NullPointerException();
        //创建返回值Future 的列表
        ArrayList<Future<T>> futures = new ArrayList<Future<T>>(tasks.size());
        boolean done = false;
        try {
            //放入线程池运行
            for (Callable<T> t : tasks) {
                RunnableFuture<T> f = newTaskFor(t);
                futures.add(f);
                execute(f);
            }
            //等待运行完成
            for (int i = 0, size = futures.size(); i < size; i++) {
                Future<T> f = futures.get(i);
                if (!f.isDone()) {
                    try {
                        f.get();
                    } catch (CancellationException ignore) {
                    } catch (ExecutionException ignore) {
                    }
                }
            }
            done = true;
            return futures;
        } finally {
            if (!done)
                //将没有运行完成的线程直接取消掉
                for (int i = 0, size = futures.size(); i < size; i++)
                    futures.get(i).cancel(true);
        }
    }

    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
                                         long timeout, TimeUnit unit)
        throws InterruptedException {
        if (tasks == null)
            throw new NullPointerException();
        long nanos = unit.toNanos(timeout);
        ArrayList<Future<T>> futures = new ArrayList<Future<T>>(tasks.size());
        boolean done = false;
        try {
            //创建任务数组
            for (Callable<T> t : tasks)
                futures.add(newTaskFor(t));
			//截止时间
            final long deadline = System.nanoTime() + nanos;
            final int size = futures.size();
			
            //减去提交的时间
            for (int i = 0; i < size; i++) {
                execute((Runnable)futures.get(i));
                nanos = deadline - System.nanoTime();
                //小于0直接返回现有的
                if (nanos <= 0L)
                    return futures;
            }
			
			//处理每个获取的时间
            for (int i = 0; i < size; i++) {
                Future<T> f = futures.get(i);
                if (!f.isDone()) {
                    if (nanos <= 0L)
                        return futures;
                    try {
                        f.get(nanos, TimeUnit.NANOSECONDS);
                    } catch (CancellationException ignore) {
                    } catch (ExecutionException ignore) {
                    } catch (TimeoutException toe) {
                        //发现timeout直接返回
                        return futures;
                    }
                    nanos = deadline - System.nanoTime();
                }
            }
            done = true;
            return futures;
        } finally {
            if (!done)
                //返回后发现还有在运行的直接cacel掉
                for (int i = 0, size = futures.size(); i < size; i++)
                    futures.get(i).cancel(true);
        }
    }

}
```

从上面可以看出来上面方法实现主要是通过调用  **`execute`** 和 **`ExecutorCompletionService`** 这个类。来实现了 **`submit`** , **`doInvokeAny`**  ,**`invokeAll`** 这些方法。

### 3 看看最常用的实现 **`ThreadPoolExecutor`**

首先我们来看一下 **`ThreadPoolExecutor`** 类中包含的成员变量进行逐一的分析

```java
//从开始的继承图可以看出来 ThreadPoolExecutor继承了AbstractExecutorService
public class ThreadPoolExecutor extends AbstractExecutorService {
    /**
     * 主线程池控制状态ctl是一个atomic整型封装了两个概念字段
     * 
     *   线程数量, 定义了有效的线程数量
     *   运行状态,    定义了：运行状态，关闭状态等等。
     *
     * 为了封装成一个整数, 我们限制线程的数量为
     * (2^29)-1 (about 500 million) 而不是 (2^31)-1
     * 如果将来出现这种情况，可以将变量更改为AtomicLong，并调整下面的shift/mask常量。
     * 但是在需要之前，这段代码使用int会更快、更简单。
     * 工作线程是允许启动和停止的，工作线程可能会有和存活的线程有短暂的数量不同
     *
     *   RUNNING:  接受新任务并处理排队的任务
     *   SHUTDOWN: 不接受新任务但是处理排队任务
     *   STOP:     不接受新任务不接受排队任务，并且中断在处理中的任务
     *             
     *   TIDYING(整理):  所有的任务中止, 工作线程为0，转换到状态清理的线程将运行terminate()钩子方法
     *             
     *   TERMINATED: terminated() 已经完成
     *
     * The numerical order among these values matters, to allow
     * ordered comparisons. The runState monotonically increases over
     * time, but need not hit each state. The transitions are:
     *
     * RUNNING -> SHUTDOWN
     *     调用shutdown(),或者在finalize()中调用shutdown()
     * (RUNNING or SHUTDOWN) -> STOP
     *    调用shutdownNow()
     * SHUTDOWN -> TIDYING
     *    当队列和线程池都为空的时候
     * STOP -> TIDYING
     *    当线程池为空
     * TIDYING -> TERMINATED
     *    terminated() 方法执行完成
     *
     */
    private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
    //线程的数量的表示位--低29位表示线程数量
    private static final int COUNT_BITS = Integer.SIZE - 3;
    //最大的线程的容量(2^29)-1
    private static final int CAPACITY   = (1 << COUNT_BITS) - 1;

    // runState 用int的高三位表示
    //11100000000000000000000000000000
    private static final int RUNNING    = -1 << COUNT_BITS;
    
    //00000000000000000000000000000000
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    
    //00100000000000000000000000000000
    private static final int STOP       =  1 << COUNT_BITS;
    
    //10000000000000000000000000000000
    private static final int TIDYING    =  2 << COUNT_BITS;
    
    //11000000000000000000000000000000
    private static final int TERMINATED =  3 << COUNT_BITS;

    // 拆解出运行状态
    private static int runStateOf(int c)     { return c & ~CAPACITY; }
    
    //拆解出来线程数量
    private static int workerCountOf(int c)  { return c & CAPACITY; }
    
    //把运行状态和线程数量打包成一个整数
    private static int ctlOf(int rs, int wc) { return rs | wc; }

    /**
     * 线程的增加和减少都是通过CAS来进行的
     */
    private boolean compareAndIncrementWorkerCount(int expect) {
        return ctl.compareAndSet(expect, expect + 1);
    }

    private boolean compareAndDecrementWorkerCount(int expect) {
        return ctl.compareAndSet(expect, expect - 1);
    }


    private void decrementWorkerCount() {
        do {} while (! compareAndDecrementWorkerCount(ctl.get()));
    }

    /**
     * 阻塞队列
     */
    private final BlockingQueue<Runnable> workQueue;

    /**
     * 非公平的重入锁
     */
    private final ReentrantLock mainLock = new ReentrantLock();

    /**
     * 仅在持有主锁mainLock时访问
     * .
     */
    private final HashSet<Worker> workers = new HashSet<Worker>();


    private final Condition termination = mainLock.newCondition();


    private int largestPoolSize;


    private long completedTaskCount;


    private volatile ThreadFactory threadFactory;

    /**
     * 当执行饱和或关闭时调用处理Handler
     */
    private volatile RejectedExecutionHandler handler;

    /**
     * 闲置的线程等待超时时间
     */
    private volatile long keepAliveTime;

    /**
     * 是否允许核心线程超时
     */
    private volatile boolean allowCoreThreadTimeOut;

    /**
	 * 核心线程池的大小
     */
    private volatile int corePoolSize;

    /**
     * 线程的极大值
     * 
     */
    private volatile int maximumPoolSize;

    /**
     * 默认的被拒执行的Handler
     */
    private static final RejectedExecutionHandler defaultHandler =
        new AbortPolicy();

	//Worker实现了AQS和Runnable的接口
    private final class Worker
        extends AbstractQueuedSynchronizer
        implements Runnable
    {
        
        private static final long serialVersionUID = 6138294804551838833L;

       
        final Thread thread;
       
        Runnable firstTask;
       
        volatile long completedTasks;

        Worker(Runnable firstTask) {
            setState(-1); // inhibit interrupts until runWorker
            this.firstTask = firstTask;
            this.thread = getThreadFactory().newThread(this);
        }

        /** Delegates main run loop to outer runWorker  */
        public void run() {
            runWorker(this);
        }

        protected boolean isHeldExclusively() {
            return getState() != 0;
        }

        protected boolean tryAcquire(int unused) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }

        protected boolean tryRelease(int unused) {
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }

        public void lock()        { acquire(1); }
        public boolean tryLock()  { return tryAcquire(1); }
        public void unlock()      { release(1); }
        public boolean isLocked() { return isHeldExclusively(); }

        void interruptIfStarted() {
            Thread t;
            if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
                try {
                    t.interrupt();
                } catch (SecurityException ignore) {
                }
            }
        }
    }
```

### 3. execute 的实现

从上面可以看出来上面方法实现主要是通过调用  **`execute`** 和 **`ExecutorCompletionService`** 这个类。来实现了 **`submit`** , **`doInvokeAny`**  ,**`invokeAll`** 这些方法。下面就来看一下 **`execute`** 这方法在 **`ThreadPoolExecutor`** 中是如何实现的。

```java
 public void execute(Runnable command) {
        if (command == null)
            throw new NullPointerException();
        /*
         * Proceed in 3 steps:
         *
         * 1 如果运行的线程小于corePoolSize，则尝试以给定命令作为其第一个任务启动新线程。对
         * addWorker的调用以原子方式检查runState和workerCount，从而通过返回false防止在不
         * 应该添加线程时添加错误警报。
         * 
         * 2. 如果一个任务可以成功地排队，那么我们仍然需要再次检查是否应该添加线程(因为上次检
         * 查后已有线程死亡)，或者是否应该在进入这个方法后关闭线程池。因此，我们重新检查状
         * 态，如果有必要的话，在停止时回滚队列，或者在没有线程时启动新线程。
         *
         * 3. 如果无法对任务排队，则尝试添加新线程。如果它失败了，我们知道我们被关闭或饱和，所以拒绝任务。
         * 所以拒绝任务。
         * 
         */
     
     	//获取线程池中线程数量---默认是0
        int c = ctl.get();
        //如果设置了核心线程数先判断核心线程数是不是已经满了
        if (workerCountOf(c) < corePoolSize) {
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
        //判断线程池是否处于运行状态并且还能往队列添加任务
        if (isRunning(c) && workQueue.offer(command)) {
            int recheck = ctl.get();
            //双重检查---如果不是运行状态从队列中删除任务
            if (! isRunning(recheck) && remove(command))
                //根据传入的不同策略处理器处理问题
                reject(command);
            else if (workerCountOf(recheck) == 0)
                addWorker(null, false);
        }
        //添加非核心线程任务
        else if (!addWorker(command, false))
            //添加失败根据传入的不同的策略处理器处理问题
            reject(command);
    }
```

**execute** 方法主要做了三件事情：

1. **添加核心处理线程**
2. **线程池在运行状态，添加任务到任务阻塞队列中**
3. **新增非核心线程处理**

> 在线程池构造函数中有设置keepAliveTime，这个设置的就是非coreThread的存活时间。

通过上面的源码发现主要是 **`addWorker`** 方法：

```java
    private boolean addWorker(Runnable firstTask, boolean core) {
        //增加Worker的数量
        retry:
        for (;;) {
            int c = ctl.get();
            int rs = runStateOf(c);

            // Check if queue empty only if necessary.
            if (rs >= SHUTDOWN &&
                ! (rs == SHUTDOWN &&
                   firstTask == null &&
                   ! workQueue.isEmpty()))
                return false;

            for (;;) {
                int wc = workerCountOf(c);
                if (wc >= CAPACITY ||
                    wc >= (core ? corePoolSize : maximumPoolSize))
                    return false;
                if (compareAndIncrementWorkerCount(c))
                    break retry;
                c = ctl.get();  // Re-read ctl
                if (runStateOf(c) != rs)
                    continue retry;
            }
        }

        //创建Worker并且启动
        boolean workerStarted = false;
        boolean workerAdded = false;
        Worker w = null;
        try {
            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    // Recheck while holding lock.
                    // Back out on ThreadFactory failure or if
                    // shut down before lock acquired.
                    int rs = runStateOf(ctl.get());

                    if (rs < SHUTDOWN ||
                        (rs == SHUTDOWN && firstTask == null)) {
                        if (t.isAlive()) // precheck that t is startable
                            throw new IllegalThreadStateException();
                        workers.add(w);
                        int s = workers.size();
                        if (s > largestPoolSize)
                            largestPoolSize = s;
                        workerAdded = true;
                    }
                } finally {
                    mainLock.unlock();
                }
                if (workerAdded) {
                    t.start();
                    workerStarted = true;
                }
            }
        } finally {
            if (! workerStarted)
                addWorkerFailed(w);
        }
        return workerStarted;
    }
```

上面的代码也是做了两件事情：

1. 增加worker数量的统计
2. 创建新的Worker并且启动

在线程池中的任务处理主要是靠一个 **`Worker`** 的内部类进行处理。下面来看一下这个内部类：

```java
private final class Worker
        extends AbstractQueuedSynchronizer
        implements Runnable
    {
        /**
         * This class will never be serialized, but we provide a
         * serialVersionUID to suppress a javac warning.
         */
        private static final long serialVersionUID = 6138294804551838833L;

        /** Thread this worker is running in.  Null if factory fails. */
        final Thread thread;
        /** Initial task to run.  Possibly null. */
        Runnable firstTask;
        /** Per-thread task counter */
        volatile long completedTasks;

        /**
         * Creates with given first task and thread from ThreadFactory.
         * @param firstTask the first task (null if none)
         */
        Worker(Runnable firstTask) {
            setState(-1); // inhibit interrupts until runWorker
            this.firstTask = firstTask;
            this.thread = getThreadFactory().newThread(this);
        }

        /** Delegates main run loop to outer runWorker  */
        public void run() {
            runWorker(this);
        }
        protected boolean isHeldExclusively() {
            return getState() != 0;
        }

        protected boolean tryAcquire(int unused) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }

        protected boolean tryRelease(int unused) {
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }

        public void lock()        { acquire(1); }
        public boolean tryLock()  { return tryAcquire(1); }
        public void unlock()      { release(1); }
        public boolean isLocked() { return isHeldExclusively(); }

        void interruptIfStarted() {
            Thread t;
            if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
                try {
                    t.interrupt();
                } catch (SecurityException ignore) {
                }
            }
        }
    }
```

**`Worker`** 继承了 **`AbstractQueuedSynchronizer`** 实现了 **`Runnable`** 。**`Worker`** 中有两个变量：

- Thread变量
- Runnable变量

第一个是在创建Worker的时候，把Worker变成线程保存起来，也就是通过这样的方式来处理任务，Runnable保存的是创建Worker的时候执行的任务。那么这个Worker的run方法什么时候执行。在前面执行 addWorker 方法的时候，会有一个创建Worker的过程，然后调用了Thread.start()方法。这样就会执行到Worker的run方法，而在run方法中调用的是 **`ThreadPoolExecutor.runWorker`**  参数是当前Worker的实例:

```java
final void runWorker(Worker w) {
        Thread wt = Thread.currentThread();
        Runnable task = w.firstTask;
        w.firstTask = null;
        w.unlock(); // allow interrupts
        boolean completedAbruptly = true;
        try {
            while (task != null || (task = getTask()) != null) {
                w.lock();
                if ((runStateAtLeast(ctl.get(), STOP) ||
                     (Thread.interrupted() &&
                      runStateAtLeast(ctl.get(), STOP))) &&
                    !wt.isInterrupted())
                    wt.interrupt();
                try {
                    beforeExecute(wt, task);
                    Throwable thrown = null;
                    try {
                        task.run();
                    } catch (RuntimeException x) {
                        thrown = x; throw x;
                    } catch (Error x) {
                        thrown = x; throw x;
                    } catch (Throwable x) {
                        thrown = x; throw new Error(x);
                    } finally {
                        afterExecute(task, thrown);
                    }
                } finally {
                    task = null;
                    w.completedTasks++;
                    w.unlock();
                }
            }
            completedAbruptly = false;
        } finally {
            processWorkerExit(w, completedAbruptly);
        }
    }
```

首先获取Worker中的需要处理的任务去处理，当处理完成Worker中的通过获取getTask任务列表中的任务进行处理。根据是否有核心处理线程(Worker)来是否要退出当前Worker:

```java
private Runnable getTask() {
        boolean timedOut = false; // Did the last poll() time out?

        for (;;) {
            int c = ctl.get();
            int rs = runStateOf(c);

            // Check if queue empty only if necessary.
            if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
                decrementWorkerCount();
                return null;
            }

            int wc = workerCountOf(c);

            // 默认情况下core线程不会失效
            boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;

            if ((wc > maximumPoolSize || (timed && timedOut))
                && (wc > 1 || workQueue.isEmpty())) {
                if (compareAndDecrementWorkerCount(c))
                    return null;
                continue;
            }

            try {
                //根据是否失效调用任务列表的不同方法
                Runnable r = timed ?
                    //调用poll，在规定时间内还没有就返回null
                    workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                	//没有就阻塞当前线程
                    workQueue.take();
                if (r != null)
                    return r;
                timedOut = true;
            } catch (InterruptedException retry) {
                timedOut = false;
            }
        }
    }
```



### 2 线程池化的模型图

- 从池的空闲线程列表中选择一个 Thread，并且指派它去运行一个已提交的任务(一个 Runnable，Callable 的实现)

- 当任务完成时，将该 Thread 返回给该列表，使其可被重用。

  ![图解](https://github.com/mxsm/document/blob/master/image/JSE/Executor%E6%89%A7%E8%A1%8C%E7%9A%84%E9%80%BB%E8%BE%91%E5%9B%BE%E8%A7%A3.jpg?raw=true) 

  

### 3 线程池拒绝策略

- CallerRunsPolicy：在任务被拒绝添加后，会调用当前线程池的所在的线程去执行被拒绝的任务

  ```java
   public static class CallerRunsPolicy implements RejectedExecutionHandler {
         
          public CallerRunsPolicy() { }
  
        
          public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
              if (!e.isShutdown()) {
                  r.run();
              }
          }
      }
  ```

  

- AbortPolicy：直接抛出异常

  ```java
      public static class AbortPolicy implements RejectedExecutionHandler {
          
          public AbortPolicy() { }
  
          public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
              throw new RejectedExecutionException("Task " + r.toString() +
                                                   " rejected from " +
                                                   e.toString());
          }
      }
  ```

  

- DiscardPolicy：会让被线程池拒绝的任务直接抛弃，不会抛异常也不会执行。

  ```java
  public static class DiscardPolicy implements RejectedExecutionHandler {
  
          public DiscardPolicy() { }
  
          public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
          }
      }
  ```

  

- DiscardOldestPolicy：DiscardOldestPolicy策略的作用是，当任务呗拒绝添加时，会抛弃任务队列中最旧的任务也就是最先加入队列的，再把这个新任务添加进去。

  ```java
      public static class DiscardOldestPolicy implements RejectedExecutionHandler {
  
          public DiscardOldestPolicy() { }
  
          public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
              if (!e.isShutdown()) {
                  e.getQueue().poll();
                  e.execute(r);
              }
          }
      }
  ```

- 自定义策略，只要实现RejectedExecutionHandler接口
