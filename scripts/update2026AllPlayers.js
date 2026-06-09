const fs = require('fs');
const path = require('path');

// ===== LOAD DATA =====
const csvPath = path.join(__dirname, '..', 'data', 'final-player-source.csv');
let raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

const playerListPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');
const plRaw = fs.readFileSync(playerListPath, 'utf-8');
const plLines = plRaw.trim().split('\n').slice(1);

// Load Form data from all-player-list.csv
const formMap = {};
plLines.forEach(l => {
  const c = l.split('\t');
  if (c.length > 9) {
    const name = (c[1] || '').trim().toLowerCase();
    formMap[name] = (c[9] || '').trim();
  }
});

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

function joinCSV(cols) {
  return cols.map(c => {
    if (c.includes(',') || c.includes('"') || c.includes('\n')) return '"' + c.replace(/"/g, '""') + '"';
    return c;
  }).join(',');
}

// ===== 2026 PRICES (known performers) =====
const known2026 = {
  // IPL 2026 Top Run Scorers
  'Vaibhav Suryavanshi': 12, 'Shubman Gill': 16, 'Sai Sudharsan': 10,
  'Virat Kohli': 18, 'Heinrich Klaasen': 16, 'Ishan Kishan': 12,
  'KL Rahul': 14, 'Abhishek Sharma': 10, 'Mitchell Marsh': 12,
  'Jos Buttler': 12, 'Dhruv Jurel': 8, 'Prabhsimran Singh': 6,
  'Rajat Patidar': 8, 'Shreyas Iyer': 12, 'Cooper Connolly': 4,

  // IPL 2026 Top Wicket Takers
  'Kagiso Rabada': 14, 'Bhuvneshwar Kumar': 10, 'Jofra Archer': 12,
  'Rashid Khan': 14, 'Anshul Kamboj': 4, 'Eshan Malinga': 6,
  'Mohammed Siraj': 10, 'Rasikh Dar': 3, 'Kartik Tyagi': 3,
  'Jason Holder': 6, 'Prince Yadav': 2, 'Prasidh Krishna': 6,
  'Sunil Narine': 10, 'Trent Boult': 10, 'Arshdeep Singh': 8,
  'Jasprit Bumrah': 16, 'Mohit Sharma': 4, 'Varun Chakravarthy': 6,
  'Kuldeep Yadav': 8, 'Harshal Patel': 5,

  // SA20 2026
  'Quinton de Kock': 10, 'Ryan Rickelton': 6, 'Dewald Brevis': 8,
  'Aiden Markram': 8, 'Sherfane Rutherford': 6, 'Donovan Ferreira': 3,
  'Sikandar Raza': 5, 'Marco Jansen': 8, 'Keshav Maharaj': 5,
  'Anrich Nortje': 8, 'Ottneil Baartman': 3, 'Jonny Bairstow': 8,
  'Matthew Breetzke': 3, 'Tristan Stubbs': 5,

  // BBL 2025/26
  'Finn Allen': 6, 'Jake Fraser-McGurk': 5, 'David Warner': 8,

  // PSL 2026
  'Kusal Mendis': 6, 'Aaron Hardie': 5, 'Steve Smith': 8,

  // Other stars
  'Rishabh Pant': 12, 'Sanju Samson': 10, 'Suryakumar Yadav': 12,
  'Travis Head': 10, 'Yashasvi Jaiswal': 10, 'Rohit Sharma': 12,
  'MS Dhoni': 8, 'Faf du Plessis': 6, 'Hardik Pandya': 12,
  'Axar Patel': 8, 'Ravindra Jadeja': 10, 'Pat Cummins': 12,
  'Mohammed Shami': 8, 'Ravichandran Ashwin': 6,
  'Shakib Al Hasan': 5, 'Mitchell Santner': 4, 'Mustafizur Rahman': 5,
  'Adam Zampa': 4, 'Fazalhaq Farooqi': 3, 'Adam Milne': 3,
  'T. Natarajan': 3, 'Avesh Khan': 4, 'Ravi Bishnoi': 5,
  'Mukesh Kumar': 3, 'Umesh Yadav': 3,
  'Ayush Mhatre': 2, 'Jamie Overton': 2, 'Lahiru Kumara': 2,
  'Robin Minz': 1.5
};

function normalize(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
}

function findMatch(name, dict) {
  const norm = normalize(name);
  for (const [k, v] of Object.entries(dict)) {
    const knorm = normalize(k);
    if (norm === knorm || (norm.includes(knorm) && knorm.length > 3) || (knorm.includes(norm) && norm.length > 3)) {
      return v;
    }
  }
  return null;
}

// ===== PROCESS =====
let added2026Count = 0;
let estimatedCount = 0;

const formMultiplier = { 'Elite': 1.15, 'Consistent': 1.08, 'In Demand': 1.05, 'Developing': 0.98, 'Emerging': 0.92 };

const newRows = rows.map(line => {
  const cols = parseCSV(line);
  const name = (cols[1] || '').trim();

  // Check if known 2026 performer
  let price26 = findMatch(name, known2026);

  if (price26 === null) {
    // Estimate 2026 price from existing data
    estimatedCount++;

    // Get 2025 price, market target, and form
    const price2025 = cols[6] === 'U' || cols[6] === 'R' ? null : parseFloat(cols[6]);
    const marketTarget = parseFloat(cols[13]) || 0;
    const form = formMap[name.toLowerCase()] || 'Emerging';
    const fm = formMultiplier[form] || 1.0;

    if (price2025 !== null) {
      // Was sold in 2025 → apply form modifier
      price26 = Math.round(price2025 * fm * 100) / 100;
    } else if (marketTarget > 0) {
      // Use market target as base
      price26 = Math.round(marketTarget * fm * 100) / 100;
    } else {
      // Fallback: use 2025 column or 0
      price26 = price2025 || 0;
    }

    // Minimum 0.3 Cr for anyone
    price26 = Math.max(0.3, price26);
  } else {
    added2026Count++;
  }

  // Insert 2026 Price after 2025 Price (index 6)
  cols.splice(7, 0, String(price26));

  // Recalculate Market Min/Target/Max
  const prices = [cols[2], cols[3], cols[4], cols[5], cols[6], cols[7]]
    .map(p => p === 'U' || p === 'R' ? null : parseFloat(p))
    .filter(p => p !== null && !isNaN(p));

  if (prices.length > 0) {
    const latestPrice = parseFloat(cols[7]) || 0;
    const prevMax = prices.length > 1 ? Math.max(...prices.slice(0, -1)) : latestPrice;

    const newTarget = Math.round((latestPrice * 0.7 + prevMax * 0.3) * 100) / 100;
    const newMin = Math.round(Math.min(prevMax * 0.5, latestPrice * 0.6) * 100) / 100;
    const newMax = Math.round(Math.max(prevMax * 1.1, latestPrice * 1.25) * 100) / 100;

    cols[13] = String(newMin);
    cols[14] = String(newTarget);
    cols[15] = String(newMax);
  }

  return joinCSV(cols);
});

const newHeader = parseCSV(header);
newHeader.splice(7, 0, '2026 Price (Cr)');

const output = joinCSV(newHeader) + '\n' + newRows.join('\n');
fs.writeFileSync(csvPath, output);

console.log('Known 2026 performers updated:', added2026Count);
console.log('Estimated 2026 prices:', estimatedCount);
console.log('Total:', added2026Count + estimatedCount);

// Show samples
const sample = ['Vaibhav Suryavanshi','Sai Sudharsan','Donovan Ferreira','Rahul Tripathi','Piyush Chawla','Manan Vohra'];
const outRows = output.trim().split('\n').slice(1);
sample.forEach(n => {
  outRows.forEach(r => {
    const c = parseCSV(r);
    if ((c[1]||'').trim().toLowerCase().includes(n.toLowerCase())) {
      console.log('\n' + c[1] + ' → 2026 Price: ₹' + c[7] + ' Cr | Target: ₹' + c[14] + ' Cr');
    }
  });
});
