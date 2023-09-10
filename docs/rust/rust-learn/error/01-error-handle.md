---
title: "Rust 中的错误处理"
linkTitle: "Rust 中的错误处理"
sidebar_label: Rust 中的错误处理
weight: 202309091952
description: Rust 中的错误处理
---

不管学什么开发语言，错误处理是一个需要要会的，不同的语言标准库都是以统一的方式处理错误。今天就来聊聊Rust中的错误处理，同时对比Java中的错误处理有什么不同。

## 错误与异常

**错误（Errors）**：运行时发生的不寻常超出预期的行为

- **错误是严重的问题，通常无法通过代码来处理或修复。** 错误通常表示系统级问题，例如内存耗尽、虚拟机崩溃、类找不到等。这些问题通常由Java虚拟机（JVM）或底层操作系统引起，而不是由程序代码引起的。
- **错误不应该被程序员捕获或处理。** 程序员无法有效地处理错误，因此它们通常不被捕获，而是导致程序终止。

**异常（Exceptions）**：运行时候发生的不规则，**预料之内的行为** 。

- **异常是可预测的问题，可以通过编写代码来捕获和处理。** 异常通常由程序代码引起，表示不同类型的错误情况，例如除零错误、空指针引用、文件未找到等。
- **异常处理是通过异常处理器来进行的**

## Option

Rust和Java的一个重要的不同就是：**Rust中没有`null`的概念**。那么就没办法创建一个对象然后赋值null。那么Rust中需要需要表达相似的概念怎么办。在Rust中定义了一个**struct Option**：

```rust
pub enum Option<T> {
    /// No value.
    #[lang = "None"]
    #[stable(feature = "rust1", since = "1.0.0")]
    None,
    /// Some value of type `T`.
    #[lang = "Some"]
    #[stable(feature = "rust1", since = "1.0.0")]
    Some(#[stable(feature = "rust1", since = "1.0.0")] T),
}
```

从上面代码可以看出来，当你想表达**`null`** 的时候可以用None代替，而有值就可以用**Some()** 代替。那么如何访问Some中的内容呢？通过match获取

```rust
match option {
    Some(target) => {println!("value={}",target)}
    None => {println!("None Value")}
}
```

或者使用下面的代码：

```rust
let option = Option::Some(1);
let i = option.unwrap();

//下面是源码
pub const fn unwrap(self) -> T {
      match self {
          Some(val) => val,
          None => panic("called `Option::unwrap()` on a `None` value"),
     }
 }
```

> Java中也有类似的的类：Optional 但是这个是用来处理null对象，减少空指针

## Result

通过上面的可以知道**`Option`** 用来处理**`null`**。 而Result用来处理结果：

```rust
pub enum Result<T, E> {
    /// Contains the success value
    #[lang = "Ok"]
    #[stable(feature = "rust1", since = "1.0.0")]
    Ok(#[stable(feature = "rust1", since = "1.0.0")] T),

    /// Contains the error value
    #[lang = "Err"]
    #[stable(feature = "rust1", since = "1.0.0")]
    Err(#[stable(feature = "rust1", since = "1.0.0")] E),
}
```

通过上面的Result的源码可以看出来，Result枚举主要有两个类型：

- **Ok：** 表示没有错误
- **Err：** 表示错误

所以Result可以使用 pattern matching。但是从上面代码可以看出来语义化的Result的泛型T表示没有错误的对象，而E表示错误的类型。但是下面这样也是可以的

```rust
    fn read(num: i32)->Result<i32,i32>{
        if num > 0 {
            Ok(num)
        }else {
            Err(num)
        }
    }
```

这里你会发现都是一种类型并没有什么错误。

> 可以了解一下：anyhow的crate

## Rust错误传递

通过上面知道**`Result`** 中的Err可以是任意类型，而在Java中有一个叫做错误传递的概念。方法A抛出Exception1，当方法B调用方法A的时候，方法A抛出的错误就会传递抛出到方法B。在Rust是怎么样的呢看一下下面的代码：

```rust

    fn a()->i32{
        let result1 = "t".parse::<i32>().unwrap(); //ParseIntError
        let result = "a".parse::<bool>().unwrap(); //ParseBoolError
        1
    }
```

上面的代码有个问题就是：两个解析的代码会抛出不同的错误。那么我们应该抛出什么错误类型呢？联想到Java的中错误或者异常通常会有一个顶层Class，然后其他的就继承即可，所以在Rust中也有这样一个trait：**Error** 我们首先看一下ParseIntError的源码：

```rust
impl Error for ParseIntError {
    #[allow(deprecated)]
    fn description(&self) -> &str {
        match self.kind {
            IntErrorKind::Empty => "cannot parse integer from empty string",
            IntErrorKind::InvalidDigit => "invalid digit found in string",
            IntErrorKind::PosOverflow => "number too large to fit in target type",
            IntErrorKind::NegOverflow => "number too small to fit in target type",
            IntErrorKind::Zero => "number would be zero for non-zero type",
        }
    }
}
```

实现了Error。

## Trait std::error::Error

Rust统一的错误类型**Error**

```rust
pub trait Error: Debug + Display {
    
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        None
    }

    fn type_id(&self, _: private::Internal) -> TypeId
    where
        Self: 'static,
    {
        TypeId::of::<Self>()
    }

    fn provide<'a>(&'a self, demand: &mut Demand<'a>) {}
}
```

上述代码中删除了过期的方法。 Error继承了Debug和Display，所以当自定义的Error的时候需要实现Debug和Display。

> Rust中的错误的传递和Java中的错误传递类似，都是通过定义一个顶级的接口(Java)， Rust中称之为Trait。 然后实现对应的接口即可



## 如何自定义错误类型

通过实现**Error** 来完成自定义错误

```rust
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};
use std::num::ParseIntError;
use std::str::ParseBoolError;

fn main() {
   parse("1").unwrap();
}

fn parse(st: &str) -> Result<bool, CustomError> {
    st.parse::<bool>().map_err(|e| {
        CustomError {
            kind: ErrorKind::BoolParseError(e)
        }
    })
}

#[derive(Clone)]
struct CustomError {
    kind: ErrorKind,
}

#[derive(Clone)]
enum ErrorKind {
    IntParseError(ParseIntError),
    BoolParseError(ParseBoolError),
}

impl Display for ErrorKind {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ErrorKind::IntParseError(ref err) => write!(f, "Integer parsing error: {}",err),
            ErrorKind::BoolParseError(ref err) => write!(f, "Boolean parsing error: {}",err),
        }
    }
}

impl Debug for ErrorKind {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ErrorKind::IntParseError(ref err) => write!(f, "Integer parsing error: {}",err),
            ErrorKind::BoolParseError(ref err) => write!(f, "Boolean parsing error: {}",err),
        }
    }
}

impl Display for CustomError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Kind={}", self.kind.to_string())
    }
}

impl Debug for CustomError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Kind={}", self.kind.to_string())
    }
}

impl Error for CustomError {}
```

## 如何处理错误

在 Rust 中，有几种处理错误的方式，取决于您的需求和代码结构。以下是 Rust 中处理错误的主要方法：

1. **Result 类型**：

   `Result` 是 Rust 中用于处理可能会出现错误的操作的标准方式。它有两个变体：`Result<T, E>` 和 `Result<(), E>`。

   - `Result<T, E>`：表示可能返回一个类型为 `T` 的值或者一个错误类型为 `E` 的错误。
   - `Result<(), E>`：表示可能返回一个成功状态（`Ok(())`）或者一个错误类型为 `E` 的错误。

   您可以使用 `match` 表达式或 `unwrap` 方法来处理 `Result` 类型。

   示例：

   ```rust
   fn divide(x: i32, y: i32) -> Result<i32, &'static str> {
       if y == 0 {
           return Err("division by zero");
       }
       Ok(x / y)
   }
   
   fn main() {
       let result = divide(10, 2);
   
       match result {
           Ok(value) => println!("Result: {}", value),
           Err(error) => println!("Error: {}", error),
       }
   }
   ```

2. **panic! 宏**：

   当遇到无法恢复的错误或不应该发生的情况时，您可以使用 `panic!` 宏来触发恐慌（panic）。恐慌会导致程序立即终止并打印错误信息。通常，`panic!` 用于表示程序遇到了不可修复的错误情况。

   示例：

   ```rust
   fn main() {
       let x = 42;
       if x < 0 {
           panic!("x should be a positive number");
       }
   }
   ```

3. **? 运算符**：

   在函数中，您可以使用 `?` 运算符来快速处理 `Result` 类型。如果函数返回的是 `Result`，您可以使用 `?` 运算符将错误传播给调用者。

   示例：

   ```rust
   fn read_file() -> Result<String, std::io::Error> {
       let content = std::fs::read_to_string("file.txt")?;
       Ok(content)
   }
   
   fn main() {
       match read_file() {
           Ok(content) => println!("File content: {}", content),
           Err(error) => println!("Error: {}", error),
       }
   }
   ```

4. **自定义错误类型**：

   您可以创建自定义的错误类型，通常是枚举类型，以便更好地表示您的应用程序中的不同错误情况。这使得错误的类型更具可读性和表达性。

   示例：

   ```rust
   enum MyError {
       FileNotFound,
       InvalidInput(String),
       OtherError,
   }
   
   fn process_data(data: &str) -> Result<(), MyError> {
       if data.is_empty() {
           return Err(MyError::InvalidInput("Input data is empty".to_string()));
       }
       // 处理数据
       Ok(())
   }
   ```

这些是 Rust 中处理错误的主要方式。通过结合使用 `Result` 类型、`panic!` 宏和 `?` 运算符，以及自定义错误类型，您可以有效地处理可能出现的错误情况，并编写更健壮的 Rust 代码。 

参考文献：

- https://sled.rs/errors.html

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:mxsm@apache.com