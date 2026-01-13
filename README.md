# Electron Game of Life

A full-featured Conway's Game of Life simulator built with Electron and React.

## Features

- **Large Board Support**: Up to 1000×1000 cells with Web Worker for smooth performance
- **Configurable Rules**: B/S notation (e.g., B3/S23 for Conway's rules) with presets
- **Smooth Zoom & Pan**: Mouse wheel zoom, drag to pan
- **Pattern Library**: 6 classic patterns (Glider, Blinker, Pulsar, Gosper Gun, LWSS, Block)
- **Visual Customization**: Cell color, shape (square/circle/diamond), grid toggle
- **Statistics**: Generation count, population, births, deaths
- **File Operations**: Save/load game state to JSON
- **Export**: Single PNG image or frame sequence recording
- **Toroidal Boundary**: Cells wrap around edges

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts Vite dev server and Electron in development mode.

## Build

```bash
npm run build:electron
```

## Controls

| Action | Control |
|--------|---------|
| Toggle cell | Left click |
| Pan view | Right click + drag / Middle click + drag / Shift + Left drag |
| Zoom | Mouse wheel |
| Place pattern | Select pattern, then click on board |

## Keyboard Shortcuts

- **Space**: Start/Stop simulation (when implemented)

## File Format

Game state is saved as JSON:

```json
{
  "version": "1.0",
  "width": 100,
  "height": 100,
  "rules": "B3/S23",
  "generation": 0,
  "cells": ["10,10", "11,10", "12,10"],
  "savedAt": "2026-01-13T12:00:00.000Z"
}
```

## B/S Notation

Rules are specified as `B<digits>/S<digits>`:
- **B**: Number of neighbors required for a cell to be born
- **S**: Number of neighbors required for a cell to survive

Examples:
- `B3/S23` - Conway's Game of Life
- `B36/S23` - HighLife (with replicators)
- `B3678/S34678` - Day & Night

## License

MIT
Game of Life made in Electron
