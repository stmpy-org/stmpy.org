---
title: 芯片数据格式
sidebar:
  order: 5
---

# 芯片数据格式

`stmpy chips --json` 输出 stmpy 能编译的所有芯片，以及各产品线的时钟限制。StmPy Studio 的芯片选择器和时钟树都读这份数据，所以界面上显示的和当前版本的 stmpy 能编译的总是一致。其他工具也可以用它。

这份输出没有单独的格式版本号，格式跟着 stmpy 的版本（`version` 字段）走。

## 整体结构

```json
{
  "version": "0.1.0",
  "chips": [ ... ],
  "clock": { "STM32F407": { ... } }
}
```

频率的单位都是 Hz。`xxx_range` 是 `[最低, 最高]`，两端都包括在内。

## chips

每个元素是一个芯片：

| 字段 | 例子 | 说明 |
|---|---|---|
| `name` | `"STM32F407ZGTx"` | 完整型号，可以直接写进 `.spp`。`x` 的位置是温度范围，数据里没有，所以不写具体数字 |
| `family` | `"stm32f4"` | 系列 |
| `line` | `"STM32F407"` | 产品线，用它在 `clock` 里查时钟限制 |
| `package` | `"LQFP144"` | 封装 |
| `pins` | `144` | 引脚数 |
| `flash_kb` | `1024` | Flash 大小 |
| `ram_kb` | `128` | RAM 大小，不含 CCM |
| `lse` | `true` | 封装有没有 PC14、PC15，也就是能不能接 32.768 kHz 晶振 |

## clock

键是产品线。`tree` 表示这条产品线的时钟树是什么结构，不认识的值说明是更新版本的 stmpy 加的，这时可以不画时钟树。

所有产品线都有：

| 字段 | 说明 |
|---|---|
| `tree` | `"f1"`、`"f1_connectivity"` 或 `"f4"` |
| `hsi_hz`、`lsi_hz`、`lse_hz` | 内部高速时钟、内部低速时钟（典型值）、外部低速晶振的频率 |
| `hse_range` | 外部晶振的范围 |
| `pll_input_range` | PLL 输入的范围，F4 是经过 `pll_m` 分频之后的 |
| `max_sysclk`、`max_apb1`、`max_apb2` | SYSCLK、PCLK1、PCLK2 的上限 |
| `flash_latency` | 0、1、2 …… 个等待周期各自允许的最高频率。F1 按 SYSCLK 查，F4 按 HCLK 查 |
| `ahb_div`、`apb_div` | `ahb_div`、`apb1_div`、`apb2_div` 能填的值 |

`f1` 和 `f1_connectivity` 还有：

| 字段 | 说明 |
|---|---|
| `hse_pre_div` | `hse_pre_div` 能填的值 |
| `pll_mul` | `hse_pll_mul` 能填的值，F105、F107 有 6.5 |
| `pll_output_range` | PLL 输出的范围 |
| `pll2` | 只有 `f1_connectivity` 有：`pre_div`、`mul` 是 `pll2_pre_div`、`pll2_mul` 能填的值，`input_range`、`output_range` 是第二个 PLL 输入和输出的范围 |

`f4` 还有：

| 字段 | 说明 |
|---|---|
| `pll_m_range`、`pll_n_range`、`pll_q_range` | `pll_m`、`pll_n`、`pll_q` 的范围 |
| `pll_p` | `pll_p` 能填的值 |
| `vco_range` | VCO 输出的范围 |
| `min_pll_output` | 经过 `pll_p` 之后 PLL 输出的下限 |
| `max_pll_q_output` | 经过 `pll_q` 之后输出的上限 |
| `overdrive_above` | SYSCLK 超过它时打开超频模式，0 表示没有超频模式 |
| `max_apb1_overdrive`、`max_apb2_overdrive` | 打开超频模式时 PCLK1、PCLK2 的上限，没有超频模式时等于 `max_apb1`、`max_apb2` |
| `scales` | `[电压档, 这一档的 SYSCLK 上限]` 的列表，从低档到高档 |

各配置项的含义和计算方式见[时钟配置](../clock/)。
