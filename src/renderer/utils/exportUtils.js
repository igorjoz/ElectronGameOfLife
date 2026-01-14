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

export function validateLoadedState(data) {
  try {
    if (!data || !data.cells || !Array.isArray(data.cells)) {
      return { valid: false, error: 'Missing cells data' };
    }
    
    const w = data.width;
    const h = data.height;
    if (!w || !h || w < 10 || w > 1000 || h < 10 || h > 1000) {
      return { valid: false, error: 'Invalid board size (10-1000)' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Bad file format' };
  }
}

export function captureCanvas(canvas) {
  return canvas.toDataURL('image/png');
}

export function generateFilename(prefix, extension) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}
