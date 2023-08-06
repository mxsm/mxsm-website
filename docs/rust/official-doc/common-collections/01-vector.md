---
title: "使用向量（Vectors）存储多个值"
sidebar_label: 8.1. 使用向量（Vectors）存储多个值
linkTitle: "使用向量（Vectors）存储多个值"
weight: 202308051736
description: 使用向量（Vectors）存储多个值
---



## [使用向量（Vectors）存储多个值](https://doc.rust-lang.org/book/ch08-01-vectors.html#storing-lists-of-values-with-vectors)

我们首先要看的集合类型是`Vec<T>`，也称为*向量（vector）*。向量允许您将多个值存储在单个数据结构中，这些值在内存中相邻排列。向量只能存储相同类型的值。当您有一系列项目时，例如文件中的文本行或购物车中商品的价格时，它们非常有用。

### [创建新的向量](https://doc.rust-lang.org/book/ch08-01-vectors.html#creating-a-new-vector)

要创建一个新的空向量，我们调用`Vec::new`函数，如示例 8-1 所示。

```rust
let v: Vec<i32> = Vec::new();
```

示例 8-1：创建一个新的空向量，用于保存`i32`类型的值。

注意我们在这里添加了类型注解。因为我们没有向向量中插入任何值，Rust 不知道我们打算存储的元素类型是什么。这是一个重要的点。向量使用泛型实现；我们将在第 10 章讨论如何在您自己的类型中使用泛型。目前，只需知道标准库提供的`Vec<T>`类型可以容纳任何类型。当我们创建一个用于存储特定类型的向量时，我们可以在尖括号中指定该类型。在示例 8-1 中，我们告诉 Rust，`v` 中的`Vec<T>` 将包含`i32`类型的元素。

更常见的做法是，您可以创建一个具有初始值的`Vec<T>`，Rust 将推断出您要存储的值的类型，因此您很少需要进行类型注解。Rust 提供了 `vec!` 宏，可以创建一个新的向量，其中包含您提供的值。示例 8-2 创建一个新的 `Vec<i32>`，其中包含值`1`、`2`和`3`。整数类型是`i32`，因为这是默认的整数类型，我们在第 3 章“[数据类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#data-types)”中讨论过。

```rust
let v = vec![1, 2, 3];
```

示例 8-2：创建包含值的新向量。

因为我们提供了初始`i32`值，Rust 可以推断`v`的类型是`Vec<i32>`，因此类型注解是不必要的。接下来，我们将看看如何修改向量。

### [更新向量](https://doc.rust-lang.org/book/ch08-01-vectors.html#updating-a-vector)

要创建一个向量并向其中添加元素，我们可以使用`push`方法，如示例 8-3 所示。

```rust
let mut v = Vec::new();

v.push(5);
v.push(6);
v.push(7);
v.push(8);
```

示例 8-3：使用`push`方法向向量添加值。

与任何变量一样，如果我们想要更改其值，我们需要使用`mut`关键字使其可变，就像在第 3 章讨论的一样。我们在其中放入的数字都是`i32`类型的，Rust 可以从数据中推断出这一点，因此我们不需要`Vec<i32>`的类型注解。

### [读取向量的元素](https://doc.rust-lang.org/book/ch08-01-vectors.html#reading-elements-of-vectors)

有两种方式可以引用向量中存储的值：通过索引和使用`get`方法。在下面的示例中，我们已经注释了这些函数返回的值的类型，以增加清晰度。

示例 8-4 展示了通过索引语法和`get`方法访问向量中的值的两种方法。

```rust
let v = vec![1, 2, 3, 4, 5];

let third: &i32 = &v[2];
println!("The third element is {third}");

let third: Option<&i32> = v.get(2);
match third {
    Some(third) => println!("The third element is {third}"),
    None => println!("There is no third element."),
}
```

示例 8-4：使用索引语法或`get`方法访问向量中的元素。

请注意一些细节。我们使用索引值`2`来获取第三个元素，因为向量从零开始编号。使用`&`和`[]`给我们提供了对索引值处元素的引用。使用`get`方法时，将索引传递为参数，我们得到一个`Option<&T>`，我们可以在`match`语句中使用。

Rust 提供这两种引用元素的方法是为了让您选择在尝试使用超出现有元素范围的索引值时程序的行为方式。例如，让我们看看当我们有一个包含五个元素的向量，然后尝试使用每种技术访问索引为 100 处的元素时会发生什么，如示例 8-5 所示。

```rust
let v = vec![1, 2, 3, 4, 5];

let does_not_exist = &v[100];
let does_not_exist = v.get(100);
```

示例 8-5：尝试访问包含五个元素的向量中索引为 100 处的元素。

运行这段代码时，第一个`[]`方法会导致程序出现 panic，因为它引用了不存在的元素。这种方法最适用于当向量尝试访问超出向量末尾的元素时，您希望程序崩溃的情况。

当`get`方法被传递超出向量的索引时，它将返回`None`而不是 panic。如果

在正常情况下可能偶尔发生访问向量范围之外的元素，则可以使用此方法。您的代码将使用`match`来处理`Some(&element)`或`None`，如第 6 章中讨论的。例如，索引可能来自用户输入的数字。如果用户意外输入一个过大的数字，程序会得到一个`None`值，您可以告诉用户当前向量中有多少项，并给他们另一个机会输入一个有效值。这比由于输错一个字母而导致程序崩溃更加用户友好！

当程序有有效的引用时，借用检查器将强制执行所有权和借用规则（在第 4 章中讨论），以确保该引用和向量内容的任何其他引用在有效的情况下保持有效。回顾一下规则，规定在同一范围内不能同时拥有可变和不可变引用。该规则适用于示例 8-6，在其中我们持有向量的第一个元素的不可变引用，同时尝试在末尾添加一个元素。如果我们在函数后面还试图引用该元素，这个程序就不能正常工作：

```rust
let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];

v.push(6);

println!("The first element is: {first}");
```

示例 8-6：尝试在持有项的同时向向量添加一个元素。

编译此代码将导致以下错误：

```console
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:5
  |
4 |     let first = &v[0];
  |                  - immutable borrow occurs here
5 |
6 |     v.push(6);
  |     ^^^^^^^^^ mutable borrow occurs here
7 |
8 |     println!("The first element is: {first}");
  |                                      ----- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `collections` due to previous error
```

示例 8-6 中的代码看起来似乎应该可以工作：为什么对第一个元素的引用会关心向量末尾的更改？这个错误是由于向量的工作方式造成的：因为向量将值相邻地放置在内存中，如果在向量的末尾添加一个新元素需要分配新的内存并将旧元素复制到新空间中（如果当前存储向量的地方没有足够的空间来放置所有元素）。在这种情况下，对第一个元素的引用将指向已解分配的内存。借用规则防止程序陷入这种情况。

> 注意：有关`Vec<T>`类型的实现细节的更多信息，请参见《[Rustonomicon](https://doc.rust-lang.org/nomicon/vec/vec.html)》。

### [迭代向量中的值](https://doc.rust-lang.org/book/ch08-01-vectors.html#iterating-over-the-values-in-a-vector)

要依次访问向量中的每个元素，我们可以遍历所有元素，而不是使用索引逐个访问。示例 8-7 展示了如何使用`for`循环获取`i32`值向量中的每个元素的不可变引用并打印它们。

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{i}");
}
```

示例 8-7：使用`for`循环遍历元素并打印向量中的每个元素。

我们还可以通过可变引用遍历可变向量中的每个元素，以便对所有元素进行更改。示例 8-8 中的`for`循环将向每个元素添加`50`。

```rust
let mut v = vec![100, 32, 57];
for i in &mut v {
    *i += 50;
}
```

示例 8-8：遍历可变向量中的每个元素的可变引用。

为了更改可变引用所引用的值，我们必须使用`*`解引用运算符来访问`i`中的值，然后才能使用`+=`运算符。我们将在第 15 章“[使用解引用运算符跟踪指针指向的值](https://doc.rust-lang.org/book/ch15-02-deref.html#following-the-pointer-to-the-value-with-the-dereference-operator)”中更详细地讨论解引用运算符。

无论是对向量进行不可变迭代还是可变迭代，都是安全的，因为借用检查器的规则。如果我们试图在示例 8-7 和示例 8-8 的`for`循环体中插入或删除项，将得到与示例 8-6 中的代码相似的编译器错误。`for`循环持有的对向量的引用防止对整个向量的同时修改。

### [使用枚举（Enum）存储

多种类型](https://doc.rust-lang.org/book/ch08-01-vectors.html#using-an-enum-to-store-multiple-types)

向量只能存储相同类型的值。这可能不方便；确实有需要存储不同类型的项目的情况。幸运的是，枚举的变体被定义在同一枚举类型下，因此当我们需要一种类型来表示不同类型的元素时，我们可以定义和使用枚举！

例如，假设我们想要从电子表格的一行中获取值，在该行中，一些列包含整数、一些列包含浮点数，还有一些列包含字符串。我们可以定义一个枚举，其变体将包含不同的值类型，所有枚举变体都被认为是同一类型：即枚举的类型。然后，我们可以创建一个向量来保存该枚举，从而最终保存不同类型的值。我们在示例 8-9 中演示了这一点。

```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

示例 8-9：定义一个枚举以在一个向量中存储不同类型的值。

Rust 需要在编译时知道向量中将存储哪些类型，以便确切地知道在堆上需要多少内存来存储每个元素。我们还必须明确地指定这个向量中允许的类型。如果 Rust 允许一个向量包含任何类型，那么某些类型可能会导致向量中元素的操作出现错误。使用枚举加上`match`表达式意味着 Rust 将在编译时确保每种可能的情况都得到处理，这在第 6 章中讨论过。

如果在运行时不知道程序将在向量中存储哪种类型的完整集合，则枚举技巧无法使用。在这种情况下，您可以使用 trait 对象，在第 17 章中将进行讨论。

现在我们已经讨论了一些最常见的向量用法，请务必查阅[API 文档](https://doc.rust-lang.org/std/vec/struct.Vec.html)，其中包含标准库为`Vec<T>`定义的许多有用方法。除了`push`方法外，还有一个`pop`方法可用于删除并返回最后一个元素。

### [删除向量也会删除其元素](https://doc.rust-lang.org/book/ch08-01-vectors.html#dropping-a-vector-drops-its-elements)

与任何其他`struct`一样，当向量超出范围时，它会被释放，如示例 8-10 中所示。

```rust
{
    let v = vec![1, 2, 3, 4];

    // 使用 v 做一些操作
} // <- v 在这里超出范围并被释放
```

示例 8-10：显示向量及其元素何时被释放。

当向量被释放时，它的所有内容也会被释放，这意味着其中包含的整数将被清理。借用检查器确保向量内容的任何引用仅在向量本身有效时使用。

接下来，我们继续讨论下一个集合类型：`String`！