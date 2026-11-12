---
title: 工程文件
order: 1
---

# 工程文件

每个工程有一个 `.spp` 文件（StmPy Project），内容是 TOML 格式。用 StmPy Studio 时，双击它就能打开整个工程。

```toml
[project]
chip = "STM32F103C8T6"
entry = "main.py"

[rcc]
use_hse = true
hse_value = 8000000
hse_pll_enable = true
hse_pll_mul = 9

[build]
optimize = "Os"
```

- **工程名就是 `.spp` 的文件名**：`demo.spp` 的工程名是 `demo`，编译出来的是 `demo.elf` 和 `demo.hex`。`[project]` 里不要写 `name`，写了会报错。
- **Flash 和 RAM 大小、启动文件、链接脚本都由芯片型号决定**，不需要写。
- `[project]` 和 `[build]` 里写了不认识的键会报错。
- 所有键都是小写，单词之间用下划线隔开，只有 `buildPath` 例外。

## [project]

| 键 | 默认值 | 说明 |
|---|---|---|
| `chip` | 必填 | 芯片型号，见下文 |
| `entry` | `"main.py"` | 入口文件，相对于 `.spp` 所在的目录，里面必须定义 `def main()` |
| `buildPath` | `"build"` | 生成文件和编译产物放在哪里，相对于 `.spp` 所在的目录 |

### 芯片型号

写芯片上印的完整型号，比如 `STM32F103C8T6`，大小写都可以。

- 型号最后的温度范围可以写成 `x`，比如 `STM32F407ZGTx`。
- 封装和温度范围都可以省略，比如 `STM32F103C8`。但同一个型号有几种封装、引出的引脚又不一样时，必须写全。比如 `STM32F103R8` 有 LQFP64 和 TFBGA64 两种封装，要写成 `STM32F103R8T6`。

支持哪些芯片见[支持的芯片](chips.md)。

## [rcc]

时钟配置。整节都可以不写，这时用芯片内部的高速时钟（F1 是 8 MHz，F4 是 16 MHz）。所有选项见[时钟配置](clock.md)。

## [build]

| 键 | 默认值 | 说明 |
|---|---|---|
| `optimize` | `"Os"` | gcc 的优化级别：`O0`、`O1`、`O2`、`O3`、`Os`、`Og` |
| `debug` | `true` | 是否带调试信息（`-g`） |
| `jobs` | `0` | 同时编译几个文件，0 表示和 CPU 核数一样 |
| `stack_size` | `0x400` | 为栈保留的 RAM 字节数，必须是 8 的倍数 |
| `heap_size` | `0x200` | 为堆保留的 RAM 字节数，必须是 8 的倍数 |
| `c_flags` | `[]` | 额外的 gcc 编译参数，只作用于生成的代码，不作用于 HAL 库 |
| `ld_flags` | `[]` | 额外的链接参数 |

栈和堆加上全局变量放不进 RAM 时，链接时报错。编译成功后输出的 RAM 用量已经包括了栈和堆。
