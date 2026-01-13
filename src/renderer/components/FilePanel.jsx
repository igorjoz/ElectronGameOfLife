import React, { useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { stateToJSON, validateLoadedState, captureCanvas, generateFilename } from '../utils/exportUtils';

function FilePanel() {
  const { state, actions } = useGame();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recordingFramesRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };
  
  const handleSave = async () => {
    if (!window.electronAPI) {
      showMessage('Save is only available in Electron');
      return;
    }
    
    const data = stateToJSON(state);
    const result = await window.electronAPI.saveFile(data, generateFilename('game-state', 'json'));
    
    if (result.success) {
      showMessage('State saved successfully!');
    } else if (!result.canceled) {
      showMessage(`Error: ${result.error}`);
    }
  };
  
  const handleLoad = async () => {
    if (!window.electronAPI) {
      showMessage('Load is only available in Electron');
      return;
    }
    
    const result = await window.electronAPI.loadFile();
    
    if (result.success) {
      const validation = validateLoadedState(result.data);
      if (validation.valid) {
        actions.loadState(result.data);
        showMessage('State loaded successfully!');
      } else {
        showMessage(`Invalid file: ${validation.error}`);
      }
    } else if (!result.canceled) {
      showMessage(`Error: ${result.error}`);
    }
  };
  
  const handleExportImage = async () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      showMessage('Canvas not found');
      return;
    }
    
    if (!window.electronAPI) {
      // Fallback for browser - download directly
      const link = document.createElement('a');
      link.download = generateFilename('game-of-life', 'png');
      link.href = canvas.toDataURL('image/png');
      link.click();
      showMessage('Image downloaded!');
      return;
    }
    
    const dataUrl = captureCanvas(canvas);
    const result = await window.electronAPI.saveImage(dataUrl, generateFilename('game-of-life', 'png'));
    
    if (result.success) {
      showMessage('Image saved successfully!');
    } else if (!result.canceled) {
      showMessage(`Error: ${result.error}`);
    }
  };
  
  const handleStartRecording = () => {
    if (isRecording) return;
    
    setIsRecording(true);
    recordingFramesRef.current = [];
    actions.setRecording(true);
    actions.clearFrames();
    
    // Capture frame every 100ms
    recordingIntervalRef.current = setInterval(() => {
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        const frame = captureCanvas(canvas);
        recordingFramesRef.current.push(frame);
        actions.addFrame(frame);
      }
    }, 100);
    
    showMessage('Recording started...');
  };
  
  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    actions.setRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    const frames = recordingFramesRef.current;
    
    if (frames.length === 0) {
      showMessage('No frames recorded');
      return;
    }
    
    if (!window.electronAPI) {
      showMessage(`Recorded ${frames.length} frames (save not available in browser)`);
      return;
    }
    
    showMessage(`Saving ${frames.length} frames...`);
    
    const result = await window.electronAPI.saveImageSequence(
      frames,
      generateFilename('frame', '').slice(0, -1)
    );
    
    if (result.success) {
      showMessage(`Saved ${result.count} frames to folder!`);
    } else if (!result.canceled) {
      showMessage(`Error: ${result.error}`);
    }
    
    recordingFramesRef.current = [];
    actions.clearFrames();
  };
  
  return (
    <div className="panel">
      <h3 className="panel-title">File</h3>
      
      <div className="btn-group" style={{ marginBottom: '12px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={handleSave}
          disabled={state.isRunning}
        >
          💾 Save
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleLoad}
          disabled={state.isRunning}
        >
          📂 Load
        </button>
      </div>
      
      <div className="btn-group" style={{ marginBottom: '12px' }}>
        <button className="btn btn-secondary" onClick={handleExportImage}>
          🖼 Export PNG
        </button>
      </div>
      
      <div className="btn-group">
        {!isRecording ? (
          <button className="btn btn-primary" onClick={handleStartRecording}>
            ⏺ Record
          </button>
        ) : (
          <button className="btn btn-warning" onClick={handleStopRecording}>
            ⏹ Stop & Save
          </button>
        )}
      </div>
      
      {message && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default FilePanel;
