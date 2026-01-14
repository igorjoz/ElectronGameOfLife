import React from 'react';
import { useGame } from '../context/GameContext';
import { patterns } from '../utils/patterns';

function PatternsPanel() {
  const { state, actions } = useGame();
  
  const handlePatternSelect = (pattern) => {
    if (state.selectedPattern?.id === pattern.id) {
      // Deselect if clicking same pattern
      actions.selectPattern(null);
    } else {
      actions.selectPattern(pattern);
    }
  };
  
  const handleCancelPlacement = () => {
    actions.selectPattern(null);
  };
  
  return (
    <div className="panel">
      <h3 className="panel-title">Patterns</h3>
      
      {state.selectedPattern && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Click on the board to place the pattern
          </p>
          <button 
            className="btn btn-secondary btn-full"
            onClick={handleCancelPlacement}
          >
            Cancel
          </button>
        </div>
      )}
      
      <div className="pattern-list">
        {patterns.map(pattern => (
          <div
            key={pattern.id}
            className={`pattern-item ${state.selectedPattern?.id === pattern.id ? 'selected' : ''}`}
            onClick={() => handlePatternSelect(pattern)}
          >
            <div className="pattern-name">{pattern.name}</div>
            <div className="pattern-size">
              {pattern.width}×{pattern.height} — {pattern.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatternsPanel;
