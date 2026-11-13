---
title: ADC
sidebar:
  order: 7
---

# ADC

ADC 把引脚上的模拟电压转换成数字，用来读电位器、电池电压、各种模拟传感器。精度是 12 位，结果在 0 到 4095 之间。

只要写引脚，编译器会找到引脚对应的 ADC 和通道。

```python
from stmpy import ADC, UART, delay_ms

knob = ADC("PA0")
battery = ADC("PB1", vref_mv=3300)
uart = UART(1)

def main():
    while True:
        uart.write_int(knob.read())        # 0-4095
        uart.write(" ")
        uart.write_int(battery.read_mv())  # 毫伏
        uart.write("\n")
        delay_ms(200)
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `pin` | 必填 | 模拟输入引脚，比如 `"PA0"`；也可以是芯片内部的输入，见下文 |
| `vref_mv` | 3300 | 参考电压，单位毫伏，`read_mv()` 用它换算。取值 2400-3600 |
| `sample_us` | 0 | 采样时间，单位微秒，见"采样时间"。0 表示用默认值 |
| `continuous` | `False` | 在后台连续转换，见"后台连续转换" |

48 脚及以下的小封装没有单独的 VREF+ 引脚，参考电压就是 VDDA，Blue Pill 上是 3.3 V。

## 方法

| 方法 | 说明 |
|---|---|
| `read() -> int` | 转换一次并等待结果，返回 0（0 V）到 4095（参考电压）。`continuous` 时立刻返回最新的值 |
| `read_mv() -> int` | 和 `read()` 一样取值，换算成毫伏 |

## 引脚

STM32F103：

| ADC | 引脚和通道 | 可用芯片 |
|---|---|---|
| ADC1 | PA0-PA7：0-7，PB0：8，PB1：9，PC0-PC5：10-15 | 全部。PC0-PC5 要 64 脚及以上 |
| ADC3 | PF6-PF10：4-8 | xE / xG 的 144 脚封装 |

- ADC2 的引脚和 ADC1 相同，所以只用 ADC1。ADC3 用于 ADC1 没有的 PF6-PF10。
- 多个输入共用一个 ADC：每次 `read()` 先换到自己的通道，再转换，输入的个数没有限制。
- 一个引脚只能有一个 ADC 对象，也不能同时当 GPIO 或者 PWM。

其他芯片的引脚以编辑器的补全和编译报错为准。

## 芯片内部的输入

引脚写成 `"TEMP"` 或 `"VREFINT"`，读的是芯片内部的信号，不占引脚：

| 写法 | 输入 |
|---|---|
| `ADC("TEMP")` | 温度传感器 |
| `ADC("VREFINT")` | 内部参考电压，标称 1.2 V（1.16-1.24 V） |

```python
temp = ADC("TEMP")
vrefint = ADC("VREFINT")

def main():
    # 换算系数是 STM32F103 手册里的典型值
    celsius = 25 + (1430 - temp.read_mv()) / 4.3
    # 由内部参考电压反推 VDDA，只适用于 VREF+ 接在 VDDA 上的情况
    vdda_mv = 1200 * 4095 // vrefint.read()
```

- 温度传感器适合看温度的变化，不适合测绝对温度：每颗芯片的偏差可能有 45 °C，要准就得自己校准。
- 读到的是芯片内部的温度，比环境温度高，和芯片自身的发热有关。
- 采样时间至少要 17.1 微秒。不写 `sample_us` 时编译器会自动选够长的，写短了会报错。

## 后台连续转换

默认每次 `read()` 都要等一次转换。写了 `continuous=True` 后，ADC 在后台不停地转换，结果由 DMA 存进内存，不占 CPU，`read()` 只是取出最新的值，立刻返回。

```python
from stmpy import ADC, UART, delay_ms

knob = ADC("PA0", continuous=True)
battery = ADC("PB1", continuous=True, sample_us=15)
temp = ADC("TEMP", continuous=True)
uart = UART(1)

def main():
    while True:
        uart.write_int(knob.read())
        uart.write_int(battery.read_mv())
        delay_ms(100)
```

同一个 ADC 上的 `continuous` 输入由编译器合并成一个序列，按定义的顺序轮流转换，转完一轮再从头开始。上面的例子在 STM32F103、72 MHz 时：

| 输入 | 采样时间 | 一次转换 |
|---|---|---|
| `knob` | 55.5 个周期 | 5.7 微秒 |
| `battery` | 239.5 个周期 | 21 微秒 |
| `temp` | 239.5 个周期 | 21 微秒 |
| 一轮 | | 47.7 微秒 |

在编辑器里悬停在对象上能看到实际的值。

- **同一个 ADC 上的输入，要么全是 `continuous`，要么全不是**，混用时编译报错，因为后台转换一直占着 ADC。两种都要的话，把另一种放到别的 ADC 上，比如 ADC3 的 PF6-PF10。
- 一个 ADC 最多 16 个 `continuous` 输入。
- 程序开始时第一轮已经转完，`read()` 从一开始就是真实的值。
- `read()` 只是读内存，在中断里也能用，主循环和中断可以同时读。
- 不同输入的值不是同一时刻的，最多相差一轮。这种方式适合随时取最新的值，不适合采集波形，因为采样间隔不固定。
- 转换一直在跑，比按需转换耗电多一点。
- 占用的 DMA 通道由编译器分配。STM32F103 上 ADC1 用 DMA1 通道 1，ADC3 用 DMA2 通道 5。

## 采样时间

信号源的内阻越大，需要的采样时间越长；要转换得快，就短一点。同一个 ADC 上每个输入可以有不同的采样时间。

`sample_us` 会取芯片支持的采样时间里、不短于它的最短一档，超过最长一档时报错。在编辑器里悬停在对象上能看到实际的值。

| | STM32F1 | STM32F4 |
|---|---|---|
| ADC 时钟 | 不超过 14 MHz（F100、F102 不超过 12 MHz），72 MHz 时是 12 MHz | 不超过 36 MHz |
| 可选的采样时间 | 1.5、7.5、13.5、28.5、41.5、55.5、71.5、239.5 个周期 | 3、15、28、56、84、112、144、480 个周期 |
| 默认采样时间 | 55.5 个周期，信号源内阻要在 50 kΩ 以内 | 84 个周期 |

STM32F1 上，一次 `read()` 要花采样时间再加 12.5 个 ADC 周期：72 MHz 时默认约 6 微秒，8 MHz 的默认时钟下约 17 微秒。

ADC 在上电时会自动校准一次。

## 注意

- `read()` 会等转换完成再返回，在中断里也能用。但**不要在主循环和中断里同时读同一个 ADC 上的输入**：中断打断主循环的转换时会把通道换走，主循环读到的是别的通道的值。`continuous` 时没有这个问题。
- STM32F4 上温度传感器的通道按型号是 16 或 18，写 `ADC("TEMP")` 就行，不用管通道号。
