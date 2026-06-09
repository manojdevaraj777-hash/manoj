const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'final-player-source.csv');
let raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

// CSV parser that handles quoted fields
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
    if (c.includes(',') || c.includes('"') || c.includes('\n')) {
      return '"' + c.replace(/"/g, '""') + '"';
    }
    return c;
  }).join(',');
}

// 2026 estimated auction prices (in Crores)
const price2026 = {
  // ===== IPL 2026 Top Run Scorers =====
  'Vaibhav Suryavanshi': 12,  // Orange Cap, 776 runs, SR 237
  'Shubman Gill': 16,         // 732 runs
  'Sai Sudharsan': 10,        // 722 runs
  'Virat Kohli': 18,          // 675 runs
  'Heinrich Klaasen': 16,     // 624 runs
  'Ishan Kishan': 12,         // 602 runs
  'KL Rahul': 14,             // 593 runs
  'Abhishek Sharma': 10,      // 563 runs
  'Mitchell Marsh': 12,       // 563 runs
  'Jos Buttler': 12,          // 526 runs
  'Dhruv Jurel': 8,           // 515 runs
  'Prabhsimran Singh': 6,     // 510 runs
  'Rajat Patidar': 8,         // 501 runs
  'Shreyas Iyer': 12,         // 498 runs
  'Cooper Connolly': 4,       // 491 runs

  // ===== IPL 2026 Top Wicket Takers =====
  'Kagiso Rabada': 14,        // Purple Cap, 29 wkts
  'Bhuvneshwar Kumar': 10,    // 28 wkts
  'Jofra Archer': 12,         // 25 wkts
  'Rashid Khan': 14,          // 21 wkts
  'Anshul Kamboj': 4,         // 21 wkts
  'Eshan Malinga': 6,         // 20 wkts
  'Mohammed Siraj': 10,       // 19 wkts
  'Rasikh Dar': 3,            // 19 wkts
  'Kartik Tyagi': 3,          // 18 wkts
  'Jason Holder': 6,          // 17 wkts
  'Prince Yadav': 2,          // 16 wkts
  'Prasidh Krishna': 6,       // 16 wkts
  'Sunil Narine': 10,         // consistent T20 legend
  'Trent Boult': 10,          // consistent performer
  'Arshdeep Singh': 8,        // 2026 form
  'Jasprit Bumrah': 16,       // always top
  'Mohit Sharma': 4,          // 2026 form
  'Varun Chakravarthy': 6,    // 2026 form
  'Kuldeep Yadav': 8,         // 2026 form
  'Harshal Patel': 5,         // 2026 form

  // ===== SA20 2026 =====
  'Quinton de Kock': 10,      // SA20 top scorer, 390 runs
  'Ryan Rickelton': 6,        // SA20 337 runs, 2 centuries
  'Dewald Brevis': 8,         // SA20 370 runs, final century
  'Aiden Markram': 8,         // SA20 309 runs
  'Sherfane Rutherford': 6,   // SA20 334 runs, avg 66.8
  'Donovan Ferreira': 3,      // SA20 SR 171
  'Sikandar Raza': 5,         // SA20 15 wkts
  'Marco Jansen': 8,          // SA20 13 wkts, eco 6.49
  'Keshav Maharaj': 5,        // SA20 12 wkts, eco 6.53
  'Anrich Nortje': 8,         // SA20 18 wkts
  'Ottneil Baartman': 3,      // SA20 20 wkts
  'Jonny Bairstow': 8,        // SA20 consistent
  'Matthew Breetzke': 3,      // SA20 final performer
  'Tristan Stubbs': 5,        // SA20 captain, winner

  // ===== BBL 2025/26 =====
  'Finn Allen': 6,            // BBL 466 runs
  'Jake Fraser-McGurk': 5,    // BBL performer
  'David Warner': 8,          // BBL 433 runs
  'Haris Rauf': 5,            // BBL 20 wkts

  // ===== PSL 2026 =====
  'Kusal Mendis': 6,          // PSL 550 runs
  'Aaron Hardie': 5,          // PSL MOT Final
  'Steve Smith': 8,           // PSL 380 runs, SR 161

  // ===== Additional IPL performers =====
  'Rishabh Pant': 12,         // marquee
  'Sanju Samson': 10,         // marquee
  'Suryakumar Yadav': 12,     // top T20 batter
  'Travis Head': 10,          // in form
  'Yashasvi Jaiswal': 10,     // rising star
  'Rohit Sharma': 12,         // legend
  'MS Dhoni': 8,              // legend
  'Faf du Plessis': 6,        // veteran
  'Hardik Pandya': 12,        // all-rounder
  'Axar Patel': 8,            // all-rounder
  'Ravindra Jadeja': 10,      // all-rounder
  'Pat Cummins': 12,          // top fast bowler
  'Mohammed Shami': 8,        // experienced
  'Ravichandran Ashwin': 6,   // experienced
  'T. Natarajan': 3,          // 2026 form
  'Avesh Khan': 4,            // 2026 form
  'Ravi Bishnoi': 5,          // 2026 form
  'Mukesh Kumar': 3,          // 2026 form
  'Umesh Yadav': 3,           // veteran
  'Shakib Al Hasan': 5,       // legend all-rounder
  'Mitchell Santner': 4,      // 2026 form
  'Mustafizur Rahman': 5,     // experienced
  'Adam Zampa': 4,            // 2026 form
  'Fazalhaq Farooqi': 3,      // 2026 form
  'Adam Milne': 3,            // 2026 form
};

function normalize(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
}

let updated = 0;

const newRows = rows.map(line => {
  const cols = parseCSV(line);
  const name = (cols[1] || '').trim();

  // Find matching 2026 price
  let price26 = null;
  for (const [k, v] of Object.entries(price2026)) {
    const a = normalize(name);
    const b = normalize(k);
    if (a === b || (a.includes(b) && b.length > 3) || (b.includes(a) && a.length > 3)) {
      price26 = v;
      break;
    }
  }

  if (price26 !== null) {
    cols.splice(7, 0, String(price26)); // Insert 2026 Price after 2025 Price (col 6)
    // Update header was already done
    updated++;

    // Recalculate Market Min/Target/Max based on 2026 price
    // Previous market columns are now at different positions after insertion
    // After insertion: 2026 Price is at index 7
    // Market Min was at 12, now at 13
    // Market Target was at 13, now at 14
    // Market Max was at 14, now at 15

    // Collect all prices (2021-2026) for recalc
    const prices = [cols[2], cols[3], cols[4], cols[5], cols[6], cols[7]]
      .map(p => p === 'U' || p === 'R' ? null : parseFloat(p))
      .filter(p => p !== null && !isNaN(p));

    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Market Min = slightly below min or avg*0.7
      // Market Target = weighted avg with 2026 getting 40% weight
      // Market Max = slightly above max or avg*1.3

      const latestPrice = parseFloat(cols[7]) || avg;
      const prevPrices = prices.slice(0, -1);

      let newMin, newTarget, newMax;

      if (prevPrices.length > 0) {
        const prevMax = Math.max(...prevPrices);

        // Weight: 2026 gets 70%, previous max gets 30%
        newTarget = Math.round((latestPrice * 0.7 + prevMax * 0.3) * 100) / 100;
        newMin = Math.round(Math.min(prevMax * 0.5, latestPrice * 0.6) * 100) / 100;
        newMax = Math.round(Math.max(prevMax * 1.1, latestPrice * 1.25) * 100) / 100;
      } else {
        // Only 2026 price exists (new player)
        newTarget = Math.round(latestPrice * 100) / 100;
        newMin = Math.round(latestPrice * 0.7 * 100) / 100;
        newMax = Math.round(latestPrice * 1.3 * 100) / 100;
      }

      // Update market columns (shifted by 1 due to insertion)
      cols[13] = String(newMin);   // Market Min
      cols[14] = String(newTarget); // Market Target
      cols[15] = String(newMax);   // Market Max
    }
  }

  return joinCSV(cols);
});

// Add 2026 Price to header
const newHeader = header.split(',');
newHeader.splice(7, 0, '2026 Price (Cr)'); // Insert after 2025 Price
const output = joinCSV(newHeader) + '\n' + newRows.join('\n');
fs.writeFileSync(csvPath, output);

console.log('Updated', updated, 'players with 2026 prices');
console.log('New column added: 2026 Price (Cr)');

// Show examples
const check = ['Vaibhav Suryavanshi','Sai Sudharsan','Donovan Ferreira','Heinrich Klaasen','Kagiso Rabada','Finn Allen','Kusal Mendis','Rishabh Pant'];
const outRows = output.trim().split('\n').slice(1);
check.forEach(n => {
  outRows.forEach(r => {
    const c = parseCSV(r);
    if ((c[1]||'').trim().toLowerCase().includes(n.toLowerCase())) {
      console.log('\\n' + c[1] + ':');
      console.log('  2021-2025:', c[2], c[3], c[4], c[5], c[6]);
      console.log('  2026 Price:', c[7]);
      console.log('  Market Min:', c[13], '| Target:', c[14], '| Max:', c[15]);
    }
  });
});
