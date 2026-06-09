const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');
let csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

const all2026Players = [
  // ===== IPL 2026 Top Performers =====
  'Vaibhav Suryavanshi', 'Shubman Gill', 'Sai Sudharsan', 'Virat Kohli',
  'Heinrich Klaasen', 'Ishan Kishan', 'KL Rahul', 'Abhishek Sharma',
  'Mitchell Marsh', 'Jos Buttler', 'Dhruv Jurel', 'Prabhsimran Singh',
  'Rajat Patidar', 'Shreyas Iyer', 'Cooper Connolly',
  'Rishabh Pant', 'Sanju Samson', 'Suryakumar Yadav', 'Travis Head',
  'Yashasvi Jaiswal', 'Rohit Sharma', 'MS Dhoni', 'Faf du Plessis',
  'David Warner', 'Nitish Kumar Reddy', 'Riyan Parag', 'Rinku Singh',
  'Tilak Varma', 'Angkrish Raghuvanshi', 'Naman Dhir', 'Priyansh Arya',
  'Kagiso Rabada', 'Bhuvneshwar Kumar', 'Jofra Archer', 'Rashid Khan',
  'Anshul Kamboj', 'Eshan Malinga', 'Mohammed Siraj', 'Rasikh Dar',
  'Kartik Tyagi', 'Jason Holder', 'Prince Yadav', 'Prasidh Krishna',
  'Sunil Narine', 'Trent Boult', 'Jasprit Bumrah', 'Arshdeep Singh',
  'Kuldeep Yadav', 'Varun Chakravarthy', 'Mohit Sharma', 'Hardik Pandya',
  'Axar Patel', 'Ravindra Jadeja', 'Pat Cummins', 'Mohammed Shami',
  'Anrich Nortje', 'Harshal Patel', 'Ravichandran Ashwin', 'Ayush Mhatre',
  'Jamie Overton', 'Lahiru Kumara', 'Robin Minz',
  // ===== PSL 2026 Top Performers =====
  'Babar Azam', 'Kusal Mendis', 'Steve Smith', 'Usman Khan',
  'Fakhar Zaman', 'Aaron Hardie', 'Shadab Khan', 'Sufyan Moqim',
  'Hunain Shah', 'Nahid Rana', 'Richard Gleeson', 'Shaheen Shah Afridi',
  'Sahibzada Farhan', 'Shan Masood', 'Arafat Minhas', 'Zaman Khan',
  'Mohammad Ali', 'Farhan Yousaf',
  // ===== SA20 2026 Top Performers =====
  'Quinton de Kock', 'Ryan Rickelton', 'Dewald Brevis', 'Aiden Markram',
  'Sherfane Rutherford', 'Donovan Ferreira', 'Sikandar Raza', 'Marco Jansen',
  'Ottneil Baartman', 'Keshav Maharaj', 'James Coles', 'Jordan Hermann',
  'Tristan Stubbs', 'Matthew Breetzke', 'Devon Conway', 'Shai Hope',
  'Hardus Viljoen', 'Simon Harmer', 'Nqobani Mokoena', 'Jonny Bairstow',
  // ===== BBL 2025/26 Top Performers =====
  'Finn Allen', 'Haris Rauf', 'Jack Edwards', 'Gurinder Sandhu',
  'Jake Fraser-McGurk', 'David Payne', 'Mitchell Owen', 'Sam Harper',
  'Joel Davies', 'Jack Wildermuth', 'Matt Renshaw', 'Moises Henriques'
];

function normalize(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const found2026 = [];
const remaining = [];

rows.forEach(line => {
  const cols = line.split('\t');
  const name = (cols[1] || '').trim();
  const norm = normalize(name);
  let matched = false;
  for (const t of all2026Players) {
    const tnorm = normalize(t);
    if (norm === tnorm || (norm.includes(tnorm) && tnorm.length > 3) || (tnorm.includes(norm) && norm.length > 3)) {
      matched = true;
      break;
    }
  }
  if (matched) found2026.push(line);
  else remaining.push(line);
});

found2026.sort((a, b) => parseInt(a.split('\t')[0]) - parseInt(b.split('\t')[0]));

const newRows = [...found2026, ...remaining];
const renumbered = newRows.map((line, i) => {
  const cols = line.split('\t');
  cols[0] = String(i + 1);
  // Also increase prices for 2026 performers (first group)
  if (i < found2026.length) {
    const price = parseFloat(cols[4]) || 0;
    // Set minimum 1 Cr for 2026 performers, scale based on their stats
    const matches = parseInt(cols[10]) || 0;
    const runs = parseInt(cols[11]) || 0;
    const wkts = parseInt(cols[12]) || 0;
    const sr = parseFloat(cols[14]) || 0;
    const eco = parseFloat(cols[15]) || 0;
    const form = (cols[9] || '').trim();

    // Price logic based on 2026 performance indicators
    let newPrice = price;
    if (runs > 500 || wkts > 15) newPrice = Math.max(newPrice, 2);
    else if (runs > 300 || wkts > 10) newPrice = Math.max(newPrice, 1.5);
    else if (runs > 100 || wkts > 5) newPrice = Math.max(newPrice, 1);
    else if (form === 'In Demand' || form === 'Elite') newPrice = Math.max(newPrice, 1);
    else newPrice = Math.max(newPrice, 0.75);

    // Form boost for 2026
    if (cols[9] === 'Developing' || cols[9] === 'Emerging') cols[9] = 'In Demand';

    cols[4] = String(newPrice);
  }
  return cols.join('\t');
});

const output = header + '\n' + renumbered.join('\n');
fs.writeFileSync(csvPath, output);
console.log('2026 performers found and moved to top:', found2026.length);
console.log('Total players:', newRows.length);
console.log('First 10:');
renumbered.slice(0, 10).forEach((r, i) => {
  const c = r.split('\t');
  console.log('  #' + (i+1) + ' ' + c[1] + ' | ₹' + c[4] + ' Cr | ' + c[3]);
});
