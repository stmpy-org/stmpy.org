---
title: Command line
order: 3
---

# Command line

```bash
stmpy build <project.spp> [-o output.hex]
stmpy lsp [project.spp] [--stdio | --port <port>]
stmpy chips [--json]
stmpy version
```

## build

Builds the project into a `.hex` file.

```bash
stmpy build demo.spp
```

- The output goes to `<buildPath>/<project name>.hex`, `-o` writes it elsewhere. Generated C code and intermediate files go to `buildPath` too.
- On success it prints the flash usage, the RAM usage (with stack and heap) and the path of the `.hex` file.
- On failure it prints every error and warning to stderr and exits with 1. The format is that of gcc, `file:line:col: kind: message`, which editors and CI understand.

stmpy does not flash the chip, see [Installation](../getting-started/installation.md) for that.

## lsp

Starts the language server (Language Server Protocol), which gives an editor error checking, completion, hover and go to definition. StmPy Studio uses it, and any editor with LSP support can.

| Option | Description |
|---|---|
| `--stdio` | talk over stdin and stdout, usually what an editor starting it wants |
| `--port <n>` | listen on `127.0.0.1:<n>` |
| neither | listen on `127.0.0.1:2087` |

**Project file**: the `.spp` given on the command line. Without one, in the directory the editor opened: the `.spp` named after the directory, then the only `.spp` in it. With several and none named after the directory, it is an error, give it on the command line.

**Error checking**:

- From the `.spp`, through the entry file, to every module it imports. Files nothing imports are not checked.
- Once when the editor connects, then every time a `.py` or `.spp` file is saved. What is checked is the files as saved, unsaved edits do not count.
- Every error and warning is reported at once, not just the first.
- Errors of the `.spp` itself show in the `.spp`.

**Completion and hover** work on the text in the editor, saved or not:

- Only names StmPy supports are offered. Python functions and modules StmPy does not have do not show up.
- In the string of a pin argument (such as `GPIO("|")` or `UART(1, tx="|")`), completion lists the pins of your chip, each with what it is there, such as `USART1 TX remap 1`, `TIM2_CH2` or `ADC1_IN9`.
- Hovering over a peripheral object shows what it is on the chip: the peripheral and pins, the remap, the real frequency or baud rate (and its error), the DMA channel, the interrupts bound to it. This comes from the last check after a save.

## chips

Lists every chip stmpy can build for: part number, package, flash and RAM.

```bash
stmpy chips
```

`--json` prints JSON with the clock limits of each product line as well, for tools such as StmPy Studio. See [Chip data format](chips-json.md).

## version

Prints the version of stmpy, such as `0.1.0`.

## Environment variables

| Variable | Description |
|---|---|
| `STMPY_TOOLCHAIN` | where `arm-none-eabi-gcc` is, the toolchain's root directory or its `bin` directory. Without it, `PATH` is searched |
| `STMPY_LOG` | log level, warnings and above by default. `info` or `debug` show how stmpy reads the program, on stderr |
