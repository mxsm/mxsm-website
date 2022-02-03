---
title: "CAS Docker部署"
linkTitle: "CAS Docker部署"
date: 2022-02-02
weight: 202202021750
---

> CAS版本：6.4.5

### 1. CAS Docker镜像拉取

Docker进行拉取有两种方式：

- **直接用命令拉取**

  ```shell
  docker pull apereo/cas:6.4.5
  ```

  ![image-20220202175512114](https://raw.githubusercontent.com/mxsm/picture/main/other/sso/image-20220202175512114.png)

- **通过Dockerfile构建**

  1. 拉取**cas-webapp-docker** 项目

     ```shell
      git clone https://github.com/apereo/cas-webapp-docker.git
     ```

     ![image-20220202181238894](https://raw.githubusercontent.com/mxsm/picture/main/other/sso/image-20220202181238894.png)

  2. 本地构建镜像

     ```shell
     cd cas-webapp-docker
     docker build --build-arg cas_version=6.4 . -t cas/local:6.4
     ```

     ![image-20220202185138205](https://raw.githubusercontent.com/mxsm/picture/main/other/sso/image-20220202185138205.png)

     或者直接调用

     ```shell
     ./build.sh 6.4
     ```

### 2. SSL配置

```shell
keytool -genkeypair -alias cas -keyalg RSA -keypass changeit \
        -storepass changeit -keystore ./thekeystore \
        -dname "CN=cas.ljbmxsm.com,OU=ljbmxsm,OU=com,C=AU" \
        -ext SAN="dns:cas.ljbmxsm.com,dns:localhost,ip:127.0.0.1"
```

### 3. 运行CAS

```java
docker run -d -p 8080:8080 -p 8443:8443 --name="cas" apereo/cas:v6.4
```

由于没有在container中有private key所有会报错：

![image-20220202204335527](https://raw.githubusercontent.com/mxsm/picture/main/other/sso/image-20220202204335527.png)

将生产的thekeystore复制到容器中

```java
docker cp thekeystore cas:/etc/cas/thekeystore
```

然后重启

```shell
docker restart cas
```

查看日志：

```shell
docker logs cas
```

![image-20220202204904231](https://raw.githubusercontent.com/mxsm/picture/main/other/sso/image-20220202204904231.png)

登录地址：https://172.24.174.149:8443/cas/login

默认登录名密码：casuser/Mellon

![cas登录](https://raw.githubusercontent.com/mxsm/picture/main/other/sso/cas%E7%99%BB%E5%BD%95.gif)

到这里基础环境已经搭建起来了