// Simulation Web Worker for Game of Life
// Handles computation in background thread for large boards

let board = null;
let width = 0;
let height = 0;
let birthRules = [3];
let survivalRules = [2, 3];

// Initialize board from cell list
function initBoard(cells, w, h) {
  width = w;
  height = h;
  board = new Uint8Array(width * height);
  
  cells.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      board[y * width + x] = 1;
    }
  });
}

// Get cell state with toroidal boundary
function getCell(x, y) {
  const nx = ((x % width) + width) % width;
  const ny = ((y % height) + height) % height;
  return board[ny * width + nx];
}

// Count neighbors
function countNeighbors(x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      count += getCell(x + dx, y + dy);
    }
  }
  return count;
}

// Perform one simulation step
function step() {
  const newBoard = new Uint8Array(width * height);
  let births = 0;
  let deaths = 0;
  const aliveCells = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alive = board[idx] === 1;
      const neighbors = countNeighbors(x, y);
      
      let newState = 0;
      
      if (alive) {
        // Cell is alive - check survival
        if (survivalRules.includes(neighbors)) {
          newState = 1;
        } else {
          deaths++;
        }
      } else {
        // Cell is dead - check birth
        if (birthRules.includes(neighbors)) {
          newState = 1;
          births++;
        }
      }
      
      newBoard[idx] = newState;
      if (newState === 1) {
        aliveCells.push(`${x},${y}`);
      }
    }
  }
  
  board = newBoard;
  return { cells: aliveCells, births, deaths };
}

// Message handler
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'init':
      initBoard(data.cells, data.width, data.height);
      birthRules = data.birthRules || [3];
      survivalRules = data.survivalRules || [2, 3];
      self.postMessage({ type: 'ready' });
      break;
      
    case 'step':
      const result = step();
      self.postMessage({ type: 'step-result', data: result });
      break;
      
    case 'set-rules':
      birthRules = data.birthRules || [3];
      survivalRules = data.survivalRules || [2, 3];
      self.postMessage({ type: 'rules-updated' });
      break;
      
    case 'update-cells':
      initBoard(data.cells, data.width, data.height);
      self.postMessage({ type: 'cells-updated' });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};
