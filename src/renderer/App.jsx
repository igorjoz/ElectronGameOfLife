import React from 'react';
import BoardCanvas from './components/BoardCanvas';
import ControlPanel from './components/ControlPanel';
import SettingsPanel from './components/SettingsPanel';
import StatsPanel from './components/StatsPanel';
import PatternsPanel from './components/PatternsPanel';
import FilePanel from './components/FilePanel';
import { useGame } from './context/GameContext';

function App() {
  const { state } = useGame();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game of Life</h1>
        <StatsPanel />
      </header>
      
      <main className="app-main">
        <aside className="sidebar left-sidebar">
          <ControlPanel />
          <FilePanel />
          <SettingsPanel />
        </aside>
        
        <div className="board-container">
          <BoardCanvas />
        </div>
        
        <aside className="sidebar right-sidebar">
          <PatternsPanel />
        </aside>
      </main>
      
      <footer className="app-footer">
        <span>Rules: {state.rules}</span>
        <span>Board: {state.width}×{state.height}</span>
        <span>Zoom: {Math.round(state.zoom * 100)}%</span>
      </footer>
    </div>
  );
}

export default App;
