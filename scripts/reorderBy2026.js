const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'all-player-list.csv');
let csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split('\n');
const header = lines[0];
const rows = lines.slice(1);

const top2026 = [
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
  'Jamie Overton', 'Lahiru Kumara', 'Robin Minz'
];

function normalize(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const topSet = new Set();
const topRows = [];
const remainingRows = [];

rows.forEach(line => {
  const cols = line.split('\t');
  const name = (cols[1] || '').trim();
  let isTop = false;
  for (const t of top2026) {
    const a = normalize(name);
    const b = normalize(t);
    if (a === b || (a.includes(b) && b.length > 3) || (b.includes(a) && a.length > 3)) {
      isTop = true;
      topSet.add(t);
      break;
    }
  }
  if (isTop) topRows.push(line);
  else remainingRows.push(line);
});

topRows.sort((a, b) => {
  const aNo = parseInt(a.split('\t')[0]);
  const bNo = parseInt(b.split('\t')[0]);
  return aNo - bNo;
});

const newRows = [...topRows, ...remainingRows];
const renumbered = newRows.map((line, i) => {
  const cols = line.split('\t');
  cols[0] = String(i + 1);
  return cols.join('\t');
});

const output = header + '\n' + renumbered.join('\n');
fs.writeFileSync(csvPath, output);
console.log('Total 2026 performers found and moved to top:', topSet.size);
console.log('Total players:', newRows.length);
