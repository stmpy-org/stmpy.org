---
title: 中断
order: 5
---

# 中断

中断用装饰器来写：装饰器挂在外设对象上，被装饰的函数就是中断处理函数。硬件事件一发生，芯片就暂停主程序，调用这个函数，执行完再回到主程序。

```python
from stmpy import GPIO, Mode, Pull, Edge

led = GPIO("PC13")
key = GPIO("PA0", Mode.INPUT, pull=Pull.UP)
pressed: bool = False

@key.on_edge(Edge.FALLING, priority=2)
def on_press():
    global pressed
    pressed = True

def main():
    global pressed
    while True:
        if pressed:
            pressed = False
            led.toggle()
```

## 规则

1. **装饰器要带括号**：`@key.on_edge` 要写成 `@key.on_edge()`。
2. **外设对象要先定义或者 import**，再写装饰器。也可以用别的模块里的对象，比如 `@board.key.on_edge()`。
3. **装饰器的参数只能是编译时的常量**，和外设的构造参数一样。
4. **处理函数的签名由装饰器决定**，没有返回值。大多数是 `def f()`，少数会把数据当参数传进来，比如 UART 的 `on_rx` 是 `def f(b: int)`。
5. 一个函数可以叠加多个装饰器，其中任何一个事件发生都会调用它。
6. **处理函数不能被代码直接调用**，`main` 也不能做处理函数。
7. `key.on_edge()` 只能当装饰器用，不能写成普通的语句。

## 有哪些中断

| 装饰器 | 什么时候调用 | 处理函数 | 说明 |
|---|---|---|---|
| `GPIO.on_edge` | 引脚出现上升沿或下降沿 | `def f()` | [GPIO](../peripherals/gpio.md) |
| `Timer.on_update` | 每个周期结束 | `def f()` | [定时器](../peripherals/timer.md) |
| `Capture.on_capture` | 捕获到一个边沿 | `def f(t: int)`，参数是计数值 | [输入捕获](../peripherals/capture.md) |
| `UART.on_rx` | 收到一个字节 | `def f(b: int)`，参数是这个字节 | [UART](../peripherals/uart.md) |
| `UART.on_idle` | 收完一段数据，线路空闲下来 | `def f()` | [UART](../peripherals/uart.md) |
| `UART.on_sent`、`SPI.on_sent` | 后台发送全部完成 | `def f()` | [UART](../peripherals/uart.md)、[SPI](../peripherals/spi.md) |
| `CAN.on_rx` | 有收到的消息在等着读 | `def f()` | [CAN](../peripherals/can.md) |
| `RTC.on_second` | 每秒一次 | `def f()` | [RTC](../peripherals/rtc.md) |
| `RTC.on_alarm` | 到了闹钟时间 | `def f()` | [RTC](../peripherals/rtc.md) |

## 优先级

每个装饰器都有一个 `priority` 参数，默认是 8。

- 取值 0-15，**数字越小越优先**。优先级高的中断可以打断正在执行的、优先级低的处理函数。
- **共用一个中断向量的处理函数，优先级必须相同**，否则编译报错。比如 PA5 和 PA6 的 `on_edge` 都在 `EXTI9_5` 这个向量上。
- 系统计时用的 SysTick 是最低的 15，`delay_ms` 和 `ticks_ms` 都靠它计时。

## 中断里不能用的调用

处理函数执行的时候，SysTick 不会走。所以等 SysTick 计时的调用，在中断里永远不会返回。这些调用在编译时直接报错，通过别的函数间接调用的也会查出来：

| 调用 | 原因 |
|---|---|
| `delay_ms` | 等 SysTick 计数 |
| `uart.read_byte` | 接收超时靠 SysTick 计时 |
| `capture.read` | 等待超时靠 SysTick 计时 |
| I2C 的所有传输方法 | 超时靠 SysTick 计时 |
| `power.sleep` / `stop` / `standby` | 处理函数挡住了同级和更低级的中断，等不到唤醒 |
| `flash.erase` / `write` | CPU 要停几十毫秒，主循环正在写的时候还会失败 |

比如：

```python
def wait() -> None:
    delay_ms(1)

@key.on_edge()
def handler():
    wait()
```

报错指向 `delay_ms(1)` 那一行，并给出调用链：

```
ValueError: delay_ms cannot be used in an interrupt handler: handler -> wait -> delay_ms
```

能用、但要注意的：

- `delay_us` 按 CPU 周期计时，在中断里能用。但在中断里等待会拖住其他同级和更低级的中断。
- `uart.write` 能用，会等发送完才返回。但如果主循环正在用同一个 UART 发送，中断里的这次发送会被直接丢掉，不会报错。

## 共享变量

中断和主程序之间一般通过全局变量传递数据。**处理函数里用到、并且在任何地方被写过的全局变量，编译器会自动标成 `volatile`**，处理函数间接调用的函数里用到的也算。只读的全局变量不受影响。

如果没有 `volatile`，编译器优化时可能把主循环里的 `if pressed:` 只读一次，之后就再也看不到中断对它的修改。这件事编译器替你做了，不用操心。

需要自己注意的是：`volatile` 只保证每次都从内存里读写，**不保证读、改、写是一个整体**。`count += 1` 同时出现在主循环和中断里时，可能丢掉一次修改。

## 注意

- 处理函数要尽快返回。它执行期间，同级和更低级的中断都要等着。
- 所有外设初始化完成后才会打开中断，`main()` 开始时中断已经打开了。
- 机械按键有抖动，按一次可能触发好几次中断，需要的话在处理函数里自己过滤。
- 读、改、写的竞争目前还没有办法彻底避免，以后会提供临界区。
