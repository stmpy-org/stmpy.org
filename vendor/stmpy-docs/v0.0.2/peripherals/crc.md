---
title: CRC
order: 17
---

# CRC

Computes CRC-32 in hardware. The result is that of Python's `zlib.crc32`, so it can be checked on a computer.

```python
from stmpy import CRC, UART

crc = CRC()
uart = UART(1)
data = bytearray([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39])

def main():
    uart.write_int(crc.calculate(data))     # -873187034
```

## Methods

`CRC()` takes no parameters.

| Method | Description |
|---|---|
| `calculate(data: bytearray) -> int` | the CRC-32 of `data` |

## The sign of the result

StmPy's `int` is a signed 32 bit integer, while a CRC-32 uses all 32 bits, so a result with the top bit set is negative:

| | `zlib.crc32` on a computer | `crc.calculate` |
|---|---|---|
| `b"123456789"` | `0xCBF43926` | `-873187034` |

- `0xCBF43926` cannot be written in a program, it does not fit an `int`. Write `-873187034`.
- Two results can be compared directly.
- To compare with what `uart.write_int` printed, take `& 0xFFFFFFFF` on the computer first.
- Sending it byte by byte with `(x >> 24) & 0xFF` and the like gives the right bytes.

## Speed

The hardware takes 4 bytes at a time. Bytes left over at the end are done bit by bit in software, which is much slower, so lengths that are a multiple of 4 are fastest.

## Notes

- A `calculate()` has the hardware to itself, do not use it from both the main loop and a handler, the result would be wrong.
- A program can have only one `CRC` object. For several files to use it, they import the same object.
- This is the standard CRC-32, not what writing words straight into the hardware gives as in ST's manual: that one has no bit reversal and no final inversion.
