const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');
let csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

// Real 2026 IPL performance data
const topPerformers = {
  // Orange Cap & Top Run Scorers
  'Vaibhav Suryavanshi': { price: '2', form: 'In Demand' },
  'Shubman Gill': { price: '2', form: 'In Demand' },
  'Sai Sudharsan': { price: '2', form: 'In Demand' },
  'Virat Kohli': { price: '2', form: 'In Demand' },
  'Heinrich Klaasen': { price: '2', form: 'In Demand' },
  'Ishan Kishan': { price: '2', form: 'In Demand' },
  'KL Rahul': { price: '2', form: 'In Demand' },
  'Abhishek Sharma': { price: '2', form: 'In Demand' },
  'Mitchell Marsh': { price: '2', form: 'In Demand' },
  'Jos Buttler': { price: '2', form: 'In Demand' },
  'Dhruv Jurel': { price: '1.5', form: 'In Demand' },
  'Prabhsimran Singh': { price: '1.5', form: 'In Demand' },
  'Rajat Patidar': { price: '2', form: 'In Demand' },
  'Shreyas Iyer': { price: '2', form: 'In Demand' },
  'Cooper Connolly': { price: '1.5', form: 'In Demand' },
  'Rishabh Pant': { price: '2', form: 'In Demand' },
  'Sanju Samson': { price: '2', form: 'In Demand' },

  // Purple Cap & Top Wicket Takers
  'Kagiso Rabada': { price: '2', form: 'In Demand' },
  'Bhuvneshwar Kumar': { price: '2', form: 'In Demand' },
  'Jofra Archer': { price: '2', form: 'In Demand' },
  'Rashid Khan': { price: '2', form: 'In Demand' },
  'Anshul Kamboj': { price: '1.5', form: 'Emerging' },
  'Eshan Malinga': { price: '1.5', form: 'In Demand' },
  'Mohammed Siraj': { price: '2', form: 'In Demand' },
  'Rasikh Salam': { price: '1', form: 'In Demand' },
  'Kartik Tyagi': { price: '1', form: 'In Demand' },
  'Jason Holder': { price: '1.5', form: 'In Demand' },
  'Prince Yadav': { price: '0.75', form: 'Emerging' },
  'Prasidh Krishna': { price: '1.5', form: 'In Demand' },
  'Sunil Narine': { price: '2', form: 'In Demand' },
  'Trent Boult': { price: '2', form: 'In Demand' },
  'Ayush Mhatre': { price: '1', form: 'Emerging' },
  'Angkrish Raghuvanshi': { price: '1', form: 'In Demand' },
  'Jamie Overton': { price: '0.75', form: 'In Demand' },
  'Naman Dhir': { price: '1', form: 'In Demand' },
  'Priyansh Arya': { price: '0.75', form: 'Emerging' },
  'Nitish Kumar Reddy': { price: '1.5', form: 'In Demand' },
  'Riyan Parag': { price: '1.5', form: 'In Demand' },
  'Dhruv Jurel': { price: '1.5', form: 'In Demand' },
  'Rinku Singh': { price: '1.5', form: 'In Demand' },
  'Tilak Varma': { price: '1.5', form: 'In Demand' },
  'Yashasvi Jaiswal': { price: '2', form: 'In Demand' },
  'Rasikh Dar': { price: '1', form: 'In Demand' },
  'Anrich Nortje': { price: '1.5', form: 'In Demand' },
  'Mohit Sharma': { price: '1', form: 'In Demand' },
  'Arshdeep Singh': { price: '2', form: 'In Demand' },
  'Harshal Patel': { price: '1.5', form: 'Consistent' },
  'Kuldeep Yadav': { price: '2', form: 'In Demand' },
  'Varun Chakravarthy': { price: '1.5', form: 'Consistent' },
  'Ravindra Jadeja': { price: '2', form: 'In Demand' },
  'Axar Patel': { price: '2', form: 'In Demand' },
  'Hardik Pandya': { price: '2', form: 'In Demand' },
  'Pat Cummins': { price: '2', form: 'In Demand' },
  'Suryakumar Yadav': { price: '2', form: 'In Demand' },
  'Travis Head': { price: '2', form: 'In Demand' },
  'Rohit Sharma': { price: '2', form: 'In Demand' },
  'MS Dhoni': { price: '2', form: 'In Demand' },
  'Ravichandran Ashwin': { price: '1.5', form: 'Consistent' },
  'Jasprit Bumrah': { price: '2', form: 'In Demand' },
  'Mohammed Shami': { price: '2', form: 'In Demand' },
  'David Warner': { price: '1.5', form: 'Consistent' },
  'Faf du Plessis': { price: '1.5', form: 'In Demand' }
};

function parseRow(line) {
  const cols = line.split('\t');
  if (cols.length === 18) cols.splice(5, 0, '');
  return cols;
}

let updated = 0;
let notFound = [];

const newRows = rows.map((line, idx) => {
  const cols = parseRow(line);
  const name = (cols[1] || '').trim();

  // Try exact match first, then partial
  let match = null;
  const exact = Object.keys(topPerformers).find(k => k.toLowerCase() === name.toLowerCase());
  if (exact) match = topPerformers[exact];
  if (!match) {
    const partial = Object.keys(topPerformers).find(k => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase()));
    if (partial) match = topPerformers[partial];
  }

  if (match) {
    cols[4] = match.price;       // Base Price column
    cols[9] = match.form;        // Form column
    updated++;
    return cols.join('\t');
  }

  return line;
});

csv = header + '\n' + newRows.join('\n');
fs.writeFileSync(csvPath, csv);

console.log('Updated', updated, 'players in all-player-list.csv');
