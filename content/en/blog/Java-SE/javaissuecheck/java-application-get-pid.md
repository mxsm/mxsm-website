---
title: Java程序中获取当前进程的进程ID(Pid)
date: 2020-02-02
---

### Java如何获取Pid

```java
private String getPid() {
		try {
			String jvmName = ManagementFactory.getRuntimeMXBean().getName();
			return jvmName.split("@")[0];
		}
		catch (Throwable ex) {
			return null;
		}
	}
```
上面的代码来着SpringBoot的ApplicationPid的代码。通过这段代码就可以获取到Pid