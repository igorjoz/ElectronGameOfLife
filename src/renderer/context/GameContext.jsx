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

// Action types
const ActionTypes = {
  SET_CELL: 'SET_CELL',
  TOGGLE_CELL: 'TOGGLE_CELL',
  SET_CELLS: 'SET_CELLS',
  CLEAR_BOARD: 'CLEAR_BOARD',
  RANDOMIZE: 'RANDOMIZE',
  SET_RUNNING: 'SET_RUNNING',
  SET_SPEED: 'SET_SPEED',
  SET_GENERATION: 'SET_GENERATION',
  UPDATE_STATS: 'UPDATE_STATS',
  SET_RULES: 'SET_RULES',
  SET_BOARD_SIZE: 'SET_BOARD_SIZE',
  SET_ZOOM: 'SET_ZOOM',
  SET_OFFSET: 'SET_OFFSET',
  SET_CELL_COLOR: 'SET_CELL_COLOR',
  SET_CELL_SHAPE: 'SET_CELL_SHAPE',
  SET_GRID_COLOR: 'SET_GRID_COLOR',
  TOGGLE_GRID: 'TOGGLE_GRID',
  SELECT_PATTERN: 'SELECT_PATTERN',
  PLACE_PATTERN: 'PLACE_PATTERN',
  LOAD_STATE: 'LOAD_STATE',
  SET_RECORDING: 'SET_RECORDING',
  ADD_FRAME: 'ADD_FRAME',
  CLEAR_FRAMES: 'CLEAR_FRAMES',
  STEP_COMPLETE: 'STEP_COMPLETE',
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_CELL: {
      const newCells = new Set(state.cells);
      const key = `${action.x},${action.y}`;
      if (action.alive) {
        newCells.add(key);
      } else {
        newCells.delete(key);
      }
      return { ...state, cells: newCells, population: newCells.size };
    }
    
    case ActionTypes.TOGGLE_CELL: {
      const newCells = new Set(state.cells);
      const key = `${action.x},${action.y}`;
      if (newCells.has(key)) {
        newCells.delete(key);
      } else {
        newCells.add(key);
      }
      return { ...state, cells: newCells, population: newCells.size };
    }
    
    case ActionTypes.SET_CELLS: {
      const newCells = new Set(action.cells);
      return { ...state, cells: newCells, population: newCells.size };
    }
    
    case ActionTypes.CLEAR_BOARD: {
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
    
    case ActionTypes.RANDOMIZE: {
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
    
    case ActionTypes.SET_RUNNING:
      return { ...state, isRunning: action.isRunning };
    
    case ActionTypes.SET_SPEED:
      return { ...state, speed: action.speed };
    
    case ActionTypes.SET_GENERATION:
      return { ...state, generation: action.generation };
    
    case ActionTypes.UPDATE_STATS:
      return {
        ...state,
        generation: action.generation,
        births: state.births + action.births,
        deaths: state.deaths + action.deaths,
        population: action.population,
      };
    
    case ActionTypes.SET_RULES: {
      const parsedRules = parseRules(action.rules);
      return { ...state, rules: action.rules, parsedRules };
    }
    
    case ActionTypes.SET_BOARD_SIZE: {
      // Trim cells that are out of bounds
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
    
    case ActionTypes.SET_ZOOM:
      return { ...state, zoom: Math.max(0.1, Math.min(10, action.zoom)) };
    
    case ActionTypes.SET_OFFSET:
      return { ...state, offsetX: action.offsetX, offsetY: action.offsetY };
    
    case ActionTypes.SET_CELL_COLOR:
      return { ...state, cellColor: action.color };
    
    case ActionTypes.SET_CELL_SHAPE:
      return { ...state, cellShape: action.shape };
    
    case ActionTypes.SET_GRID_COLOR:
      return { ...state, gridColor: action.color };
    
    case ActionTypes.TOGGLE_GRID:
      return { ...state, showGrid: !state.showGrid };
    
    case ActionTypes.SELECT_PATTERN:
      return { ...state, selectedPattern: action.pattern };
    
    case ActionTypes.PLACE_PATTERN: {
      if (!action.pattern) return state;
      
      const newCells = new Set(state.cells);
      action.pattern.cells.forEach(([dx, dy]) => {
        const x = (action.x + dx + state.width) % state.width;
        const y = (action.y + dy + state.height) % state.height;
        newCells.add(`${x},${y}`);
      });
      return { ...state, cells: newCells, population: newCells.size, selectedPattern: null };
    }
    
    case ActionTypes.LOAD_STATE: {
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
    
    case ActionTypes.SET_RECORDING:
      return { ...state, isRecording: action.isRecording };
    
    case ActionTypes.ADD_FRAME:
      return { ...state, recordedFrames: [...state.recordedFrames, action.frame] };
    
    case ActionTypes.CLEAR_FRAMES:
      return { ...state, recordedFrames: [] };
    
    case ActionTypes.STEP_COMPLETE: {
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
          type: ActionTypes.STEP_COMPLETE, 
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
      dispatch({ type: ActionTypes.TOGGLE_CELL, x, y });
    }, []),
    
    setCell: useCallback((x, y, alive) => {
      dispatch({ type: ActionTypes.SET_CELL, x, y, alive });
    }, []),
    
    setCells: useCallback((cells) => {
      dispatch({ type: ActionTypes.SET_CELLS, cells });
    }, []),
    
    clearBoard: useCallback(() => {
      dispatch({ type: ActionTypes.CLEAR_BOARD });
    }, []),
    
    randomize: useCallback((density = 0.3) => {
      dispatch({ type: ActionTypes.RANDOMIZE, density });
    }, []),
    
    setRunning: useCallback((isRunning) => {
      dispatch({ type: ActionTypes.SET_RUNNING, isRunning });
    }, []),
    
    setSpeed: useCallback((speed) => {
      dispatch({ type: ActionTypes.SET_SPEED, speed });
    }, []),
    
    setRules: useCallback((rules) => {
      dispatch({ type: ActionTypes.SET_RULES, rules });
    }, []),
    
    setBoardSize: useCallback((width, height) => {
      dispatch({ type: ActionTypes.SET_BOARD_SIZE, width, height });
    }, []),
    
    setZoom: useCallback((zoom) => {
      dispatch({ type: ActionTypes.SET_ZOOM, zoom });
    }, []),
    
    setOffset: useCallback((offsetX, offsetY) => {
      dispatch({ type: ActionTypes.SET_OFFSET, offsetX, offsetY });
    }, []),
    
    setCellColor: useCallback((color) => {
      dispatch({ type: ActionTypes.SET_CELL_COLOR, color });
    }, []),
    
    setCellShape: useCallback((shape) => {
      dispatch({ type: ActionTypes.SET_CELL_SHAPE, shape });
    }, []),
    
    setGridColor: useCallback((color) => {
      dispatch({ type: ActionTypes.SET_GRID_COLOR, color });
    }, []),
    
    toggleGrid: useCallback(() => {
      dispatch({ type: ActionTypes.TOGGLE_GRID });
    }, []),
    
    selectPattern: useCallback((pattern) => {
      dispatch({ type: ActionTypes.SELECT_PATTERN, pattern });
    }, []),
    
    placePattern: useCallback((x, y, pattern) => {
      dispatch({ type: ActionTypes.PLACE_PATTERN, x, y, pattern });
    }, []),
    
    loadState: useCallback((data) => {
      dispatch({ type: ActionTypes.LOAD_STATE, data });
    }, []),
    
    setRecording: useCallback((isRecording) => {
      dispatch({ type: ActionTypes.SET_RECORDING, isRecording });
    }, []),
    
    addFrame: useCallback((frame) => {
      dispatch({ type: ActionTypes.ADD_FRAME, frame });
    }, []),
    
    clearFrames: useCallback(() => {
      dispatch({ type: ActionTypes.CLEAR_FRAMES });
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
