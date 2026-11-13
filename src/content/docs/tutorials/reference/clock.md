---
title: Clock configuration
sidebar:
  order: 2
---

# Clock configuration

The clocks are set in the `[rcc]` section of the `.spp`. The whole section can be left out, then the chip runs on its internal high speed clock, HSI: 8 MHz on F1, 16 MHz on F4.

The clock tree page of StmPy Studio edits this same section.

A setting the chip cannot run is a compile error, nothing is adjusted for you. Settings that follow from the clocks, such as the flash wait states, are worked out by the compiler, see "Derived settings" at the end of this page.

> A misspelled key in `[rcc]` is not reported for now, it is ignored. Check the spelling.

## STM32F1

```toml
[rcc]
use_hse = true
hse_value = 8000000
hse_pll_enable = true
hse_pll_mul = 9         # 8 MHz × 9 = 72 MHz
```

| Key | Default | Description |
|---|---|---|
| `use_hse` | `false` | use the external crystal (HSE). With `false` only the internal 8 MHz HSI is used |
| `hse_value` | required with HSE | frequency of the external crystal in Hz |
| `hse_pre_div` | 1 | divider of HSE before the PLL |
| `hse_pll_enable` | `false` | run the system clock from the PLL |
| `hse_pll_mul` | 9 | multiplier of the PLL |
| `use_lse` | `false` | a 32.768 kHz crystal on PC14 and PC15, for the [RTC](../../peripherals/rtc/) |
| `pll2_mul` | unused | F105 and F107 only: multiplier of the second PLL, which then feeds the PLL |
| `pll2_pre_div` | 1 | F105 and F107 only: divider of HSE before the second PLL |
| `ahb_div`, `apb1_div`, `apb2_div` | see below | bus dividers, see "Bus dividers" |

Despite `hse` in their names, `hse_pll_enable` and `hse_pll_mul` also work with `use_hse = false`. The PLL input is then HSI / 2, that is 4 MHz.

### System clock

| `use_hse` | `hse_pll_enable` | SYSCLK |
|---|---|---|
| `false` | `false` | HSI, 8 MHz |
| `false` | `true` | 4 MHz × `hse_pll_mul` |
| `true` | `false` | `hse_value` |
| `true` | `true` | `hse_value` / `hse_pre_div` × `hse_pll_mul` |

With the second PLL, the input of the PLL becomes `hse_value` / `pll2_pre_div` × `pll2_mul` / `hse_pre_div`.

### Limits by product line

From RM0008, RM0041 and the datasheet of each line:

| Line | SYSCLK max | APB1 max | `hse_value` | `hse_pre_div` | `hse_pll_mul` | PLL input | PLL output |
|---|---|---|---|---|---|---|---|
| F100 | 24 MHz | 24 MHz | 4-24 MHz | 1-16 | 2-16 | 1-24 MHz | 16-24 MHz |
| F101 | 36 MHz | 36 MHz | 4-16 MHz | 1, 2 | 2-16 | 1-25 MHz | 16-36 MHz |
| F102 | 48 MHz | 24 MHz | 4-16 MHz | 1, 2 | 2-16 | 1-25 MHz | 16-48 MHz |
| F103 | 72 MHz | 36 MHz | 4-16 MHz | 1, 2 | 2-16 | 1-25 MHz | 16-72 MHz |
| F105, F107 | 72 MHz | 36 MHz | 3-25 MHz | 1-16 | 4-9, 6.5 | 3-12 MHz | 18-72 MHz |

The APB2 limit of F1 is the SYSCLK limit of the line.

For example, `use_hse = false` with `hse_pll_mul = 2` on F103 gives a PLL output of 8 MHz, below the 16 MHz minimum, which is a compile error.

### The second PLL of F105 and F107

F105 and F107 boards often have a 25 MHz crystal, and dividing and multiplying it directly cannot make 72 MHz. The second PLL can: 25 / 5 × 8 = 40 MHz, then 40 / 5 × 9 = 72 MHz.

```toml
[rcc]
use_hse = true
hse_value = 25000000
pll2_pre_div = 5        # the input of the second PLL must be 3-5 MHz
pll2_mul = 8            # 8-14, 16 or 20, the output must be 40-74 MHz
hse_pre_div = 5
hse_pll_enable = true
hse_pll_mul = 9
```

## STM32F4

The PLL of F4 is set differently from F1. `hse_pre_div`, `hse_pll_mul` and `pll2_*` are errors in an F4 project.

```toml
[rcc]
use_hse = true
hse_value = 8000000     # 4-26 MHz
hse_pll_enable = true
pll_m = 8               # input divider, 2-63, the result must be 1-2 MHz
pll_n = 336             # VCO multiplier, 50-432
pll_p = 2               # system clock divider: 2, 4, 6 or 8
pll_q = 7               # divider for USB, SDIO and RNG, 2-15
```

SYSCLK = HSE (or HSI) / `pll_m` × `pll_n` / `pll_p`, and the PLL output must be at least 24 MHz. Without `pll_q`, the smallest divider that keeps its output at most 48 MHz is taken.

`use_lse`, `ahb_div`, `apb1_div` and `apb2_div` work as on F1.

### Limits by product line

| Line | SYSCLK max | APB1 max | APB2 max | VCO | Full speed from an 8 MHz crystal |
|---|---|---|---|---|---|
| F401 | 84 MHz | 42 MHz | 84 MHz | 192-432 MHz | `m=8, n=336, p=4` |
| F405, F407, F415, F417 | 168 MHz | 42 MHz | 84 MHz | 100-432 MHz | `m=8, n=336, p=2` |
| F410, F411, F412, F413, F423 | 100 MHz | 50 MHz | 100 MHz | 100-432 MHz | `m=8, n=200, p=2` |
| F427, F429, F437, F439, F446 | 180 MHz | 45 MHz | 90 MHz | 100-432 MHz | `m=8, n=360, p=2` |
| F469, F479 | 180 MHz | 45 MHz | 90 MHz | 192-432 MHz | `m=8, n=360, p=2` |

On F427, F429, F437, F439, F446, F469 and F479 the compiler turns on over-drive mode when SYSCLK is above 168 MHz. At 168 MHz and below, the APB1 and APB2 limits are 42 and 84 MHz.

## Bus dividers

```toml
[rcc]
ahb_div = 2     # HCLK = SYSCLK / ahb_div: 1, 2, 4, 8, 16, 64, 128, 256 or 512
apb1_div = 2    # PCLK1 = HCLK / apb1_div: 1, 2, 4, 8 or 16
apb2_div = 1    # PCLK2 = HCLK / apb2_div: 1, 2, 4, 8 or 16
```

All three can be left out: `ahb_div` is then 1, and `apb1_div` and `apb2_div` the smallest divider within the limit of the line. A value that is written is used as it is, a result above the limit is a compile error.

- **Timer clocks**: equal to PCLK when the APB is not divided, twice PCLK when it is.
- When HCLK is not a whole number of MHz (such as 4.5 MHz), `delay_us` counts the MHz rounded down, so delays come out short.

A bus divided too far is a compile error for the peripherals that need it:

| Peripheral | Needs |
|---|---|
| I2C | PCLK1 at least 2 MHz up to 100 kHz, 4 MHz above |
| ADC | an ADC clock of at least 0.6 MHz |
| RTC | PCLK1 at least 4 times the RTC clock on F1, not below it on F4 |
| `delay_us` | HCLK at least 1 MHz |
| `Flash` on F4 | HCLK at least 1 MHz |

## Derived settings

These follow from the clocks and are not configured:

- **Flash wait states**: on F1 by SYSCLK, 0 up to 24 MHz, 1 up to 48 MHz and 2 above, none on F100. On F4 by HCLK, for a supply of 2.7-3.6 V.
- **Regulator voltage scale on F4**: the lowest one that is enough for SYSCLK.
- **Over-drive mode on F4**: see above.
- **Prefetch buffer on F1**: the manual wants it on when a bus divider is not 1, `HAL_Init` turns it on.
