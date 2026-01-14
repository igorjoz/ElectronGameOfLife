import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

// Initial state
const initialState = {
  // Board dimensions
  width: 100,
  height: 100,
  
  // Cell data - using Set for sparse storage (stores "x,y" strings)
  cells: new Set(),
  
  // Simulation state
  isRunning: false,
  generation: 0,
  speed: 10, // steps per second (1-30)
  
  // Statistics
  births: 0,
  deaths: 0,
  population: 0,
  
  // Rules in B/S notation
  rules: 'B3/S23',
  parsedRules: { birth: [3], survival: [2, 3] },
  
  // View state
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  
  // Visual settings
  cellColor: '#e94560',
  cellShape: 'square', // square, circle, diamond
  gridColor: '#333333',
  showGrid: true,
  
  // Pattern placement
  selectedPattern: null,
  
  // Recording
  isRecording: false,
  recordedFrames: [],
};

// Parse B/S notation rules
function parseRules(rulesString) {
  const match = rulesString.match(/^B(\d*)\/S(\d*)$/i);
  if (!match) {
    return { birth: [3], survival: [2, 3] }; // Default Conway rules
  }
  
  const birth = match[1] ? match[1].split('').map(Number) : [];
  const survival = match[2] ? match[2].split('').map(Number) : [];
  
  return { birth, survival };
}



// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case 'set-cell': {
      const newCells = new Set(state.cells);
      const key = `${action.x},${action.y}`;
      if (action.alive) {
        newCells.add(key);
      } else {
        newCells.delete(key);
      }
      return { ...state, cells: newCells, population: newCells.size };
    }
    
    case 'toggle-cell': {
      const newCells = new Set(state.cells);
      const key = `${action.x},${action.y}`;
      if (newCells.has(key)) {
        newCells.delete(key);
      } else {
        newCells.add(key);
      }
      return { ...state, cells: newCells, population: newCells.size };
    }
    
    case 'set-cells': {
      const newCells = new Set(action.cells);
      return { ...state, cells: newCells, population: newCells.size };
    }
    
    case 'clear': {
      return {
        ...state,
        cells: new Set(),
        population: 0,
        generation: 0,
        births: 0,
        deaths: 0,
        isRunning: false,
      };
    }
    
    case 'randomize': {
      const newCells = new Set();
      const density = action.density || 0.3;
      for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
          if (Math.random() < density) {
            newCells.add(`${x},${y}`);
          }
        }
      }
      return {
        ...state,
        cells: newCells,
        population: newCells.size,
        generation: 0,
        births: 0,
        deaths: 0,
      };
    }
    
    case 'set-running':
      return { ...state, isRunning: action.isRunning };
    
    case 'set-speed':
      return { ...state, speed: action.speed };
    
    case 'set-generation':
      return { ...state, generation: action.generation };
    
    case 'update-stats':
      return {
        ...state,
        generation: action.generation,
        births: state.births + action.births,
        deaths: state.deaths + action.deaths,
        population: action.population,
      };
    
    case 'set-rules': {
      const parsedRules = parseRules(action.rules);
      return { ...state, rules: action.rules, parsedRules };
    }
    
    case 'set-board-size': {
      const newCells = new Set();
      state.cells.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        if (x < action.width && y < action.height) {
          newCells.add(key);
        }
      });
      return {
        ...state,
        width: action.width,
        height: action.height,
        cells: newCells,
        population: newCells.size,
      };
    }
    
    case 'set-zoom':
      return { ...state, zoom: Math.max(0.1, Math.min(10, action.zoom)) };
    
    case 'set-offset':
      return { ...state, offsetX: action.offsetX, offsetY: action.offsetY };
    
    case 'set-cell-color':
      return { ...state, cellColor: action.color };
    
    case 'set-cell-shape':
      return { ...state, cellShape: action.shape };
    
    case 'set-grid-color':
      return { ...state, gridColor: action.color };
    
    case 'toggle-grid':
      return { ...state, showGrid: !state.showGrid };
    
    case 'select-pattern':
      return { ...state, selectedPattern: action.pattern };
    
    case 'place-pattern': {
      if (!action.pattern) return state;
      
      const newCells = new Set(state.cells);
      action.pattern.cells.forEach(([dx, dy]) => {
        const x = (action.x + dx + state.width) % state.width;
        const y = (action.y + dy + state.height) % state.height;
        newCells.add(`${x},${y}`);
      });
      return { ...state, cells: newCells, population: newCells.size, selectedPattern: null };
    }
    
    case 'load-state': {
      const { width, height, rules, cells } = action.data;
      const cellSet = new Set(cells);
      const parsedRules = parseRules(rules);
      return {
        ...state,
        width,
        height,
        rules,
        parsedRules,
        cells: cellSet,
        population: cellSet.size,
        generation: action.data.generation || 0,
        births: 0,
        deaths: 0,
        isRunning: false,
      };
    }
    
    case 'set-recording':
      return { ...state, isRecording: action.isRecording };
    
    case 'add-frame':
      return { ...state, recordedFrames: [...state.recordedFrames, action.frame] };
    
    case 'clear-frames':
      return { ...state, recordedFrames: [] };
    
    case 'step-complete': {
      return {
        ...state,
        cells: new Set(action.cells),
        population: action.cells.length,
        generation: state.generation + 1,
        births: state.births + action.births,
        deaths: state.deaths + action.deaths,
      };
    }
    
    default:
      return state;
  }
}

// Worker code as string
const workerCode = `
let board = null;
let width = 0;
let height = 0;
let birthRules = [3];
let survivalRules = [2, 3];

function initBoard(cells, w, h) {
  width = w;
  height = h;
  board = new Uint8Array(width * height);
  
  for (let i = 0; i < cells.length; i++) {
    const key = cells[i];
    const commaIdx = key.indexOf(',');
    const x = parseInt(key.substring(0, commaIdx), 10);
    const y = parseInt(key.substring(commaIdx + 1), 10);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      board[y * width + x] = 1;
    }
  }
}

function getCell(x, y) {
  const nx = ((x % width) + width) % width;
  const ny = ((y % height) + height) % height;
  return board[ny * width + nx];
}

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
        if (survivalRules.includes(neighbors)) {
          newState = 1;
        } else {
          deaths++;
        }
      } else {
        if (birthRules.includes(neighbors)) {
          newState = 1;
          births++;
        }
      }
      
      newBoard[idx] = newState;
      if (newState === 1) {
        aliveCells.push(x + ',' + y);
      }
    }
  }
  
  board = newBoard;
  return { cells: aliveCells, births, deaths };
}

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
  }
};
`;

// Context
const GameContext = createContext(null);

// Provider
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Worker and animation refs
  const workerRef = useRef(null);
  const animationRef = useRef(null);
  const lastStepTime = useRef(0);
  const stateRef = useRef(state);
  
  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // Initialize worker once
  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);
    
    workerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      
      if (type === 'step-result') {
        dispatch({ 
          type: 'step-complete', 
          cells: data.cells, 
          births: data.births, 
          deaths: data.deaths 
        });
      }
    };
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Animation loop - runs when isRunning changes to true
  useEffect(() => {
    if (!state.isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    if (!workerRef.current) return;
    
    // Initialize worker with current cells before starting
    const currentState = stateRef.current;
    workerRef.current.postMessage({
      type: 'init',
      data: {
        cells: Array.from(currentState.cells),
        width: currentState.width,
        height: currentState.height,
        birthRules: currentState.parsedRules.birth,
        survivalRules: currentState.parsedRules.survival,
      },
    });
    
    lastStepTime.current = 0;
    
    const animate = (timestamp) => {
      const currentState = stateRef.current;
      
      if (!currentState.isRunning || !workerRef.current) {
        return;
      }
      
      const interval = 1000 / currentState.speed;
      
      if (lastStepTime.current === 0 || timestamp - lastStepTime.current >= interval) {
        workerRef.current.postMessage({ type: 'step' });
        lastStepTime.current = timestamp;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [state.isRunning]);
  
  // Manual step function
  const doStep = useCallback(() => {
    if (!workerRef.current) return;
    
    const currentState = stateRef.current;
    
    // Initialize worker with current state
    workerRef.current.postMessage({
      type: 'init',
      data: {
        cells: Array.from(currentState.cells),
        width: currentState.width,
        height: currentState.height,
        birthRules: currentState.parsedRules.birth,
        survivalRules: currentState.parsedRules.survival,
      },
    });
    
    // Small delay to ensure init completes, then step
    setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'step' });
      }
    }, 10);
  }, []);
  
  // Action creators
  const actions = {
    toggleCell: useCallback((x, y) => {
      dispatch({ type: 'toggle-cell', x, y });
    }, []),
    
    setCell: useCallback((x, y, alive) => {
      dispatch({ type: 'set-cell', x, y, alive });
    }, []),
    
    setCells: useCallback((cells) => {
      dispatch({ type: 'set-cells', cells });
    }, []),
    
    clearBoard: useCallback(() => {
      dispatch({ type: 'clear' });
    }, []),
    
    randomize: useCallback((density = 0.3) => {
      dispatch({ type: 'randomize', density });
    }, []),
    
    setRunning: useCallback((isRunning) => {
      dispatch({ type: 'set-running', isRunning });
    }, []),
    
    setSpeed: useCallback((speed) => {
      dispatch({ type: 'set-speed', speed });
    }, []),
    
    setRules: useCallback((rules) => {
      dispatch({ type: 'set-rules', rules });
    }, []),
    
    setBoardSize: useCallback((width, height) => {
      dispatch({ type: 'set-board-size', width, height });
    }, []),
    
    setZoom: useCallback((zoom) => {
      dispatch({ type: 'set-zoom', zoom });
    }, []),
    
    setOffset: useCallback((offsetX, offsetY) => {
      dispatch({ type: 'set-offset', offsetX, offsetY });
    }, []),
    
    setCellColor: useCallback((color) => {
      dispatch({ type: 'set-cell-color', color });
    }, []),
    
    setCellShape: useCallback((shape) => {
      dispatch({ type: 'set-cell-shape', shape });
    }, []),
    
    setGridColor: useCallback((color) => {
      dispatch({ type: 'set-grid-color', color });
    }, []),
    
    toggleGrid: useCallback(() => {
      dispatch({ type: 'toggle-grid' });
    }, []),
    
    selectPattern: useCallback((pattern) => {
      dispatch({ type: 'select-pattern', pattern });
    }, []),
    
    placePattern: useCallback((x, y, pattern) => {
      dispatch({ type: 'place-pattern', x, y, pattern });
    }, []),
    
    loadState: useCallback((data) => {
      dispatch({ type: 'load-state', data });
    }, []),
    
    setRecording: useCallback((isRecording) => {
      dispatch({ type: 'set-recording', isRecording });
    }, []),
    
    addFrame: useCallback((frame) => {
      dispatch({ type: 'add-frame', frame });
    }, []),
    
    clearFrames: useCallback(() => {
      dispatch({ type: 'clear-frames' });
    }, []),
    
    step: doStep,
  };
  
  return (
    <GameContext.Provider value={{ state, actions, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
