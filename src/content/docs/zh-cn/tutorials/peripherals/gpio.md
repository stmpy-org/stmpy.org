---
title: GPIO
sidebar:
  order: 1
---

# GPIO

GPIO 是普通的数字引脚：输出高低电平，或者读取外部的电平。

```python
from stmpy import GPIO, Mode, Pull, delay_ms

led = GPIO("PC13")
key = GPIO("PA0", Mode.INPUT, pull=Pull.UP)

def main():
    while True:
        if key.read() == 0:         # 按键接地，按下时读到 0
            led.toggle()
            delay_ms(200)
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `name` | 必填 | 引脚名，比如 `"PC13"`、`"PA0"`，大小写都可以 |
| `mode` | `Mode.OUTPUT_PP` | 模式，见下表 |
| `pull` | `Pull.NONE` | 上下拉：`NONE`、`UP`、`DOWN` |
| `speed` | `Speed.LOW` | 输出的翻转速度：`LOW`、`MEDIUM`、`HIGH` |

| 模式 | 说明 |
|---|---|
| `Mode.OUTPUT_PP` | 推挽输出，能输出高电平也能输出低电平。驱动 LED 一般用这个 |
| `Mode.OUTPUT_OD` | 开漏输出，只能拉低，高电平要靠上拉电阻。适合多个设备共用一根线 |
| `Mode.INPUT` | 数字输入 |
| `Mode.ANALOG` | 模拟模式，关掉数字输入，最省电。读模拟电压用 [ADC](../adc/) |

`speed` 只影响输出的边沿有多陡，不影响程序能多快地改变输出。没有特别需要时用默认的 `LOW`，干扰最小。`Speed.MAX` 目前还不支持。

## 方法

| 方法 | 说明 |
|---|---|
| `on()` | 输出高电平 |
| `off()` | 输出低电平 |
| `toggle()` | 翻转输出 |
| `write(value)` | `value` 为 0 时输出低电平，否则输出高电平 |
| `read() -> int` | 读引脚的电平，返回 0 或 1 |

> 很多开发板上的 LED 是接在引脚和 3.3 V 之间的，比如 Blue Pill 的 PC13。这时 `off()` 让灯亮，`on()` 让灯灭。

## 外部中断 on_edge

引脚的电平一变化就调用处理函数，不用在主循环里一直查。

```python
from stmpy import GPIO, Mode, Pull, Edge

key = GPIO("PA0", Mode.INPUT, pull=Pull.UP)
presses: int = 0

@key.on_edge(Edge.FALLING, priority=2)
def on_press():
    global presses
    presses += 1
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `edge` | `Edge.FALLING` | `RISING` 上升沿、`FALLING` 下降沿、`BOTH` 两种都触发 |
| `priority` | 8 | 优先级，0-15，数字越小越优先 |

- 引脚必须是 `Mode.INPUT`，上下拉照常用 `pull` 设置。
- 没有外部上下拉电阻时不要用 `Pull.NONE`，引脚悬空会不停地误触发。

中断的通用规则见[中断](../../language/interrupts/)。

### 引脚号不能重复

芯片只有 16 条外部中断线（EXTI0-EXTI15），引脚号相同的引脚共用一条，不管在哪个端口上。所以**挂了 `on_edge` 的引脚，引脚号不能重复**：

| 写法 | 结果 | 原因 |
|---|---|---|
| PA5 和 PB5 都挂 `on_edge` | 报错 | 都要用 EXTI5 |
| 同一个引脚挂两次 `on_edge` | 报错 | 同上，要两种边沿就用 `Edge.BOTH` |
| PA5 和 PA6 都挂 `on_edge` | 可以 | 线不同 |
| PA5 和 PB6 都挂 `on_edge` | 可以 | 线不同，端口无所谓 |
| PA5 挂 `on_edge`，PB5 只用 `read()` | 可以 | 普通输入不占中断线 |

冲突时的报错会指出这条线被谁占用了：

```
main.py:10: ValueError: EXTI5 is already used by a.on_edge at main.py:6
```

几条线共用一个中断向量：

| EXTI 线 | 中断向量 |
|---|---|
| 0-4 | 各自独立：`EXTI0` - `EXTI4` |
| 5-9 | 共用 `EXTI9_5` |
| 10-15 | 共用 `EXTI15_10` |

共用一个向量的引脚（比如 PA5 和 PA6）各自调用自己的处理函数，但优先级必须相同。

## 引脚

- **PA13、PA14 不能用。** 它们是 SWD 调试口，下载程序和调试都要用它们。
- **PA15、PB3、PB4** 复位后属于 JTAG 调试口。用到它们时编译器会自动把它们交给程序，SWD 不受影响。
- 一个引脚只能有一个用途：已经被 UART、PWM 等外设占用的引脚，不能再当 GPIO，反过来也一样。
- 在编辑器里给 `GPIO("")` 补全时，会列出当前芯片上所有能用的引脚。
