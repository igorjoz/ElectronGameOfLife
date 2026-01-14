# Game of Life

Conway's Game of Life in Electron + React. Supports large boards (up to 1000x1000), custom rules in B/S notation, and a few classic patterns.

## Quick start

```bash
npm install
npm run dev
```

## Features

- Web Worker for smooth simulation on large boards
- Configurable rules (B/S notation) with presets
- Zoom and pan with mouse
- Save/load state as JSON
- Export frames as PNG

## Controls

- Left click: toggle cell
- Right/middle drag: pan
- Mouse wheel: zoom
- Select a pattern from the panel, then click to place

## B/S notation

Rules like `B3/S23` mean: a cell is born with 3 neighbors, survives with 2 or 3.

Some presets:
- `B3/S23` - Conway's Life
- `B36/S23` - HighLife
- `B3678/S34678` - Day & Night

## TODO

- [ ] RLE pattern import
- [ ] Keyboard shortcuts
- [ ] Better mobile support

## License

MIT
