const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');
let csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

function parseRow(line) {
  const cols = line.split('\t');
  if (cols.length === 18) cols.splice(5, 0, '');
  while (cols.length < 19) cols.push('');
  return cols;
}

// ============ 1. FIX WRONG DATA ============
const fixes = {
  'Steve Smith': { 15: '7.80' }, // Fix economy
  'Shamar Joseph': { 2: 'West Indies' }, // Fix country
  'Mohammad Siraj': { 9: 'In Demand' }, // Fix form
  'Marcus Stoinis': { 9: 'In Demand' },
  'Ruturaj Gaikwad': { 9: 'Elite' },
  'Andre Russell': { 9: 'Elite' },
  'Kane Williamson': { 9: 'Consistent' },
  'Cameron Green': { 9: 'In Demand' },
  'Piyush Chawla': { 9: 'Consistent' },
  'Manish Pandey': { 9: 'Consistent' },
  'Mayank Agarwal': { 9: 'In Demand' },
  'Jaydev Unadkat': { 9: 'Consistent' },
  'Karun Nair': { 9: 'In Demand' }
};

const priceUpdates = {
  'Rahul Tripathi': '1.5',
  'Prithvi Shaw': '1.5',
  'Deepak Hooda': '1.25',
  'Manish Pandey': '1.5',
  'Piyush Chawla': '1.5',
  'Mayank Agarwal': '1.5',
  'Vijay Shankar': '1',
  'Karn Sharma': '1',
  'Karun Nair': '1',
  'Mahipal Lomror': '0.75',
  'Murugan Ashwin': '0.75',
  'Vaibhav Arora': '1',
  'Yash Thakur': '0.75',
  'Shreyas Gopal': '1',
  'Manan Vohra': '0.75',
  'Jaydev Unadkat': '1.5',
  'Ishant Sharma': '1.25',
  'R. Sai Kishore': '1',
  'Harpreet Brar': '1',
  'Nehal Wadhera': '1',
  'Abdul Samad': '1',
  'Ashutosh Sharma': '0.75',
  'Suyash Sharma': '0.75',
  'Shahbaz Ahamad': '1',
  'Shubham Dubey': '0.75',
  'Anuj Rawat': '0.75',
  'Lungi Ngidi': '1.25',
  'Kuldeep Sen': '0.75',
  'Dushmantha Chameera': '0.75',
  'Shivam Mavi': '1'
};

// Apply fixes and price updates
const fixedRows = rows.map(line => {
  const cols = parseRow(line);
  const name = (cols[1] || '').trim();

  // Fix data errors
  if (fixes[name]) {
    Object.entries(fixes[name]).forEach(([colIdx, val]) => {
      cols[parseInt(colIdx)] = val;
    });
  }

  // Fix prices
  if (priceUpdates[name]) {
    cols[4] = priceUpdates[name];
  }

  return cols.join('\t');
});

// ============ 2. DETERMINE WHO SHOULD BE IN TOP 150 ============
const shouldBeTop150 = new Set();

fixedRows.forEach((line, idx) => {
  const cols = parseRow(line);
  const name = (cols[1] || '').trim();
  const form = (cols[9] || '').trim();
  const matches = parseInt(cols[10]) || 0;
  const runs = parseInt(cols[11]) || 0;
  const wkts = parseInt(cols[12]) || 0;
  const sr = parseFloat(cols[14]) || 0;
  const eco = parseFloat(cols[15]) || 0;

  let reason = '';

  // Elite/Consistent form players
  if (form === 'Elite') reason = 'Elite form';
  else if (form === 'Consistent' && (matches > 15 || runs > 300 || wkts > 10)) reason = 'Consistent form';
  else if (form === 'In Demand') reason = 'In Demand form';

  // High stats players
  if (runs > 1500 && matches > 50) reason = 'Veteran batter 1500+ runs';
  else if (runs > 800 && matches > 30) reason = 'Solid batter 800+ runs';
  else if (wkts > 50 && matches > 30) reason = 'Proven bowler 50+ wkts';
  else if (runs > 500 && wkts > 10) reason = 'Impact all-rounder';
  else if (runs > 300 && sr > 140 && matches > 10) reason = 'High impact batter';
  else if (wkts > 20 && eco < 8 && matches > 15) reason = 'Quality bowler';

  if (reason) shouldBeTop150.add(idx);
});

// ============ 3. REORDER ============
const top150Indices = [];
const remainingIndices = [];

fixedRows.forEach((line, idx) => {
  const cols = parseRow(line);
  const name = (cols[1] || '').trim();

  // Prioritize known 2026 performers first
  const is2026Performer = shouldBeTop150.has(idx) || 
    ['In Demand', 'Elite', 'Consistent'].includes((cols[9] || '').trim());

  if (is2026Performer) top150Indices.push(idx);
  else remainingIndices.push(idx);
});

// Sort top150 by original order
top150Indices.sort((a, b) => a - b);

const reordered = [...top150Indices.map(i => fixedRows[i]), ...remainingIndices.map(i => fixedRows[i])];
const output = reordered.map((line, i) => {
  const cols = parseRow(line);
  cols[0] = String(i + 1);
  return cols.join('\t');
});

fs.writeFileSync(csvPath, header + '\n' + output.join('\n'));
console.log('Done!');
console.log('Top 150 section size:', top150Indices.length);
console.log('Total players:', reordered.length);
