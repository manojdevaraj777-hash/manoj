const fs = require('fs');
const raw = fs.readFileSync('data/final-player-source.csv', 'utf-8');
const lines = raw.trim().split('\n').slice(1);
const players = [];
lines.forEach(l => {
  const c = [];
  let curr = '', q = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') { q = !q; continue; }
    if (l[i] === ',' && !q) { c.push(curr.trim()); curr = ''; continue; }
    curr += l[i];
  }
  c.push(curr.trim());
  players.push({ name: c[1], price26: parseFloat(c[7]) || 0, target: parseFloat(c[14]) || 0 });
});
players.sort((a, b) => b.price26 - a.price26);
console.log('Top 20 by 2026 Price:');
players.slice(0, 20).forEach((p, i) => console.log((i+1) + '. ' + p.name + ' - ₹' + p.price26 + ' Cr (Target: ₹' + p.target + ' Cr)'));
console.log('\nDonovan Ferreira:');
players.filter(p => p.name.toLowerCase().includes('donovan')).forEach(p => console.log('  ' + p.name + ' - ₹' + p.price26 + ' Cr'));
