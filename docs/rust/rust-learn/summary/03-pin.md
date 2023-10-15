---
title: "Rust Pin机制和作用"
linkTitle: "Rust Pin机制和作用"
sidebar_label: Rust Pin机制和作用
weight: 202310151934
description: Rust Pin机制和作用
---

在学习Rust异步的时候发现一个比较特别的智能指针 **`Pin`** 

```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

下面我们来分析一下这个智能指针的作用。

## 1. Pin的特点

通过对Pin指针的源码阅读我们可以总结出来Pin的以下几个特点：

1. **Pin&lt;P>** 泛型数据结构P必须是指针(智能指针和普通指针)，准确的来说是必须实现**`Deref trait`** 的对象。

   ```rust
   impl<P: Deref> Pin<P> {/*省略代码*/}
   ```

2. **Pin** 也是智能指针

   ```rust
   #[stable(feature = "pin", since = "1.33.0")]
   impl<P: Deref> Deref for Pin<P> {
       type Target = P::Target;
       fn deref(&self) -> &P::Target {
           Pin::get_ref(Pin::as_ref(self))
       }
   }
   
   #[stable(feature = "pin", since = "1.33.0")]
   impl<P: DerefMut<Target: Unpin>> DerefMut for Pin<P> {
       fn deref_mut(&mut self) -> &mut P::Target {
           Pin::get_mut(Pin::as_mut(self))
       }
   }
   ```

3. 给定 `PinP<T>>` 类型的数据，**只要 `T` 不满足 Unpin trait**，则 Safe Rust（即**不使用 `unsafe{}` 块**）下无法获得 `&mut T` 和 `T`。换言之，要想 `Pin` 有其效果，则 `T` 必须不满足 Unpin trait。也就是不能实现Unpin。trait为几乎所有类型自动实现。

   > 通过对struct使用PhantomPinned标记来阻止实现Unpin trait

下面来通过代码验证上面的三点说法。

**Pin包裹的P必须是指针**

```rust
use std::pin::Pin;

#[derive(Clone)]
struct Mxsm{
    name:String
}

fn main() {
       let mxsm = Mxsm{
        name: "".to_string()
    };
    Pin::new(&mxsm); //普通指针
    Pin::new(Box::new(mxsm.clone())); //智能指针
    let num = 32;
    Pin::new(num); //编译报错
}
```

上面代码可以看出来普通指针和智能指针都是可以的。如果是非指针直接编译报错：

![image-20231015223450119](C:\Users\ljbmx\AppData\Roaming\Typora\typora-user-images\image-20231015223450119.png)

**Pin是智能指针**

```rust
let mxsm1 = &*pin;
```

上面代码说明Pin是智能指针。

因为Unpin这个trait几乎所有的类型都自动实现，所以我们如果让某个类型不实现，需要增加一个标记 **`PhantomPinned`** 来阻止实现。

```rust
struct Mxsm{
    name:String,
    _mark: PhantomPinned //增加标记，不实现Unpin trait
}

fn main() {
    let mxsm = Mxsm{
        name: "".to_string(),
        _mark: PhantomPinned
    };
   Pin::new(Box::new(mxsm));
}
```

此时上面的代码无法编译：

![image-20231015225404208](C:\Users\ljbmx\AppData\Roaming\Typora\typora-user-images\image-20231015225404208.png)

编译失败，我们来看一下**Pin::new** 的定义

```rust
impl<P: Deref<Target: Unpin>> Pin<P> {
	pub const fn new(pointer: P) -> Pin<P> {
        // SAFETY: the value pointed to is `Unpin`, and so has no requirements
        // around pinning.
        unsafe { Pin::new_unchecked(pointer) }
    }
    //省略部分代码
}
```

然后看一下泛型P的约束条件：P实现了Deref trait并且， **Deref包裹的泛型类实现Unpin ** 从上面的约束可以知道

- **泛型P必须实现Deref trait**
- P包裹的Target必须实现**Unpin** 

所以当上面的结构体 **Struct Mxsm** 增加一个标记  **`PhantomPinned`** 来阻止实现**Unpin trait** 所以就报错了。但是我们可以通过非安全的方法来实现

```rust
fn main() {
    let mxsm = Mxsm{
        name: "".to_string(),
        _mark: PhantomPinned
    };
    let pin = unsafe{Pin::new_unchecked(Box::new(mxsm))}; //通过非安全的实现
}
```

