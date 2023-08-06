---
title: 常见编程概念
sidebar_label: 常见编程概念 
hide_table_of_contents: true
slug: /rust/official-doc/common-collections
---

# [常用集合](https://doc.rust-lang.org/book/ch08-00-common-collections.html#common-collections)

Rust的标准库包含了一些非常有用的数据结构，称为*集合*。大多数其他数据类型表示一个特定的值，而集合可以包含多个值。与内置的数组和元组类型不同，集合指向的数据存储在堆上，这意味着在编译时不需要知道数据的大小，并且可以在程序运行时动态增长或缩小。每种集合都有不同的功能和成本，选择适合当前情况的集合是您随着时间发展的一项技能。在本章中，我们将讨论Rust程序中经常使用的三种集合：

- *向量（vector）*允许您存储一组可变数量的值。
- *字符串（string）*是字符的集合。我们之前提到过`String`类型，但在本章中我们将深入讨论它。
- *哈希映射（hash map）*允许您将值与特定的键关联。它是更一般的数据结构*映射（map）*的一种特定实现。

要了解标准库提供的其他类型的集合，请参阅[文档](https://doc.rust-lang.org/std/collections/index.html)。

我们将讨论如何创建和更新向量、字符串和哈希映射，以及它们各自的特点。



import DocCardList from '@theme/DocCardList';

<DocCardList />