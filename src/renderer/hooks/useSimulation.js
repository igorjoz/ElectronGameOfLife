import { useRef, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';

export function useSimulation() {
  const { state, actions } = useGame();
  const workerRef = useRef(null);
  const animationRef = useRef(null);
  const lastStepTime = useRef(0);
  const isRunningRef = useRef(state.isRunning);
  const speedRef = useRef(state.speed);
  
  // Keep refs in sync with state
  useEffect(() => {
    isRunningRef.current = state.isRunning;
  }, [state.isRunning]);
  
  useEffect(() => {
    speedRef.current = state.speed;
  }, [state.speed]);
  
  // Initialize worker
  useEffect(() => {
    // Create worker from blob to avoid path issues with Vite
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
        
        cells.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          if (x >= 0 && x < width && y >= 0 && y < height) {
            board[y * width + x] = 1;
          }
        });
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
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);
    
    workerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      
      if (type === 'step-result') {
        actions.stepComplete(data.cells, data.births, data.deaths);
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
  }, [actions]);
  
  // Sync worker with state changes
  useEffect(() => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: 'init',
      data: {
        cells: Array.from(state.cells),
        width: state.width,
        height: state.height,
        birthRules: state.parsedRules.birth,
        survivalRules: state.parsedRules.survival,
      },
    });
  }, [state.width, state.height, state.parsedRules]);
  
  // Update worker cells when cells change and not running
  useEffect(() => {
    if (!workerRef.current || state.isRunning) return;
    
    workerRef.current.postMessage({
      type: 'update-cells',
      data: {
        cells: Array.from(state.cells),
        width: state.width,
        height: state.height,
      },
    });
  }, [state.cells, state.width, state.height, state.isRunning]);
  
  // Animation loop
  useEffect(() => {
    if (!state.isRunning || !workerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    // Sync cells to worker before starting animation
    workerRef.current.postMessage({
      type: 'update-cells',
      data: {
        cells: Array.from(state.cells),
        width: state.width,
        height: state.height,
      },
    });
    
    const animate = (timestamp) => {
      if (!isRunningRef.current || !workerRef.current) return;
      
      const interval = 1000 / speedRef.current;
      
      if (timestamp - lastStepTime.current >= interval) {
        workerRef.current.postMessage({ type: 'step' });
        lastStepTime.current = timestamp;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isRunning]);
  
  // Manual step function
  const step = useCallback(() => {
    if (!workerRef.current) return;
    
    // First sync current cells to worker
    workerRef.current.postMessage({
      type: 'update-cells',
      data: {
        cells: Array.from(state.cells),
        width: state.width,
        height: state.height,
      },
    });
    
    // Then perform step
    setTimeout(() => {
      workerRef.current.postMessage({ type: 'step' });
    }, 10);
  }, [state.cells, state.width, state.height]);
  
  return { step };
}
