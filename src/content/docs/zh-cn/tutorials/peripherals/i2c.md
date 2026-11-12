---
title: I2C
sidebar:
  order: 10
---

# I2C

I2C 是一种两根线的总线，常用来接传感器、EEPROM、OLED 屏幕等。StmPy 的 I2C 工作在主机模式，收发的数据放在 `bytearray` 里（见[数组](../../language/arrays/)）。

## 用法

下面的例子读 MPU6050 的加速度。驱动写在单独的文件里，接收一个总线对象，不关心用的是哪两个引脚：

```python
# mpu.py
from stmpy import I2C

ADDR = 0x68
_raw = bytearray(6)

def wake(bus: I2C) -> None:
    bus.write_reg(ADDR, 0x6B, 0)

def accel_x(bus: I2C) -> int:
    if not bus.read_regs(ADDR, 0x3B, _raw):
        return 0
    x = (_raw[0] << 8) | _raw[1]
    if x >= 0x8000:
        x -= 0x10000
    return x
```

```python
# main.py
from stmpy import I2C, UART, delay_ms
import mpu

bus = I2C(1, freq=400_000)
uart = UART(2)

def main():
    if not bus.ping(mpu.ADDR):
        uart.write("no mpu6050\n")
    mpu.wake(bus)
    while True:
        uart.write_int(mpu.accel_x(bus))
        uart.write("\n")
        delay_ms(100)
```

一条总线可以挂多个地址不同的设备，把同一个总线对象传给各个驱动就行。

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `id` | 必填 | I2C 编号，1 就是 I2C1 |
| `freq` | 100_000 | 总线时钟，单位 Hz。标准模式是 100 kHz，快速模式最高 400 kHz |
| `scl` | `""` | 时钟引脚，比如 `"PB8"`。见"引脚" |
| `sda` | `""` | 数据引脚，比如 `"PB9"`。见"引脚" |

## 方法

`addr` 是 7 位的设备地址，比如 0x68；`reg` 是 8 位的寄存器地址。

| 方法 | 说明 |
|---|---|
| `write(addr, data: bytearray) -> bool` | 发送 `data` |
| `read(addr, buf: bytearray) -> bool` | 读满 `buf` |
| `write_reg(addr, reg, value) -> bool` | 写一个寄存器（一个字节） |
| `read_reg(addr, reg) -> int` | 读一个寄存器，失败时返回 -1 |
| `write_regs(addr, reg, data: bytearray) -> bool` | 从 `reg` 开始连续写 |
| `read_regs(addr, reg, buf: bytearray) -> bool` | 从 `reg` 开始连续读，读满 `buf` |
| `ping(addr) -> bool` | 这个地址上有没有设备应答 |

返回 `bool` 的方法：设备应答了所有字节时返回 `True`；设备没应答、总线出错或者超过 100 毫秒时返回 `False`。

## 引脚

`scl`、`sda` 都不写时用默认引脚。要换引脚时两个都要写，而且必须属于这个 I2C。STM32F1 的重映射由编译器选。

```python
bus = I2C(1, scl="PB8", sda="PB9")
```

STM32F103：

| I2C | 引脚组 | SCL | SDA | 可用芯片 |
|---|---|---|---|---|
| I2C1 | 默认 | PB6 | PB7 | 全部 |
| I2C1 | 重映射 | PB8 | PB9 | 48 脚及以上 |
| I2C2 | 默认 | PB10 | PB11 | xB 及以上的 48 脚及以上封装 |

| 写法 | 结果 |
|---|---|
| `I2C(1)` | PB6、PB7 |
| `I2C(1, scl="PB8", sda="PB9")` | I2C1 重映射 |
| `I2C(1, scl="PB8")` | 报错：两个引脚都要写 |
| `I2C(1, scl="PB8", sda="PB7")` | 报错：两个引脚不在同一组 |
| `I2C(2, scl="PB8", sda="PB9")` | 报错：PB8 不是 I2C2 的 SCL，可选 PB10 |

- **SCL 和 SDA 都要接上拉电阻**，常用 4.7 kΩ 接到 3.3 V。芯片内部的上拉在 I2C 模式下不起作用。
- USART1 重映射（`tx="PB6"`）也用 PB6、PB7，和 I2C1 的默认引脚冲突。
- STM32F4 和其他芯片的引脚以编辑器的补全和编译报错为准。

## 时钟

- I2C 在 APB1 总线上。STM32F103 在 72 MHz 的常用配置下，PCLK1 是 36 MHz。
- 频率的下限由 PCLK1 决定：36 MHz 时是 4396 Hz，8 MHz（默认的 HSI）时是 977 Hz，太低时编译报错。
- 快速模式（高于 100 kHz）的低电平和高电平时间比是 2:1。

## 启动时的总线恢复

单片机在传输中途复位时，从机可能一直把 SDA 拉低，总线就卡死了。为此初始化时会先把两个引脚当普通 GPIO 用：SDA 被拉低时，在 SCL 上给最多 9 个时钟，让从机把字节送完，再发一个 START 和 STOP 让所有从机复位，然后才交给 I2C 外设。

STM32F1 的 I2C 还有一个硬件问题：线上的毛刺可能让 BUSY 标志一直置位，外设就再也发不出 START（勘误手册 ES096 2.13.7）。初始化时会复位一次 I2C 外设，把它清掉。

## 注意

- 所有传输方法的超时都靠 SysTick 计时，**不能在中断里调用**，编译时会报错。
- 一次传输失败后，外设会恢复到空闲状态，下一次可以直接重试。但运行中总线卡死时目前不会自动恢复，要重新上电。
- 寄存器地址只支持 8 位，24C32 这类要 16 位地址的 EEPROM，用 `write` 和 `read` 自己拼地址。
