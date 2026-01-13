import React from 'react';
import { useGame } from '../context/GameContext';

function ControlPanel() {
  const { state, actions } = useGame();
  
  const handleStart = () => {
    actions.setRunning(true);
  };
  
  const handleStop = () => {
    actions.setRunning(false);
  };
  
  const handleStep = () => {
    if (!state.isRunning) {
      actions.step();
    }
  };
  
  const handleClear = () => {
    actions.clearBoard();
  };
  
  const handleRandomize = () => {
    actions.randomize(0.3);
  };
  
  const handleSpeedChange = (e) => {
    actions.setSpeed(parseInt(e.target.value, 10));
  };
  
  const handleResetView = () => {
    actions.setZoom(1);
    actions.setOffset(0, 0);
  };
  
  return (
    <div className="panel">
      <h3 className="panel-title">Controls</h3>
      
      <div className="btn-group" style={{ marginBottom: '12px' }}>
        {!state.isRunning ? (
          <button className="btn btn-success" onClick={handleStart}>
            ▶ Start
          </button>
        ) : (
          <button className="btn btn-warning" onClick={handleStop}>
            ⏸ Stop
          </button>
        )}
        
        <button 
          className="btn btn-secondary" 
          onClick={handleStep}
          disabled={state.isRunning}
        >
          ⏭ Step
        </button>
      </div>
      
      <div className="btn-group" style={{ marginBottom: '12px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={handleClear}
          disabled={state.isRunning}
        >
          🗑 Clear
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={handleRandomize}
          disabled={state.isRunning}
        >
          🎲 Random
        </button>
      </div>
      
      <div className="form-group">
        <label className="form-label">
          Speed: {state.speed} steps/sec
        </label>
        <input
          type="range"
          className="form-range"
          min="1"
          max="30"
          value={state.speed}
          onChange={handleSpeedChange}
        />
        <div className="speed-display">
          <span>1</span>
          <span>30</span>
        </div>
      </div>
      
      <button 
        className="btn btn-secondary btn-full" 
        onClick={handleResetView}
        style={{ marginTop: '12px' }}
      >
        🔄 Reset View
      </button>
    </div>
  );
}

export default ControlPanel;
