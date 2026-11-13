---
title: UART
order: 9
---

# UART

UART 就是常说的串口，用来和电脑、GPS、蓝牙模块等设备通信。数据位固定是 8 位，校验位和停止位可以设置。

```python
from stmpy import UART

uart = UART(1, baudrate=115200)

def main():
    uart.write("hello\n")
    while True:
        c = uart.read_byte(10)
        if c >= 0:
            uart.write_byte(c)      # 收到什么就发回去
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `id` | 必填 | UART 编号：1 是 USART1，4 是 UART4 |
| `baudrate` | 115200 | 波特率 |
| `tx` | `""` | 发送引脚，比如 `"PB6"`。见"引脚" |
| `rx` | `""` | 接收引脚，比如 `"PB7"`。见"引脚" |
| `parity` | `Parity.NONE` | 校验位：`NONE`、`EVEN`、`ODD`。数据仍然是 8 位 |
| `stop_bits` | `StopBits.ONE` | 停止位：`ONE`、`TWO` |
| `rx_buffer` | 0 | 后台接收缓冲区的字节数，见"后台接收"。0 表示不用 |
| `background_send` | `False` | 用 `send()` 在后台发送，见"后台发送" |

## 方法

| 方法 | 说明 |
|---|---|
| `write(s: str)` | 发送字符串，发完才返回 |
| `write_byte(b)` | 发送一个字节，也就是 `b` 的低 8 位 |
| `write_bytes(data: bytearray)` | 发送 `data` 的所有字节 |
| `write_int(n)` | 把 `n` 按十进制的文字发送，比如 `123` 发出去是 `"123"` |
| `read_byte(timeout_ms) -> int` | 最多等 `timeout_ms` 毫秒收一个字节，超时返回 -1。传负数表示一直等 |
| `available() -> bool` | 有没有收到的字节在等着读 |
| `read_into(buf: bytearray) -> int` | 把后台接收缓冲区里的字节移到 `buf`，不等待，返回移了几个。要有 `rx_buffer` |
| `send(data: bytearray)` | 开始在后台发送 `data`，立刻返回。要有 `background_send` |
| `busy() -> bool` | 后台发送是否还没完成 |

## 引脚

`tx`、`rx` 都不写时用默认引脚。只写一个时只用这一个方向，另一个引脚空出来可以做别的用途。

```python
gps = UART(2, 9600, rx="PA3")       # 只收，PA2 空出来
log = UART(1, tx="PB6", rx="PB7")   # 换到 USART1 的另一组引脚
```

写的引脚必须属于这个 UART，否则报错并列出可选的引脚。STM32F1 的重映射由编译器根据引脚选。

STM32F103：

| UART | 引脚组 | TX | RX | 可用芯片 |
|---|---|---|---|---|
| USART1 | 默认 | PA9 | PA10 | 全部 |
| USART1 | 重映射 | PB6 | PB7 | 全部 |
| USART2 | 默认 | PA2 | PA3 | 全部 |
| USART2 | 重映射 | PD5 | PD6 | 100、144 脚 |
| USART3 | 默认 | PB10 | PB11 | xB 及以上的 48 脚及以上封装 |
| USART3 | 部分重映射 | PC10 | PC11 | xB 及以上的 64 脚及以上封装 |
| USART3 | 完全重映射 | PD8 | PD9 | xB 及以上的 100、144 脚 |
| UART4 | 默认 | PC10 | PC11 | xE / xG |
| UART5 | 默认 | PC12 | PD2 | xE / xG |

| 写法 | 结果 |
|---|---|
| `UART(1)` | PA9、PA10 |
| `UART(1, tx="PB6", rx="PB7")` | USART1 重映射 |
| `UART(1, tx="PA9")` | 只发，PA10 空出来。不能用 `read_byte`、`available`、`on_rx` |
| `UART(1, rx="PA10")` | 只收，PA9 空出来。不能用 `write` 这一类方法 |
| `UART(1, tx="PA9", rx="PB7")` | 报错：两个引脚不在同一组 |
| `UART(1, tx="PB10")` | 报错：PB10 不是 USART1 的 TX，可选 PA9、PB6 |

- STM32F4 的每个引脚单独选复用功能，TX 和 RX 可以任意搭配，能用的引脚也更多。默认引脚和 F1 一样。
- RX 引脚配置成上拉输入，线没接时不会收到乱码。
- USART3 的部分重映射和 UART4 用同样的引脚，不能同时用。USART1 重映射和 I2C1 的默认引脚也冲突。
- 其他芯片的引脚以编辑器的补全和编译报错为准。

## 接收中断 on_rx

每收到一个字节调用一次处理函数，参数就是这个字节（0-255）：

```python
from stmpy import UART

uart = UART(1)
last: int = -1

@uart.on_rx(priority=3)
def on_rx(b: int):
    global last
    last = b
    uart.write_byte(b)      # 回显
```

- 挂了 `on_rx` 的 UART，收到的字节只交给处理函数，不能再用 `read_byte()` 和 `available()`，直接调用会编译报错。
- 处理函数要尽快返回：115200 波特率下每个字节只有约 87 微秒，处理函数返回之前又收完两个字节时，后一个会丢。
- 带校验位时，校验出错的字节也照常交给处理函数。
- 主循环和处理函数同时用同一个 UART 的 `write` 时，处理函数里的发送可能被丢掉。

## 后台接收

不用 `rx_buffer` 时，硬件只能存一个字节，程序来不及取走，下一个字节就丢了。115200 波特率下每个字节只有约 87 微秒，程序在 `delay_ms` 或者忙别的事情时就会丢数据。

写了 `rx_buffer` 后，收到的字节由 DMA 在后台存进一块缓冲区，不占 CPU，程序有空时再读。

一次收一段长度不定的数据，比如模块的一行回复或者 GPS 的一条语句，用 `on_idle`：

```python
from stmpy import UART

uart = UART(1, rx_buffer=256)
line = bytearray(64)
length: int = 0

@uart.on_idle()
def on_message():
    global length
    length = uart.read_into(line)
```

`on_idle` 在线路空闲下来时调用，也就是一段数据收完之后。

也可以不用中断，主循环有空就取：

```python
def main():
    while True:
        n = uart.read_into(line)
        if n > 0:
            handle(line, n)
        do_other_things()
```

有 `rx_buffer` 时，`read_byte` 和 `available` 的用法不变，读的是缓冲区。

### 缓冲区要多大

缓冲区最多存 `rx_buffer - 1` 个字节，要在存满之前读走：

| 波特率 | 每秒约多少字节 | 256 字节存满要多久 |
|---|---|---|
| 9600 | 960 | 266 毫秒 |
| 115200 | 11520 | 22 毫秒 |
| 921600 | 92160 | 2.8 毫秒 |

> **存满之后，最老的数据会被新数据覆盖**，程序分辨不出来，也不会报错。缓冲区要比两次读取之间可能收到的数据多。

缓冲区占 RAM，编译结束时输出的 RAM 用量里已经算上了。

### 限制

- `on_rx` 不能和 `rx_buffer` 一起用，因为字节都进了缓冲区，一起用时编译报错。
- `on_idle` 和 `read_into` 必须有 `rx_buffer`，直接调用时编译报错。
- 不要在主循环和中断里同时读同一个 UART 的缓冲区，读的位置会乱。
- `on_idle` 调用时，`read_into` 偶尔可能返回 0，程序要能处理这种情况。
- STM32F1 的 UART5 硬件上没有 DMA，不能用 `rx_buffer`。

## 后台发送

`write` 这一类方法要等发完才返回，115200 波特率下发 1000 个字节要等约 87 毫秒。写了 `background_send=True` 后，`send()` 把数据交给 DMA，立刻返回，程序可以接着做别的事：

```python
from stmpy import UART

uart = UART(1, background_send=True)
report = bytearray(100)

@uart.on_sent()
def on_sent():
    pass            # 全部发完了

def main():
    while True:
        fill(report)
        uart.send(report)
        do_other_things()
        while uart.busy():      # 改 report 之前要等它发完
            pass
```

规则：

1. **`send` 的参数必须直接写全局数组的名字**，否则编译报错。因为发送在函数返回后还在继续，函数里的局部数组那时已经不在了；函数的参数也不行，编译器不知道它指向哪个数组。
2. **发送期间不要修改这个数组**，否则发出去的是改到一半的数据。编译器查不出这种错误，要用 `busy()` 或 `on_sent` 确认发完了再改。
3. 上一次还没发完时，再调用 `send` 或者 `write` 这一类方法，都会先等它发完，字节不会交错。这个等待靠硬件完成，在中断里也不会卡死，只是会多等一会儿。
4. 数组最多 65535 字节，整个数组都会发出去。

`on_sent` 在最后一个字节离开引脚之后才调用，这时可以切换 RS-485 的收发方向。为此处理函数会先等最后一个字节发完，最多一个字节的时间：115200 波特率约 87 微秒，9600 波特率约 1 毫秒。这段时间同级和更低级的中断要等着，低波特率时要注意。

`rx_buffer` 和 `background_send` 可以一起用。

## DMA 通道

后台接收和后台发送都要占用 DMA 通道，由编译器分配，不用写。在编辑器里悬停在对象上能看到用的是哪个。

STM32F1 上每个 UART 的通道是硬件固定的：

| UART | 接收 | 发送 | 可用芯片 |
|---|---|---|---|
| USART1 | DMA1 通道 5 | DMA1 通道 4 | 全部 |
| USART2 | DMA1 通道 6 | DMA1 通道 7 | 全部 |
| USART3 | DMA1 通道 3 | DMA1 通道 2 | xB 及以上 |
| UART4 | DMA2 通道 3 | DMA2 通道 5 | xE / xG |

一个通道只能有一种用途，冲突时编译报错。比如 UART4 的后台发送和 ADC3 的 `continuous` 都要 DMA2 通道 5。STM32F4 的选择更多，编译器会挑空闲的数据流。

## 注意

- 不能用的方法只对直接用对象名的调用报错。UART 对象通过函数参数传进去时查不出来，要自己避免：这时没有 `rx_buffer` 的 UART 上 `read_into` 总是返回 0；没有 `background_send` 的 UART 上 `send` 会等发完才返回，`busy()` 总是 `False`。
