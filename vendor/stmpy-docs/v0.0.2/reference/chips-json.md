---
title: Chip data format
order: 5
---

# Chip data format

`stmpy chips --json` prints every chip stmpy can build for, with the clock limits of each product line. The chip picker and the clock tree of StmPy Studio read it, so what they show always matches what the installed stmpy can build. Other tools can use it too.

The output has no format version of its own, it follows the version of stmpy (the `version` field).

## Structure

```json
{
  "version": "0.1.0",
  "chips": [ ... ],
  "clock": { "STM32F407": { ... } }
}
```

Frequencies are in Hz. `xxx_range` is `[lowest, highest]`, both included.

## chips

Each element is a chip:

| Field | Example | Description |
|---|---|---|
| `name` | `"STM32F407ZGTx"` | full part number, ready for the `.spp`. The `x` is the temperature range, which the data does not have |
| `family` | `"stm32f4"` | series |
| `line` | `"STM32F407"` | product line, the key of its clock limits in `clock` |
| `package` | `"LQFP144"` | package |
| `pins` | `144` | pin count |
| `flash_kb` | `1024` | flash size |
| `ram_kb` | `128` | RAM size, without CCM |
| `lse` | `true` | whether the package has PC14 and PC15, that is, whether it can take a 32.768 kHz crystal |

## clock

The keys are product lines. `tree` says what the clock tree of the line looks like. A value you do not know comes from a newer stmpy, skip drawing the tree then.

Every line has:

| Field | Description |
|---|---|
| `tree` | `"f1"`, `"f1_connectivity"` or `"f4"` |
| `hsi_hz`, `lsi_hz`, `lse_hz` | internal high speed clock, internal low speed clock (typical), external low speed crystal |
| `hse_range` | range of the external crystal |
| `pll_input_range` | range of the PLL input, after `pll_m` on F4 |
| `max_sysclk`, `max_apb1`, `max_apb2` | limits of SYSCLK, PCLK1 and PCLK2 |
| `flash_latency` | the highest frequency for 0, 1, 2 ... wait states. By SYSCLK on F1, by HCLK on F4 |
| `ahb_div`, `apb_div` | the values `ahb_div`, `apb1_div` and `apb2_div` can take |

`f1` and `f1_connectivity` also have:

| Field | Description |
|---|---|
| `hse_pre_div` | the values `hse_pre_div` can take |
| `pll_mul` | the values `hse_pll_mul` can take, with 6.5 on F105 and F107 |
| `pll_output_range` | range of the PLL output |
| `pll2` | `f1_connectivity` only: `pre_div` and `mul` are the values `pll2_pre_div` and `pll2_mul` can take, `input_range` and `output_range` the input and output ranges of the second PLL |

`f4` also has:

| Field | Description |
|---|---|
| `pll_m_range`, `pll_n_range`, `pll_q_range` | ranges of `pll_m`, `pll_n` and `pll_q` |
| `pll_p` | the values `pll_p` can take |
| `vco_range` | range of the VCO output |
| `min_pll_output` | lowest PLL output after `pll_p` |
| `max_pll_q_output` | highest output after `pll_q` |
| `overdrive_above` | over-drive mode is on above this SYSCLK, 0 when the line has none |
| `max_apb1_overdrive`, `max_apb2_overdrive` | limits of PCLK1 and PCLK2 with over-drive, the same as `max_apb1` and `max_apb2` without it |
| `scales` | a list of `[voltage scale, its SYSCLK limit]`, lowest scale first |

See [Clock configuration](clock.md) for what the settings mean and how they are computed.
