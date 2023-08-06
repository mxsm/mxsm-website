---
title: "在哈希映射中存储具有关联值的键"
sidebar_label: 8.3. 在哈希映射中存储具有关联值的键
linkTitle: "在哈希映射中存储具有关联值的键"
weight: 202308051736
description: 在哈希映射中存储具有关联值的键
---

## [在哈希映射中存储具有关联值的键](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#storing-keys-with-associated-values-in-hash-maps)

我们要讨论的最后一种常见集合是 *哈希映射*（hash map）。类型 `HashMap<K, V>` 用于存储键的类型 `K` 到值的类型 `V` 的映射，使用一个 *哈希函数*（hashing function）来决定如何将这些键和值存放到内存中。许多编程语言支持这种数据结构，但它们通常使用不同的名称，如 hash、map、object、hash table、dictionary 或 associative array 等。

哈希映射在您想通过键来查找数据而不是使用索引（如向量）时非常有用。例如，在游戏中，您可以使用哈希映射来跟踪每个团队的得分，其中每个键是团队的名称，值是团队的得分。给定一个团队的名称，您可以获取其得分。

本节中，我们将介绍哈希映射的基本 API，但标准库中 `HashMap<K, V>` 上定义的许多其他方法也非常有用。和往常一样，查阅标准库文档以获取更多信息。

### [创建新的哈希映射](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#creating-a-new-hash-map)

创建一个空的哈希映射的一种方法是使用 `new` 并使用 `insert` 添加元素。在示例 8-20 中，我们跟踪两个团队（名称分别为 *Blue* 和 *Yellow*）的得分。Blue 队的得分是 10 分，Yellow 队的得分是 50 分。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
```

示例 8-20：创建新的哈希映射并插入一些键和值

请注意，我们需要首先通过 `use` 语句从标准库的 collections 部分引入 `HashMap`。在三种常见的集合类型中，哈希映射是最不常用的，因此它没有在 prelude 中自动引入作用域的特性中包含。标准库对哈希映射的支持也较少，例如没有内建的宏可以用于构建哈希映射。

和向量一样，哈希映射将数据存储在堆上。此 `HashMap` 的键类型是 `String`，值类型是 `i32`。与向量一样，哈希映射是同质的：所有键的类型必须与彼此相同，所有值的类型也必须与彼此相同。

### [访问哈希映射中的值](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#accessing-values-in-a-hash-map)

我们可以通过将键传递给 `get` 方法来从哈希映射中获取一个值，如示例 8-21 所示。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    let team_name = String::from("Blue");
    let score = scores.get(&team_name).copied().unwrap_or(0);
```

示例 8-21：访问存储在哈希映射中的 Blue 队得分

在这里，`score` 将得到与 Blue 队关联的值，结果为 `10`。`get` 方法返回一个 `Option<&V>`；如果哈希映射中没有该键的值，`get` 将返回 `None`。这个程序通过调用 `copied` 方法来处理 `Option`，以获得 `Option<i32>` 而不是 `Option<&i32>`，然后通过 `unwrap_or` 将 `score` 设置为零，如果 `scores` 没有该键的条目。

我们可以以类似向量的方式遍历哈希映射中的每个键值对，使用 `for` 循环：

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    for (key, value) in &scores {
        println!("{key}: {value}");
    }
```

此代码将按任意顺序打印每一对：

```text
Yellow: 50
Blue: 10
```

### [哈希映射与所有权](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#hash-maps-and-ownership)

对于实现了 `Copy` trait（例如 `i32`）的类型，值将被复制到哈希映射中。对于拥有的值（例如 `String`），值将被移动，哈希映射将成为这些值的所有者，如示例 8-22 所示。

```rust
    use std::collections::HashMap;

    let field_name = String::from("Favorite color");
    let field_value = String::from("Blue");

    let mut map = HashMap::new();
    map.insert(field_name, field_value);
    // 在此处，field_name 和 field_value 已无效，尝试使用它们会产生编译错误！
```

示例 8-22：展示一旦被插入到哈希映射中，键和值就由哈希映射拥有

在将其移动到哈希映射中后，我们不能再使用变量 `field_name` 和 `field_value`。如果我们尝试使用它们，会产生编译错误。

如果我们将对值的引用插入到哈

希映射中，值就不会被移动到哈希映射中。引用所指向的值必须在哈希映射有效的时间内保持有效。我们将在第 10 章的 [“使用生命周期验证引用”](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#validating-references-with-lifetimes) 部分更详细地讨论这些问题。

### [更新哈希映射](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#updating-a-hash-map)

尽管键值对的数量是可增长的，但每个唯一的键只能有一个与之关联的值（但反之不成立：例如，Blue 队和 Yellow 队都可以在 `scores` 哈希映射中存储值 10）。

当您想要更改哈希映射中的数据时，您必须决定如何处理键已经有值的情况。您可以用新值替换旧值，完全忽略旧值。您可以保留旧值并忽略新值，只有在键 *没有* 值时才添加新值。或者您可以将旧值与新值合并。让我们看看如何做到这些！

#### [覆盖一个值](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#overwriting-a-value)

如果我们先向哈希映射插入一个键和一个值，然后再插入相同的键但不同的值，那么与该键关联的值将被替换。即使代码在示例 8-23 中调用了两次 `insert`，哈希映射中仍然只会包含一个键值对，因为我们两次都为 Blue 队的键插入了值。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Blue"), 25);

    println!("{:?}", scores);
```

示例 8-23：替换存储在特定键中的值

这段代码将打印 `{"Blue": 25}`。原始值 `10` 被覆盖掉了。

#### [仅在键不存在时添加键和值](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#adding-a-key-and-value-only-if-a-key-isnt-present)

通常，我们会检查哈希映射中是否已经存在特定的键，并根据情况执行以下操作：如果哈希映射中已存在该键，则保持现有值不变。如果哈希映射中不存在该键，则插入该键及其值。

哈希映射提供了一个称为 `entry` 的特殊 API 来处理这种情况，该 API 以您想要检查的键作为参数。`entry` 方法的返回值是一个名为 `Entry` 的枚举，表示可能存在也可能不存在的值。假设我们想检查 Yellow 队的键是否有一个关联的值。如果没有，则插入值 50；对于 Blue 队也是一样。使用 `entry` API，代码如示例 8-24 所示。

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);

    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50);

    println!("{:?}", scores);
```

示例 8-24：使用 `entry` 方法仅在键没有关联值时插入

`Entry` 上的 `or_insert` 方法定义为返回对应键的值的可变引用（`&mut V`），如果该键存在，则不修改值；如果该键不存在，则插入参数作为新值，并返回对新值的可变引用。这种技术比手动编写逻辑要简洁得多，并且与借用检查器更友好。

运行示例 8-24 中的代码将打印 `{"Yellow": 50, "Blue": 10}`。对 `entry` 的第一次调用将使用值 50 插入 Yellow 队的键，因为 Yellow 队还没有值。对 `entry` 的第二次调用不会改变哈希映射，因为 Blue 队已经有值 10。

#### [根据旧值更新值](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#updating-a-value-based-on-the-old-value)

哈希映射的另一个常见用例是查找键的值，然后基于旧值进行更新。例如，示例 8-25 中的代码显示了如何统计一些文本中每个单词出现的次数。我们使用一个哈希映射，键为单词，值为出现次数，每次看到一个单词时就将其值加 1。如果是第一次看到一个单词，我们首先插入值 0。

```rust
    use std::collections::HashMap;

    let text = "hello world wonderful world";

    let mut map = HashMap::new();

    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        *count += 1;
    }

    println!("{:?}", map);
```

示例 8-25：使用哈希映射存储单词和出现次数来统计单词的出现次数

这段代码将打印 `{"world": 2, "hello": 1, "wonderful": 1}`。您可能会看到相同的键/值对以不同的顺序打印出来：回顾一下 [“访问哈希映射中的值”](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#accessing-values-in-a-hash-map) 部分，哈希映射的迭代顺序是随机的

。

`split_whitespace` 方法返回值 `text` 中由空白字符分隔的子切片的迭代器。`or_insert` 方法返回指定键的可变引用（`&mut V`）。在此示例中，我们将该可变引用存储在 `count` 变量中，因此为了对该值进行赋值，我们必须首先解引用 `count`（使用星号 `*`）。在 `for` 循环结束时，可变引用的作用域结束，因此所有这些更改都是安全的，并且符合借用规则。

### [哈希函数](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#hashing-functions)

默认情况下，`HashMap` 使用称为 *SipHash* 的哈希函数，它可以提供针对涉及哈希表的拒绝服务（DoS）攻击的抵抗力[1](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#siphash)。这不是可用的最快哈希算法，但性能下降换来的更好安全性是值得的。如果您对代码进行性能分析，发现默认的哈希函数对您的需求太慢，您可以通过指定不同的哈希函数来切换。*哈希器*（hasher）是一个实现了 `BuildHasher` trait 的类型。我们将在第 10 章讨论 trait 和如何实现它们。您不一定需要从头开始实现自己的哈希器；[crates.io](https://crates.io/) 有其他 Rust 用户共享的库，提供了许多常见哈希算法的哈希器实现。

https://en.wikipedia.org/wiki/SipHash

## [总结](https://doc.rust-lang.org/book/ch08-03-hash-maps.html#summary)

向量、字符串和哈希映射将为程序中存储、访问和修改数据提供大量必要的功能。现在您可以解决以下一些练习：

- 给定一个整数列表，使用向量并返回列表的中位数（排序后的中间值）和众数（出现次数最多的值；哈希映射在这里非常有帮助）。
- 将字符串转换为 pig latin。将每个单词的第一个辅音字母移动到该单词的末尾，并添加“ay”，因此“first”变成“irst-fay”。以元音字母开头的单词在末尾添加“hay”（“apple”变成“apple-hay”）。请记住关于 UTF-8 编码的细节！
- 使用哈希映射和向量，创建一个文本界面，允许用户将员工姓名添加到公司的部门中。例如，“Add Sally to Engineering”或“Add Amir to Sales”。然后让用户通过部门检索所有员工或通过部门按字母顺序检索所有员工列表。

标准库 API 文档描述了向量、字符串和哈希映射拥有的方法，这些方法对于这些练习很有帮助！

我们进入了更复杂的程序中，其中操作可能会失败，因此现在是讨论错误处理的绝佳时机。下一章我们将会进行讨论！