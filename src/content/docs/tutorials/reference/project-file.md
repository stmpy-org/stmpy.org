---
title: Project file
sidebar:
  order: 1
---

# Project file

Every project has a `.spp` file (StmPy Project) in TOML format. In StmPy Studio, double-clicking it opens the whole project.

```toml
[project]
chip = "STM32F103C8T6"
entry = "main.py"

[rcc]
use_hse = true
hse_value = 8000000
hse_pll_enable = true
hse_pll_mul = 9

[build]
optimize = "Os"
```

- **The project name is the file name of the `.spp`**: `demo.spp` is the project `demo`, and builds `demo.elf` and `demo.hex`. Do not put a `name` in `[project]`, it is an error.
- **Flash and RAM sizes, the startup file and the linker script all follow from the part number**, they are not written here.
- An unknown key in `[project]` or `[build]` is an error.
- Keys are lower case with underscores between words, except `buildPath`.

## [project]

| Key | Default | Description |
|---|---|---|
| `chip` | required | the part number, see below |
| `entry` | `"main.py"` | the entry file, relative to the directory of the `.spp`. It must define `def main()` |
| `buildPath` | `"build"` | where generated files and build output go, relative to the directory of the `.spp` |

### Part number

Write the full part number printed on the chip, such as `STM32F103C8T6`, in any case.

- The temperature range at the end can be written as `x`, such as `STM32F407ZGTx`.
- The package and the temperature range can both be left out, such as `STM32F103C8`. But when a part comes in several packages that bring out different pins, write the whole number. `STM32F103R8`, for example, comes as LQFP64 and TFBGA64, so write `STM32F103R8T6`.

See [Supported chips](../chips/) for the list.

## [rcc]

The clocks. The whole section can be left out, then the chip runs on its internal high speed clock (8 MHz on F1, 16 MHz on F4). See [Clock configuration](../clock/) for every option.

## [build]

| Key | Default | Description |
|---|---|---|
| `optimize` | `"Os"` | gcc optimization level: `O0`, `O1`, `O2`, `O3`, `Os`, `Og` |
| `debug` | `true` | include debug information (`-g`) |
| `jobs` | `0` | how many files to compile at once, 0 is the number of CPU cores |
| `stack_size` | `0x400` | bytes of RAM kept for the stack, a multiple of 8 |
| `heap_size` | `0x200` | bytes of RAM kept for the heap, a multiple of 8 |
| `c_flags` | `[]` | extra gcc flags, for the generated code only, not for the HAL library |
| `ld_flags` | `[]` | extra linker flags |

When the stack, the heap and the global variables do not fit the RAM, the link fails. The RAM usage printed after a build includes the stack and the heap.
