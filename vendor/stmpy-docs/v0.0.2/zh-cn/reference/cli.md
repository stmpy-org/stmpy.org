---
title: 命令行
order: 3
---

# 命令行

```bash
stmpy build <工程.spp> [-o 输出.hex]
stmpy lsp [工程.spp] [--stdio | --port <端口>]
stmpy chips [--json]
stmpy version
```

## build

把工程编译成 `.hex` 文件。

```bash
stmpy build demo.spp
```

- 默认输出到 `<buildPath>/<工程名>.hex`，用 `-o` 可以指定别的路径。生成的 C 代码和中间文件也放在 `buildPath` 下。
- 成功时依次输出 Flash 用量、RAM 用量（包括栈和堆）和 `.hex` 文件的路径。
- 失败时把所有错误和警告输出到 stderr，退出码是 1。格式和 gcc 一样，是 `文件:行:列: 类型: 说明`，编辑器和 CI 都能直接识别。

stmpy 不负责烧录，烧录见[安装](../getting-started/installation.md)。

## lsp

启动语言服务器（Language Server Protocol），给编辑器提供错误检查、补全、悬停提示和跳转定义。StmPy Studio 用的就是它，支持 LSP 的编辑器都可以接入。

| 选项 | 说明 |
|---|---|
| `--stdio` | 通过标准输入输出通信，编辑器启动它时一般用这个 |
| `--port <n>` | 监听 `127.0.0.1:<n>` |
| 都不写 | 监听 `127.0.0.1:2087` |

**工程文件**：命令行给了 `.spp` 就用它。没给时，在编辑器打开的目录里依次找：和目录同名的 `<目录名>.spp`，然后是目录里唯一的 `.spp`。有多个 `.spp` 又没有同名的时候报错，要在命令行里指定。

**错误检查**：

- 检查从 `.spp` 开始，经过入口文件，到它 import 的所有模块。没被引用到的文件不检查。
- 编辑器连上时检查一次，之后每次保存 `.py` 或 `.spp` 文件时再检查。检查的是保存到磁盘上的内容，还没保存的修改不算。
- 一次报出所有错误和警告，不会只报第一个。
- `.spp` 本身的错误显示在 `.spp` 文件上。

**补全和提示**用的是编辑器里当前的内容，还没保存的也算：

- 只提示 StmPy 支持的名字。Python 自带而 StmPy 不支持的函数和模块不会出现。
- 在引脚参数的字符串里（比如 `GPIO("|")`、`UART(1, tx="|")`），补全列出的是当前芯片上能用的引脚，每个都注明它在这里是什么，比如 `USART1 TX remap 1`、`TIM2_CH2`、`ADC1_IN9`。
- 鼠标停在外设对象上时，会显示它在芯片上实际是什么：用的外设和引脚、重映射、实际的频率或波特率（以及误差）、DMA 通道、绑定的中断等。这部分来自最近一次保存后的检查。

## chips

列出 stmpy 能编译的所有芯片：型号、封装、Flash 和 RAM 大小。

```bash
stmpy chips
```

`--json` 输出 JSON 格式，还带上各产品线的时钟限制，给 StmPy Studio 这类工具读取，格式见[芯片数据格式](chips-json.md)。

## version

输出 stmpy 的版本号，比如 `0.1.0`。

## 环境变量

| 变量 | 说明 |
|---|---|
| `STMPY_TOOLCHAIN` | `arm-none-eabi-gcc` 所在的目录，写工具链的根目录或者 `bin` 目录都可以。不设时从 `PATH` 里找 |
| `STMPY_LOG` | 日志级别，默认只输出警告以上。设成 `info` 或 `debug` 能看到 stmpy 是怎么分析程序的，输出到 stderr |
