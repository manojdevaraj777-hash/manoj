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

// 1. Apply all fixes first
const fixes = {
  'Steve Smith': { 15: '7.80' },
  'Shamar Joseph': { 2: 'West Indies' },
  'Mohammad Siraj': { 9: 'In Demand' },
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
  'Rahul Tripathi': '1.5', 'Prithvi Shaw': '1.5', 'Deepak Hooda': '1.25',
  'Manish Pandey': '1.5', 'Piyush Chawla': '1.5', 'Mayank Agarwal': '1.5',
  'Vijay Shankar': '1', 'Karn Sharma': '1', 'Karun Nair': '1',
  'Vaibhav Arora': '1', 'Shreyas Gopal': '1', 'Jaydev Unadkat': '1.5',
  'Ishant Sharma': '1.25', 'R. Sai Kishore': '1', 'Harpreet Brar': '1',
  'Nehal Wadhera': '1', 'Abdul Samad': '1', 'Shahbaz Ahamad': '1',
  'Shivam Mavi': '1', 'Washington Sundar': '1.25', 'Kuldeep Sen': '0.75',
  'Lungi Ngidi': '1.25', 'Shakib Al Hasan': '1.5', 'T. Natarajan': '1',
  'Umesh Yadav': '1.5', 'Mohit Sharma': '1.25', 'Krunal Pandya': '1.5',
  'Harshal Patel': '1.5', 'Avesh Khan': '1.5', 'Ravi Bishnoi': '1.5',
  'Mukesh Kumar': '1.25', 'Sandeep Warrier': '0.75'
};

const fixedRows = rows.map(line => {
  const cols = parseRow(line);
  const name = (cols[1] || '').trim();
  if (fixes[name]) Object.entries(fixes[name]).forEach(([i, v]) => cols[parseInt(i)] = v);
  if (priceUpdates[name]) cols[4] = priceUpdates[name];
  return cols.join('\t');
});

// Players who performed well in 2026 T20 tournaments (must be top 150)
const forcedTop150 = [
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
  'Quinton de Kock', 'Ryan Rickelton', 'Dewald Brevis', 'Aiden Markram',
  'Sherfane Rutherford', 'Donovan Ferreira', 'Sikandar Raza', 'Marco Jansen',
  'Keshav Maharaj', 'James Coles', 'Jonny Bairstow',
  'Finn Allen', 'Jake Fraser-McGurk', 'Aaron Hardie',
  'Kusal Mendis', 'Steve Smith',
  'Shakib Al Hasan', 'Mitchell Santner', 'Mustafizur Rahman', 'Adam Zampa',
  'Rahul Tripathi', 'Prithvi Shaw', 'Deepak Hooda', 'Manish Pandey',
  'Piyush Chawla', 'Mayank Agarwal', 'Vijay Shankar', 'Karn Sharma',
  'Karun Nair', 'Shahbaz Ahamad', 'Nehal Wadhera', 'Abdul Samad',
  'Shubham Dubey', 'Rachin Ravindra', 'Harpreet Brar', 'Ashutosh Sharma',
  'Chetan Sakariya', 'Gerald Coetzee', 'Nuwan Thushara', 'Fazalhaq Farooqi',
  'Adam Milne', 'Azmatullah Omarzai', 'Anuj Rawat', 'Daniel Sams',
  'Nathan Ellis', 'Glenn Phillips', 'Lungi Ngidi', 'Jayant Yadav',
  'Kuldeep Sen', 'Dushmantha Chameera', 'Atharva Taide', 'Mukesh Choudhary',
  'Suyash Sharma', 'Vaibhav Arora', 'Yash Thakur', 'Shreyas Gopal',
  'Washington Sundar', 'T. Natarajan', 'Umesh Yadav', 'Krunal Pandya',
  'Avesh Khan', 'Ravi Bishnoi', 'Mukesh Kumar', 'Mahipal Lomror',
  'Murugan Ashwin', 'Shivam Mavi', 'Sarfaraz Khan', 'Manan Vohra',
  'Ishant Sharma', 'R. Sai Kishore', 'Sam Billings', 'Mohammad Nabi',
  'Evin Lewis', 'Tim Southee', 'Jaydev Unadkat', 'Kane Williamson',
  'Cameron Green', 'Marcus Stoinis'
];

function isInList(name, list) {
  const norm = name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  return list.some(x => {
    const xn = x.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
    return norm === xn || norm.includes(xn) || xn.includes(norm);
  });
}

// 2. Score each player for ranking priority
function calcScore(line, isForced) {
  const c = parseRow(line);
  const matches = parseInt(c[10]) || 0;
  const runs = parseInt(c[11]) || 0;
  const wkts = parseInt(c[12]) || 0;
  const sr = parseFloat(c[14]) || 0;
  const avg = parseFloat(c[13]) || 0;
  const eco = parseFloat(c[15]) || 0;
  const form = (c[9] || '').trim();

  const formScores = { 'Elite': 50, 'Consistent': 35, 'In Demand': 25, 'Developing': 10, 'Emerging': 0 };
  let score = formScores[form] || 0;

  if (isForced) score += 200;

  if (runs > 2000) score += 50;
  else if (runs > 1000) score += 35;
  else if (runs > 500) score += 20;
  else if (runs > 200) score += 10;
  else if (runs > 0) score += 5;

  if (wkts > 100) score += 50;
  else if (wkts > 50) score += 35;
  else if (wkts > 20) score += 20;
  else if (wkts > 10) score += 10;
  else if (wkts > 0) score += 5;

  if (matches > 100) score += 30;
  else if (matches > 50) score += 20;
  else if (matches > 20) score += 10;
  else if (matches > 10) score += 5;

  if (sr > 150 && runs > 200) score += 15;
  if (eco > 0 && eco < 7.5 && wkts > 20) score += 15;
  if (avg > 35 && runs > 500) score += 10;

  if (matches === 0) score -= 15;
  if (matches > 0 && matches < 5 && runs < 50 && wkts < 3) score -= 10;

  return score;
}

// Create scored entries
const scored = fixedRows.map((line, idx) => {
  const c = parseRow(line);
  const name = (c[1] || '').trim();
  const isForced = isInList(name, forcedTop150);
  return { line, score: calcScore(line, isForced), idx, isForced };
});
scored.sort((a, b) => b.score - a.score);

// Split into top 150 and rest
const top150 = scored.slice(0, 150);
const rest = scored.slice(150);

// Sort each group by original order
top150.sort((a, b) => a.idx - b.idx);
rest.sort((a, b) => a.idx - b.idx);

const reordered = [...top150.map(s => s.line), ...rest.map(s => s.line)];
const output = reordered.map((line, i) => {
  const cols = parseRow(line);
  cols[0] = String(i + 1);
  return cols.join('\t');
});

fs.writeFileSync(csvPath, header + '\n' + output.join('\n'));

// Show results
console.log('=== Top 20 ===');
reordered.slice(0, 20).forEach((l, i) => {
  const c = parseRow(l);
  console.log('#' + (i+1) + ' ' + c[1] + ' | ₹' + c[4] + ' Cr | ' + c[3] + ' | Form:' + c[9]);
});

console.log('\n=== Around #150 ===');
reordered.slice(145, 155).forEach((l, i) => {
  const c = parseRow(l);
  console.log('#' + (146+i) + ' ' + c[1] + ' | ₹' + c[4] + ' Cr | M:' + c[10] + ' R:' + c[11] + ' W:' + c[12] + ' | Form:' + c[9]);
});

console.log('\n=== Key 2026 performers check ===');
const check = ['Donovan Ferreira','Vaibhav Suryavanshi','Ayush Mhatre','Sai Sudharsan','Sherfane Rutherford','Finn Allen','Aaron Hardie','Kusal Mendis','Shakib Al Hasan','Harpreet Brar','Mitchell Santner','Nehal Wadhera','Manish Pandey','Piyush Chawla','Karun Nair','Vijay Shankar'];
reordered.forEach((l, i) => {
  const c = parseRow(l);
  const name = c[1];
  const match = check.find(x => name.toLowerCase().includes(x.toLowerCase()));
  if (match) console.log('#' + (i+1) + ' ' + name + ' | ₹' + c[4] + ' Cr | Form:' + c[9]);
});
