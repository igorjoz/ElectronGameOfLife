// B/S notation: B3/S23 means birth with 3 neighbors, survive with 2-3
export function parseRules(rulesString) {
  const normalized = rulesString.toUpperCase().replace(/\s/g, '');
  const match = normalized.match(/^B(\d*)\/S(\d*)$/);
  
  if (!match) {
    console.warn(`Invalid rules format: ${rulesString}, using Conway rules`);
    return { birth: [3], survival: [2, 3] };
  }
  
  const birth = match[1] ? match[1].split('').map(Number).filter(n => n >= 0 && n <= 8) : [];
  const survival = match[2] ? match[2].split('').map(Number).filter(n => n >= 0 && n <= 8) : [];
  
  return { birth, survival };
}

export function formatRules(birth, survival) {
  const birthStr = birth.sort((a, b) => a - b).join('');
  const survivalStr = survival.sort((a, b) => a - b).join('');
  return `B${birthStr}/S${survivalStr}`;
}

export function validateRules(rulesString) {
  const normalized = rulesString.toUpperCase().replace(/\s/g, '');
  return /^B[0-8]*\/S[0-8]*$/.test(normalized);
}

export const rulePresets = [
  { name: 'Conway (Life)', rules: 'B3/S23', description: 'Classic Game of Life' },
  { name: 'HighLife', rules: 'B36/S23', description: 'Life with replicators' },
  { name: 'Day & Night', rules: 'B3678/S34678', description: 'Symmetric rules' },
  { name: 'Seeds', rules: 'B2/S', description: 'Explosive growth' },
  { name: 'Life without Death', rules: 'B3/S012345678', description: 'Cells never die' },
  { name: 'Diamoeba', rules: 'B35678/S5678', description: 'Creates diamond shapes' },
];
