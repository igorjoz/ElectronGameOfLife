import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { validateRules, rulePresets } from '../utils/rules';

function SettingsPanel() {
  const { state, actions } = useGame();
  const [tempWidth, setTempWidth] = useState(state.width);
  const [tempHeight, setTempHeight] = useState(state.height);
  const [tempRules, setTempRules] = useState(state.rules);
  const [rulesError, setRulesError] = useState('');
  
  const handleSizeChange = () => {
    const w = Math.max(10, Math.min(1000, parseInt(tempWidth, 10) || 100));
    const h = Math.max(10, Math.min(1000, parseInt(tempHeight, 10) || 100));
    setTempWidth(w);
    setTempHeight(h);
    actions.setBoardSize(w, h);
  };
  
  const handleRulesChange = (e) => {
    const value = e.target.value.toUpperCase();
    setTempRules(value);
    
    if (validateRules(value)) {
      setRulesError('');
      actions.setRules(value);
    } else {
      setRulesError('Invalid format. Use B#/S# (e.g., B3/S23)');
    }
  };
  
  const handlePresetChange = (e) => {
    const preset = rulePresets.find(p => p.rules === e.target.value);
    if (preset) {
      setTempRules(preset.rules);
      setRulesError('');
      actions.setRules(preset.rules);
    }
  };
  
  const handleColorChange = (e) => {
    actions.setCellColor(e.target.value);
  };
  
  const handleShapeChange = (e) => {
    actions.setCellShape(e.target.value);
  };
  
  const handleGridColorChange = (e) => {
    actions.setGridColor(e.target.value);
  };
  
  const handleToggleGrid = () => {
    actions.toggleGrid();
  };
  
  return (
    <div className="panel">
      <h3 className="panel-title">Settings</h3>
      
      {/* Board Size */}
      <div className="form-group">
        <label className="form-label">Board Size</label>
        <div className="inline-form">
          <div className="form-group">
            <input
              type="number"
              className="form-input"
              value={tempWidth}
              onChange={(e) => setTempWidth(e.target.value)}
              min="10"
              max="1000"
              disabled={state.isRunning}
            />
          </div>
          <span className="separator">×</span>
          <div className="form-group">
            <input
              type="number"
              className="form-input"
              value={tempHeight}
              onChange={(e) => setTempHeight(e.target.value)}
              min="10"
              max="1000"
              disabled={state.isRunning}
            />
          </div>
        </div>
        <button 
          className="btn btn-secondary btn-full"
          onClick={handleSizeChange}
          disabled={state.isRunning}
          style={{ marginTop: '8px' }}
        >
          Set Size
        </button>
      </div>
      
      {/* Rules */}
      <div className="form-group">
        <label className="form-label">Rules (B/S Notation)</label>
        <input
          type="text"
          className="form-input"
          value={tempRules}
          onChange={handleRulesChange}
          placeholder="B3/S23"
          disabled={state.isRunning}
        />
        {rulesError && (
          <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
            {rulesError}
          </span>
        )}
      </div>
      
      <div className="form-group">
        <label className="form-label">Rule Presets</label>
        <select
          className="form-select"
          value={state.rules}
          onChange={handlePresetChange}
          disabled={state.isRunning}
        >
          {rulePresets.map(preset => (
            <option key={preset.rules} value={preset.rules}>
              {preset.name} ({preset.rules})
            </option>
          ))}
        </select>
      </div>
      
      {/* Visual Settings */}
      <div className="form-group">
        <label className="form-label">Cell Color</label>
        <div className="color-picker-container">
          <input
            type="color"
            className="color-picker"
            value={state.cellColor}
            onChange={handleColorChange}
          />
          <span>{state.cellColor}</span>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Cell Shape</label>
        <select
          className="form-select"
          value={state.cellShape}
          onChange={handleShapeChange}
        >
          <option value="square">Square</option>
          <option value="circle">Circle</option>
          <option value="diamond">Diamond</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label">Grid Color</label>
        <div className="color-picker-container">
          <input
            type="color"
            className="color-picker"
            value={state.gridColor}
            onChange={handleGridColorChange}
          />
          <button
            className="btn btn-secondary"
            onClick={handleToggleGrid}
            style={{ marginLeft: 'auto' }}
          >
            {state.showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
