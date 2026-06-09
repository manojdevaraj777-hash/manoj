const fs = require('fs');
const raw = fs.readFileSync('data/final-player-source.csv', 'utf-8');
const lines = raw.trim().split('\n').slice(1);

function parse(l) {
  const r = [];
  let c = '', q = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') { q = !q; continue; }
    if (l[i] === ',' && !q) { r.push(c.trim()); c = ''; continue; }
    c += l[i];
  }
  r.push(c.trim());
  return r;
}

let full = 0, partial = 0, none = 0;
lines.forEach(l => {
  const c = parse(l);
  const prices = [c[2], c[3], c[4], c[5], c[6]]
    .map(x => x === 'U' || x === 'R' ? null : parseFloat(x))
    .filter(x => x !== null && !isNaN(x));
  if (prices.length === 5) full++;
  else if (prices.length > 0) partial++;
  else none++;
});

console.log('Full data (5 seasons):', full);
console.log('Partial data:', partial);
console.log('No data:', none);
console.log('Total:', lines.length);
