import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';

function BoardCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { state, actions } = useGame();
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Calculate cell size based on zoom
  const baseSize = 10;
  const cellSize = baseSize * state.zoom;
  
  // Get canvas dimensions
  const getCanvasDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    return {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    };
  }, []);
  
  // Convert screen coordinates to cell coordinates
  const screenToCell = useCallback((screenX, screenY) => {
    const { width, height } = getCanvasDimensions();
    const centerX = width / 2;
    const centerY = height / 2;
    
    const worldX = (screenX - centerX) / cellSize + state.offsetX + state.width / 2;
    const worldY = (screenY - centerY) / cellSize + state.offsetY + state.height / 2;
    
    return {
      x: Math.floor(worldX),
      y: Math.floor(worldY),
    };
  }, [cellSize, state.offsetX, state.offsetY, state.width, state.height, getCanvasDimensions]);
  
  // Draw the board
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate visible area
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const startCellX = Math.floor(-centerX / cellSize + state.offsetX + state.width / 2);
    const startCellY = Math.floor(-centerY / cellSize + state.offsetY + state.height / 2);
    const endCellX = Math.ceil(centerX / cellSize + state.offsetX + state.width / 2);
    const endCellY = Math.ceil(centerY / cellSize + state.offsetY + state.height / 2);
    
    // Draw grid if enabled and zoom is sufficient
    if (state.showGrid && cellSize >= 4) {
      ctx.strokeStyle = state.gridColor;
      ctx.lineWidth = 0.5;
      
      for (let x = Math.max(0, startCellX); x <= Math.min(state.width, endCellX); x++) {
        const screenX = centerX + (x - state.width / 2 - state.offsetX) * cellSize;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvasHeight);
        ctx.stroke();
      }
      
      for (let y = Math.max(0, startCellY); y <= Math.min(state.height, endCellY); y++) {
        const screenY = centerY + (y - state.height / 2 - state.offsetY) * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvasWidth, screenY);
        ctx.stroke();
      }
    }
    
    // Draw board boundary
    const boundaryX = centerX + (0 - state.width / 2 - state.offsetX) * cellSize;
    const boundaryY = centerY + (0 - state.height / 2 - state.offsetY) * cellSize;
    const boundaryW = state.width * cellSize;
    const boundaryH = state.height * cellSize;
    
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.strokeRect(boundaryX, boundaryY, boundaryW, boundaryH);
    
    // Draw cells
    ctx.fillStyle = state.cellColor;
    const padding = cellSize > 3 ? 1 : 0;
    
    state.cells.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      
      // Check if cell is visible
      if (x < startCellX - 1 || x > endCellX + 1 || y < startCellY - 1 || y > endCellY + 1) {
        return;
      }
      
      const screenX = centerX + (x - state.width / 2 - state.offsetX) * cellSize + padding;
      const screenY = centerY + (y - state.height / 2 - state.offsetY) * cellSize + padding;
      const size = cellSize - padding * 2;
      
      switch (state.cellShape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(screenX + size / 2, screenY + size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(screenX + size / 2, screenY);
          ctx.lineTo(screenX + size, screenY + size / 2);
          ctx.lineTo(screenX + size / 2, screenY + size);
          ctx.lineTo(screenX, screenY + size / 2);
          ctx.closePath();
          ctx.fill();
          break;
        case 'square':
        default:
          ctx.fillRect(screenX, screenY, size, size);
          break;
      }
    });
    
    // Draw pattern preview if placing
    if (state.selectedPattern) {
      ctx.fillStyle = 'rgba(233, 69, 96, 0.5)';
      ctx.strokeStyle = '#e94560';
      ctx.setLineDash([5, 5]);
      
      const patternWidth = state.selectedPattern.width * cellSize;
      const patternHeight = state.selectedPattern.height * cellSize;
      
      // Show pattern size indicator at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, canvasHeight - 30, 200, 25);
      ctx.fillStyle = '#e94560';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Placing: ${state.selectedPattern.name} (${state.selectedPattern.width}×${state.selectedPattern.height})`, 15, canvasHeight - 12);
      
      ctx.setLineDash([]);
    }
  }, [state, cellSize, getCanvasDimensions]);
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
      draw();
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);
  
  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);
  
  // Handle mouse wheel for zoom - must use native listener for passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = state.zoom * delta;
      actions.setZoom(newZoom);
    };
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [state.zoom, actions]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      // Middle click, right click, or shift+left click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (e.button === 0) {
      // Left click for cell toggle or pattern placement
      const rect = canvasRef.current.getBoundingClientRect();
      const { x, y } = screenToCell(e.clientX - rect.left, e.clientY - rect.top);
      
      if (x >= 0 && x < state.width && y >= 0 && y < state.height) {
        if (state.selectedPattern) {
          actions.placePattern(x, y, state.selectedPattern);
        } else if (!state.isRunning) {
          actions.toggleCell(x, y);
        }
      }
    }
  }, [screenToCell, state.width, state.height, state.selectedPattern, state.isRunning, actions]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x) / cellSize;
      const dy = (e.clientY - panStart.y) / cellSize;
      actions.setOffset(state.offsetX - dx, state.offsetY - dy);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart, cellSize, state.offsetX, state.offsetY, actions]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  // Handle context menu (prevent default)
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);
  
  // Get cursor class
  const getCursorClass = () => {
    if (isPanning) return 'panning';
    if (state.selectedPattern) return 'placing-pattern';
    return '';
  };
  
  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        id="game-canvas"
        className={getCursorClass()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}

export default BoardCanvas;
