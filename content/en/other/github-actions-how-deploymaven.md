---
title: “如何使用GitHub Actions自动发布JAR到Maven中央仓库"
linkTitle: "如何使用GitHub Actions自动发布JAR到Maven中央仓库"
date: 2022-05-27
weight: 202205272142
---

将Java项目的Jar包发送到Maven中央仓库基本上都是通过本地通过命令 **`mvn deploy`** 发布。平时很多Java开发者都会把项目放在GitHub上面，那么有没有一种方式在Github上面自动发布？ 这就是笔者今天要说的Github Actions自动发布JAR到Maven中央仓库。

> Tips: 想要了解正常情况下如何发布可以看一下笔者的这篇文章[《将Jar包发布Maven中央仓库》](https://juejin.cn/post/7043398199217750030)

### 1. 前提条件

1. 首先你之前通过正常的情况发布过Jar包到Maven中央仓库，这个是前提。
2. 在Github创建一个Maven项目，笔者这里用 [**rain**](https://github.com/mxsm/rain) 作为例子
3. OSSRH 账号、密码

### 2. 发布配置

#### 2.1 创建项目

首先在Github上面创建项目：

![image-20220527220609956](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527220609956.png)

然后需要注意增加两个Maven插件：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-gpg-plugin</artifactId>
    <version>3.0.1</version>
    <executions>
        <execution>
            <id>sign-artifacts</id>
            <phase>verify</phase>
            <goals>
                <goal>sign</goal>
            </goals>
            <configuration>
                <!-- Prevent `gpg` from using pinentry programs -->
                <gpgArguments>
                    <arg>--pinentry-mode</arg>
                    <arg>loopback</arg>
                </gpgArguments>
            </configuration>
        </execution>
    </executions>
</plugin>

<plugin>
    <groupId>org.sonatype.plugins</groupId>
    <artifactId>nexus-staging-maven-plugin</artifactId>
    <version>1.6.13</version>
    <extensions>true</extensions>
    <configuration>
        <serverId>ossrh</serverId>
        <nexusUrl>https://oss.sonatype.org/</nexusUrl>
        <autoReleaseAfterClose>false</autoReleaseAfterClose>
    </configuration>
</plugin>
```

具体可以参照[**`rain 项目的pom`**](https://github.com/mxsm/rain/blob/develop/pom.xml) 。

#### 2.2 GPG信息获取

对于GPG信息首先是你已经存在。信息查看命令：

```shell
gpg --list-secret-keys
```

> Tips: 不存在参照文章[《将Jar包发布Maven中央仓库》](https://juejin.cn/post/7043398199217750030)生成

![image-20220527221748757](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527221748757.png)

执行命令：

```shell
gpg -a --export-secret-keys KEYID

#例子
gpg -a --export-secret-keys 00053070D457FA43EF20B208E9AD13776C3E943D
```

这里需要保护私钥的密码，然后回出现下面的密文:

![image-20220527222222397](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527222222397.png)

上面笔者就截图了一部分，复制需要将BEGIN和END那一行全部复制后续需要配置。

#### 2.3 项目配置

配置路径： rain-->Settings-->Secrets-->Actions

![image-20220527223045512](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527223045512.png)

#### 2.4 配置Github Actions

笔者这里使用的是 [action-maven-publish](https://github.com/marketplace/actions/action-maven-publish) 这个Action，在项目下创建如下图文件：

![image-20220527223520078](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527223520078.png)

然后编写maven-publish.yml

```yaml
name: Publish package to the Maven Central Repository and GitHub Packages
on:
  push:
    branches:
      - main
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v3
      - name: Set up Java for publishing to GitHub Packages
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'adopt'
      - name: Publish to GitHub Packages
        run:  mvn --batch-mode deploy -DskipTests -Prelease-github
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  release:
    runs-on: ubuntu-18.04
    steps:
      - name: Check out Git repository
        uses: actions/checkout@v2

      - name: Install Java and Maven
        uses: actions/setup-java@v1
        with:
          java-version: 11

      - name: Release Maven package
        uses: samuelmeuli/action-maven-publish@v1
        with:
          maven_profiles: 'release-ossrh'
          maven_args: '-DskipTests'
          gpg_private_key: ${{ secrets.gpg_private_key }}
          gpg_passphrase: ${{ secrets.gpg_passphrase }}
          nexus_username: ${{ secrets.OSSRH_USERNAME }}
          nexus_password: ${{ secrets.OSSRH_TOKEN }}

```

说明：我上面还增加了发布到Github的。然后保存就行了。action就会自动运行。看一下效果：

![image-20220527223750366](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527223750366.png)

执行完成发布后，需要登录到[OSSRH](https://oss.sonatype.org/#welcome) close 发布的，然后就等待同步到Maven中央仓库。Maven中央仓库查询：

![image-20220527224301161](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220527224301161.png)

到这里就完成了。 后续你每次提交push到对应的分支就会存在自动发布。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

参考文档：

- https://github.com/samuelmeuli/action-maven-publish/blob/master/docs/deployment-setup.md
- https://github.com/marketplace/actions/action-maven-publish
- https://docs.github.com/cn/actions/publishing-packages/publishing-java-packages-with-maven