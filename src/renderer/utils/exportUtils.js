// Export utilities for saving images and state

/**
 * Convert game state to JSON format for saving
 */
export function stateToJSON(state) {
  return {
    version: '1.0',
    width: state.width,
    height: state.height,
    rules: state.rules,
    generation: state.generation,
    cells: Array.from(state.cells),
    savedAt: new Date().toISOString(),
  };
}

/**
 * Validate loaded JSON state
 */
export function validateLoadedState(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }
  
  if (typeof data.width !== 'number' || typeof data.height !== 'number') {
    return { valid: false, error: 'Invalid board dimensions' };
  }
  
  if (data.width < 10 || data.width > 1000 || data.height < 10 || data.height > 1000) {
    return { valid: false, error: 'Board dimensions out of range (10-1000)' };
  }
  
  if (typeof data.rules !== 'string') {
    return { valid: false, error: 'Invalid rules format' };
  }
  
  if (!Array.isArray(data.cells)) {
    return { valid: false, error: 'Invalid cells data' };
  }
  
  return { valid: true };
}

/**
 * Capture canvas as data URL
 */
export function captureCanvas(canvas) {
  return canvas.toDataURL('image/png');
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix, extension) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}
