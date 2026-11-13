---
title: Low power
sidebar:
  order: 16
---

# Low power

Saves power while the chip has nothing to do. There are three levels, and the more power one saves, the more it costs to wake up:

| Method | What stops | Rough current | After waking | Woken by |
|---|---|---|---|---|
| `sleep()` | the CPU | about half of running, depends on the clocks | goes on with the next line | any interrupt |
| `stop()` | the CPU and all fast clocks | tens of µA | goes on with the next line | GPIO `on_edge`, RTC `on_alarm` |
| `standby()` | everything but the backup domain | a few µA | **the program starts over** | a rising edge on PA0, the RTC alarm, the reset pin, the independent watchdog |

The currents are rough values from the datasheet. A whole board also draws for its regulator, LEDs and other parts.

## Usage

Sleep until a button is pressed:

```python
from stmpy import GPIO, Mode, Pull, Edge, Power

power = Power()
key = GPIO("PA1", Mode.INPUT, pull=Pull.UP)
pressed: bool = False

@key.on_edge(Edge.FALLING)
def on_key():
    global pressed
    pressed = True

def main():
    global pressed
    while True:
        power.stop()            # goes on when the button is pressed
        if pressed:
            pressed = False
            handle_key()
```

Wake up now and then to do some work, and be off the rest of the time:

```python
from stmpy import Power, RTC

power = Power()
rtc = RTC()

def main():
    measure_and_send()
    rtc.alarm_at(rtc.now() + 60)
    power.standby()             # does not return, the program starts over in 60 seconds
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `wake_pin` | `False` | a rising edge on PA0 ends `standby()`. PA0 cannot be used for anything else then, the hardware makes it an input with a pull-down |

## Methods

| Method | Description |
|---|---|
| `sleep()` | stop the CPU until any interrupt |
| `stop()` | stop the CPU and the clocks until a GPIO `on_edge` or an RTC `on_alarm` |
| `standby()` | power off, does not return |
| `woke_from_standby() -> bool` | whether this start came from `standby()`. Reading clears it, a second read is `False` |

## Checks at compile time

When nothing can wake the chip, the program would stop forever, so these are compile errors:

| Written | Result |
|---|---|
| `sleep()` in a program without any interrupt handler | error |
| `stop()` without a GPIO `on_edge` or an RTC `on_alarm` | error. Timers and UARTs do not run during `stop`, they cannot wake it |
| any of the three in an interrupt handler | error |

`standby()` is not checked, the reset pin can always wake it.

## What each level keeps

| | `sleep` | `stop` | `standby` |
|---|---|---|---|
| RAM and global variables | kept | kept | **lost** |
| peripheral setup | kept | kept | **lost** |
| timers, PWM, UART, DMA | keep running | **stand still** | off |
| RTC and backup registers | keep going | keep going | keep going |
| independent watchdog IWDG | keeps going | **keeps going** | **keeps going** |
| `ticks_ms` | stands still | stands still | starts over |

- **With an `IWDG`, wake up in time to feed it, or the chip resets**, during `stop` and `standby` too, since a started watchdog cannot be stopped. To sleep long, do not use an `IWDG`, or wake up by RTC alarm to feed it.
- Timers keep running during `sleep`, and their interrupts wake it. To save power with `sleep`, do not leave fast interrupts running that you do not need.
- Before `stop`, wait for sends to finish, such as until `uart.busy()` is `False`. With the clocks stopped, a half finished send gets stuck and only goes on after waking.
- When waking from `stop`, the compiler restores the clocks before the handler runs, so baud rates are right. Restoring waits for the crystal to start, which adds a few milliseconds.
- `ticks_ms` does not count during `sleep` and `stop`, it does not know how long the chip slept. Use the RTC for time.
- After `standby` every pin is back in its reset state, the parts on the board must be fine with that. Keep data that has to survive in the backup registers of the RTC or in the [internal flash](../flash/).

## Debugging and flashing

**`stop` and `standby` disconnect the debugger, and a chip in low power cannot be flashed.** When a program goes into `standby` right after power up, flashing a new program gets hard:

- Hold the reset button while flashing, or use the "connect under reset" option of the flashing tool.
- During development, wait a few seconds with `delay_ms` at the start of the program before going into low power.

`sleep` does not affect debugging.

## Notes

- A program can have only one `Power` object. For several files to use it, they import the same object.
- An interrupt that comes between checking a flag and calling `sleep` or `stop` does not wake the chip, the next interrupt does. In the button example, a press right after the `if` and before `stop` is handled only at the next press.
- PA0 as the wake pin needs a rising edge, the signal must go from low to high.
