const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'data', 'final-player-source.csv');
const plPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');

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

// Load all-player-list.csv
const plRaw = fs.readFileSync(plPath, 'utf-8');
const plLines = plRaw.trim().split('\n').slice(1);
const plMap = {};
plLines.forEach(l => {
  const c = l.split('\t');
  if (c.length > 10) {
    plMap[(c[1] || '').trim().toLowerCase()] = {
      basePrice: parseFloat(c[4]) || 0.3,
      form: (c[9] || '').trim(),
      matches: parseInt(c[10]) || 0,
      runs: parseInt(c[11]) || 0,
      wkts: parseInt(c[12]) || 0,
      role: (c[3] || '').trim()
    };
  }
});

// 2026 known performers (estimated auction price based on 2026 T20 performance)
const known2026 = {
  'Vaibhav Suryavanshi': 12, 'Shubman Gill': 16, 'Sai Sudharsan': 10,
  'Virat Kohli': 18, 'Heinrich Klaasen': 16, 'Ishan Kishan': 12,
  'KL Rahul': 14, 'Abhishek Sharma': 10, 'Mitchell Marsh': 12,
  'Jos Buttler': 12, 'Dhruv Jurel': 8, 'Prabhsimran Singh': 6,
  'Rajat Patidar': 8, 'Shreyas Iyer': 12, 'Cooper Connolly': 4,
  'Kagiso Rabada': 14, 'Bhuvneshwar Kumar': 10, 'Jofra Archer': 12,
  'Rashid Khan': 14, 'Anshul Kamboj': 4, 'Eshan Malinga': 6,
  'Mohammed Siraj': 10, 'Rasikh Dar': 3, 'Kartik Tyagi': 3,
  'Jason Holder': 6, 'Prince Yadav': 2, 'Prasidh Krishna': 6,
  'Sunil Narine': 10, 'Trent Boult': 10, 'Arshdeep Singh': 8,
  'Jasprit Bumrah': 16, 'Mohit Sharma': 4, 'Varun Chakravarthy': 6,
  'Kuldeep Yadav': 8, 'Harshal Patel': 5,
  'Quinton de Kock': 10, 'Ryan Rickelton': 6, 'Dewald Brevis': 8,
  'Aiden Markram': 8, 'Sherfane Rutherford': 6, 'Donovan Ferreira': 3,
  'Sikandar Raza': 5, 'Marco Jansen': 8, 'Keshav Maharaj': 5,
  'Anrich Nortje': 8, 'Jonny Bairstow': 8, 'Finn Allen': 6,
  'Jake Fraser-McGurk': 5, 'David Warner': 8, 'Kusal Mendis': 6,
  'Aaron Hardie': 5, 'Steve Smith': 8,
  'Rishabh Pant': 12, 'Sanju Samson': 10, 'Suryakumar Yadav': 12,
  'Travis Head': 10, 'Yashasvi Jaiswal': 10, 'Rohit Sharma': 12,
  'MS Dhoni': 8, 'Faf du Plessis': 6, 'Hardik Pandya': 12,
  'Axar Patel': 8, 'Ravindra Jadeja': 10, 'Pat Cummins': 12,
  'Mohammed Shami': 8, 'Ravichandran Ashwin': 6,
  'Shakib Al Hasan': 5, 'Mitchell Santner': 4, 'Mustafizur Rahman': 5,
  'Adam Zampa': 4, 'Ayush Mhatre': 2, 'Jamie Overton': 2,
  'Lahiru Kumara': 2, 'Robin Minz': 1.5, 'Nitish Kumar Reddy': 6,
  'Riyan Parag': 6, 'Rinku Singh': 5, 'Tilak Varma': 5,
  'Angkrish Raghuvanshi': 3, 'Naman Dhir': 2.5, 'Priyansh Arya': 2
};

function findMatch(name, dict) {
  const n = name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  for (const [k, v] of Object.entries(dict)) {
    const kn = k.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    if (n === kn || (n.includes(kn) && kn.length > 3) || (kn.includes(n) && n.length > 3)) return v;
  }
  return null;
}

const formMult = { Elite: 1.3, Consistent: 1.15, 'In Demand': 1.05, Developing: 0.95, Emerging: 0.85 };
const weights = [1, 2, 3, 4, 5]; // recency weights for 2021-2025

// Read source CSV
const srcRaw = fs.readFileSync(srcPath, 'utf-8');
const srcLines = srcRaw.trim().split('\n');
const header = srcLines[0];
const rows = srcLines.slice(1);

let fromHistory = 0, fromKnown2026 = 0, estimated = 0;

const newRows = rows.map(line => {
  const cols = parseCSV(line);
  const name = (cols[1] || '').trim();
  const nameLower = name.toLowerCase();
  const pl = plMap[nameLower];

  // ===== STEP 1: Determine 2026 Price =====
  let price26 = findMatch(name, known2026);

  if (price26 === null && pl) {
    // Estimate from base price + form + stats
    const fm = formMult[pl.form] || 1.0;
    let est = pl.basePrice * fm;
    if (pl.matches > 20) est *= 1.15;
    if (pl.matches > 50) est *= 1.25;
    if (pl.runs > 500) est *= 1.3;
    if (pl.runs > 1000) est *= 1.5;
    if (pl.wkts > 20) est *= 1.25;
    if (pl.wkts > 50) est *= 1.4;
    price26 = Math.round(Math.max(0.3, est) * 100) / 100;
    estimated++;
  } else if (price26 === null) {
    price26 = 0.3;
    estimated++;
  } else {
    fromKnown2026++;
  }

  // Insert 2026 Price after 2025 Price (index 6)
  cols.splice(7, 0, String(price26));

  // ===== STEP 2: Calculate Min/Target/Max =====
  const rawPrices = [cols[2], cols[3], cols[4], cols[5], cols[6], cols[7]];
  const priceData = rawPrices.map((p, i) => {
    if (p === 'U' || p === 'R') return null;
    const v = parseFloat(p);
    if (isNaN(v) || v === 0) return null;
    // Weight: increasing for recent years + 2026 gets 2x the weight of 2025
    const w = i < 5 ? weights[i] : 40; // 2026 gets weight 40 (dominates)
    return { value: v, weight: w };
  }).filter(x => x !== null);

  let target, minVal, maxVal;

  if (priceData.length > 0) {
    const totalW = priceData.reduce((s, p) => s + p.weight, 0);
    const weightedAvg = priceData.reduce((s, p) => s + p.value * p.weight, 0) / totalW;
    const values = priceData.map(p => p.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);

    target = Math.round(weightedAvg * 100) / 100;
    minVal = Math.round(Math.max(0.2, Math.min(minV, target * 0.65)) * 100) / 100;
    maxVal = Math.round(Math.max(maxV, target * 1.25) * 100) / 100;

    if (priceData.length >= 2) {
      fromHistory++;
    }
  } else {
    target = price26;
    minVal = Math.round(Math.max(0.2, target * 0.6) * 100) / 100;
    maxVal = Math.round(Math.max(target * 1.2, target + 0.5) * 100) / 100;
  }

  // Update Market columns (shifted by 1 due to 2026 insertion)
  cols[13] = String(minVal);   // Market Min
  cols[14] = String(target);   // Market Target
  cols[15] = String(maxVal);   // Market Max

  return joinCSV(cols);
});

// Add 2026 Price to header
const hdr = parseCSV(header);
hdr.splice(7, 0, '2026 Price (Cr)');

const output = joinCSV(hdr) + '\n' + newRows.join('\n');
fs.writeFileSync(srcPath, output);

console.log('From historical data (2021-2025):', fromHistory);
console.log('From known 2026 performance:', fromKnown2026);
console.log('Estimated from form/stats:', estimated);
console.log('Total:', fromHistory + fromKnown2026 + estimated);

// Show key players
const check = ['Rishabh Pant','Virat Kohli','Vaibhav Suryavanshi','Sai Sudharsan','Donovan Ferreira','Ayush Mhatre','Heinrich Klaasen','Kagiso Rabada'];
newRows.forEach(r => {
  const c = parseCSV(r);
  const match = check.find(s => c[1].toLowerCase().includes(s.toLowerCase()));
  if (match) {
    console.log('\n' + c[1] + ': 2026 Price=₹' + c[7] + ' Cr | Target=₹' + c[14] + ' Cr');
  }
});
