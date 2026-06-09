const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'data', 'final-player-source.csv');
const plPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');

// Parse CSVs
function parseCSV(line) {
  const r = []; let c = '', q = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { q = !q; continue; }
    if (line[i] === ',' && !q) { r.push(c.trim()); c = ''; continue; }
    c += line[i];
  }
  r.push(c.trim());
  return r;
}

function joinCSV(cols) {
  return cols.map(c => {
    if (c.includes(',') || c.includes('"') || c.includes('\n'))
      return '"' + c.replace(/"/g, '""') + '"';
    return c;
  }).join(',');
}

// Load all-player-list.csv for Base Price and Form
const plRaw = fs.readFileSync(plPath, 'utf-8');
const plLines = plRaw.trim().split('\n').slice(1);
const plMap = {};
plLines.forEach(l => {
  const c = l.split('\t');
  if (c.length > 10) {
    const name = (c[1] || '').trim().toLowerCase();
    plMap[name] = {
      basePrice: parseFloat(c[4]) || 0.3,
      form: (c[9] || '').trim(),
      matches: parseInt(c[10]) || 0,
      runs: parseInt(c[11]) || 0,
      wkts: parseInt(c[12]) || 0,
      role: (c[3] || '').trim()
    };
  }
});

// Read final-player-source.csv
const srcRaw = fs.readFileSync(srcPath, 'utf-8');
const srcLines = srcRaw.trim().split('\n');
const header = srcLines[0];
const rows = srcLines.slice(1);

// Form multipliers for estimation
const formMult = { Elite: 1.3, Consistent: 1.15, 'In Demand': 1.05, Developing: 0.95, Emerging: 0.85 };
const roleMult = { Bowler: 0.9, 'All-Rounder': 1.0, Batter: 1.0, Wicketkeeper: 0.95 };

// Recency weights for 2021-2025
const weights = [2021, 2022, 2023, 2024, 2025].map((y, i) => i + 1); // 1,2,3,4,5

let updated = 0, estimated = 0;

const newRows = rows.map((line, idx) => {
  const cols = parseCSV(line);
  const name = (cols[1] || '').trim();
  const nameLower = name.toLowerCase();

  // Collect available prices
  const rawPrices = [cols[2], cols[3], cols[4], cols[5], cols[6]];
  const priceData = rawPrices.map((p, i) => {
    if (p === 'U' || p === 'R') return null;
    const v = parseFloat(p);
    return isNaN(v) ? null : { year: 2021 + i, value: v, weight: weights[i] };
  }).filter(x => x !== null);

  let target, min, max;
  const pl = plMap[nameLower];

  if (priceData.length > 0) {
    // Use historical data with recency weighting
    const totalWeight = priceData.reduce((s, p) => s + p.weight, 0);
    const weightedAvg = priceData.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;

    const prices = priceData.map(p => p.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const latestPrice = priceData[priceData.length - 1].value;
    const latestWeight = priceData[priceData.length - 1].weight;

    // Target: blend of recency-weighted avg and latest price
    target = Math.round((weightedAvg * 0.4 + latestPrice * 0.6) * 100) / 100;

    // Min: 70% of target or min historical price (whichever lower)
    min = Math.round(Math.min(minPrice, target * 0.7) * 100) / 100;

    // Max: 130% of target or max historical price (whichever higher)
    max = Math.round(Math.max(maxPrice, target * 1.3) * 100) / 100;

    updated++;
  } else if (pl) {
    // No historical data - estimate from all-player-list.csv
    estimated++;
    const fm = formMult[pl.form] || 1.0;
    const rm = roleMult[pl.role] || 1.0;

    // Base estimation from base price
    let estimatedPrice = pl.basePrice * fm * rm;

    // Bonus for proven stats
    if (pl.matches > 20) estimatedPrice *= 1.2;
    if (pl.matches > 50) estimatedPrice *= 1.3;
    if (pl.runs > 500) estimatedPrice *= 1.4;
    if (pl.runs > 1000) estimatedPrice *= 1.6;
    if (pl.wkts > 20) estimatedPrice *= 1.3;
    if (pl.wkts > 50) estimatedPrice *= 1.5;

    target = Math.round(Math.max(0.3, estimatedPrice) * 100) / 100;
    min = Math.round(Math.max(0.2, target * 0.6) * 100) / 100;
    max = Math.round(Math.max(target * 1.2, target + 0.5) * 100) / 100;
  } else {
    // No data anywhere - minimum fallback
    estimated++;
    target = 0.3;
    min = 0.2;
    max = 0.5;
  }

  // Update Market Min (col 12), Target (col 13), Max (col 14)
  cols[12] = String(min);
  cols[13] = String(target);
  cols[14] = String(max);

  return joinCSV(cols);
});

const output = header + '\n' + newRows.join('\n');
fs.writeFileSync(srcPath, output);

console.log('Updated from historical data:', updated);
console.log('Estimated from player data:', estimated);
console.log('Total:', updated + estimated);

// Show samples
const samples = ['Rishabh Pant', 'Virat Kohli', 'Donovan Ferreira', 'Vaibhav Suryavanshi', 'Ayush Mhatre'];
newRows.forEach(r => {
  const c = parseCSV(r);
  const match = samples.find(s => c[1].toLowerCase().includes(s.toLowerCase()));
  if (match) {
    console.log('\n' + c[1] + ':');
    console.log('  2021-2025: ' + [c[2],c[3],c[4],c[5],c[6]].join(', '));
    console.log('  Min: ₹' + c[12] + ' Cr | Target: ₹' + c[13] + ' Cr | Max: ₹' + c[14] + ' Cr');
  }
});
