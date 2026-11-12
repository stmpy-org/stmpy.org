---
title: Your first program
order: 2
---

# Your first program

This page uses a common STM32F103C8T6 board (the Blue Pill) to blink the LED on PC13. With another board, use your own chip's part number and LED pin.

## What a project is

A project is a directory with at least two files:

```
blink/
├── blink.spp     project file: chip, clocks, build options
└── main.py       entry point of the program
```

In StmPy Studio, the new project wizard creates both. On the command line, create them yourself.

## The project file

`blink.spp` is a TOML file:

```toml
[project]
chip = "STM32F103C8T6"

[rcc]
use_hse = true
hse_value = 8000000
hse_pll_enable = true
hse_pll_mul = 9
```

- `chip` is the part number, it is required.
- `[rcc]` sets the clocks: the 8 MHz crystal on the board, multiplied by 9, runs the chip at 72 MHz. Without the section the chip runs on its internal 8 MHz clock, which works too, only slower.

The project name is the file name of the `.spp`, `blink` here. See [Project file](../reference/project-file.md) and [Clock configuration](../reference/clock.md) for every option.

## The program

`main.py`:

```python
from stmpy import GPIO, delay_ms

led = GPIO("PC13")

def main():
    while True:
        led.toggle()
        delay_ms(500)
```

- Peripheral objects go at the top level of the file. `GPIO("PC13")` is a push-pull output by default.
- `main()` is the entry point. It is called once the chip is set up, do not call it yourself.
- A microcontroller program usually never ends, so `main()` is typically an endless loop.

## Build

In the project directory, run:

```bash
stmpy build blink.spp
```

On success it prints how much flash and RAM the program takes, and the path of the `.hex` file:

```
flash: 2848 / 65536 bytes (4.3%)
ram:   1592 / 20480 bytes (7.8%) (with stack and heap)
/path/to/blink/build/blink.hex
```

When the program has mistakes, every one of them is listed as `file:line: kind: message`, with a column when it is known. For example with `PE0`, a pin the 48-pin package does not have:

```
main.py:3: ValueError: PE0 is not available on STM32F103C8 (48 pins)
```

## Flash

In Studio, flash right from Studio. On the command line, connect the probe and run:

```bash
probe-rs download --chip STM32F103C8 --binary-format hex build/blink.hex
```

Press the reset button on the board and the LED starts blinking.

## Next steps

- [Language overview](../language/overview.md): which Python constructs StmPy supports
- [GPIO](../peripherals/gpio.md): reading buttons and driving outputs
- [Interrupts](../language/interrupts.md): reacting to a button at once instead of checking it in the main loop
