const fs = require('fs');
const raw = fs.readFileSync('data/final-player-source.csv', 'utf-8');
const lines = raw.trim().split('\n').slice(1);

function parse(l) {
  const r = []; let c = '', q = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') { q = !q; continue; }
    if (l[i] === ',' && !q) { r.push(c.trim()); c = ''; continue; }
    c += l[i];
  }
  r.push(c.trim());
  return r;
}

lines.forEach(l => {
  if (l.toLowerCase().includes('anukul') || l.toLowerCase().includes('kamboj')) {
    const c = parse(l);
    console.log('Player:', c[1]);
    console.log('2021-2025:', c[2], c[3], c[4], c[5], c[6]);
    console.log('2026 Price: \u20b9' + c[7] + ' Cr');
    console.log('Market Min: \u20b9' + c[13] + ' Cr');
    console.log('Market Target: \u20b9' + c[14] + ' Cr');
    console.log('Market Max: \u20b9' + c[15] + ' Cr');
  }
});
