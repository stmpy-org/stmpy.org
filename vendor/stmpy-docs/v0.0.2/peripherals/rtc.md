---
title: RTC
order: 13
---

# RTC

The RTC (real-time clock) is a counter that goes up by one every second and keeps going through a reset. With a battery on the VBAT pin it keeps going while the chip has no power, too. It comes with a few backup registers that keep their data the same way.

```python
from stmpy import RTC, UART

rtc = RTC()
uart = UART(1)

@rtc.on_second()
def tick():
    uart.write_int(rtc.now())
    uart.write("\n")

def main():
    if rtc.lost():
        rtc.set(1700000000)     # the time is lost, set it again, such as from the network
    while True:
        pass
```

For accurate time, the board needs a 32.768 kHz crystal, turned on in the `.spp` (see [Clock configuration](../reference/clock.md)):

```toml
[rcc]
use_lse = true
```

## Methods

`RTC()` takes no parameters.

| Method | Description |
|---|---|
| `now() -> int` | the counter, in seconds |
| `set(seconds: int)` | set the counter |
| `lost() -> bool` | whether the time cannot be trusted: the backup domain lost power and the counter started over, or the clock did not start. `False` after a `set()` |
| `alarm_at(seconds: int)` | call `on_alarm` once when the counter reaches this value |
| `save(slot: int, value: int)` | keep the low 16 bits of `value` in backup register `slot` |
| `load(slot: int) -> int` | read backup register `slot`, 0-65535, or -1 for a slot that does not exist |
| `@on_second(priority=8)` | calls the handler every second |
| `@on_alarm(priority=8)` | calls the handler once at the alarm time |

## What the counter means

What the counter counts from is up to the program. Unix time, the seconds since January 1, 1970, is a common choice.

- The RTC of STM32F1 is a plain seconds counter. The RTC of STM32F4 is a calendar, and the compiler turns it into the same seconds counter, so the code is the same on both.
- The counter is a signed 32 bit `int`, so Unix time turns negative in January 2038.
- There is no conversion to year, month and day yet.

## Clock

| Setting | Clock | Accuracy | Without power |
|---|---|---|---|
| `use_lse = true` | the 32.768 kHz crystal on PC14 and PC15 | good, seconds per day | keeps going with a battery |
| not set | the internal LSI | **poor, can be off by a third** | stops |

- **Without `use_lse` the program builds, but the RTC is no good as a clock**, only for rough timing. Hover over the object in the editor to see which clock it uses.
- With the crystal, PC14 and PC15 are taken and cannot be GPIO. Packages of 36 pins do not have them, `use_lse` is then a compile error.
- At first power up the crystal takes seconds to start, the program waits for it up to 5 seconds. Without a crystal, or with a broken one, the program goes on but the RTC does not run: `lost()` stays `True` and `set()` does nothing.
- That wait happens during setup. With a watchdog, define it after the `RTC` or use `start=False`, otherwise it may reset the chip while waiting for the crystal.
- A reset does not set up the RTC again, it keeps going and there is no wait for the crystal. The first run after the clock setting changed clears the time and the backup registers.

## Backup registers

Like the RTC, the backup registers keep their data through a reset, and with a battery without power. They suit small data such as calibration values or a count of restarts. For more data, or without a battery, use the [internal flash](flash.md).

Each register has 16 bits, `slot` starts at 1:

| Chip | Registers |
|---|---|
| most STM32F1 | 10 |
| STM32F1 groups xE / xG, F105, F107 | 42 |
| F100 group xE, STM32F4 | 20 |

## Interrupts

- The vector of `on_second` is `RTC`, that of `on_alarm` is `RTC_Alarm`.
- An alarm goes off once. For a repeating one, call `alarm_at` again in the handler.
- Call `alarm_at` before the counter gets there, a time already past does not go off.
- The RTC alarm can wake the chip from `stop()` and `standby()`, see [Low power](power.md).

## Notes

- `set` and `alarm_at` wait for the slow clock of the RTC, about 100 microseconds, also in a handler.
- A program can have only one `RTC` object. For several files to use it, they import the same object.
- A reset does not clear the RTC, so the time keeps going while debugging and flashing new programs.
