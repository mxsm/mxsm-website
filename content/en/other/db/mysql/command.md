---
title: mysql命令
date: 2021-03-04
weight: 1
---

### 1. mysql常用系统命令

登录后三部曲命令：查看数据库，选择数据库，查看表

```mysql
show databases; //显示数据库
use 数据库名称; // 选择数据库
show tables; //显示数据库表
```



#### 1.1查询变量

```mysql
show variables;
show variables like '%dir%';
```

例子：

```mysql
mysql> show variables like '%dir%';
+-----------------------------------------+--------------------------------+
| Variable_name                           | Value                          |
+-----------------------------------------+--------------------------------+
| basedir                                 | /usr/                          |
| binlog_direct_non_transactional_updates | OFF                            |
| character_sets_dir                      | /usr/share/mysql-8.0/charsets/ |
| datadir                                 | /var/lib/mysql/                |
| innodb_data_home_dir                    |                                |
| innodb_directories                      |                                |
| innodb_doublewrite_dir                  |                                |
| innodb_log_group_home_dir               | ./                             |
| innodb_max_dirty_pages_pct              | 90.000000                      |
| innodb_max_dirty_pages_pct_lwm          | 10.000000                      |
| innodb_redo_log_archive_dirs            |                                |
| innodb_temp_tablespaces_dir             | ./#innodb_temp/                |
| innodb_tmpdir                           |                                |
| innodb_undo_directory                   | ./                             |
| lc_messages_dir                         | /usr/share/mysql-8.0/          |
| plugin_dir                              | /usr/lib64/mysql/plugin/       |
| slave_load_tmpdir                       | /tmp                           |
| tmpdir                                  | /tmp                           |
+-----------------------------------------+--------------------------------+
18 rows in set (0.09 sec)
```

### 2. mysql表相关命令

#### 2.1 查看表索引

```mysql
show index from table;
```

