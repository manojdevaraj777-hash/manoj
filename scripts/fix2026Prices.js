const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'final-player-source.csv');
let raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

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

// The 80 manually-set players (from update2026MarketValues.js)
const manualPlayers = new Set([
  'Vaibhav Suryavanshi','Shubman Gill','Sai Sudharsan','Virat Kohli','Heinrich Klaasen',
  'Ishan Kishan','KL Rahul','Abhishek Sharma','Mitchell Marsh','Jos Buttler',
  'Dhruv Jurel','Prabhsimran Singh','Rajat Patidar','Shreyas Iyer','Cooper Connolly',
  'Kagiso Rabada','Bhuvneshwar Kumar','Jofra Archer','Rashid Khan','Anshul Kamboj',
  'Eshan Malinga','Mohammed Siraj','Kartik Tyagi','Jason Holder','Prasidh Krishna',
  'Sunil Narine','Trent Boult','Arshdeep Singh','Jasprit Bumrah','Mohit Sharma',
  'Varun Chakravarthy','Kuldeep Yadav','Harshal Patel',
  'Quinton de Kock','Ryan Rickelton','Dewald Brevis','Aiden Markram',
  'Sherfane Rutherford','Donovan Ferreira','Sikandar Raza','Marco Jansen',
  'Keshav Maharaj','Anrich Nortje','Jonny Bairstow','Tristan Stubbs',
  'Finn Allen','Jake Fraser-McGurk','David Warner','Haris Rauf',
  'Kusal Mendis','Aaron Hardie','Steve Smith',
  'Rishabh Pant','Sanju Samson','Suryakumar Yadav','Travis Head','Yashasvi Jaiswal',
  'Rohit Sharma','MS Dhoni','Faf du Plessis','Hardik Pandya','Axar Patel',
  'Ravindra Jadeja','Pat Cummins','Mohammed Shami','Ravichandran Ashwin',
  'T. Natarajan','Avesh Khan','Ravi Bishnoi','Mukesh Kumar','Umesh Yadav',
  'Shakib Al Hasan','Mitchell Santner','Mustafizur Rahman','Adam Zampa',
  'Fazalhaq Farooqi','Adam Milne','Rasikh Dar','Prince Yadav'
].map(n => n.trim().toLowerCase()));

function normalize(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
}

let fixed = 0;
let keptManual = 0;
let noChange = 0;

const newRows = rows.map(line => {
  const cols = parseCSV(line);
  const name = (cols[1] || '').trim();
  const nameKey = normalize(name);

  const isManual = manualPlayers.has(nameKey);

  const p25Raw = cols[6];
  const p26Raw = cols[7];
  const p26Num = parseFloat(p26Raw);

  const p25Num = (p25Raw !== 'U' && p25Raw !== 'R' && p25Raw !== '') ? parseFloat(p25Raw) : null;

  let newP26 = p26Num;

  if (isManual) {
    keptManual++;
  } else if (p25Num !== null && p25Num > 0 && p26Num < p25Num * 0.85) {
    newP26 = Math.round(p25Num * 0.8 * 100) / 100;
    fixed++;
  } else {
    noChange++;
  }

  if (newP26 !== p26Num) {
    cols[7] = String(newP26);

    const prices = [cols[2], cols[3], cols[4], cols[5], cols[6], cols[7]]
      .map(p => (p === 'U' || p === 'R') ? null : parseFloat(p))
      .filter(p => p !== null && !isNaN(p));

    if (prices.length > 0) {
      const latestPrice = prices[prices.length - 1];
      const prevPrices = prices.slice(0, -1);

      let newMin, newTarget, newMax;

      if (prevPrices.length > 0) {
        const prevMax = Math.max(...prevPrices);
        newTarget = Math.round((latestPrice * 0.7 + prevMax * 0.3) * 100) / 100;
        newMin = Math.round(Math.min(prevMax * 0.5, latestPrice * 0.6) * 100) / 100;
        newMax = Math.round(Math.max(prevMax * 1.1, latestPrice * 1.25) * 100) / 100;
      } else {
        newTarget = Math.round(latestPrice * 100) / 100;
        newMin = Math.round(latestPrice * 0.7 * 100) / 100;
        newMax = Math.round(latestPrice * 1.3 * 100) / 100;
      }

      cols[13] = String(newMin);
      cols[14] = String(newTarget);
      cols[15] = String(newMax);
    }
  }

  return joinCSV(cols);
});

const output = header + '\n' + newRows.join('\n');
fs.writeFileSync(csvPath, output);

console.log('Manual (kept):', keptManual);
console.log('Fixed (2026 = 80% of 2025):', fixed);
console.log('No change:', noChange);
console.log('Total:', keptManual + fixed + noChange);

const checkNames = ['Venkatesh Iyer','Nicholas Pooran','Ruturaj Gaikwad','Matheesha Pathirana','Rinku Singh','Riyan Parag','T. Natarajan','Mitchell Starc','Rishabh Pant','Shreyas Iyer'];
const outLines = output.trim().split('\n').slice(1);
checkNames.forEach(n => {
  outLines.forEach(r => {
    const c = parseCSV(r);
    if (c[1].toLowerCase().includes(n.toLowerCase())) {
      console.log('\n' + c[1] + ':');
      console.log('  2025:', c[6], '-> 2026:', c[7]);
      console.log('  Min:', c[13], '| Target:', c[14], '| Max:', c[15]);
    }
  });
});
