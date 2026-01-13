// Pattern definitions for Game of Life
// Each pattern has a name, description, and cells array with [x, y] offsets from origin

export const patterns = [
  {
    id: 'glider',
    name: 'Glider',
    description: 'Classic spaceship that moves diagonally',
    width: 3,
    height: 3,
    cells: [
      [1, 0],
      [2, 1],
      [0, 2], [1, 2], [2, 2],
    ],
  },
  {
    id: 'blinker',
    name: 'Blinker',
    description: 'Period 2 oscillator',
    width: 3,
    height: 1,
    cells: [
      [0, 0], [1, 0], [2, 0],
    ],
  },
  {
    id: 'pulsar',
    name: 'Pulsar',
    description: 'Period 3 oscillator',
    width: 13,
    height: 13,
    cells: [
      // Top section
      [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
      [0, 2], [5, 2], [7, 2], [12, 2],
      [0, 3], [5, 3], [7, 3], [12, 3],
      [0, 4], [5, 4], [7, 4], [12, 4],
      [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
      // Middle section (mirrored)
      [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
      [0, 8], [5, 8], [7, 8], [12, 8],
      [0, 9], [5, 9], [7, 9], [12, 9],
      [0, 10], [5, 10], [7, 10], [12, 10],
      [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
    ],
  },
  {
    id: 'gosper-gun',
    name: 'Gosper Glider Gun',
    description: 'Produces gliders periodically',
    width: 36,
    height: 9,
    cells: [
      // Left square
      [0, 4], [0, 5], [1, 4], [1, 5],
      // Left part
      [10, 4], [10, 5], [10, 6],
      [11, 3], [11, 7],
      [12, 2], [12, 8],
      [13, 2], [13, 8],
      [14, 5],
      [15, 3], [15, 7],
      [16, 4], [16, 5], [16, 6],
      [17, 5],
      // Right part
      [20, 2], [20, 3], [20, 4],
      [21, 2], [21, 3], [21, 4],
      [22, 1], [22, 5],
      [24, 0], [24, 1], [24, 5], [24, 6],
      // Right square
      [34, 2], [34, 3], [35, 2], [35, 3],
    ],
  },
  {
    id: 'lwss',
    name: 'Lightweight Spaceship',
    description: 'Spaceship that moves horizontally',
    width: 5,
    height: 4,
    cells: [
      [1, 0], [4, 0],
      [0, 1],
      [0, 2], [4, 2],
      [0, 3], [1, 3], [2, 3], [3, 3],
    ],
  },
  {
    id: 'block',
    name: 'Block',
    description: 'Stable still life pattern',
    width: 2,
    height: 2,
    cells: [
      [0, 0], [1, 0],
      [0, 1], [1, 1],
    ],
  },
];

export function getPatternById(id) {
  return patterns.find(p => p.id === id);
}
