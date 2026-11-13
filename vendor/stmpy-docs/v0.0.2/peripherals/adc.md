---
title: ADC
order: 7
---

# ADC

The ADC turns the analog voltage on a pin into a number, for potentiometers, battery voltages and analog sensors of all kinds. It has 12 bits, results go from 0 to 4095.

Give the pin, and the compiler finds the ADC and channel on it.

```python
from stmpy import ADC, UART, delay_ms

knob = ADC("PA0")
battery = ADC("PB1", vref_mv=3300)
uart = UART(1)

def main():
    while True:
        uart.write_int(knob.read())        # 0-4095
        uart.write(" ")
        uart.write_int(battery.read_mv())  # millivolts
        uart.write("\n")
        delay_ms(200)
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `pin` | required | analog input pin such as `"PA0"`, or an input inside the chip, see below |
| `vref_mv` | 3300 | reference voltage in millivolts, `read_mv()` uses it. 2400-3600 |
| `sample_us` | 0 | sample time in microseconds, see "Sample time". 0 takes the default |
| `continuous` | `False` | convert continuously in the background, see "Continuous conversion" |

Small packages (48 pins and below) have no separate VREF+ pin, the reference is VDDA, 3.3 V on the Blue Pill.

## Methods

| Method | Description |
|---|---|
| `read() -> int` | convert once and wait for it, 0 (0 V) to 4095 (the reference voltage). With `continuous` the latest value at once |
| `read_mv() -> int` | the same value as `read()`, in millivolts |

## Pins

STM32F103:

| ADC | Pins and channels | Chips |
|---|---|---|
| ADC1 | PA0-PA7: 0-7, PB0: 8, PB1: 9, PC0-PC5: 10-15 | all, PC0-PC5 with 64 pins and up |
| ADC3 | PF6-PF10: 4-8 | xE / xG in 144 pins |

- ADC2 has the pins of ADC1, so only ADC1 is used. ADC3 is for PF6-PF10, which ADC1 does not have.
- Several inputs share an ADC: each `read()` switches to its own channel and then converts, there is no limit on the number of inputs.
- A pin can have only one ADC object, and cannot be a GPIO or PWM output at the same time.

For other chips, completion in the editor and the compile errors are the reference.

## Inputs inside the chip

With `"TEMP"` or `"VREFINT"` as the pin, the input is a signal inside the chip, no pin is taken:

| Written | Input |
|---|---|
| `ADC("TEMP")` | temperature sensor |
| `ADC("VREFINT")` | internal reference voltage, nominally 1.2 V (1.16-1.24 V) |

```python
temp = ADC("TEMP")
vrefint = ADC("VREFINT")

def main():
    # typical values from the STM32F103 datasheet
    celsius = 25 + (1430 - temp.read_mv()) / 4.3
    # VDDA from the internal reference, only when VREF+ is connected to VDDA
    vdda_mv = 1200 * 4095 // vrefint.read()
```

- The temperature sensor shows changes of temperature, not the absolute value: it can be off by 45 °C from chip to chip, calibrate it for accuracy.
- It measures the die, which is warmer than the air around and depends on how much the chip itself heats.
- These inputs need a sample time of at least 17.1 microseconds. Without `sample_us` the compiler picks a long enough one, a shorter `sample_us` is an error.

## Continuous conversion

By default every `read()` waits for a conversion. With `continuous=True` the ADC converts over and over in the background, DMA stores the results in memory without the CPU, and `read()` returns the latest value at once.

```python
from stmpy import ADC, UART, delay_ms

knob = ADC("PA0", continuous=True)
battery = ADC("PB1", continuous=True, sample_us=15)
temp = ADC("TEMP", continuous=True)
uart = UART(1)

def main():
    while True:
        uart.write_int(knob.read())
        uart.write_int(battery.read_mv())
        delay_ms(100)
```

The compiler joins the `continuous` inputs of an ADC into one sequence, converted in the order they are defined, round after round. The example on an STM32F103 at 72 MHz:

| Input | Sample time | One conversion |
|---|---|---|
| `knob` | 55.5 cycles | 5.7 µs |
| `battery` | 239.5 cycles | 21 µs |
| `temp` | 239.5 cycles | 21 µs |
| a round | | 47.7 µs |

Hover over an object in the editor to see the real values.

- **The inputs of one ADC must all be `continuous` or none**, mixing them is a compile error, since background conversion keeps the ADC busy. For both kinds, put the others on another ADC, such as PF6-PF10 on ADC3.
- An ADC takes at most 16 `continuous` inputs.
- The first round is done when the program starts, `read()` gives real values from the start.
- `read()` only reads memory: it works in interrupt handlers, and the main loop and handlers can read at the same time.
- The values of different inputs are not from the same moment, they can be a round apart. This suits taking the latest value at any time, not recording waveforms, since the sampling interval is not fixed.
- Converting all the time takes a little more power than converting on demand.
- The compiler assigns the DMA channel. On STM32F103, ADC1 takes DMA1 channel 1 and ADC3 DMA2 channel 5.

## Sample time

A source with a higher resistance needs a longer sample time, a faster conversion a shorter one. Each input of an ADC can have its own.

`sample_us` takes the shortest sample time of the chip that is at least that long, and longer than the longest is an error. Hover over the object in the editor to see the real value.

| | STM32F1 | STM32F4 |
|---|---|---|
| ADC clock | at most 14 MHz (12 MHz on F100 and F102), 12 MHz at 72 MHz | at most 36 MHz |
| Sample times | 1.5, 7.5, 13.5, 28.5, 41.5, 55.5, 71.5, 239.5 cycles | 3, 15, 28, 56, 84, 112, 144, 480 cycles |
| Default | 55.5 cycles, for a source of up to 50 kΩ | 84 cycles |

On STM32F1 a `read()` takes the sample time plus 12.5 ADC cycles: about 6 microseconds by default at 72 MHz, about 17 at the default 8 MHz.

The ADC calibrates itself once at power up.

## Notes

- `read()` waits for the conversion and works in interrupt handlers. But **do not read inputs of the same ADC from the main loop and from a handler**: a handler interrupting a conversion of the main loop switches the channel, and the main loop gets the value of another channel. With `continuous` this does not happen.
- On STM32F4 the temperature sensor is on channel 16 or 18 depending on the part, `ADC("TEMP")` takes care of it.
