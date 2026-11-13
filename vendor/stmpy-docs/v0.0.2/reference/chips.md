---
title: Supported chips
order: 4
---

# Supported chips

| Series | Product lines | Parts |
|---|---|---|
| STM32F1 | F100, F101, F102, F103, F105, F107 | 95, or 125 counting packages |
| STM32F4 | F401, F405, F407, F410, F411, F412, F413, F415, F417, F423, F427, F429, F437, F439, F446, F469, F479 | 149, or 211 counting packages |

The pins, peripherals and packages of the chips come from ST's public [STM32_open_pin_data](https://github.com/STMicroelectronics/STM32_open_pin_data).

For the full list, run:

```bash
stmpy chips
```

## Writing the part number

`chip` in the `.spp` is the part number printed on the chip, such as `STM32F103C8T6`. What its parts mean:

```
STM32 F1 03 C 8 T 6
      │  │  │ │ │ └ temperature range, can be x or left out
      │  │  │ │ └── package: T is LQFP, U is QFN, H is BGA ...
      │  │  │ └──── flash size: 8 is 64 KB, B is 128 KB, E is 512 KB ...
      │  │  └────── pin count: C is 48, R is 64, V is 100, Z is 144 ...
      │  └───────── product line
      └──────────── series
```

The package can be left out too, as in `STM32F103C8`. Only when a part comes in several packages that bring out different pins does it have to be written.

## Switching chips

Peripherals and pins are written the same way on every chip, so switching chips usually means changing `chip`. But:

- **The new chip needs the peripherals and pins the program uses.** Small packages have fewer pins and small flash sizes fewer peripherals. Anything missing is a compile error that says what is missing.
- **F1 and F4 set their clocks differently**, see [Clock configuration](clock.md).
- **Flash pages (sectors) differ in size**, a program using [`Flash`](../peripherals/flash.md) needs other addresses.

## Tables in the peripheral pages

Most pin and DMA tables in the peripheral pages are for the STM32F103. For the other F1 lines and for F4, completion in the editor and the compile errors are the reference, they come straight from the chip data.

STM32F1 parts fall into four groups by flash size, and the parts of a group have the same peripherals. "xB and up" or "xE / xG" in the tables refer to these groups:

| Group | Flash | Example |
|---|---|---|
| x6 | 16, 32 KB | STM32F103C6 |
| xB | 64, 128 KB | STM32F103C8, STM32F103CB |
| xE | 256, 384, 512 KB | STM32F103RC, STM32F103ZE |
| xG | 768 KB, 1 MB | STM32F103ZG |
