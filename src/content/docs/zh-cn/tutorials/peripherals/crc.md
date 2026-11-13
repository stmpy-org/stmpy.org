---
title: CRC
sidebar:
  order: 17
---

# CRC

用硬件计算 CRC-32，结果和 Python 的 `zlib.crc32` 一样，可以直接在电脑上核对。

```python
from stmpy import CRC, UART

crc = CRC()
uart = UART(1)
data = bytearray([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39])

def main():
    uart.write_int(crc.calculate(data))     # -873187034
```

## 方法

`CRC()` 没有参数。

| 方法 | 说明 |
|---|---|
| `calculate(data: bytearray) -> int` | 计算 `data` 的 CRC-32 |

## 结果的符号

StmPy 的 `int` 是有符号的 32 位整数，而 CRC-32 用满了 32 位，最高位是 1 时结果是负数：

| | 电脑上的 `zlib.crc32` | `crc.calculate` |
|---|---|---|
| `b"123456789"` | `0xCBF43926` | `-873187034` |

- 程序里不能直接写 `0xCBF43926`，它放不进 `int`，要写成 `-873187034`。
- 两次计算的结果可以直接比较。
- 在电脑上和 `uart.write_int` 打出来的数比较时，先 `& 0xFFFFFFFF`。
- 按字节发送时用 `(x >> 24) & 0xFF` 这样的写法，结果是对的。

## 速度

硬件一次算 4 个字节。不足 4 字节的尾巴由软件逐位计算，慢得多，所以长度是 4 的倍数时最快。

## 注意

- 一次 `calculate()` 独占硬件，不要在主循环和中断里同时用，结果会出错。
- 一个程序只能有一个 `CRC` 对象。多个文件要用的话，都 import 同一个对象。
- 这是标准的 CRC-32，和 STM32 手册上直接往硬件里写数据得到的结果不同：手册的算法没有位反转和结果取反。
