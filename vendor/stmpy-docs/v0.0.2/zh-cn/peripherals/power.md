---
title: 低功耗
order: 16
---

# 低功耗

让芯片在没事做的时候省电。一共三档，越省电，醒来的代价越大：

| 方法 | 停掉什么 | 大约的电流 | 醒来之后 | 怎么唤醒 |
|---|---|---|---|---|
| `sleep()` | CPU | 比运行时少一半左右，看时钟 | 从下一行接着跑 | 任何中断 |
| `stop()` | CPU 和所有高速时钟 | 十几到几十微安 | 从下一行接着跑 | GPIO 的 `on_edge`、RTC 的 `on_alarm` |
| `standby()` | 除备份域以外全部断电 | 几微安 | **程序从头开始** | PA0 的上升沿、RTC 闹钟、复位引脚、独立看门狗 |

电流是手册里的大概数值。整块板子的电流还要看稳压芯片、LED 和外接的器件。

## 用法

平时睡着，按键按下才醒：

```python
from stmpy import GPIO, Mode, Pull, Edge, Power

power = Power()
key = GPIO("PA1", Mode.INPUT, pull=Pull.UP)
pressed: bool = False

@key.on_edge(Edge.FALLING)
def on_key():
    global pressed
    pressed = True

def main():
    global pressed
    while True:
        power.stop()            # 按键按下才往下走
        if pressed:
            pressed = False
            handle_key()
```

定时醒来干活，其余时间断电：

```python
from stmpy import Power, RTC

power = Power()
rtc = RTC()

def main():
    measure_and_send()
    rtc.alarm_at(rtc.now() + 60)
    power.standby()             # 不会返回，60 秒后程序从头开始
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `wake_pin` | `False` | PA0 的上升沿能唤醒 `standby()`。这时 PA0 不能再做别的用途，硬件会把它接成下拉输入 |

## 方法

| 方法 | 说明 |
|---|---|
| `sleep()` | 停下 CPU，等任何一个中断 |
| `stop()` | 停下 CPU 和时钟，等 GPIO 的 `on_edge` 或 RTC 的 `on_alarm` |
| `standby()` | 断电，不会返回 |
| `woke_from_standby() -> bool` | 这次启动是不是从 `standby()` 醒来的。读一次就清掉，第二次读是 `False` |

## 编译时的检查

没有任何东西能唤醒时，程序会永远停在那里，所以编译时直接报错：

| 写法 | 结果 |
|---|---|
| 程序里没有任何中断处理函数，却调用了 `sleep()` | 报错 |
| 没有 GPIO 的 `on_edge` 或 RTC 的 `on_alarm`，却调用了 `stop()` | 报错。定时器和串口在 `stop` 期间不工作，叫不醒它 |
| 在中断处理函数里调用这三个方法 | 报错 |

`standby()` 不检查，因为复位引脚随时能唤醒它。

## 各档保留什么

| | `sleep` | `stop` | `standby` |
|---|---|---|---|
| RAM 和全局变量 | 保留 | 保留 | **丢失** |
| 外设的配置 | 保留 | 保留 | **丢失** |
| 定时器、PWM、UART、DMA | 继续工作 | **停住** | 断电 |
| RTC 和备份寄存器 | 继续 | 继续 | 继续 |
| 独立看门狗 IWDG | 继续 | **继续** | **继续** |
| `ticks_ms` | 停住 | 停住 | 从头开始 |

- **用了 `IWDG` 就要在超时之前醒来喂狗，否则芯片会复位**，`stop` 和 `standby` 时也一样，因为看门狗一旦开始就停不下来。要睡得久，就不要用 `IWDG`，或者用 RTC 闹钟定时醒来喂狗。
- `sleep` 期间定时器还在跑，定时器的中断也能唤醒它。所以用 `sleep` 省电时，不要留着用不上的高频中断。
- `stop` 之前要等发送完成，比如等 `uart.busy()` 变成 `False`。时钟一停，发到一半的数据会卡住，醒来才接着发。
- 从 `stop` 醒来时，编译器会恢复时钟，处理函数运行时时钟已经恢复了，串口的波特率是对的。恢复时要等晶振起振，醒来会多花几毫秒。
- `sleep` 和 `stop` 期间 `ticks_ms` 不走，不知道睡了多久。要算时间就用 RTC。
- 从 `standby` 醒来后，所有引脚都回到默认状态，外接的器件要能接受这一点。需要保留的数据放在 RTC 的备份寄存器或者[内部 Flash](flash.md) 里。

## 调试和下载

**`stop` 和 `standby` 会断开调试器，低功耗期间也下载不了程序。** 如果程序一上电就马上进入 `standby`，就很难再下载新的程序了：

- 下载时按住复位键，或者用下载工具的"复位下连接"（connect under reset）。
- 开发阶段在程序开头留几秒 `delay_ms`，再进入低功耗。

`sleep` 不影响调试。

## 注意

- 一个程序只能有一个 `Power` 对象。多个文件要用的话，都 import 同一个对象。
- 在判断标志和调用 `sleep`、`stop` 之间到来的中断，要等下一个中断才能把芯片叫醒。比如上面按键的例子，如果按键恰好在 `if` 之后、`stop` 之前按下，这一次要等到下一次按键才会处理。
- PA0 做唤醒引脚时用的是上升沿，外部信号要从低变高。
