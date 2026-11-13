---
title: 时钟配置
sidebar:
  order: 2
---

# 时钟配置

时钟配置写在 `.spp` 的 `[rcc]` 一节里。整节都可以不写，这时芯片用内部的高速时钟 HSI 运行：F1 是 8 MHz，F4 是 16 MHz。

StmPy Studio 的时钟树页面编辑的也是这一节，两边是同一份配置。

配置超出芯片的限制时编译报错，不会自动替你调整。Flash 等待周期这类由时钟决定的设置，编译器会自动算好，见本页最后的"自动推导"。

> `[rcc]` 里写错键名目前不会报错，会被直接忽略，请注意拼写。

## STM32F1

```toml
[rcc]
use_hse = true
hse_value = 8000000
hse_pll_enable = true
hse_pll_mul = 9         # 8 MHz × 9 = 72 MHz
```

| 键 | 默认值 | 说明 |
|---|---|---|
| `use_hse` | `false` | 用外部晶振（HSE）。`false` 时只用内部的 8 MHz HSI |
| `hse_value` | 用 HSE 时必填 | 外部晶振的频率，单位 Hz |
| `hse_pre_div` | 1 | HSE 进入 PLL 之前的分频 |
| `hse_pll_enable` | `false` | 用 PLL 倍频后的时钟做系统时钟 |
| `hse_pll_mul` | 9 | PLL 的倍率 |
| `use_lse` | `false` | PC14、PC15 上接了 32.768 kHz 晶振，给 [RTC](../../peripherals/rtc/) 用 |
| `pll2_mul` | 不用 | 只有 F105、F107：第二个 PLL 的倍率，写了就由它给 PLL 提供时钟 |
| `pll2_pre_div` | 1 | 只有 F105、F107：HSE 进入第二个 PLL 之前的分频 |
| `ahb_div`、`apb1_div`、`apb2_div` | 见下文 | 总线分频，见"总线分频" |

`hse_pll_enable` 和 `hse_pll_mul` 的名字里带 `hse`，但 `use_hse = false` 时同样能用，这时 PLL 的输入是 HSI / 2，也就是 4 MHz。

### 系统时钟

| `use_hse` | `hse_pll_enable` | SYSCLK |
|---|---|---|
| `false` | `false` | HSI，8 MHz |
| `false` | `true` | 4 MHz × `hse_pll_mul` |
| `true` | `false` | `hse_value` |
| `true` | `true` | `hse_value` / `hse_pre_div` × `hse_pll_mul` |

用第二个 PLL 时，PLL 的输入换成 `hse_value` / `pll2_pre_div` × `pll2_mul` / `hse_pre_div`。

### 各产品线的限制

来自 RM0008、RM0041 和各产品线的数据手册：

| 产品线 | SYSCLK 最高 | APB1 最高 | `hse_value` | `hse_pre_div` | `hse_pll_mul` | PLL 输入 | PLL 输出 |
|---|---|---|---|---|---|---|---|
| F100 | 24 MHz | 24 MHz | 4-24 MHz | 1-16 | 2-16 | 1-24 MHz | 16-24 MHz |
| F101 | 36 MHz | 36 MHz | 4-16 MHz | 1、2 | 2-16 | 1-25 MHz | 16-36 MHz |
| F102 | 48 MHz | 24 MHz | 4-16 MHz | 1、2 | 2-16 | 1-25 MHz | 16-48 MHz |
| F103 | 72 MHz | 36 MHz | 4-16 MHz | 1、2 | 2-16 | 1-25 MHz | 16-72 MHz |
| F105、F107 | 72 MHz | 36 MHz | 3-25 MHz | 1-16 | 4-9、6.5 | 3-12 MHz | 18-72 MHz |

F1 的 APB2 上限等于这条产品线的 SYSCLK 上限。

比如在 F103 上写 `use_hse = false` 和 `hse_pll_mul = 2`，PLL 输出只有 8 MHz，低于 16 MHz 的下限，编译会报错。

### F105、F107 的第二个 PLL

F105、F107 的板子常接 25 MHz 晶振，直接分频再倍频凑不出 72 MHz，要用第二个 PLL：先 25 / 5 × 8 = 40 MHz，再 40 / 5 × 9 = 72 MHz。

```toml
[rcc]
use_hse = true
hse_value = 25000000
pll2_pre_div = 5        # 第二个 PLL 的输入要在 3-5 MHz
pll2_mul = 8            # 可选 8-14、16、20，输出要在 40-74 MHz
hse_pre_div = 5
hse_pll_enable = true
hse_pll_mul = 9
```

## STM32F4

F4 的 PLL 写法和 F1 不同。在 F4 的工程里写 `hse_pre_div`、`hse_pll_mul` 或 `pll2_*` 会报错。

```toml
[rcc]
use_hse = true
hse_value = 8000000     # 4-26 MHz
hse_pll_enable = true
pll_m = 8               # 输入分频，2-63，分频后要在 1-2 MHz
pll_n = 336             # VCO 倍频，50-432
pll_p = 2               # 系统时钟分频：2、4、6、8
pll_q = 7               # USB、SDIO、RNG 的分频，2-15
```

SYSCLK = HSE（或 HSI）/ `pll_m` × `pll_n` / `pll_p`，PLL 的输出不能低于 24 MHz。`pll_q` 不写时，取让输出不超过 48 MHz 的最小分频。

`use_lse`、`ahb_div`、`apb1_div`、`apb2_div` 的用法和 F1 一样。

### 各产品线的限制

| 产品线 | SYSCLK 最高 | APB1 最高 | APB2 最高 | VCO | 8 MHz 晶振跑满的写法 |
|---|---|---|---|---|---|
| F401 | 84 MHz | 42 MHz | 84 MHz | 192-432 MHz | `m=8, n=336, p=4` |
| F405、F407、F415、F417 | 168 MHz | 42 MHz | 84 MHz | 100-432 MHz | `m=8, n=336, p=2` |
| F410、F411、F412、F413、F423 | 100 MHz | 50 MHz | 100 MHz | 100-432 MHz | `m=8, n=200, p=2` |
| F427、F429、F437、F439、F446 | 180 MHz | 45 MHz | 90 MHz | 100-432 MHz | `m=8, n=360, p=2` |
| F469、F479 | 180 MHz | 45 MHz | 90 MHz | 192-432 MHz | `m=8, n=360, p=2` |

F427、F429、F437、F439、F446、F469、F479 的 SYSCLK 超过 168 MHz 时，编译器会打开超频模式（over-drive）。不超过 168 MHz 时，APB1、APB2 的上限按 42 MHz、84 MHz 算。

## 总线分频

```toml
[rcc]
ahb_div = 2     # HCLK = SYSCLK / ahb_div，可选 1、2、4、8、16、64、128、256、512
apb1_div = 2    # PCLK1 = HCLK / apb1_div，可选 1、2、4、8、16
apb2_div = 1    # PCLK2 = HCLK / apb2_div，可选 1、2、4、8、16
```

这三个键都可以不写：`ahb_div` 默认是 1，`apb1_div`、`apb2_div` 默认取不超过产品线上限的最小分频。写了就按写的值来，结果超过上限时编译报错。

- **定时器的时钟**：APB 不分频时等于 PCLK，分频时是 PCLK 的两倍。
- HCLK 不是整数 MHz 时（比如 4.5 MHz），`delay_us` 按向下取整后的 MHz 计时，延时会偏短。

总线分得太低时，用到的外设会在编译时报错：

| 外设 | 要求 |
|---|---|
| I2C | 100 kHz 及以下时 PCLK1 至少 2 MHz，更快时至少 4 MHz |
| ADC | ADC 时钟至少 0.6 MHz |
| RTC | F1 的 PCLK1 至少是 RTC 时钟的 4 倍，F4 的不低于 RTC 时钟 |
| `delay_us` | HCLK 至少 1 MHz |
| F4 的 `Flash` | HCLK 至少 1 MHz |

## 自动推导

下面这些由编译器根据时钟算出来，不需要配置：

- **Flash 等待周期**：F1 按 SYSCLK 选，24 MHz 以下是 0，48 MHz 以下是 1，再往上是 2，F100 不需要等待周期；F4 按 HCLK 和 2.7-3.6 V 的供电电压选。
- **F4 的稳压器电压档**：按 SYSCLK 取够用的最低一档。
- **F4 的超频模式**：见上文。
- **F1 的预取指缓冲**：总线分频不是 1 时手册要求打开，`HAL_Init` 已经打开。
