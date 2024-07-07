---
title: "如何利用Github Action自动Merge PR"
linkTitle: "如何利用Github Action自动Merge PR"
sidebar_label: 如何利用Github Action自动Merge PR
weight: 202401010938
description: 如何利用Github Action自动Merge PR
---

## 1. 引言

GitHub Actions 是 GitHub 提供的一种强大而灵活的自动化工具，它允许开发者在软件开发生命周期的各个阶段构建、测试和部署代码。借助 GitHub Actions，开发者可以创建自定义的工作流来自动执行一系列任务，从而提高开发效率、减少人为错误并确保代码质量。

### 2.准备工作

**创建一个Github仓库**

我这里以我已经创建的 [**rocketmq-rust**](https://github.com/mxsm/rocketmq-rust)为例

![image-20240707155536592](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707155536592.png)

**设置 GitHub Actions**

创建 `.github/workflows` 文件夹

![image-20240707155722047](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707155722047.png)

创建新的工作流文件（如 `auto-merge.yml`）,我这里创建了三个文件：

- [auto-comment-pr.yml](https://github.com/mxsm/rocketmq-rust/blob/main/.github/workflows/auto-comment-pr.yml)
- [auto_request_review.yml](https://github.com/mxsm/rocketmq-rust/blob/main/.github/workflows/auto_request_review.yml)
- [automerge.yml](https://github.com/mxsm/rocketmq-rust/blob/main/.github/workflows/automerge.yml)

都是和自动merge相关的。下面会具体讲解

## 3.编写自动 Merge PR 的 GitHub Actions 工作流

### 3.1定义工作流名称和触发条件

分析上面每个文件的作用

- [**auto-comment-pr.yml**](https://github.com/mxsm/rocketmq-rust/blob/main/.github/workflows/auto-comment-pr.yml)

  这个文件的作用是当有贡献者提交PR的时候增加一个评论与此同时添加两个标签，具体如下图所示[RP#716](https://github.com/mxsm/rocketmq-rust/pull/716)

  ![image-20240707160323320](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707160323320.png)

  ![image-20240707161057321](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707161057321.png)

  这个配置文件的触发条件就是 **`pull_request_target`**

- [**auto_request_review.yml**](https://github.com/mxsm/rocketmq-rust/blob/main/.github/workflows/auto_request_review.yml)

  这个配置文件的作用就是请求相关项目的ower对PR进行代码Review。来提醒相关人员进行代码Review,例如下面个[**PR#657**](https://github.com/mxsm/rocketmq-rust/pull/657)

  ![image-20240707160958341](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707160958341.png)

  这个也是为下面自动merge作的准备，配置文件触发条件 **`pull_request_target`**

- [**automerge.yml**](https://github.com/mxsm/rocketmq-rust/blob/main/.github/workflows/automerge.yml)

  这个配置文件的作用就对已经Review好的项目进行merge,这里会有一些条件下面会具体讲解

  ![image-20240707161332639](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707161332639.png)

  触发条件：

  - **pull_request_target**
  - **pull_request_review**
  - **check_suite**

### 3.2 设置工作流的权限

对于上面的这些操作大部分都可以使用Github Action的权限，也就是使用 **`secrets.GITHUB_TOKEN`** 这个Token,而我这里的代码Merge和评论使用的是私有的Token也就是 **`secrets.PAT`** 。所以你会发现上面的这些评论和操作中部分是 **mxsm** 这个账号部分是 [**github-actions**](https://github.com/apps/github-actions) 这个机器人账号。

![image-20240707162052061](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707162052061.png)

**生成Private Access Token（PAT）**

![image-20240707162650549](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707162650549.png)

![image-20240707162750740](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707162750740.png)

这里主要的权限是跟仓库相关的，你可以把全部设置成Read and Write的权限

**配置PAT**

找到对应项目的设置地方，具体如下图配置PAT

![image-20240707163047204](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707163047204.png)

到这里就完成了整个权限的配置。

> 三个配置文件的具体脚本参照项目：https://github.com/mxsm/rocketmq-rust 项目的对应目录下面 (如果觉得项目不错给个star，谢谢)

## 4. 测试相关流程

以[**PR#740**](https://github.com/mxsm/rocketmq-rust/pull/740) 为例子。首先当提交PR的时候会有一个对PR的评论与此同时会增加两个标签  auto merge 和 ready to review

![image-20240707163732452](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707163732452.png)

同时会增加一个Review的请求这个是有github-actions机器人添加

![image-20240707163834587](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707163834587.png)

对应的Action如下：

![image-20240707163937063](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707163937063.png)

接下来就是对项目进行代码Review然后, 这里需要有两个地方需要修改

- 对代码进行approve
- 删除ready to review label加上approved标签

> 说明： 这里删除ready to review label加上approved标签是因为在automerge.yml配置里面配置了MERGE_LABELS为"approved,auto merge,!ready to review"。 更多的配置可以参照pascalgn/automerge-action@v0.16.3。

![image-20240707164051565](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707164051565.png)

进行操作后：

![image-20240707164519504](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707164519504.png)

提示PR已经被合并，在看一下代码界面：

![image-20240707164601273](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20240707164601273.png)

代码已经被合并。实现了自动合并的机制

## 5. 总结

自动化工作流在现代软件开发中变得越来越重要，特别是在 CI/CD（持续集成和持续部署）过程中。自动化工作流的主要好处包括：

- **提高开发效率**：减少手动操作，让开发者专注于更高价值的任务。
- **增强代码质量**：通过自动化测试和审查流程，确保代码在合并前符合质量标准。
- **降低人为错误**：减少手动合并和部署过程中的潜在错误。
- **加快发布周期**：通过自动化部署和发布流程，加快从代码提交到发布的周期。

**推荐资源:**

[GitHub Actions 官方文档](https://docs.github.com/en/actions)

[GitHub API 文档](https://docs.github.com/en/rest)

[GitHub Actions Marketplace](https://github.com/marketplace?type=actions)