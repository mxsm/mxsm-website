---
title: EnumMap
categories:
  - Java
  - JSE
  - JDK源码解析
  - Map集合源码解析
tags:
  - Java
  - JSE
  - JDK源码解析
  - Map集合源码解析
abbrlink: 157e9ea2
date: 2018-12-05 20:32:51
---
### EnumMap

```java
    private final Class<K> keyType;

    /**
     * All of the values comprising K.  (Cached for performance.)
     */
    private transient K[] keyUniverse;

    /**
     * Array representation of this map.  The ith element is the value
     * to which universe[i] is currently mapped, or null if it isn't
     * mapped to anything, or NULL if it's mapped to null.
     */
    private transient Object[] vals;

    /**
     * The number of mappings in this map.
     */
    private transient int size = 0;
```

实现：数组实现

使用案例：

```java
public enum Color {

    red,black,green;

}

Map<Color,String> map = new EnumMap<Color,String>(Color.class);
```

