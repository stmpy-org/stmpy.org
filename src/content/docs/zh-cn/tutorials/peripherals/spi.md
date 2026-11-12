---
title: SPI
sidebar:
  order: 11
---

# SPI

SPI 是一种高速的同步总线，常用来接 Flash 存储芯片、屏幕、SD 卡等。StmPy 的 SPI 工作在主机模式，收发的数据放在 `bytearray` 里（见[数组](../../language/arrays/)）。

片选（CS）不由 SPI 管，用一个普通的 [GPIO](../gpio/) 自己控制。

```python
from stmpy import SPI, GPIO, UART

flash = SPI(1, baudrate=4_000_000)
cs = GPIO("PA4")
uart = UART(2)
cmd = bytearray([0x9F, 0, 0, 0])

def main():
    cs.on()                 # 不选中
    cs.off()                # 选中
    flash.transfer(cmd)     # 发 0x9F 和 3 个空字节，cmd 被换成收到的字节
    cs.on()
    uart.write_int(cmd[1])  # 厂商 ID
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `id` | 必填 | SPI 编号，1 就是 SPI1 |
| `baudrate` | 1_000_000 | 时钟频率，单位 Hz。实际取不超过它的最高速率 |
| `mode` | 0 | 0-3，等于时钟极性 × 2 + 时钟相位，按器件手册填 |
| `sck` | `""` | 时钟引脚，比如 `"PB3"`。见"引脚" |
| `miso` | `""` | 数据输入引脚，比如 `"PB4"` |
| `mosi` | `""` | 数据输出引脚，比如 `"PB5"` |
| `background_send` | `False` | 用 `send()` 在后台发送，见"后台发送" |

## 方法

| 方法 | 说明 |
|---|---|
| `write(data: bytearray)` | 发送 `data`，收到的字节丢掉 |
| `read(buf: bytearray)` | 每个字节发 0xFF，把收到的填进 `buf` |
| `transfer(buf: bytearray)` | 发送 `buf`，并把每个字节换成同时收到的字节 |
| `transfer_byte(b) -> int` | 发一个字节，返回同时收到的字节 |
| `send(data: bytearray)` | 开始在后台发送 `data`，立刻返回，收到的字节丢掉。要有 `background_send` |
| `busy() -> bool` | 后台发送是否还没完成 |

只支持 8 位数据、高位在前。

## 引脚

三个引脚都不写时用默认引脚。写了任意一个就只用写了的：`sck` 必须写，`miso` 和 `mosi` 至少写一个。引脚必须属于这个 SPI，STM32F1 的重映射由编译器选。

```python
lcd = SPI(1, sck="PA5", mosi="PA7")     # 只发，PA6 可以做别的用途
flash = SPI(2)                          # PB13、PB14、PB15
```

STM32F103：

| SPI | 引脚组 | SCK | MISO | MOSI | 可用芯片 |
|---|---|---|---|---|---|
| SPI1 | 默认 | PA5 | PA6 | PA7 | 全部 |
| SPI1 | 重映射 | PB3 | PB4 | PB5 | 全部 |
| SPI2 | 默认 | PB13 | PB14 | PB15 | xB 及以上的 48 脚及以上封装 |
| SPI3 | 默认 | PB3 | PB4 | PB5 | xE / xG |

| 写法 | 结果 |
|---|---|
| `SPI(1, sck="PB3", miso="PB4", mosi="PB5")` | SPI1 重映射 |
| `SPI(1, sck="PA5", mosi="PA7")` | 只发，不能用 `read`、`transfer`、`transfer_byte` |
| `SPI(1, sck="PA5", miso="PA6")` | 只收，不能用 `write`、`transfer`、`transfer_byte` |
| `SPI(1, sck="PA5")` | 报错：`miso`、`mosi` 至少写一个 |
| `SPI(1, sck="PB3", mosi="PA7")` | 报错：两个引脚不在同一组 |

- 一条总线上挂多个设备时，每个设备用一个单独的片选引脚。NSS 引脚不用。
- SPI1 的重映射和 SPI3 用同样的引脚，不能同时用。
- PB3、PB4 复位后属于 JTAG，用到时编译器会自动处理，SWD 不受影响。
- 不用的引脚不会被配置，也不会被占用。
- STM32F4 和其他芯片的引脚以编辑器的补全和编译报错为准。

## 时钟

- SPI1 在 APB2 总线上，SPI2、SPI3 在 APB1 上。分频只能是 2、4、8 …… 256。
- 实际速率取不超过 `baudrate` 的最高值。比如 72 MHz 的配置下 SPI1 要 4 MHz：16 分频是 4.5 MHz，超了，所以实际用 32 分频，是 2.25 MHz。在编辑器里悬停在对象上能看到实际的速率。
- 上限：STM32F1 是 18 MHz，F100 是 12 MHz；STM32F4 是所在总线时钟的一半，比如 168 MHz 的配置下 SPI1 是 42 MHz、SPI2 和 SPI3 是 21 MHz。写更大的值也只能到这个速率。
- 下限是总线时钟的 1/256，72 MHz 的配置下 SPI1 约 281 kHz、SPI2 约 141 kHz，太低时编译报错。

## 后台发送

刷屏这类大块的数据适合用 `send()`：交给 DMA，立刻返回，程序可以接着做别的事。

```python
from stmpy import SPI, GPIO

lcd = SPI(1, baudrate=18_000_000, sck="PA5", mosi="PA7", background_send=True)
cs = GPIO("PA4")
frame = bytearray(1024)

@lcd.on_sent()
def on_sent():
    cs.on()         # 全部发完才调用，这时释放片选

def main():
    cs.on()
    fill(frame)
    cs.off()
    lcd.send(frame)
```

规则和 [UART 的后台发送](../uart/)一样：

1. `send` 的参数必须直接写全局数组的名字，否则编译报错。
2. 发送期间不要修改这个数组。
3. 上一次还没发完时，再调用 `send`、`write`、`transfer` 等都会先等它发完。之后 `read`、`transfer` 收到的是新数据，发送期间收到的已经丢掉了。
4. 数组最多 65535 字节。
5. `send` 发完之前不要释放片选，用 `busy()` 或 `on_sent` 确认发完了。

DMA 通道由编译器分配。STM32F1 上每个 SPI 的通道是硬件固定的：

| SPI | DMA 通道 | 可用芯片 |
|---|---|---|
| SPI1 | DMA1 通道 3 | 全部 |
| SPI2 | DMA1 通道 5 | xB 及以上 |
| SPI3 | DMA2 通道 2 | xE / xG |

一个通道只能有一种用途，冲突时编译报错：

| 写法 | 结果 |
|---|---|
| `SPI(1, background_send=True)` 和 `UART(3, rx_buffer=64)` | 报错：都要 DMA1 通道 3 |
| `SPI(2, background_send=True)` 和 `UART(1, rx_buffer=64)` | 报错：都要 DMA1 通道 5 |

## 注意

- 传输会一直等到完成，不计超时，在中断里也能用。但不要在主循环和中断里同时用同一条 SPI，中断里的传输会因为总线忙而被丢掉。
- 不能用的方法只对直接用对象名的调用报错，SPI 对象通过函数参数传进去时查不出来。
