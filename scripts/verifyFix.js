const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'final-player-source.csv');
let raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.trim().split('\n');

function parseCSV(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; continue; }
    if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += line[i];
  }
  result.push(current.trim());
  return result;
}

const checks = ['Cooper Connolly','Donovan Ferreira','Anshul Kamboj','Steve Smith','Vaibhav Suryavanshi','Heinrich Klaasen','David Warner','Prince Yadav','Rasikh Dar'];

const outLines = lines.slice(1);
checks.forEach(n => {
  outLines.forEach(r => {
    const c = parseCSV(r);
    if (c[1].toLowerCase().includes(n.toLowerCase())) {
      console.log(c[1] + ': 2026=' + c[7] + '  Target=' + c[14] + '  Max=' + c[15]);
    }
  });
});

console.log('\n=== Remaining anomalies (2025 > 2x 2026) ===');
for (let i = 1; i < lines.length; i++) {
  const c = parseCSV(lines[i]);
  const p25 = parseFloat(c[6]);
  const p26 = parseFloat(c[7]);
  if (!isNaN(p25) && !isNaN(p26) && p25 > 2 && p26 < p25 * 0.5) {
    console.log('  ' + c[1] + ': 2025=' + c[6] + ' 2026=' + c[7]);
  }
}

const freq = {};
for (let i = 1; i < lines.length; i++) {
  const c = parseCSV(lines[i]);
  const p = c[7];
  freq[p] = (freq[p] || 0) + 1;
}
console.log('\n=== Price frequencies (top 10) ===');
Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([k,v]) => {
  console.log('  ' + k + ' : ' + v + ' players');
});
