import React from 'react';
import { useGame } from '../context/GameContext';

function StatsPanel() {
  const { state } = useGame();
  
  return (
    <div className="stats-container">
      <div className="stat-item">
        <span className="stat-value">{state.generation}</span>
        <span className="stat-label">Generation</span>
      </div>
      
      <div className="stat-item">
        <span className="stat-value">{state.population}</span>
        <span className="stat-label">Population</span>
      </div>
      
      <div className="stat-item">
        <span className="stat-value" style={{ color: '#4ade80' }}>{state.births}</span>
        <span className="stat-label">Births</span>
      </div>
      
      <div className="stat-item">
        <span className="stat-value" style={{ color: '#f87171' }}>{state.deaths}</span>
        <span className="stat-label">Deaths</span>
      </div>
      
      {state.isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span>Recording ({state.recordedFrames.length})</span>
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
