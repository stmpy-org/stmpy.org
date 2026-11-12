---
title: 安装
order: 1
---

# 安装

StmPy 有两种用法：

- **StmPy Studio**：桌面编辑器，里面已经带好了 stmpy、编译工具链和烧录工具，装好就能用。推荐新手用这种。
- **命令行**：只装 `stmpy` 命令，配合自己习惯的编辑器使用。编译工具链和烧录工具要自己装。

## StmPy Studio

从 [stmpy.org](https://stmpy.org) 的下载页或 [GitHub Releases](https://github.com/stmpy-org/stmpy-studio/releases) 下载对应系统的安装包，安装后打开即可。新建工程、编辑、编译、烧录都在 Studio 里完成，不需要再装别的东西。

## 命令行

### 1. 安装 stmpy

从下载页或 [GitHub Releases](https://github.com/stmpy-org/stmpy/releases) 下载对应系统的 stmpy 压缩包，解压到任意目录，然后把这个目录加到 `PATH`。解压出来的是一个文件夹，里面的 `stmpy` 是启动程序，其余文件要和它放在一起，不要单独拷走 `stmpy`。

检查是否装好：

```bash
stmpy version
```

### 2. 安装编译工具链

stmpy 用 `arm-none-eabi-gcc` 编译生成的 C 代码。可以从 [Arm 官网](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads) 下载，也可以用系统的包管理器安装。

stmpy 按这个顺序查找工具链：

1. 环境变量 `STMPY_TOOLCHAIN` 指定的目录，写工具链的根目录或者它的 `bin` 目录都可以
2. `PATH`

### 3. 安装烧录工具

stmpy 只负责生成 `.hex` 文件，不负责烧录。命令行下推荐用 [probe-rs](https://probe.rs)，它支持 ST-Link、J-Link 和 CMSIS-DAP 等常见的下载器：

```bash
probe-rs download --chip STM32F103C8 --binary-format hex build/blink.hex
```

## 从源码运行

需要 Python 3.11 或更高版本。

```bash
git clone https://github.com/stmpy-org/stmpy.git
cd stmpy
pip install -r requirements.txt
python script/fetch_resources.py
python script/gen_chip_data.py
```

- `fetch_resources.py` 下载 STM32 的 HAL 和 CMSIS 源码
- `gen_chip_data.py` 生成芯片数据

之后在仓库根目录用 `python -m stmpyc` 代替 `stmpy` 命令，比如 `python -m stmpyc build demo.spp`。

## 下一步

[第一个程序](first-project.md)
