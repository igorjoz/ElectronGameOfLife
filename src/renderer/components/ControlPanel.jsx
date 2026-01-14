import React from 'react';
import { useGame } from '../context/GameContext';

function ControlPanel() {
  const { state, actions } = useGame();
  
  const start = () => actions.setRunning(true);
  const stop = () => actions.setRunning(false);
  
  const step = () => {
    if (!state.isRunning) actions.step();
  };
  
  const clear = () => actions.clearBoard();
  const randomize = () => actions.randomize(0.3);
  const onSpeedChange = (e) => actions.setSpeed(parseInt(e.target.value, 10));
  
  const resetView = () => {
    actions.setZoom(1);
    actions.setOffset(0, 0);
  };
  
  return (
    <div className="panel">
      <h3 className="panel-title">Controls</h3>
      
      <div className="btn-group" style={{ marginBottom: '12px' }}>
        {!state.isRunning ? (
          <button className="btn btn-success" onClick={start}>
            Start
          </button>
        ) : (
          <button className="btn btn-warning" onClick={stop}>
            Stop
          </button>
        )}
        
        <button 
          className="btn btn-secondary" 
          onClick={step}
          disabled={state.isRunning}
        >
          Step
        </button>
      </div>
      
      <div className="btn-group" style={{ marginBottom: '12px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={clear}
          disabled={state.isRunning}
        >
          Clear
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={randomize}
          disabled={state.isRunning}
        >
          Random
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
          onChange={onSpeedChange}
        />
        <div className="speed-display">
          <span>1</span>
          <span>30</span>
        </div>
      </div>
      
      <button 
        className="btn btn-secondary btn-full" 
        onClick={resetView}
        style={{ marginTop: '12px' }}
      >
        Reset View
      </button>
    </div>
  );
}

export default ControlPanel;
