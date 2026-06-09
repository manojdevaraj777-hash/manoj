const fs = require('fs');
const raw = fs.readFileSync('data/final-player-source.csv', 'utf-8');
const lines = raw.trim().split('\n').slice(1);
const dist = {};
lines.forEach(l => {
  const c = [];
  let curr = '', q = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') { q = !q; continue; }
    if (l[i] === ',' && !q) { c.push(curr.trim()); curr = ''; continue; }
    curr += l[i];
  }
  c.push(curr.trim());
  const p = parseFloat(c[7]) || 0;
  const bucket = p >= 15 ? '15+' : Math.floor(p) + '';
  dist[bucket] = (dist[bucket] || 0) + 1;
});
Object.entries(dist).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([k, v]) => console.log(k + ' Cr -> ' + v + ' players'));
console.log('Total:', lines.length);
