---
title: Internal flash
sidebar:
  order: 15
---

# Internal flash

Keeps a part of the chip's internal flash for data, such as settings and calibration values, which stay without power. The address and size of the area are written in the code, so the data stays where it is when the program changes.

```python
from stmpy import Flash

config = Flash(0x0800FC00, 1024)    # the last page of a 64 KB chip
data = bytearray(16)

def save() -> None:
    config.erase()
    config.write(0, data)

def main():
    config.read(0, data)
    if data[0] == 0xFF:             # all 0xFF after an erase: nothing saved yet
        data[0] = 1
        save()
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `address` | required | where it starts, on a page boundary (a sector boundary on F4) |
| `size` | required | bytes, whole pages (whole sectors on F4) |

## Methods

| Method | Description |
|---|---|
| `size() -> int` | bytes of the area |
| `read(offset, buf: bytearray) -> bool` | fill `buf` from `offset`, `False` when that is outside the area |
| `erase() -> bool` | set the whole area to 0xFF, whether that worked |
| `write(offset, data: bytearray) -> bool` | write `data` at `offset`, whether that worked |

## Choosing the address

The program fills the flash from its start (`0x08000000`) on, so **put data areas at the end of the flash**, which leaves the most room for the program.

The flash of STM32F1 is erased by page:

| Flash size | Page size | End | Last page |
|---|---|---|---|
| 16 KB | 1 KB | `0x08004000` | `0x08003C00` |
| 32 KB | 1 KB | `0x08008000` | `0x08007C00` |
| 64 KB (such as C8T6) | 1 KB | `0x08010000` | `0x0800FC00` |
| 128 KB | 1 KB | `0x08020000` | `0x0801FC00` |
| 256 KB | 2 KB | `0x08040000` | `0x0803F800` |
| 384 KB | 2 KB | `0x08060000` | `0x0805F800` |
| 512 KB | 2 KB | `0x08080000` | `0x0807F800` |
| 768 KB | 2 KB | `0x080C0000` | `0x080BF800` |
| 1 MB | 2 KB | `0x08100000` | `0x080FF800` |

The pages of F105 and F107 are 2 KB whatever the flash size.

The flash of STM32F4 has sectors of different sizes, address and size go by whole sectors:

| Sector | Size | Start |
|---|---|---|
| 0-3 | 16 KB each | from `0x08000000` |
| 4 | 64 KB | `0x08010000` |
| 5 and up | 128 KB each | from `0x08020000` |

Chips with 64 KB have only sectors 0-3, those with 128 KB end with sector 4. Chips with 2 MB have two banks, and from `0x08100000` the same layout starts again. The last sector of a 1 MB chip, for example, is `Flash(0x080E0000, 131072)`.

Rules:

1. Address and size must be on page or sector boundaries, an area outside the flash of the chip is a compile error. When you switch to a chip with other page sizes, the error tells you to change them.
2. Areas cannot overlap.
3. **The program must end before the lowest area**, if it does not fit the link fails with `region FLASH overflowed`.

The flash usage printed after a build is out of the part the program can use:

```
flash: 4196 / 60416 bytes (6.9%), the last 5120 kept for data
```

## Writing

Flash can only turn 1s into 0s. Getting a 1 back takes an erase, and an erase clears a whole page. So:

1. **Erase before writing, and do not write the same place twice.** `write` checks first: when any part of the range was written since the last erase, it writes nothing and returns `False`.
2. `offset` must be even, the hardware writes 2 bytes at a time.
3. When `data` has an odd length, a 0xFF is added after its last byte, and those 2 bytes cannot be written again either.
4. Outside the area nothing is written and it returns `False`.

An erased area can be written in several parts at different places, such as a log written record after record and erased when full.

## Wear and power loss

- **A page lasts about 10000 erases.** Do not erase for every change of data that changes often: saving once a second uses up 10000 erases in under 3 hours. Append new data instead and erase when full, or keep small data in the backup registers of the [RTC](../rtc/).
- A power loss during an erase or write can leave the data broken. Protect important data with a checksum, such as a [CRC](../crc/), and keep two copies written in turn.

## Timing

| Operation | Time |
|---|---|
| read | about as fast as memory |
| write | about 50 µs per 2 bytes |
| erase | about 20-40 ms per page on F1, over a second for a 128 KB sector on F4 |

**The CPU stops during writes and erases**, since the program itself is in flash. Interrupts wait too: timer handlers run late, and `delay_ms` runs slow. DMA is not affected, `rx_buffer` keeps receiving. Leave room for this in the timeout of a watchdog.

`erase` and `write` cannot be called in an interrupt handler, that is a compile error.

## Several areas

A program can have several `Flash` objects, each erased on its own:

```python
config = Flash(0x0800FC00, 1024)
records = Flash(0x0800EC00, 4096)
```

The order of the objects does not change their addresses. Changing `address` or `size` reads other data, what was saved before does not move with it.

## Notes

- Flashing a new program usually erases only the pages it writes, so the data stays. A full chip erase clears it.
- On STM32F4, `Flash` needs HCLK of at least 1 MHz.
