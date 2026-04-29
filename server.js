const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function normalizeOrigin(originValue) {
  const rawValue = String(originValue || '').trim();

  if (!rawValue) {
    return null;
  }

  if (rawValue === '*') {
    return '*';
  }

  try {
    return new URL(rawValue).origin;
  } catch (_err) {
    return null;
  }
}

function getEnvironmentOrigins() {
  const directOrigins = [
    process.env.PUBLIC_BASE_URL,
    process.env.APP_BASE_URL,
    process.env.RENDER_EXTERNAL_URL
  ]
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const railwayPublicDomain = String(process.env.RAILWAY_PUBLIC_DOMAIN || '').trim();
  if (railwayPublicDomain) {
    const railwayOrigin = normalizeOrigin(`https://${railwayPublicDomain}`);
    if (railwayOrigin) {
      directOrigins.push(railwayOrigin);
    }
  }

  return [...new Set(directOrigins)];
}

function parseAllowedOrigins() {
  const configured = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  return [...new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...getEnvironmentOrigins(),
    ...configured
  ])];
}

const allowedOrigins = parseAllowedOrigins();
const isCorsWildcardEnabled = allowedOrigins.includes('*');
const publicBaseUrl = normalizeOrigin(
  process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL
);
const corsOptions = {
  origin(origin, callback) {
    const isLocalhostOrigin = /^https?:\/\/localhost:\d+$/i.test(String(origin || ''));
    const isLoopbackOrigin = /^https?:\/\/127\.0\.0\.1:\d+$/i.test(String(origin || ''));

    if (!origin || isCorsWildcardEnabled || allowedOrigins.includes(origin) || isLocalhostOrigin || isLoopbackOrigin) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS policy blocked this origin.'));
  },
  methods: ['GET', 'POST']
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.get('/healthz', (_req, res) => {
  res.status(200).json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime())
  });
});
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/sounds', express.static(path.join(__dirname, 'sounds')));

// ============ DATA ============
const teamsData = {
  'MI': { 
    name: 'Mumbai Indians', 
    shortCode: 'MI',
    purse: 151, 
    players: [
      { id: 9991, name: 'Rohit Sharma', role: 'Batsman', country: 'India', price: 16, boughtInAuction: false, image: 'rohit-sharma.jpg' },
      { id: 9992, name: 'Jasprit Bumrah', role: 'Bowler', country: 'India', price: 12, boughtInAuction: false, image: 'jasprit-bumrah.jpg' },
      { id: 9993, name: 'Suryakumar Yadav', role: 'Batsman', country: 'India', price: 8, boughtInAuction: false, image: 'suryakumar-yadav.jpg' },
      { id: 9994, name: 'Hardik Pandya', role: 'All-rounder', country: 'India', price: 16, boughtInAuction: false, image: 'hardik-pandya.jpg' },
      { id: 9995, name: 'Tilak Varma', role: 'Batsman', country: 'India', price: 0.5, boughtInAuction: false, image: 'tilak-varma.jpg' }
    ],
    overseasCount: 0,
    totalPlayers: 5,
    socketId: null
  },
  'CSK': { 
    name: 'Chennai Super Kings', 
    shortCode: 'CSK',
    purse: 151, 
    players: [
      { id: 9981, name: 'MS Dhoni', role: 'Wicketkeeper', country: 'India', price: 12, boughtInAuction: false, image: 'ms-dhoni.jpg' },
      { id: 9982, name: 'Ravindra Jadeja', role: 'All-rounder', country: 'India', price: 16, boughtInAuction: false, image: 'ravindra-jadeja.jpg' },
      { id: 9983, name: 'Ruturaj Gaikwad', role: 'Batsman', country: 'India', price: 6, boughtInAuction: false, image: 'ruturaj-gaikwad.jpg' },
      { id: 9984, name: 'Deepak Chahar', role: 'Bowler', country: 'India', price: 5, boughtInAuction: false, image: 'deepak-chahar.jpg' }
    ],
    overseasCount: 0,
    totalPlayers: 4,
    socketId: null
  },
  'RCB': { 
    name: 'Royal Challengers Bengaluru', 
    shortCode: 'RCB',
    purse: 151, 
    players: [
      { id: 9971, name: 'Virat Kohli', role: 'Batsman', country: 'India', price: 18, boughtInAuction: false, image: 'virat-kohli.jpg' },
      { id: 9972, name: 'Faf du Plessis', role: 'Batsman', country: 'South Africa', price: 8, boughtInAuction: false, image: 'faf-du-plessis.jpg' },
      { id: 9973, name: 'Glenn Maxwell', role: 'All-rounder', country: 'Australia', price: 10, boughtInAuction: false, image: 'glenn-maxwell.jpg' },
      { id: 9974, name: 'Mohammed Siraj', role: 'Bowler', country: 'India', price: 5, boughtInAuction: false, image: 'mohammed-siraj.jpg' }
    ],
    overseasCount: 2,
    totalPlayers: 4,
    socketId: null
  },
  'KKR': { 
    name: 'Kolkata Knight Riders', 
    shortCode: 'KKR',
    purse: 151, 
    players: [
      { id: 9961, name: 'Andre Russell', role: 'All-rounder', country: 'West Indies', price: 10, boughtInAuction: false, image: 'andre-russell.jpg' },
      { id: 9962, name: 'Sunil Narine', role: 'All-rounder', country: 'West Indies', price: 8, boughtInAuction: false, image: 'sunil-narine.jpg' },
      { id: 9963, name: 'Rinku Singh', role: 'Batsman', country: 'India', price: 5, boughtInAuction: false, image: 'rinku-singh.jpg' },
      { id: 9964, name: 'Varun Chakravarthy', role: 'Bowler', country: 'India', price: 5, boughtInAuction: false, image: 'varun-chakravarthy.jpg' }
    ],
    overseasCount: 2,
    totalPlayers: 4,
    socketId: null
  },
  'RR': { 
    name: 'Rajasthan Royals', 
    shortCode: 'RR',
    purse: 151, 
    players: [
      { id: 9951, name: 'Sanju Samson', role: 'Wicketkeeper', country: 'India', price: 12, boughtInAuction: false, image: 'sanju-samson.jpg' },
      { id: 9952, name: 'Jos Buttler', role: 'Wicketkeeper', country: 'England', price: 12, boughtInAuction: false, image: 'jos-buttler.jpg' },
      { id: 9953, name: 'Yashasvi Jaiswal', role: 'Batsman', country: 'India', price: 6, boughtInAuction: false, image: 'yashasvi-jaiswal.jpg' },
      { id: 9954, name: 'Trent Boult', role: 'Bowler', country: 'New Zealand', price: 8, boughtInAuction: false, image: 'trent-boult.jpg' }
    ],
    overseasCount: 2,
    totalPlayers: 4,
    socketId: null
  },
  'SRH': { 
    name: 'Sunrisers Hyderabad', 
    shortCode: 'SRH',
    purse: 151, 
    players: [
      { id: 9941, name: 'Ishan Kishan', role: 'Wicketkeeper', country: 'India', price: 8, boughtInAuction: false, image: 'ishan-kishan.jpg' },
      { id: 9942, name: 'Abhishek Sharma', role: 'All-rounder', country: 'India', price: 4, boughtInAuction: false, image: 'abhishek-sharma.jpg' },
      { id: 9943, name: 'Bhuvneshwar Kumar', role: 'Bowler', country: 'India', price: 5, boughtInAuction: false, image: 'bhuvneshwar-kumar.jpg' },
      { id: 9944, name: 'Umran Malik', role: 'Bowler', country: 'India', price: 4, boughtInAuction: false, image: 'umran-malik.jpg' }
    ],
    overseasCount: 0,
    totalPlayers: 4,
    socketId: null
  },
  'DC': { 
    name: 'Delhi Capitals', 
    shortCode: 'DC',
    purse: 151, 
    players: [
      { id: 9931, name: 'KL Rahul', role: 'Wicketkeeper', country: 'India', price: 14, boughtInAuction: false, image: 'kl-rahul.jpg' },
      { id: 9932, name: 'David Warner', role: 'Batsman', country: 'Australia', price: 8, boughtInAuction: false, image: 'david-warner.jpg' },
      { id: 9933, name: 'Axar Patel', role: 'All-rounder', country: 'India', price: 6, boughtInAuction: false, image: 'axar-patel.jpg' },
      { id: 9934, name: 'Kuldeep Yadav', role: 'Bowler', country: 'India', price: 6, boughtInAuction: false, image: 'kuldeep-yadav.jpg' }
    ],
    overseasCount: 1,
    totalPlayers: 4,
    socketId: null
  },
  'PBKS': { 
    name: 'Punjab Kings', 
    shortCode: 'PBKS',
    purse: 151, 
    players: [
      { id: 9921, name: 'Shikhar Dhawan', role: 'Batsman', country: 'India', price: 6, boughtInAuction: false, image: 'shikhar-dhawan.jpg' },
      { id: 9922, name: 'Arshdeep Singh', role: 'Bowler', country: 'India', price: 6, boughtInAuction: false, image: 'arshdeep-singh.jpg' },
      { id: 9923, name: 'Sam Curran', role: 'All-rounder', country: 'England', price: 8, boughtInAuction: false, image: 'sam-curran.jpg' },
      { id: 9924, name: 'Liam Livingstone', role: 'All-rounder', country: 'England', price: 6, boughtInAuction: false, image: 'liam-livingstone.jpg' }
    ],
    overseasCount: 2,
    totalPlayers: 4,
    socketId: null
  },
  'GT': { 
    name: 'Gujarat Titans', 
    shortCode: 'GT',
    purse: 151, 
    players: [
      { id: 9911, name: 'Shubman Gill', role: 'Batsman', country: 'India', price: 15, boughtInAuction: false, image: 'shubman-gill.jpg' },
      { id: 9912, name: 'Rashid Khan', role: 'Bowler', country: 'Afghanistan', price: 15, boughtInAuction: false, image: 'rashid-khan.jpg' },
      { id: 9913, name: 'Mohammed Shami', role: 'Bowler', country: 'India', price: 10, boughtInAuction: false, image: 'mohammed-shami.jpg' },
      { id: 9914, name: 'David Miller', role: 'Batsman', country: 'South Africa', price: 6, boughtInAuction: false, image: 'david-miller.jpg' }
    ],
    overseasCount: 2,
    totalPlayers: 4,
    socketId: null
  },
  'LSG': { 
    name: 'Lucknow Super Giants', 
    shortCode: 'LSG',
    purse: 151, 
    players: [
      { id: 9901, name: 'Rishabh Pant', role: 'Wicketkeeper', country: 'India', price: 16, boughtInAuction: false, image: 'rishabh-pant.jpg' },
      { id: 9902, name: 'Quinton de Kock', role: 'Wicketkeeper', country: 'South Africa', price: 6, boughtInAuction: false, image: 'quinton-de-kock.jpg' },
      { id: 9903, name: 'Marcus Stoinis', role: 'All-rounder', country: 'Australia', price: 6, boughtInAuction: false, image: 'marcus-stoinis.jpg' },
      { id: 9904, name: 'Ravi Bishnoi', role: 'Bowler', country: 'India', price: 4, boughtInAuction: false, image: 'ravi-bishnoi.jpg' }
    ],
    overseasCount: 2,
    totalPlayers: 4,
    socketId: null
  }
};

// TIER 1 - Marquee Players (20 players)
const tier1Players = [
  { id: 1, name: 'Virat Kohli', role: 'Batsman', country: 'India', basePrice: 2, tier: 1, image: 'virat-kohli.jpg', stats: { matches: 267, runs: 8730, average: 39.5, strikeRate: 132.9, hundreds: 8, fifties: 71 } },
  { id: 2, name: 'MS Dhoni', role: 'Wicketkeeper', country: 'India', basePrice: 2, tier: 1, image: 'ms-dhoni.jpg', stats: { matches: 250, runs: 5082, average: 39.1, strikeRate: 135.9, fifties: 24, sixes: 239 } },
  { id: 3, name: 'Rohit Sharma', role: 'Batsman', country: 'India', basePrice: 2, tier: 1, image: 'rohit-sharma.jpg', stats: { matches: 227, runs: 6211, average: 29.6, strikeRate: 130.3, hundreds: 1, fifties: 42 } },
  { id: 4, name: 'Jasprit Bumrah', role: 'Bowler', country: 'India', basePrice: 2, tier: 1, image: 'jasprit-bumrah.jpg', stats: { matches: 120, wickets: 145, economy: 6.8, average: 19.5 } },
  { id: 5, name: 'Hardik Pandya', role: 'All-rounder', country: 'India', basePrice: 2, tier: 1, image: 'hardik-pandya.jpg', stats: { matches: 137, runs: 2336, wickets: 53, strikeRate: 147.2 } },
  { id: 6, name: 'Rashid Khan', role: 'Bowler', country: 'Afghanistan', basePrice: 2, tier: 1, image: 'rashid-khan.jpg', stats: { matches: 109, wickets: 139, economy: 6.7, average: 20.5 } },
  { id: 7, name: 'Jos Buttler', role: 'Wicketkeeper', country: 'England', basePrice: 2, tier: 1, image: 'jos-buttler.jpg', stats: { matches: 96, runs: 3392, average: 38.1, strikeRate: 148.5, hundreds: 7 } },
  { id: 8, name: 'Suryakumar Yadav', role: 'Batsman', country: 'India', basePrice: 2, tier: 1, image: 'suryakumar-yadav.jpg', stats: { matches: 60, runs: 2141, average: 41.2, strikeRate: 175.5, hundreds: 3 } },
  { id: 9, name: 'Ravindra Jadeja', role: 'All-rounder', country: 'India', basePrice: 2, tier: 1, image: 'ravindra-jadeja.jpg', stats: { matches: 226, runs: 2691, wickets: 152, economy: 7.6 } },
  { id: 10, name: 'Shubman Gill', role: 'Batsman', country: 'India', basePrice: 2, tier: 1, image: 'shubman-gill.jpg', stats: { matches: 58, runs: 1790, average: 37.3, strikeRate: 135.2, hundreds: 3 } },
  { id: 11, name: 'KL Rahul', role: 'Wicketkeeper', country: 'India', basePrice: 2, tier: 1, image: 'kl-rahul.jpg', stats: { matches: 132, runs: 4163, average: 47.3, strikeRate: 136.7, hundreds: 4 } },
  { id: 12, name: 'Rishabh Pant', role: 'Wicketkeeper', country: 'India', basePrice: 2, tier: 1, image: 'rishabh-pant.jpg', stats: { matches: 111, runs: 3284, average: 35.3, strikeRate: 149.2, hundreds: 1 } },
  { id: 13, name: 'Andre Russell', role: 'All-rounder', country: 'West Indies', basePrice: 2, tier: 1, image: 'andre-russell.jpg', stats: { matches: 110, runs: 2180, wickets: 105, strikeRate: 177.3 } },
  { id: 14, name: 'Sunil Narine', role: 'All-rounder', country: 'West Indies', basePrice: 2, tier: 1, image: 'sunil-narine.jpg', stats: { matches: 159, wickets: 163, economy: 6.7, runs: 1093 } },
  { id: 15, name: 'Glenn Maxwell', role: 'All-rounder', country: 'Australia', basePrice: 2, tier: 1, image: 'glenn-maxwell.jpg', stats: { matches: 127, runs: 2719, wickets: 55, strikeRate: 157.7 } },
  { id: 16, name: 'Yuzvendra Chahal', role: 'Bowler', country: 'India', basePrice: 2, tier: 1, image: 'yuzvendra-chahal.jpg', stats: { matches: 174, wickets: 221, economy: 7.96, bestBowling: '5/40' } },
  { id: 17, name: 'Mohammed Shami', role: 'Bowler', country: 'India', basePrice: 2, tier: 1, image: 'mohammed-shami.jpg', stats: { matches: 110, wickets: 127, economy: 8.5, average: 26.5 } },
  { id: 18, name: 'David Warner', role: 'Batsman', country: 'Australia', basePrice: 2, tier: 1, image: 'david-warner.jpg', stats: { matches: 184, runs: 6397, average: 40.7, strikeRate: 140.4, hundreds: 4 } },
  { id: 19, name: 'Faf du Plessis', role: 'Batsman', country: 'South Africa', basePrice: 2, tier: 1, image: 'faf-du-plessis.jpg', stats: { matches: 145, runs: 4571, average: 36.8, strikeRate: 136.4, hundreds: 1 } },
  { id: 20, name: 'Trent Boult', role: 'Bowler', country: 'New Zealand', basePrice: 2, tier: 1, image: 'trent-boult.jpg', stats: { matches: 84, wickets: 105, economy: 8.1, average: 24.5 } }
];

// TIER 2 - Established Internationals (25 players)
const tier2Players = [
  { id: 21, name: 'Shikhar Dhawan', role: 'Batsman', country: 'India', basePrice: 1.5, tier: 2, image: 'shikhar-dhawan.jpg' },
  { id: 22, name: 'Sanju Samson', role: 'Wicketkeeper', country: 'India', basePrice: 1.5, tier: 2, image: 'sanju-samson.jpg' },
  { id: 23, name: 'Axar Patel', role: 'All-rounder', country: 'India', basePrice: 1.5, tier: 2, image: 'axar-patel.jpg' },
  { id: 24, name: 'Bhuvneshwar Kumar', role: 'Bowler', country: 'India', basePrice: 1.5, tier: 2, image: 'bhuvneshwar-kumar.jpg' },
  { id: 25, name: 'Arshdeep Singh', role: 'Bowler', country: 'India', basePrice: 1.5, tier: 2, image: 'arshdeep-singh.jpg' },
  { id: 26, name: 'Sam Curran', role: 'All-rounder', country: 'England', basePrice: 1.5, tier: 2, image: 'sam-curran.jpg' },
  { id: 27, name: 'Liam Livingstone', role: 'All-rounder', country: 'England', basePrice: 1.5, tier: 2, image: 'liam-livingstone.jpg' },
  { id: 28, name: 'Marcus Stoinis', role: 'All-rounder', country: 'Australia', basePrice: 1.5, tier: 2, image: 'marcus-stoinis.jpg' },
  { id: 29, name: 'Quinton de Kock', role: 'Wicketkeeper', country: 'South Africa', basePrice: 1.5, tier: 2, image: 'quinton-de-kock.jpg' },
  { id: 30, name: 'Kagiso Rabada', role: 'Bowler', country: 'South Africa', basePrice: 2, tier: 2, image: 'kagiso-rabada.jpg' },
  { id: 31, name: 'Mitchell Starc', role: 'Bowler', country: 'Australia', basePrice: 2, tier: 2, image: 'mitchell-starc.jpg' },
  { id: 32, name: 'Pat Cummins', role: 'Bowler', country: 'Australia', basePrice: 2, tier: 2, image: 'pat-cummins.jpg' },
  { id: 33, name: 'Cameron Green', role: 'All-rounder', country: 'Australia', basePrice: 2, tier: 2, image: 'cameron-green.jpg' },
  { id: 34, name: 'Yashasvi Jaiswal', role: 'Batsman', country: 'India', basePrice: 1, tier: 2, image: 'yashasvi-jaiswal.jpg' },
  { id: 35, name: 'Ruturaj Gaikwad', role: 'Batsman', country: 'India', basePrice: 1, tier: 2, image: 'ruturaj-gaikwad.jpg' },
  { id: 36, name: 'Ishan Kishan', role: 'Wicketkeeper', country: 'India', basePrice: 1.5, tier: 2, image: 'ishan-kishan.jpg' },
  { id: 37, name: 'Prithvi Shaw', role: 'Batsman', country: 'India', basePrice: 1, tier: 2, image: 'prithvi-shaw.jpg' },
  { id: 38, name: 'Venkatesh Iyer', role: 'All-rounder', country: 'India', basePrice: 1, tier: 2, image: 'venkatesh-iyer.jpg' },
  { id: 39, name: 'Rinku Singh', role: 'Batsman', country: 'India', basePrice: 1, tier: 2, image: 'rinku-singh.jpg' },
  { id: 40, name: 'Kuldeep Yadav', role: 'Bowler', country: 'India', basePrice: 1.5, tier: 2, image: 'kuldeep-yadav.jpg' },
  { id: 41, name: 'Mohammed Siraj', role: 'Bowler', country: 'India', basePrice: 1.5, tier: 2, image: 'mohammed-siraj.jpg' },
  { id: 42, name: 'Deepak Chahar', role: 'Bowler', country: 'India', basePrice: 1, tier: 2, image: 'deepak-chahar.jpg' },
  { id: 43, name: 'Nicholas Pooran', role: 'Wicketkeeper', country: 'West Indies', basePrice: 1.5, tier: 2, image: 'nicholas-pooran.jpg' },
  { id: 44, name: 'Tim David', role: 'Batsman', country: 'Australia', basePrice: 1, tier: 2, image: 'tim-david.jpg' },
  { id: 45, name: 'Moeen Ali', role: 'All-rounder', country: 'England', basePrice: 1.5, tier: 2, image: 'moeen-ali.jpg' }
];

// TIER 3 - Domestic & Emerging (30 players)
const tier3Players = [
  { id: 46, name: 'Tilak Varma', role: 'Batsman', country: 'India', basePrice: 0.5, tier: 3, image: 'tilak-varma.jpg' },
  { id: 47, name: 'Nehal Wadhera', role: 'Batsman', country: 'India', basePrice: 0.3, tier: 3, image: 'nehal-wadhera.jpg' },
  { id: 48, name: 'Jitesh Sharma', role: 'Wicketkeeper', country: 'India', basePrice: 0.3, tier: 3, image: 'jitesh-sharma.jpg' },
  { id: 49, name: 'Prabhsimran Singh', role: 'Wicketkeeper', country: 'India', basePrice: 0.3, tier: 3, image: 'prabhsimran-singh.jpg' },
  { id: 50, name: 'Dhruv Jurel', role: 'Wicketkeeper', country: 'India', basePrice: 0.3, tier: 3, image: 'dhruv-jurel.jpg' },
  { id: 51, name: 'Ayush Badoni', role: 'All-rounder', country: 'India', basePrice: 0.3, tier: 3, image: 'ayush-badoni.jpg' },
  { id: 52, name: 'Raj Bawa', role: 'All-rounder', country: 'India', basePrice: 0.3, tier: 3, image: 'raj-bawa.jpg' },
  { id: 53, name: 'Abhishek Sharma', role: 'All-rounder', country: 'India', basePrice: 0.5, tier: 3, image: 'abhishek-sharma.jpg' },
  { id: 54, name: 'Ravi Bishnoi', role: 'Bowler', country: 'India', basePrice: 0.5, tier: 3, image: 'ravi-bishnoi.jpg' },
  { id: 55, name: 'Avesh Khan', role: 'Bowler', country: 'India', basePrice: 0.5, tier: 3, image: 'avesh-khan.jpg' },
  { id: 56, name: 'Mohsin Khan', role: 'Bowler', country: 'India', basePrice: 0.3, tier: 3, image: 'mohsin-khan.jpg' },
  { id: 57, name: 'Mukesh Kumar', role: 'Bowler', country: 'India', basePrice: 0.3, tier: 3, image: 'mukesh-kumar.jpg' },
  { id: 58, name: 'Umran Malik', role: 'Bowler', country: 'India', basePrice: 0.5, tier: 3, image: 'umran-malik.jpg' },
  { id: 59, name: 'Kartik Tyagi', role: 'Bowler', country: 'India', basePrice: 0.3, tier: 3, image: 'kartik-tyagi.jpg' },
  { id: 60, name: 'Chetan Sakariya', role: 'Bowler', country: 'India', basePrice: 0.3, tier: 3, image: 'chetan-sakariya.jpg' },
  { id: 61, name: 'Shivam Mavi', role: 'Bowler', country: 'India', basePrice: 0.3, tier: 3, image: 'shivam-mavi.jpg' },
  { id: 62, name: 'Tushar Deshpande', role: 'Bowler', country: 'India', basePrice: 0.2, tier: 3, image: 'tushar-deshpande.jpg' },
  { id: 63, name: 'Akash Madhwal', role: 'Bowler', country: 'India', basePrice: 0.2, tier: 3, image: 'akash-madhwal.jpg' },
  { id: 64, name: 'Sai Sudharsan', role: 'Batsman', country: 'India', basePrice: 0.3, tier: 3, image: 'sai-sudharsan.jpg' },
  { id: 65, name: 'Abhinav Manohar', role: 'Batsman', country: 'India', basePrice: 0.2, tier: 3, image: 'abhinav-manohar.jpg' },
  { id: 66, name: 'Shahrukh Khan', role: 'Batsman', country: 'India', basePrice: 0.2, tier: 3, image: 'shahrukh-khan.jpg' },
  { id: 67, name: 'Washington Sundar', role: 'All-rounder', country: 'India', basePrice: 0.5, tier: 3, image: 'washington-sundar.jpg' },
  { id: 68, name: 'Krunal Pandya', role: 'All-rounder', country: 'India', basePrice: 0.5, tier: 3, image: 'krunal-pandya.jpg' },
  { id: 69, name: 'Shivam Dube', role: 'All-rounder', country: 'India', basePrice: 0.5, tier: 3, image: 'shivam-dube.jpg' },
  { id: 70, name: 'Vijay Shankar', role: 'All-rounder', country: 'India', basePrice: 0.3, tier: 3, image: 'vijay-shankar.jpg' },
  { id: 71, name: 'Mahipal Lomror', role: 'All-rounder', country: 'India', basePrice: 0.2, tier: 3, image: 'mahipal-lomror.jpg' },
  { id: 72, name: 'Harpreet Brar', role: 'All-rounder', country: 'India', basePrice: 0.2, tier: 3, image: 'harpreet-brar.jpg' },
  { id: 73, name: 'Rahul Chahar', role: 'Bowler', country: 'India', basePrice: 0.5, tier: 3, image: 'rahul-chahar.jpg' },
  { id: 74, name: 'Piyush Chawla', role: 'Bowler', country: 'India', basePrice: 0.5, tier: 3, image: 'piyush-chawla.jpg' },
  { id: 75, name: 'Harshal Patel', role: 'Bowler', country: 'India', basePrice: 0.5, tier: 3, image: 'harshal-patel.jpg' }
];

const curatedPlayersByName = new Map(
  [...tier1Players, ...tier2Players, ...tier3Players]
    .map((player) => [String(player.name || '').trim().toLowerCase(), player])
);

function roleDefaultStats(role) {
  if (role === 'Batsman' || role === 'Wicketkeeper') {
    return { matches: 36, runs: 920, average: 31.5, strikeRate: 136.4, hundreds: 1, fifties: 6 };
  }
  if (role === 'Bowler') {
    return { matches: 34, wickets: 42, economy: 7.7, average: 24.8, bestBowling: '4/26' };
  }
  return { matches: 38, runs: 610, wickets: 21, strikeRate: 141.7, economy: 8.1 };
}

function roleDefaults(role) {
  if (role === 'Wicketkeeper') {
    return { battingStyle: 'Right-hand bat', bowlingStyle: 'N/A' };
  }
  if (role === 'Batsman') {
    return { battingStyle: 'Right-hand bat', bowlingStyle: 'Part-time spin' };
  }
  if (role === 'Bowler') {
    return { battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm pace' };
  }
  return { battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium' };
}

function enrichPlayer(player, idx = 0) {
  const curated = curatedPlayersByName.get(String(player.name || '').trim().toLowerCase());
  const mergedStats = {
    ...(curated?.stats || {}),
    ...(player.stats || {})
  };
  const seasonRuns = mergedStats.runs;
  const seasonWickets = mergedStats.wickets;

  return {
    ...player,
    stats: mergedStats,
    profile: {
      age: player.profile?.age ?? curated?.profile?.age ?? null,
      battingStyle: player.profile?.battingStyle || curated?.profile?.battingStyle || undefined,
      bowlingStyle: player.profile?.bowlingStyle || curated?.profile?.bowlingStyle || undefined,
      previousTeam: player.profile?.previousTeam || ['MI', 'CSK', 'RCB', 'KKR', 'RR', 'SRH', 'DC', 'PBKS', 'GT', 'LSG'][idx % 10],
      lastSeasonRuns: player.profile?.lastSeasonRuns ?? seasonRuns,
      lastSeasonWickets: player.profile?.lastSeasonWickets ?? seasonWickets,
      form: player.profile?.form || undefined
    }
  };
}

function slugifyName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildGeneratedPlayers(startId, count) {
  const firstNames = ['Aarav', 'Vihaan', 'Arjun', 'Reyansh', 'Kabir', 'Advik', 'Yuvan', 'Ayaan', 'Ishaan', 'Atharv', 'Pranav', 'Nivaan', 'Shaurya', 'Rudra', 'Krish', 'Dev', 'Naman', 'Ansh', 'Dhruv', 'Vedant', 'Rishi', 'Laksh', 'Parth', 'Hriday', 'Samar', 'Tanmay', 'Harit', 'Kian', 'Zayan', 'Nirvaan'];
  const lastNames = ['Sharma', 'Verma', 'Yadav', 'Kulkarni', 'Iyer', 'Patil', 'Rana', 'Saxena', 'Nair', 'Rawat', 'Shinde', 'Deshmukh', 'Rathore', 'Thakur', 'Pillai', 'Bora', 'Reddy', 'Kamble', 'Saini', 'Maan', 'Gill', 'Bisht', 'Ahlawat', 'Beniwal', 'Sodhi', 'Bhadoria', 'Dubey', 'Jha', 'Mishra', 'Pathan', 'Ali', 'Khan'];
  const countries = ['India', 'India', 'India', 'India', 'India', 'India', 'India', 'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Afghanistan', 'West Indies', 'Sri Lanka', 'Bangladesh'];
  const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'];
  const styles = {
    Batsman: ['Right-hand bat', 'Left-hand bat'],
    Bowler: ['Right-arm pace', 'Left-arm pace', 'Right-arm legbreak', 'Left-arm orthodox'],
    'All-rounder': ['Right-hand bat / Right-arm medium', 'Left-hand bat / Left-arm orthodox', 'Right-hand bat / Legbreak'],
    Wicketkeeper: ['Right-hand bat', 'Left-hand bat']
  };
  const forms = ['Orange Cap contender', 'Powerplay enforcer', 'Middle-overs anchor', 'Death-over finisher', 'New-ball threat', 'Spin web specialist', 'Fielding game-changer'];
  const previousTeams = ['MI', 'CSK', 'RCB', 'KKR', 'RR', 'SRH', 'DC', 'PBKS', 'GT', 'LSG'];

  const players = [];

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const role = roles[i % roles.length];
    const tier = i < 70 ? 2 : 3;
    const basePrice = tier === 2 ? [1, 1.5, 2][i % 3] : [0.2, 0.3, 0.5, 1][i % 4];
    const country = countries[i % countries.length];
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
    const image = `${slugifyName(name)}.jpg`;

    const stats = role === 'Bowler'
      ? { matches: 18 + (i % 36), wickets: 14 + (i % 58), economy: Number((6.4 + (i % 28) * 0.1).toFixed(1)), average: Number((17 + (i % 18) * 0.9).toFixed(1)) }
      : role === 'All-rounder'
        ? { matches: 18 + (i % 34), runs: 260 + (i % 52) * 19, wickets: 7 + (i % 28), strikeRate: Number((124 + (i % 35) * 1.5).toFixed(1)), economy: Number((7.1 + (i % 18) * 0.1).toFixed(1)) }
        : { matches: 18 + (i % 38), runs: 280 + (i % 72) * 22, average: Number((24 + (i % 18) * 1.1).toFixed(1)), strikeRate: Number((119 + (i % 40) * 1.6).toFixed(1)), hundreds: i % 4 === 0 ? 1 : 0, fifties: 2 + (i % 10) };

    players.push({
      id,
      name,
      role,
      country,
      basePrice,
      tier,
      image,
      stats,
      profile: {
        age: 20 + (i % 15),
        battingStyle: styles[role][i % styles[role].length],
        bowlingStyle: role === 'Wicketkeeper' ? 'N/A' : (styles[role][(i + 1) % styles[role].length]),
        previousTeam: previousTeams[i % previousTeams.length],
        lastSeasonRuns: stats.runs || (90 + (i % 40) * 7),
        lastSeasonWickets: stats.wickets || (i % 8),
        form: forms[i % forms.length]
      }
    });
  }

  return players;
}

function decodePdfTextToken(value = '') {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, '%20'));
  } catch (_err) {
    return String(value || '');
  }
}

function cleanPdfTextValue(value = '') {
  return String(value || '')
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/â€“|â€”/g, '-')
    .replace(/Â/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePdfPlayerName(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadKeyPlayerNameSet() {
  try {
    const profilePath = path.join(__dirname, 'data', 'ai-auctioneer-profile.json');
    if (!fs.existsSync(profilePath)) return new Set();

    const raw = fs.readFileSync(profilePath, 'utf8');
    const parsed = JSON.parse(raw);
    const keyPlayers = Array.isArray(parsed?.keyPlayers) ? parsed.keyPlayers : [];

    return new Set(
      keyPlayers
        .map((name) => normalizePdfPlayerName(name))
        .filter((name) => name.length > 0)
    );
  } catch (_err) {
    return new Set();
  }
}

function extractPdfAuctionRows() {
  try {
    const pdfJsonPath = path.join(__dirname, 'data', 'ipl-player-list.json', 'ipl-player-list.json');
    if (!fs.existsSync(pdfJsonPath)) return [];

    const raw = fs.readFileSync(pdfJsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    const pages = Array.isArray(parsed?.Pages) ? parsed.Pages : [];
    const rows = [];
    const seenSr = new Set();

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const texts = Array.isArray(page?.Texts) ? page.Texts : [];
      const groupedRows = new Map();

      for (const item of texts) {
        const x = Number(item?.x);
        const y = Number(item?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        const textValue = (item?.R || [])
          .map((token) => cleanPdfTextValue(decodePdfTextToken(token?.T || '')))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!textValue) continue;

        const rowKey = `${pageIndex}:${y.toFixed(3)}`;
        if (!groupedRows.has(rowKey)) groupedRows.set(rowKey, []);
        groupedRows.get(rowKey).push({ x, text: textValue });
      }

      const sortedRowKeys = [...groupedRows.keys()].sort((a, b) => {
        const leftY = Number(a.split(':')[1]);
        const rightY = Number(b.split(':')[1]);
        return leftY - rightY;
      });

      for (const rowKey of sortedRowKeys) {
        const cells = groupedRows.get(rowKey).sort((a, b) => a.x - b.x);
        const srCell = cells.find((cell) => cell.x >= 4 && cell.x < 5.9 && /^\d+$/.test(cell.text));
        if (!srCell) continue;

        const listSrNo = Number(srCell.text);
        if (!Number.isFinite(listSrNo) || listSrNo <= 0) continue;
        if (seenSr.has(listSrNo)) continue;

        const firstNameTokens = cells
          .filter((cell) => cell.x >= 8 && cell.x < 10.95)
          .map((cell) => cell.text)
          .filter((token) => !/^(first|name)$/i.test(token));

        const surnameTokens = cells
          .filter((cell) => cell.x >= 10.95 && cell.x < 13.35)
          .map((cell) => cell.text)
          .filter((token) => !/^surname$/i.test(token));

        const nameTokens = [...firstNameTokens, ...surnameTokens];

        if (nameTokens.length === 0) continue;

        const fullName = nameTokens.join(' ').replace(/\s+/g, ' ').trim();
        if (!fullName) continue;

        const countryCell = cells.find((cell) => cell.x >= 12.7 && cell.x < 15.3);
        const dobCell = cells.find((cell) => cell.x >= 16.5 && cell.x < 19.2);
        const ageCell = cells.find((cell) => cell.x >= 19.1 && cell.x < 20.4 && /^\d{1,2}$/.test(cell.text));
        const specialismCell = cells.find((cell) => cell.x >= 20.4 && cell.x < 23.2);
        const battingCell = cells.find((cell) => cell.x >= 23.2 && cell.x < 24.95);
        const bowlingCell = cells.find((cell) => cell.x >= 24.95 && cell.x < 29.2);
        const testCapsCell = cells.find((cell) => cell.x >= 29 && cell.x < 31 && /^\d+$/.test(cell.text));
        const odiCapsCell = cells.find((cell) => cell.x >= 31 && cell.x < 32.9 && /^\d+$/.test(cell.text));
        const t20CapsCell = cells.find((cell) => cell.x >= 32.9 && cell.x < 34.8 && /^\d+$/.test(cell.text));
        const iplCapsCell = cells.find((cell) => cell.x >= 34.8 && cell.x < 36.6 && /^\d+$/.test(cell.text));
        const season2022IplCell = cells.find((cell) => cell.x >= 43.2 && cell.x < 44.9 && /^\d+$/.test(cell.text));
        const cappedCell = cells.find((cell) => cell.x >= 44.8 && cell.x < 47.2);
        const reserveCell = cells.find((cell) => cell.x >= 47 && cell.x < 49 && /^\d+(\.\d+)?$/.test(cell.text));
        const reservePriceLakh = reserveCell ? Number(reserveCell.text) : NaN;
        const reservePriceCr = Number.isFinite(reservePriceLakh)
          ? Number((reservePriceLakh / 100).toFixed(2))
          : null;

        seenSr.add(listSrNo);
        rows.push({
          listSrNo,
          fullName,
          normalizedName: normalizePdfPlayerName(fullName),
          country: (countryCell?.text || 'India').trim(),
          dob: (dobCell?.text || '').trim() || undefined,
          age: ageCell ? Number(ageCell.text) : undefined,
          specialism: (specialismCell?.text || '').trim(),
          battingStyle: (battingCell?.text || '').trim() || undefined,
          bowlingStyle: (bowlingCell?.text || '').trim() || undefined,
          testCaps: testCapsCell ? Number(testCapsCell.text) : 0,
          odiCaps: odiCapsCell ? Number(odiCapsCell.text) : 0,
          t20Caps: t20CapsCell ? Number(t20CapsCell.text) : 0,
          iplCaps: iplCapsCell ? Number(iplCapsCell.text) : 0,
          season2022IplMatches: season2022IplCell ? Number(season2022IplCell.text) : 0,
          cappedStatus: /uncapped/i.test(cappedCell?.text || '') ? 'Uncapped' : 'Capped',
          reservePriceCr
        });
      }
    }

    rows.sort((a, b) => a.listSrNo - b.listSrNo);
    return rows;
  } catch (_err) {
    return [];
  }
}

function mapSpecialismToRole(specialism = '') {
  const value = String(specialism || '').toLowerCase();
  if (value.includes('all-rounder') || value.includes('all rounder')) return 'All-rounder';
  if (value.includes('wicket')) return 'Wicketkeeper';
  if (value.includes('bowler') || value.includes('spin') || value.includes('fast') || value.includes('medium')) return 'Bowler';
  return 'Batsman';
}

function expandBattingStyleCode(value = '') {
  const style = String(value || '').trim().toUpperCase();
  if (!style) return undefined;
  if (style === 'RHB') return 'Right-hand bat';
  if (style === 'LHB') return 'Left-hand bat';
  return String(value || '').trim();
}

function normalizeBowlingStyle(value = '') {
  const style = String(value || '').trim();
  if (!style || style === '-') return undefined;

  const titleCased = style
    .toLowerCase()
    .split(' ')
    .map((part) => {
      if (!part) return part;
      if (/^(arm|off|leg|slow|fast|medium|spin)$/.test(part)) {
        return part[0].toUpperCase() + part.slice(1);
      }
      return part[0].toUpperCase() + part.slice(1);
    })
    .join(' ');

  return titleCased;
}

function buildPdfProfileMap(pdfRows = []) {
  const profileMap = new Map();
  if (!Array.isArray(pdfRows) || pdfRows.length === 0) return profileMap;

  for (const row of pdfRows) {
    const normalizedName = normalizePdfPlayerName(row.fullName || row.normalizedName || '');
    if (!normalizedName) continue;

    profileMap.set(normalizedName, {
      age: Number.isFinite(Number(row.age)) ? Number(row.age) : undefined,
      battingStyle: expandBattingStyleCode(row.battingStyle),
      bowlingStyle: normalizeBowlingStyle(row.bowlingStyle),
      matches: Number.isFinite(Number(row.iplCaps)) ? Number(row.iplCaps) : undefined,
      iplCaps: Number.isFinite(Number(row.iplCaps)) ? Number(row.iplCaps) : 0,
      testCaps: Number.isFinite(Number(row.testCaps)) ? Number(row.testCaps) : 0,
      odiCaps: Number.isFinite(Number(row.odiCaps)) ? Number(row.odiCaps) : 0,
      t20Caps: Number.isFinite(Number(row.t20Caps)) ? Number(row.t20Caps) : 0,
      season2022IplMatches: Number.isFinite(Number(row.season2022IplMatches)) ? Number(row.season2022IplMatches) : 0,
      cappedStatus: row.cappedStatus || 'Capped',
      roleFromPdf: mapSpecialismToRole(row.specialism || '')
    });
  }

  return profileMap;
}

function inferTierFromReservePrice(basePrice = 0) {
  const price = Number(basePrice || 0);
  if (price >= 2) return 1;
  if (price >= 1) return 2;
  return 3;
}

function buildPlayerPoolFromPdfRows(pdfRows = []) {
  if (!Array.isArray(pdfRows) || pdfRows.length === 0) return [];

  const keyPlayerSet = loadKeyPlayerNameSet();

  return pdfRows.map((row, index) => {
    const role = mapSpecialismToRole(row.specialism);
    const basePrice = Number.isFinite(Number(row.reservePriceCr)) && Number(row.reservePriceCr) > 0
      ? Number(row.reservePriceCr)
      : 0.2;
    const normalizedName = normalizePdfPlayerName(row.fullName);

    return enrichPlayer({
      id: 500000 + Number(row.listSrNo || index + 1),
      name: row.fullName,
      role,
      country: row.country || 'India',
      basePrice,
      tier: inferTierFromReservePrice(basePrice),
      image: `${slugifyName(row.fullName)}.jpg`,
      stats: roleDefaultStats(role),
      cappedStatus: row.cappedStatus || 'Capped',
      isKeyPlayer: keyPlayerSet.has(normalizedName)
    }, index);
  });
}

function parseCsvLine(line = '') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function loadPlayerKeyPointsMap() {
  try {
    const csvPath = path.join(__dirname, 'data', 'player-key-points.csv');
    if (!fs.existsSync(csvPath)) return new Map();

    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    if (lines.length <= 1) return new Map();

    const headers = parseCsvLine(lines[0]);
    const byName = new Map();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length === 0) continue;

      const row = {};
      for (let h = 0; h < headers.length; h++) {
        row[headers[h]] = values[h] ?? '';
      }

      const name = String(row['Player Name'] || '').trim();
      const normalizedName = normalizePlayerName(name);
      if (!normalizedName) continue;

      const keyPoints = toOptionalNumber(row['Key Points']);
      const secretScore = keyPoints === undefined
        ? undefined
        : Math.max(0, Math.min(10, Math.floor(keyPoints / 10)));

      byName.set(normalizedName, {
        keyPoints: keyPoints ?? null,
        secretScore: secretScore ?? null,
        form: String(row.Form || '').trim() || null,
        marketTarget: toOptionalNumber(row['Market Target']) ?? null,
        marketMax: toOptionalNumber(row['Market Max']) ?? null,
        strengthScore: toOptionalNumber(row['Strength Score']) ?? null,
        roleBonus: toOptionalNumber(row['Role Bonus']) ?? null,
        formBonus: toOptionalNumber(row['Form Bonus']) ?? null,
        fameBonus: toOptionalNumber(row['Fame Bonus']) ?? null,
        mysteryBonus: toOptionalNumber(row['Mystery Bonus']) ?? null,
        revealStatus: String(row['Reveal Status'] || '').trim().toLowerCase() || 'hidden'
      });
    }

    return byName;
  } catch (_err) {
    return new Map();
  }
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value) {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function loadFiveSeasonPriceHistory() {
  try {
    const historyPath = path.join(__dirname, 'data', 'player-price-history-5-seasons.json');
    if (!fs.existsSync(historyPath)) return {};

    const raw = fs.readFileSync(historyPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized = {};
    for (const [name, values] of Object.entries(parsed)) {
      const key = normalizePlayerName(name);
      if (!key || !Array.isArray(values)) continue;

      const priceSeries = values
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry) && entry > 0)
        .slice(0, 5)
        .map((entry) => Number(entry.toFixed(2)));

      if (priceSeries.length > 0) {
        normalized[key] = priceSeries;
      }
    }

    return normalized;
  } catch (_err) {
    return {};
  }
}

const PLAYER_FIVE_SEASON_HISTORY = loadFiveSeasonPriceHistory();

function loadEightSeasonSoldHistory() {
  try {
    const historyPath = path.join(__dirname, 'data', 'ipl-name-sold-unsold.csv');
    if (!fs.existsSync(historyPath)) return {};

    const raw = fs.readFileSync(historyPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return {};

    const headers = parseCsvLine(lines[0]);
    const headerIndex = Object.fromEntries(headers.map((header, idx) => [header, idx]));
    const seasonColumns = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const loaded = {};

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const name = String(row[headerIndex['Player Name']] || '').trim();
      const key = normalizePlayerName(name);
      if (!key) continue;

      const soldPrices = seasonColumns
        .map((season) => Number(row[headerIndex[season]]))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Number(value.toFixed(2)));

      loaded[key] = {
        soldPrices,
        timesUnsold: Math.max(0, toSafeNumber(row[headerIndex['Times Unsold']], 0))
      };
    }

    return loaded;
  } catch (_err) {
    return {};
  }
}

const PLAYER_EIGHT_SEASON_HISTORY = loadEightSeasonSoldHistory();

function loadPlayerMarketValues() {
  try {
    const marketPath = path.join(__dirname, 'data', 'player-market-values-2021-2025.json');
    if (!fs.existsSync(marketPath)) return {};

    const raw = fs.readFileSync(marketPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized = {};
    for (const [name, payload] of Object.entries(parsed)) {
      const key = normalizePlayerName(name);
      if (!key || !payload || typeof payload !== 'object') continue;

      const min = Number(payload.min);
      const target = Number(payload.target);
      const max = Number(payload.max);
      const timesUnsold = Math.max(0, toSafeNumber(payload.timesUnsold, 0));
      const soldSeasons = Array.isArray(payload.soldSeasons)
        ? payload.soldSeasons.filter((value) => Number.isFinite(Number(value)))
        : [];

      if (!Number.isFinite(min) || !Number.isFinite(target) || !Number.isFinite(max)) continue;
      if (min <= 0 || target <= 0 || max <= 0) continue;

      normalized[key] = {
        min: Number(min.toFixed(2)),
        target: Number(target.toFixed(2)),
        max: Number(max.toFixed(2)),
        timesUnsold,
        soldSeasonsCount: soldSeasons.length
      };
    }

    return normalized;
  } catch (_err) {
    return {};
  }
}

const PLAYER_MARKET_VALUES = loadPlayerMarketValues();

function normalizeCsvRole(role = '') {
  const value = String(role || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (value === 'batter') return 'Batsman';
  if (value.includes('all-rounder') || value.includes('all rounder')) return 'All-rounder';
  if (value.includes('wicket')) return 'Wicketkeeper';
  if (value.includes('bowl')) return 'Bowler';
  return 'Batsman';
}

function normalizeCsvTier(rawTier = '', basePrice = 0) {
  const tier = String(rawTier || '').toLowerCase().trim();
  if (tier === 'elite') return 1;
  if (tier === 'pro') return 2;
  return inferTierFromReservePrice(basePrice);
}

function normalizeCsvImage(imageValue = '', playerName = '') {
  const raw = String(imageValue || '').trim();
  if (!raw) return `${slugifyName(playerName)}.svg`;

  const pieces = raw.split('/').filter(Boolean);
  const fileName = pieces.length > 0 ? pieces[pieces.length - 1] : raw;
  return fileName || `${slugifyName(playerName)}.svg`;
}

function extractCsvAuctionRows() {
  try {
    const preferredPaths = [
      path.join(__dirname, 'data', 'all-player-list.csv'),
      path.join(__dirname, 'data', '_source_ipl_618.csv'),
      path.join(__dirname, 'data', 'ipl-allplayers-list-deduped.csv'),
      path.join(__dirname, 'data', 'ipl_2023_real_300_players.csv')
    ];

    for (const csvPath of preferredPaths) {
      if (!fs.existsSync(csvPath)) continue;

      const raw = fs.readFileSync(csvPath, 'utf8');
      const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));

      if (lines.length <= 1) continue;

      const isTabSeparated = lines[0].includes('\t');
      const parseLine = (line) => {
        if (isTabSeparated) {
          return line.split('\t').map((part) => String(part || '').trim());
        }
        return parseCsvLine(line).map((part) => String(part || '').trim());
      };

      const headers = parseLine(lines[0]);
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length === 0) continue;

        const record = {};
        for (let h = 0; h < headers.length; h++) {
          record[headers[h]] = values[h] ?? '';
        }

        const name = String(record['Player Name'] || '').trim().toLowerCase();
        if (!name || name === 'player name') continue;
        rows.push(record);
      }

      if (rows.length > 0) {
        return rows;
      }
    }

    return [];
  } catch (_err) {
    return [];
  }
}

function parseSeasonListValue(raw = '') {
  const text = String(raw || '').replace(/"/g, '').trim();
  if (!text) return [];
  return text
    .split(',')
    .map((value) => Number(String(value || '').trim()))
    .filter((value) => Number.isFinite(value));
}

function parseAuctionPriceValue(raw = '') {
  const text = String(raw || '').trim().toUpperCase();
  if (!text || text === 'U' || text === 'NA') return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
}

function loadFinalPlayerSourceMap() {
  try {
    const sourcePath = path.join(__dirname, 'data', 'final-player-source.csv');
    if (!fs.existsSync(sourcePath)) return new Map();

    const raw = fs.readFileSync(sourcePath, 'utf8');
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
    if (lines.length <= 1) return new Map();

    const headers = parseCsvLine(lines[0]).map((part) => String(part || '').trim());
    const byName = new Map();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]).map((part) => String(part || '').trim());
      if (values.length === 0) continue;

      const row = {};
      for (let h = 0; h < headers.length; h++) {
        row[headers[h]] = values[h] ?? '';
      }

      const name = String(row['Player Name'] || '').trim();
      if (!name) continue;

      const normalizedName = normalizePdfPlayerName(name);
      if (!normalizedName) continue;

      byName.set(normalizedName, {
        sourceOrder: toSafeNumber(row['Source Order'], 0),
        pricesByYear: {
          2021: parseAuctionPriceValue(row['2021 Price (Cr)']),
          2022: parseAuctionPriceValue(row['2022 Price (Cr)']),
          2023: parseAuctionPriceValue(row['2023 Price (Cr)']),
          2024: parseAuctionPriceValue(row['2024 Price (Cr)']),
          2025: parseAuctionPriceValue(row['2025 Price (Cr)'])
        },
        market: {
          min: parseAuctionPriceValue(row['Market Min']),
          target: parseAuctionPriceValue(row['Market Target']),
          max: parseAuctionPriceValue(row['Market Max'])
        },
        soldSeasons: parseSeasonListValue(row['Sold Seasons']),
        retainedSeasons: parseSeasonListValue(row['Retained Seasons']),
        soldSeasonsCount: toSafeNumber(row['Sold Seasons Count'], 0),
        retainedSeasonsCount: toSafeNumber(row['Retained Seasons Count'], 0),
        timesUnsold: toSafeNumber(row['Times Unsold'], 0)
      });
    }

    return byName;
  } catch (_err) {
    return new Map();
  }
}

const FINAL_PLAYER_SOURCE_MAP = loadFinalPlayerSourceMap();

const pdfAuctionRows = extractPdfAuctionRows();
const PDF_PROFILE_MAP = buildPdfProfileMap(pdfAuctionRows);

function buildPlayerPoolFromCsvRows(csvRows = []) {
  if (!Array.isArray(csvRows) || csvRows.length === 0) return [];

  const keyPlayerSet = loadKeyPlayerNameSet();

  return csvRows.map((row, index) => {
    const name = String(row['Player Name'] || '').trim();
    const normalizedName = normalizePdfPlayerName(name);
    const pdfProfile = PDF_PROFILE_MAP.get(normalizedName) || {};
    const finalSource = FINAL_PLAYER_SOURCE_MAP.get(normalizedName) || {};
    const role = row.Role
      ? normalizeCsvRole(row.Role)
      : (pdfProfile.roleFromPdf || 'Batsman');
    const basePriceRaw = row['Base Price (Cr)'] ?? row['Base Price(In Cr)'] ?? row['Base Price'] ?? 0.2;
    const basePrice = Number(toSafeNumber(basePriceRaw, 0.2).toFixed(2));
    const stats = {};
    const optionalStats = {
      matches: toOptionalNumber(row.Matches) ?? pdfProfile.matches,
      runs: toOptionalNumber(row.Runs),
      average: toOptionalNumber(row.Average),
      strikeRate: toOptionalNumber(row['Strike Rate']),
      hundreds: toOptionalNumber(row['100s']),
      fifties: toOptionalNumber(row['50s']),
      wickets: toOptionalNumber(row.Wickets),
      economy: toOptionalNumber(row.Economy)
    };
    for (const [key, value] of Object.entries(optionalStats)) {
      if (value !== undefined) stats[key] = value;
    }

    const capsStats = {
      iplCaps: toOptionalNumber(pdfProfile.iplCaps),
      t20Caps: toOptionalNumber(pdfProfile.t20Caps),
      odiCaps: toOptionalNumber(pdfProfile.odiCaps),
      testCaps: toOptionalNumber(pdfProfile.testCaps),
      lastSeasonMatches: toOptionalNumber(pdfProfile.season2022IplMatches)
    };
    for (const [key, value] of Object.entries(capsStats)) {
      if (value !== undefined) stats[key] = value;
    }

    const category = String(row.Category || '').toLowerCase();
    const csvCappedStatus = String(row['Capped Status'] || '').trim();
    const cappedStatus = csvCappedStatus || (category.includes('uncapped') ? 'Uncapped' : (pdfProfile.cappedStatus || 'Capped'));
    const isKeyPlayer = category.includes('key player') || keyPlayerSet.has(normalizedName);
    const normalizedRole = String(role || '').trim().toLowerCase();
    const roleCategory = normalizedRole === 'wicketkeeper'
      ? 'Wicketkeepers'
      : (normalizedRole === 'all-rounder'
        ? 'All-rounders'
        : (normalizedRole === 'bowler' ? 'Bowlers' : 'Batters'));
    const csvPrimaryCategory = String(row['Primary Auction Category'] || '').trim();
    const csvAuctionTags = String(row['Auction Tags'] || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);
    const derivedAuctionTags = [
      isKeyPlayer ? 'Marquee Players' : null,
      cappedStatus === 'Uncapped' ? 'Uncapped Players' : 'Capped Players',
      roleCategory
    ].filter(Boolean);
    const auctionTags = csvAuctionTags.length ? csvAuctionTags : derivedAuctionTags;
    const auctionPrimaryCategory = csvPrimaryCategory || (isKeyPlayer ? 'Marquee Players' : roleCategory);
    const pricesByYear = finalSource.pricesByYear || {};
    const latestAuctionPrice = pricesByYear[2025] ?? pricesByYear[2024] ?? pricesByYear[2023] ?? null;

    return enrichPlayer({
      id: 700000 + index + 1,
      name,
      role,
      country: String(row.Country || 'India').trim() || 'India',
      basePrice,
      tier: normalizeCsvTier(row.Tier, basePrice),
      image: normalizeCsvImage(row.Image, name),
      stats,
      profile: {
        age: toOptionalNumber(row.Age) ?? pdfProfile.age,
        battingStyle: String(row['Batting Style'] || '').trim() || pdfProfile.battingStyle,
        bowlingStyle: String(row['Bowling Style'] || '').trim() || pdfProfile.bowlingStyle,
        form: String(row.Form || '').trim() || undefined,
        cappedStatus,
        lastSeasonRuns: toOptionalNumber(row.Runs),
        lastSeasonWickets: toOptionalNumber(row.Wickets),
        iplCaps: toOptionalNumber(pdfProfile.iplCaps),
        t20Caps: toOptionalNumber(pdfProfile.t20Caps),
        odiCaps: toOptionalNumber(pdfProfile.odiCaps),
        testCaps: toOptionalNumber(pdfProfile.testCaps),
        season2022IplMatches: toOptionalNumber(pdfProfile.season2022IplMatches),
        latestAuctionPrice: latestAuctionPrice ?? undefined
      },
      auctionHistory: {
        sourceOrder: finalSource.sourceOrder || null,
        pricesByYear: {
          2021: pricesByYear[2021] ?? null,
          2022: pricesByYear[2022] ?? null,
          2023: pricesByYear[2023] ?? null,
          2024: pricesByYear[2024] ?? null,
          2025: pricesByYear[2025] ?? null
        },
        market: {
          min: finalSource.market?.min ?? null,
          target: finalSource.market?.target ?? null,
          max: finalSource.market?.max ?? null
        },
        soldSeasons: Array.isArray(finalSource.soldSeasons) ? finalSource.soldSeasons : [],
        retainedSeasons: Array.isArray(finalSource.retainedSeasons) ? finalSource.retainedSeasons : [],
        soldSeasonsCount: toSafeNumber(finalSource.soldSeasonsCount, 0),
        retainedSeasonsCount: toSafeNumber(finalSource.retainedSeasonsCount, 0),
        timesUnsold: toSafeNumber(finalSource.timesUnsold, 0)
      },
      cappedStatus,
      isKeyPlayer,
      auctionPrimaryCategory,
      auctionTags
    }, index);
  });
}

const csvAuctionRows = extractCsvAuctionRows();
const csvBasedPool = buildPlayerPoolFromCsvRows(csvAuctionRows);
const PLAYER_KEY_POINTS_MAP = loadPlayerKeyPointsMap();

// Combine all players
const allPlayers = csvBasedPool;
const allPlayersByNormalizedName = new Map(
  allPlayers.map((player) => [normalizePlayerName(player.name), player])
);
if (csvBasedPool.length > 0) {
  console.log(`[CSV AUCTION LIST] Loaded ${csvBasedPool.length} players from CSV auction list file.`);
  console.log(`[CSV AUCTION LIST] Final source links loaded for ${FINAL_PLAYER_SOURCE_MAP.size} players from final-player-source.csv.`);
  console.log(`[CSV AUCTION LIST] Player key-point scores loaded for ${PLAYER_KEY_POINTS_MAP.size} players from player-key-points.csv.`);
} else {
  console.warn('[CSV AUCTION LIST] No players loaded. Please provide data/all-player-list.csv.');
}

// Active rooms storage
const activeRooms = new Map();
const MAX_DISPLAY_NAME_LENGTH = 24;
const MAX_ROOM_NAME_LENGTH = 28;
const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_CHAT_MESSAGE_LENGTH = 280;
const MAX_PLAYERS_PER_ROOM = 12;
const ROOM_IDLE_CLEANUP_MS = 30 * 60 * 1000;
const MIN_SQUAD_SIZE_FOR_PLAYING_XI = 18;
const PLAYING_XI_SIZE = 11;
const MAX_PLAYING_XI_OVERSEAS = 4;

function buildInitialAvailablePlayers() {
  return JSON.parse(JSON.stringify(allPlayers));
}

function getRoomAvailablePlayers(room) {
  if (!room.availablePlayers) {
    room.availablePlayers = buildInitialAvailablePlayers();
  }

  const soldOrClosedNames = new Set([
    ...(room.soldPlayers || []).map((player) => normalizePlayerName(player?.name)),
    ...(room.unsoldPlayers || []).map((player) => normalizePlayerName(player?.name)),
    normalizePlayerName(room.currentPlayer?.name)
  ].filter(Boolean));

  const currentAvailableMap = new Map();
  for (const player of room.availablePlayers || []) {
    const normalized = normalizePlayerName(player?.name);
    if (!normalized || soldOrClosedNames.has(normalized)) continue;
    currentAvailableMap.set(normalized, player);
  }

  for (const masterPlayer of allPlayers) {
    const normalized = normalizePlayerName(masterPlayer?.name);
    if (!normalized || soldOrClosedNames.has(normalized) || currentAvailableMap.has(normalized)) continue;
    currentAvailableMap.set(normalized, JSON.parse(JSON.stringify(masterPlayer)));
  }

  room.availablePlayers = Array.from(currentAvailableMap.values()).map((player) => {
    const masterPlayer = allPlayersByNormalizedName.get(normalizePlayerName(player?.name));
    if (!masterPlayer) return player;

    return {
      ...masterPlayer,
      ...player,
      cappedStatus: masterPlayer.cappedStatus || player.cappedStatus,
      auctionPrimaryCategory: masterPlayer.auctionPrimaryCategory || player.auctionPrimaryCategory,
      auctionTags: Array.isArray(masterPlayer.auctionTags) ? [...masterPlayer.auctionTags] : (player.auctionTags || []),
      profile: {
        ...(masterPlayer.profile || {}),
        ...(player.profile || {}),
        cappedStatus: masterPlayer.cappedStatus || player?.profile?.cappedStatus
      }
    };
  });

  return room.availablePlayers;
}

function mergePlayerWithMasterData(player = {}) {
  const normalized = normalizePlayerName(player?.name);
  const masterPlayer = allPlayersByNormalizedName.get(normalized);
  if (!masterPlayer) {
    return JSON.parse(JSON.stringify(player || {}));
  }

  const mergedAuctionHistory = {
    ...(masterPlayer.auctionHistory || {}),
    ...(player.auctionHistory || {})
  };
  mergedAuctionHistory.pricesByYear = {
    ...((masterPlayer.auctionHistory && masterPlayer.auctionHistory.pricesByYear) || {}),
    ...((player.auctionHistory && player.auctionHistory.pricesByYear) || {})
  };

  return {
    ...masterPlayer,
    ...player,
    stats: {
      ...(masterPlayer.stats || {}),
      ...(player.stats || {})
    },
    profile: {
      ...(masterPlayer.profile || {}),
      ...(player.profile || {})
    },
    auctionHistory: mergedAuctionHistory
  };
}

function buildTeamDashboardSnapshot(room, teamCode, viewerTeamCode = null) {
  const team = room?.teams?.[teamCode];
  if (!team) return null;
  const canViewSecretValue = Boolean(viewerTeamCode) && viewerTeamCode === teamCode;

  return {
    ...team,
    players: (team.players || []).map((player) => {
      const playerData = mergePlayerWithMasterData(player);
      const keyPointEntry = PLAYER_KEY_POINTS_MAP.get(normalizePlayerName(playerData?.name || player?.name || '')) || null;
      const secretScore = Number.isFinite(Number(keyPointEntry?.secretScore))
        ? Number(keyPointEntry.secretScore)
        : null;

      return {
        ...player,
        image: playerData.image || player.image || null,
        basePrice: Number.isFinite(Number(playerData.basePrice)) ? Number(playerData.basePrice) : null,
        tier: Number.isFinite(Number(playerData.tier)) ? Number(playerData.tier) : null,
        stats: playerData.stats || {},
        profile: playerData.profile || {},
        auctionHistory: playerData.auctionHistory || {},
        secretScore: canViewSecretValue && Number.isFinite(secretScore) ? secretScore : null,
        secretScoreHidden: !canViewSecretValue,
        secretInsights: canViewSecretValue && keyPointEntry ? {
          form: keyPointEntry.form,
          marketTarget: keyPointEntry.marketTarget,
          marketMax: keyPointEntry.marketMax,
          strengthScore: keyPointEntry.strengthScore,
          roleBonus: keyPointEntry.roleBonus,
          formBonus: keyPointEntry.formBonus,
          fameBonus: keyPointEntry.fameBonus,
          mysteryBonus: keyPointEntry.mysteryBonus,
          revealStatus: keyPointEntry.revealStatus
        } : null,
        secretInsightsHidden: !canViewSecretValue && Boolean(keyPointEntry)
      };
    })
  };
}

function buildAllTeamsDashboardSnapshot(room, viewerTeamCode = null) {
  const teams = {};
  for (const teamCode of Object.keys(room?.teams || {})) {
    teams[teamCode] = buildTeamDashboardSnapshot(room, teamCode, viewerTeamCode);
  }
  return teams;
}

function sanitizeDisplayName(raw = '') {
  const normalized = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

function sanitizeRoomName(raw = '') {
  const normalized = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.replace(/[^A-Za-z0-9 _-]/g, '').slice(0, MAX_ROOM_NAME_LENGTH);
}

function sanitizeChatMessage(raw = '') {
  const normalized = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.slice(0, MAX_CHAT_MESSAGE_LENGTH);
}

function normalizeRoomCode(rawCode = '') {
  return String(rawCode)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

function generateRoomCode(length = ROOM_CODE_LENGTH) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += ROOM_CODE_ALPHABET[crypto.randomInt(0, ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const code = generateRoomCode();
    if (!activeRooms.has(code)) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique room code right now.');
}

function findPlayerByName(room, playerName) {
  const normalizedName = String(playerName || '').trim().toLowerCase();
  if (!normalizedName) return null;
  return room.players.find((p) => String(p.name || '').trim().toLowerCase() === normalizedName) || null;
}

function findPlayerBySocketId(room, socketId) {
  return room.players.find((p) => p.id === socketId) || null;
}

function getSocketTeamCode(room, socketId) {
  const player = findPlayerBySocketId(room, socketId);
  return player?.team || null;
}

function buildPlayersSnapshot(room) {
  return (room.players || []).map((player) => ({
    ...player,
    isAuctioneer: player.id === room.auctioneer
  }));
}

function clearPlayerTeamAssignment(room, player) {
  if (!room || !player || !player.team) return false;

  const teamCode = String(player.team || '').trim().toUpperCase();
  const team = room.teams ? room.teams[teamCode] : null;
  if (team && team.socketId === player.id) {
    team.socketId = null;
  }

  player.team = null;
  return true;
}

function ensureManualAuctioneerControlOnly(room) {
  if (!room || normalizeRoomMode(room.mode) !== ROOM_MODES.MANUAL) return false;

  const auctioneerPlayer = findPlayerBySocketId(room, room.auctioneer);
  return clearPlayerTeamAssignment(room, auctioneerPlayer);
}

function clearPendingRemoval(room, playerName) {
  if (!room.pendingRemovals) room.pendingRemovals = {};

  const key = String(playerName || '').trim().toLowerCase();
  if (!key) return;

  if (room.pendingRemovals[key]) {
    clearTimeout(room.pendingRemovals[key]);
    delete room.pendingRemovals[key];
  }
}

function clearRoomCleanupTimeout(room) {
  if (!room?.cleanupTimeout) return;
  clearTimeout(room.cleanupTimeout);
  room.cleanupTimeout = null;
}

function scheduleRoomCleanup(roomCode, room) {
  clearRoomCleanupTimeout(room);
  room.cleanupTimeout = setTimeout(() => {
    const latestRoom = activeRooms.get(roomCode);
    if (!latestRoom) return;

    const hasConnectedPlayers = latestRoom.players.some((p) => p.connected !== false);
    if (hasConnectedPlayers) {
      clearRoomCleanupTimeout(latestRoom);
      return;
    }

    if (latestRoom.timer) clearInterval(latestRoom.timer);
    clearAIBidTimeout(latestRoom);
    activeRooms.delete(roomCode);
    console.log(`[ROOM CLEANUP] Removed idle room ${roomCode}`);
  }, ROOM_IDLE_CLEANUP_MS);
}

function attachSocketToRoomPlayer(room, socket, playerName) {
  const safeName = String(playerName || '').trim() || 'Player';
  let player = findPlayerByName(room, safeName);

  clearRoomCleanupTimeout(room);

  if (!player) {
    player = { id: socket.id, name: safeName, team: null, connected: true };
    room.players.push(player);
    return player;
  }

  clearPendingRemoval(room, player.name);
  const oldSocketId = player.id;
  player.id = socket.id;
  player.connected = true;

  if (room.auctioneer === oldSocketId) {
    room.auctioneer = socket.id;
  }

  if (player.team && room.teams[player.team]) {
    const team = room.teams[player.team];
    if (!team.socketId || team.socketId === oldSocketId) {
      team.socketId = socket.id;
    }
    socket.team = player.team;
  }

  return player;
}

function buildFreshTeams() {
  const freshTeams = {};

  for (const [code, template] of Object.entries(teamsData)) {
    freshTeams[code] = {
      name: template.name,
      shortCode: template.shortCode,
      purse: template.purse,
      players: [],
      overseasCount: 0,
      totalPlayers: 0,
      socketId: null
    };
  }

  return freshTeams;
}

function clearAIBidTimeout(room) {
  if (!room.aiBidTimeout) return;
  clearTimeout(room.aiBidTimeout);
  room.aiBidTimeout = null;
}

function getPostBidTimeLeft(room, defaultReset = 10) {
  if (!room.fastTrackEndAt) return defaultReset;

  const remainingMs = room.fastTrackEndAt - Date.now();
  if (remainingMs <= 0) return 1;

  return Math.max(1, Math.ceil(remainingMs / 1000));
}

function recordCurrentBid(room, teamCode, bidAmount) {
  if (!room) return;
  if (!Array.isArray(room.currentBidHistory)) {
    room.currentBidHistory = [];
  }

  room.currentBidHistory.push({
    team: teamCode,
    bid: Number(bidAmount || 0),
    at: Date.now()
  });
}

function rebuildAuctionLeaderAfterSkip(room) {
  if (!room || !room.currentPlayer) return null;

  const skippedTeams = room.currentPlayerSkippedTeams || {};
  const history = Array.isArray(room.currentBidHistory) ? room.currentBidHistory : [];
  const fallbackEntry = [...history].reverse().find((entry) => entry && entry.team && !skippedTeams[entry.team]);

  if (fallbackEntry) {
    room.currentPlayer.currentBid = Number(fallbackEntry.bid || room.currentPlayer.basePrice || 0.2);
    room.currentHighestBidder = fallbackEntry.team;
    return {
      team: fallbackEntry.team,
      bid: room.currentPlayer.currentBid
    };
  }

  room.currentPlayer.currentBid = Number(room.currentPlayer.basePrice || 0.2);
  room.currentHighestBidder = null;
  return {
    team: null,
    bid: room.currentPlayer.currentBid
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const ROOM_MODES = {
  MANUAL: 'manual',
  AI: 'ai'
};

const ROOM_PHASES = {
  AUCTION: 'auction',
  PLAYING_XI: 'playing11'
};

const LEGACY_AI_TRAINER_MODE = 'ai_trainer';

function normalizeRoomMode(mode = '') {
  const normalized = String(mode || '').toLowerCase();
  if (normalized === LEGACY_AI_TRAINER_MODE) {
    return ROOM_MODES.AI;
  }
  if (normalized === ROOM_MODES.AI) {
    return ROOM_MODES.AI;
  }
  return ROOM_MODES.MANUAL;
}

function isAIMode(mode) {
  return normalizeRoomMode(mode) === ROOM_MODES.AI;
}

function getTeamOwnerDisplayName(room, teamCode) {
  const owner = (room?.players || []).find((player) => String(player.team || '').toUpperCase() === String(teamCode || '').toUpperCase());
  if (owner && owner.name) return owner.name;
  return isAIMode(room?.mode) ? 'AI Team' : 'Open Team';
}

function getCompetitionTeamCodes(room) {
  const teamCodes = Object.keys(room?.teams || {});
  if (teamCodes.length === 0) return [];

  if (isAIMode(room?.mode)) {
    return teamCodes;
  }

  const humanTeamCodes = teamCodes.filter((teamCode) => Boolean(room.teams?.[teamCode]?.socketId));
  return humanTeamCodes.length > 0 ? humanTeamCodes : teamCodes;
}

function getPlayerSecretScoreForRanking(player = {}) {
  const entry = PLAYER_KEY_POINTS_MAP.get(normalizePlayerName(player?.name || '')) || null;
  const mappedScore = Number(entry?.secretScore);
  if (Number.isFinite(mappedScore)) {
    return clamp(Math.round(mappedScore), 0, 10);
  }

  const directScore = Number(player?.secretScore);
  if (Number.isFinite(directScore)) {
    return clamp(Math.round(directScore), 0, 10);
  }

  return 5;
}

function classifyPlayingXIRole(player = {}) {
  const roleText = String(player?.role || '').trim().toLowerCase();
  if (roleText.includes('wicket')) return 'wicketkeeper';
  if (roleText.includes('all')) return 'allrounder';
  if (roleText.includes('bowl')) return 'bowler';
  return 'batter';
}

function isOverseasPlayer(player = {}) {
  return String(player?.country || '').trim().toLowerCase() !== 'india';
}

function buildRankableSquadPlayer(player = {}) {
  const merged = mergePlayerWithMasterData(player);
  return {
    ...merged,
    secretScoreForRank: getPlayerSecretScoreForRanking(merged),
    playingXIRole: classifyPlayingXIRole(merged),
    isOverseas: isOverseasPlayer(merged)
  };
}

function sortPlayersForPlayingXI(players = []) {
  return [...players].sort((left, right) => {
    if (right.secretScoreForRank !== left.secretScoreForRank) {
      return right.secretScoreForRank - left.secretScoreForRank;
    }
    const rightPrice = Number(right.price || 0);
    const leftPrice = Number(left.price || 0);
    if (rightPrice !== leftPrice) {
      return rightPrice - leftPrice;
    }
    return String(left.name || '').localeCompare(String(right.name || ''));
  });
}

function buildRecommendedPlayingXIPlayerIds(room, teamCode) {
  const team = room?.teams?.[teamCode];
  if (!team) return [];

  const squad = sortPlayersForPlayingXI((team.players || []).map((player) => buildRankableSquadPlayer(player)));
  if (squad.length <= PLAYING_XI_SIZE) {
    return squad.map((player) => player.id).slice(0, PLAYING_XI_SIZE);
  }

  const chosen = [];
  const chosenIds = new Set();

  const choosePlayers = (predicate, count) => {
    for (const player of squad) {
      if (chosen.length >= PLAYING_XI_SIZE) break;
      if (chosenIds.has(player.id) || !predicate(player)) continue;
      chosen.push(player);
      chosenIds.add(player.id);
      if (chosen.filter(predicate).length >= count) break;
    }
  };

  choosePlayers((player) => player.playingXIRole === 'wicketkeeper', 1);
  choosePlayers((player) => player.playingXIRole === 'batter', 3);
  choosePlayers((player) => player.playingXIRole === 'allrounder', 1);
  choosePlayers((player) => player.playingXIRole === 'bowler', 3);

  for (const player of squad) {
    if (chosen.length >= PLAYING_XI_SIZE) break;
    if (chosenIds.has(player.id)) continue;
    chosen.push(player);
    chosenIds.add(player.id);
  }

  let overseasCount = chosen.filter((player) => player.isOverseas).length;
  if (overseasCount > MAX_PLAYING_XI_OVERSEAS) {
    const domesticBench = squad.filter((player) => !chosenIds.has(player.id) && !player.isOverseas);
    const chosenOverseas = chosen
      .filter((player) => player.isOverseas)
      .sort((left, right) => left.secretScoreForRank - right.secretScoreForRank);

    for (const overseasPlayer of chosenOverseas) {
      if (overseasCount <= MAX_PLAYING_XI_OVERSEAS) break;
      const replacement = domesticBench.shift();
      if (!replacement) break;

      const index = chosen.findIndex((player) => player.id === overseasPlayer.id);
      if (index === -1) continue;

      chosen[index] = replacement;
      chosenIds.delete(overseasPlayer.id);
      chosenIds.add(replacement.id);
      overseasCount -= 1;
    }
  }

  return chosen.slice(0, PLAYING_XI_SIZE).map((player) => player.id);
}

function validatePlayingXISelection(room, teamCode, playerIds) {
  const team = room?.teams?.[teamCode];
  if (!team) {
    return { valid: false, reason: 'Team not found.' };
  }

  const normalizedIds = Array.isArray(playerIds)
    ? playerIds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  if (normalizedIds.length !== PLAYING_XI_SIZE) {
    return { valid: false, reason: `Select exactly ${PLAYING_XI_SIZE} players for Playing XI.` };
  }

  if (new Set(normalizedIds).size !== PLAYING_XI_SIZE) {
    return { valid: false, reason: 'Playing XI cannot contain duplicate players.' };
  }

  const squadById = new Map((team.players || []).map((player) => [Number(player.id), buildRankableSquadPlayer(player)]));
  const selectedPlayers = normalizedIds.map((playerId) => squadById.get(playerId)).filter(Boolean);
  if (selectedPlayers.length !== PLAYING_XI_SIZE) {
    return { valid: false, reason: 'Choose players only from your own squad.' };
  }

  const overseasCount = selectedPlayers.filter((player) => player.isOverseas).length;
  if (overseasCount > MAX_PLAYING_XI_OVERSEAS) {
    return { valid: false, reason: `Playing XI allows only ${MAX_PLAYING_XI_OVERSEAS} overseas players.` };
  }

  return {
    valid: true,
    playerIds: normalizedIds,
    players: selectedPlayers
  };
}

function scorePlayingXI(players = []) {
  const roleCounts = {
    wicketkeepers: 0,
    batters: 0,
    allrounders: 0,
    bowlers: 0,
    overseas: 0
  };

  let secretTotal = 0;
  for (const player of players) {
    secretTotal += Number(player.secretScoreForRank || 0);
    if (player.playingXIRole === 'wicketkeeper') roleCounts.wicketkeepers += 1;
    if (player.playingXIRole === 'batter') roleCounts.batters += 1;
    if (player.playingXIRole === 'allrounder') roleCounts.allrounders += 1;
    if (player.playingXIRole === 'bowler') roleCounts.bowlers += 1;
    if (player.isOverseas) roleCounts.overseas += 1;
  }

  let bonus = 0;
  let penalty = 0;

  if (roleCounts.wicketkeepers >= 1) bonus += 10;
  else penalty += 30;

  if (roleCounts.batters >= 3 && roleCounts.batters <= 5) bonus += 10;
  else if (roleCounts.batters < 3) penalty += 20;

  if (roleCounts.allrounders >= 1 && roleCounts.allrounders <= 3) bonus += 10;
  else if (roleCounts.allrounders === 0) penalty += 10;

  if (roleCounts.bowlers >= 3 && roleCounts.bowlers <= 5) bonus += 10;
  else if (roleCounts.bowlers < 3) penalty += 20;

  if (roleCounts.overseas <= MAX_PLAYING_XI_OVERSEAS) bonus += 10;
  else penalty += 40;

  return {
    secretTotal,
    bonus,
    penalty,
    finalScore: secretTotal + bonus - penalty,
    roleCounts
  };
}

function allCompetitionTeamsLocked(room) {
  const competitionTeamCodes = room?.playingXICompetitionTeams || getCompetitionTeamCodes(room);
  if (competitionTeamCodes.length === 0) return false;
  return competitionTeamCodes.every((teamCode) => Boolean(room?.playingXISelections?.[teamCode]?.locked));
}

function computePlayingXIRankings(room) {
  const competitionTeamCodes = room?.playingXICompetitionTeams || getCompetitionTeamCodes(room);
  const rankings = competitionTeamCodes
    .map((teamCode) => {
      const selection = room?.playingXISelections?.[teamCode];
      if (!selection || !selection.locked) return null;

      const validation = validatePlayingXISelection(room, teamCode, selection.playerIds || []);
      if (!validation.valid) return null;

      const score = scorePlayingXI(validation.players);
      return {
        teamCode,
        teamName: room.teams?.[teamCode]?.name || teamCode,
        ownerName: getTeamOwnerDisplayName(room, teamCode),
        finalScore: score.finalScore,
        secretTotal: score.secretTotal,
        bonus: score.bonus,
        penalty: score.penalty,
        roleCounts: score.roleCounts,
        players: validation.players.map((player) => ({
          id: player.id,
          name: player.name,
          role: player.role,
          country: player.country,
          price: Number(player.price || 0),
          image: player.image || null
        }))
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.finalScore !== left.finalScore) return right.finalScore - left.finalScore;
      if (right.secretTotal !== left.secretTotal) return right.secretTotal - left.secretTotal;
      if (left.penalty !== right.penalty) return left.penalty - right.penalty;
      return left.teamCode.localeCompare(right.teamCode);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      label: index === 0 ? 'Winner' : (index === 1 ? 'Runner-up' : `Rank ${index + 1}`)
    }));

  room.rankings = rankings;
  return rankings;
}

function buildPlayingXISnapshot(room, viewerSocketId) {
  const viewerTeamCode = getSocketTeamCode(room, viewerSocketId);
  const viewerIsAuctioneer = room?.auctioneer === viewerSocketId;
  const competitionTeamCodes = room?.playingXICompetitionTeams || getCompetitionTeamCodes(room);
  const allLocked = allCompetitionTeamsLocked(room);
  const rankings = allLocked ? (room.rankings?.length ? room.rankings : computePlayingXIRankings(room)) : [];

  return {
    roomCode: room?.code || '',
    roomName: room?.name || room?.code || '',
    mode: normalizeRoomMode(room?.mode),
    phase: room?.phase || ROOM_PHASES.AUCTION,
    viewerTeamCode,
    viewerIsAuctioneer,
    competitionTeamCodes,
    allTeamsLocked: allLocked,
    minSquadSize: MIN_SQUAD_SIZE_FOR_PLAYING_XI,
    playingXISize: PLAYING_XI_SIZE,
    maxOverseas: MAX_PLAYING_XI_OVERSEAS,
    rankings,
    teams: competitionTeamCodes.map((teamCode) => {
      const team = room?.teams?.[teamCode] || {};
      const teamSnapshot = buildTeamDashboardSnapshot(room, teamCode, viewerTeamCode) || { players: [] };
      const selection = room?.playingXISelections?.[teamCode] || { playerIds: [], locked: false, autoFilled: false };
      const selectedIdSet = new Set((selection.playerIds || []).map((value) => Number(value)));
      const selectedPlayers = teamSnapshot.players.filter((player) => selectedIdSet.has(Number(player.id)));
      const canViewSelection = allLocked || viewerIsAuctioneer || viewerTeamCode === teamCode;

      return {
        code: teamCode,
        name: team.name || teamCode,
        ownerName: getTeamOwnerDisplayName(room, teamCode),
        purse: Number(team.purse || 0),
        squadCount: Array.isArray(team.players) ? team.players.length : 0,
        overseasCount: Number(team.overseasCount || 0),
        locked: Boolean(selection.locked),
        autoFilled: Boolean(selection.autoFilled),
        selectionCount: Array.isArray(selection.playerIds) ? selection.playerIds.length : 0,
        canEdit: room?.phase === ROOM_PHASES.PLAYING_XI && viewerTeamCode === teamCode && !selection.locked,
        squadPlayers: viewerTeamCode === teamCode ? teamSnapshot.players : [],
        selectedPlayerIds: viewerTeamCode === teamCode ? (selection.playerIds || []) : [],
        selectedPlayers: canViewSelection ? selectedPlayers : []
      };
    })
  };
}

function stringHash(input = '') {
  const text = String(input);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const DEFAULT_LEGACY_NAME_SCORES = {
  'virat kohli': 0.99,
  'ms dhoni': 0.98,
  'rohit sharma': 0.96,
  'jasprit bumrah': 0.97,
  'hardik pandya': 0.94,
  'rashid khan': 0.95,
  'jos buttler': 0.93,
  'suryakumar yadav': 0.92,
  'ravindra jadeja': 0.93,
  'shubman gill': 0.92,
  'kl rahul': 0.9,
  'rishabh pant': 0.91,
  'andre russell': 0.9,
  'sunil narine': 0.89,
  'glenn maxwell': 0.88,
  'yuzvendra chahal': 0.88,
  'mohammed shami': 0.88,
  'david warner': 0.9,
  'faf du plessis': 0.87,
  'trent boult': 0.88,
  'pat cummins': 0.9,
  'mitchell starc': 0.89,
  'kagiso rabada': 0.86,
  'sanju samson': 0.84,
  'ruturaj gaikwad': 0.84,
  'yashasvi jaiswal': 0.85,
  'arshdeep singh': 0.82,
  'kuldeep yadav': 0.83,
  'mohammed siraj': 0.83,
  'ishan kishan': 0.83,
  'sam curran': 0.82,
  'liam livingstone': 0.8,
  'marcus stoinis': 0.81,
  'quinton de kock': 0.83,
  'nicholas pooran': 0.81,
  'washington sundar': 0.79,
  'shivam dube': 0.79,
  'rahul chahar': 0.77,
  'harshal patel': 0.77
};

const DEFAULT_AI_INSTRUCTIONS = {
  keyPlayers: [
    'Virat Kohli',
    'MS Dhoni',
    'Rohit Sharma',
    'Jasprit Bumrah',
    'Hardik Pandya',
    'Rashid Khan',
    'Shubman Gill',
    'KL Rahul',
    'Rishabh Pant'
  ],
  keyPlayerScore: 0.95,
  targetPrices: {},
  targetPriceFlex: {
    minFactor: 0.9,
    maxFactor: 1.08,
    ceilingFactor: 1.12
  },
  targetValuationSpread: 0.03,
  nameScores: { ...DEFAULT_LEGACY_NAME_SCORES },
  demandWeights: {
    name: 0.82,
    tier: 0.18
  },
  roleBoosts: {
    allRounder: 0.04,
    wicketkeeper: 0.02
  },
  tierPriceRules: {
    1: { minBase: 10, minByDemand: 2, maxBase: 17, maxByDemand: 3 },
    2: { minBase: 8, minByDemand: 1.5, maxBase: 12, maxByDemand: 3 },
    3: { minBase: 2, minByDemand: 1, maxBase: 5, maxByDemand: 3 }
  },
  bidIncrements: [
    { upto: 1, step: 0.05 },
    { upto: 2, step: 0.1 },
    { upto: 5, step: 0.2 },
    { upto: 10, step: 0.25 },
    { upto: 20, step: 0.5 },
    { step: 1 }
  ],
  biddingPressure: {
    normal: 0.58,
    late: 0.78,
    forceNormal: 1,
    forceFastTrack: 0.92,
    demandBoostScale: 0.45,
    demandBoostCap: 0.28,
    min: 0.45,
    max: 1
  }
};

let AI_INSTRUCTIONS = JSON.parse(JSON.stringify(DEFAULT_AI_INSTRUCTIONS));
const AI_PROFILE_PATH = path.join(__dirname, 'data', 'ai-auctioneer-profile.json');

function sanitizeNumber(value, fallback, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

function normalizePlayerName(value = '') {
  return String(value || '').trim().toLowerCase();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readAIProfileFromDisk() {
  try {
    if (!fs.existsSync(AI_PROFILE_PATH)) return {};
    const raw = fs.readFileSync(AI_PROFILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_err) {
    return {};
  }
}

function writeAIProfileToDisk(profile) {
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  fs.writeFileSync(AI_PROFILE_PATH, JSON.stringify(safeProfile, null, 2), 'utf8');
}

function getCurrentAIProfileSnapshot() {
  return {
    keyPlayers: [...(AI_INSTRUCTIONS.keyPlayers || [])],
    keyPlayerScore: AI_INSTRUCTIONS.keyPlayerScore,
    targetPrices: { ...(AI_INSTRUCTIONS.targetPrices || {}) },
    targetPriceFlex: { ...(AI_INSTRUCTIONS.targetPriceFlex || {}) },
    targetValuationSpread: AI_INSTRUCTIONS.targetValuationSpread,
    nameScores: { ...(AI_INSTRUCTIONS.nameScores || {}) },
    demandWeights: { ...(AI_INSTRUCTIONS.demandWeights || {}) },
    roleBoosts: { ...(AI_INSTRUCTIONS.roleBoosts || {}) },
    tierPriceRules: deepClone(AI_INSTRUCTIONS.tierPriceRules || {}),
    bidIncrements: deepClone(AI_INSTRUCTIONS.bidIncrements || []),
    biddingPressure: { ...(AI_INSTRUCTIONS.biddingPressure || {}) }
  };
}

function mergeInstructionKeywordsIntoProfile(profile, instructionText, playerNameSet) {
  const text = String(instructionText || '').toLowerCase();
  const applied = [];

  if (!profile.demandWeights) profile.demandWeights = {};
  if (!profile.roleBoosts) profile.roleBoosts = {};
  if (!profile.targetPriceFlex) profile.targetPriceFlex = {};
  if (!profile.biddingPressure) profile.biddingPressure = {};
  if (!profile.tierPriceRules) profile.tierPriceRules = {};
  if (!profile.targetPrices) profile.targetPrices = {};

  if (text.includes('aggressive') || text.includes('attack mode') || text.includes('more bids')) {
    profile.biddingPressure.normal = sanitizeNumber((profile.biddingPressure.normal ?? AI_INSTRUCTIONS.biddingPressure.normal) + 0.08, AI_INSTRUCTIONS.biddingPressure.normal, 0.1, 1);
    profile.biddingPressure.late = sanitizeNumber((profile.biddingPressure.late ?? AI_INSTRUCTIONS.biddingPressure.late) + 0.1, AI_INSTRUCTIONS.biddingPressure.late, 0.1, 1);
    profile.targetPriceFlex.maxFactor = sanitizeNumber((profile.targetPriceFlex.maxFactor ?? AI_INSTRUCTIONS.targetPriceFlex.maxFactor) + 0.06, AI_INSTRUCTIONS.targetPriceFlex.maxFactor, 1, 1.6);
    profile.targetPriceFlex.ceilingFactor = sanitizeNumber((profile.targetPriceFlex.ceilingFactor ?? AI_INSTRUCTIONS.targetPriceFlex.ceilingFactor) + 0.08, AI_INSTRUCTIONS.targetPriceFlex.ceilingFactor, 1, 1.8);
    applied.push('Increased AI aggression and upper valuation headroom');
  }

  if (text.includes('conservative') || text.includes('safe mode') || text.includes('save purse') || text.includes('budget')) {
    profile.biddingPressure.normal = sanitizeNumber((profile.biddingPressure.normal ?? AI_INSTRUCTIONS.biddingPressure.normal) - 0.08, AI_INSTRUCTIONS.biddingPressure.normal, 0.1, 1);
    profile.biddingPressure.late = sanitizeNumber((profile.biddingPressure.late ?? AI_INSTRUCTIONS.biddingPressure.late) - 0.08, AI_INSTRUCTIONS.biddingPressure.late, 0.1, 1);
    profile.targetPriceFlex.maxFactor = sanitizeNumber((profile.targetPriceFlex.maxFactor ?? AI_INSTRUCTIONS.targetPriceFlex.maxFactor) - 0.06, AI_INSTRUCTIONS.targetPriceFlex.maxFactor, 1, 1.6);
    profile.targetPriceFlex.ceilingFactor = sanitizeNumber((profile.targetPriceFlex.ceilingFactor ?? AI_INSTRUCTIONS.targetPriceFlex.ceilingFactor) - 0.07, AI_INSTRUCTIONS.targetPriceFlex.ceilingFactor, 1, 1.8);
    applied.push('Reduced AI spending aggressiveness for purse protection');
  }

  if (text.includes('avoid unsold') || text.includes('reduce unsold') || text.includes('sell more')) {
    for (const tierKey of ['1', '2', '3']) {
      const currentTier = profile.tierPriceRules[tierKey] || {};
      const defaultTier = AI_INSTRUCTIONS.tierPriceRules[tierKey] || DEFAULT_AI_INSTRUCTIONS.tierPriceRules[tierKey];
      const minBase = sanitizeNumber(currentTier.minBase ?? defaultTier.minBase, defaultTier.minBase, 0.1, 80);
      const minByDemand = sanitizeNumber(currentTier.minByDemand ?? defaultTier.minByDemand, defaultTier.minByDemand, 0, 30);
      profile.tierPriceRules[tierKey] = {
        ...currentTier,
        minBase: Number((minBase * 0.9).toFixed(2)),
        minByDemand: Number((minByDemand * 0.88).toFixed(2))
      };
    }

    profile.biddingPressure.forceNormal = sanitizeNumber((profile.biddingPressure.forceNormal ?? AI_INSTRUCTIONS.biddingPressure.forceNormal) + 0.06, AI_INSTRUCTIONS.biddingPressure.forceNormal, 0.1, 1);
    profile.biddingPressure.forceFastTrack = sanitizeNumber((profile.biddingPressure.forceFastTrack ?? AI_INSTRUCTIONS.biddingPressure.forceFastTrack) + 0.06, AI_INSTRUCTIONS.biddingPressure.forceFastTrack, 0.1, 1);
    applied.push('Adjusted reserve/floor pressure to reduce unsold outcomes');
  }

  if (text.includes('focus all-rounder') || text.includes('all rounder focus')) {
    profile.roleBoosts.allRounder = sanitizeNumber((profile.roleBoosts.allRounder ?? AI_INSTRUCTIONS.roleBoosts.allRounder) + 0.03, AI_INSTRUCTIONS.roleBoosts.allRounder, 0, 0.4);
    applied.push('Boosted all-rounder demand preference');
  }

  if (text.includes('focus wicketkeeper') || text.includes('wicketkeeper focus')) {
    profile.roleBoosts.wicketkeeper = sanitizeNumber((profile.roleBoosts.wicketkeeper ?? AI_INSTRUCTIONS.roleBoosts.wicketkeeper) + 0.03, AI_INSTRUCTIONS.roleBoosts.wicketkeeper, 0, 0.4);
    applied.push('Boosted wicketkeeper demand preference');
  }

  const lines = String(instructionText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const pairMatch = line.match(/^(.+?)\s*[:=-]\s*(\d+(?:\.\d+)?)$/);
    if (!pairMatch) continue;

    const rawName = normalizePlayerName(pairMatch[1]);
    const maybePrice = sanitizeNumber(pairMatch[2], NaN, 0.2, 40);
    if (!Number.isFinite(maybePrice)) continue;

    if (playerNameSet.has(rawName)) {
      profile.targetPrices[rawName] = Number(maybePrice.toFixed(2));
      applied.push(`Set target price for ${pairMatch[1].trim()} to ${maybePrice.toFixed(2)} Cr`);
    }
  }

  return applied;
}

function buildUpdatedProfileFromInstructions(instructionText = '') {
  const trimmed = String(instructionText || '').trim();
  if (!trimmed) {
    return { profile: readAIProfileFromDisk(), applied: [] };
  }

  const baseProfile = readAIProfileFromDisk();
  const playerNameSet = new Set(allPlayers.map((player) => normalizePlayerName(player.name)));
  let profile = deepClone(baseProfile);
  let applied = [];

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        profile = { ...profile, ...parsed };
        applied.push('Merged JSON instruction payload into AI profile');
      }
    } catch (_err) {
      // Fallback to keyword parser below.
    }
  }

  applied = [...applied, ...mergeInstructionKeywordsIntoProfile(profile, trimmed, playerNameSet)];
  return { profile, applied };
}

function loadAIInstructions() {
  try {
    const profilePath = path.join(__dirname, 'data', 'ai-auctioneer-profile.json');
    if (!fs.existsSync(profilePath)) return;

    const profileRaw = fs.readFileSync(profilePath, 'utf8');
    const profile = JSON.parse(profileRaw);
    if (!profile || typeof profile !== 'object') return;

    const mergedNameScores = {
      ...DEFAULT_AI_INSTRUCTIONS.nameScores,
      ...(typeof profile.nameScores === 'object' && profile.nameScores !== null ? profile.nameScores : {})
    };

    const mergedTargetPrices = {
      ...DEFAULT_AI_INSTRUCTIONS.targetPrices
    };
    if (typeof profile.targetPrices === 'object' && profile.targetPrices !== null) {
      for (const [name, rawValue] of Object.entries(profile.targetPrices)) {
        const normalizedName = normalizePlayerName(name);
        if (!normalizedName) continue;
        const parsedPrice = sanitizeNumber(rawValue, NaN, 0.2, 40);
        if (!Number.isFinite(parsedPrice)) continue;
        mergedTargetPrices[normalizedName] = parsedPrice;
      }
    }

    const keyPlayers = Array.isArray(profile.keyPlayers)
      ? profile.keyPlayers
          .map((name) => normalizePlayerName(name))
          .filter((name) => name.length > 0)
      : DEFAULT_AI_INSTRUCTIONS.keyPlayers.map((name) => normalizePlayerName(name));

    const keyPlayerScore = sanitizeNumber(profile.keyPlayerScore, DEFAULT_AI_INSTRUCTIONS.keyPlayerScore, 0.7, 1);

    for (const keyPlayer of keyPlayers) {
      if (mergedNameScores[keyPlayer] === undefined) {
        mergedNameScores[keyPlayer] = keyPlayerScore;
      }
    }

    const mergedDemandWeights = {
      ...DEFAULT_AI_INSTRUCTIONS.demandWeights,
      ...(typeof profile.demandWeights === 'object' && profile.demandWeights !== null ? profile.demandWeights : {})
    };

    const mergedRoleBoosts = {
      ...DEFAULT_AI_INSTRUCTIONS.roleBoosts,
      ...(typeof profile.roleBoosts === 'object' && profile.roleBoosts !== null ? profile.roleBoosts : {})
    };

    const mergedTierPriceRules = {
      ...DEFAULT_AI_INSTRUCTIONS.tierPriceRules,
      ...(typeof profile.tierPriceRules === 'object' && profile.tierPriceRules !== null ? profile.tierPriceRules : {})
    };

    const mergedBiddingPressure = {
      ...DEFAULT_AI_INSTRUCTIONS.biddingPressure,
      ...(typeof profile.biddingPressure === 'object' && profile.biddingPressure !== null ? profile.biddingPressure : {})
    };

    const mergedTargetPriceFlex = {
      ...DEFAULT_AI_INSTRUCTIONS.targetPriceFlex,
      ...(typeof profile.targetPriceFlex === 'object' && profile.targetPriceFlex !== null ? profile.targetPriceFlex : {})
    };

    let bidIncrements = DEFAULT_AI_INSTRUCTIONS.bidIncrements;
    if (Array.isArray(profile.bidIncrements) && profile.bidIncrements.length > 0) {
      const normalized = profile.bidIncrements
        .map((rule) => {
          if (!rule || typeof rule !== 'object') return null;
          const step = sanitizeNumber(rule.step, NaN, 0.01, 5);
          if (!Number.isFinite(step)) return null;
          const hasUpto = rule.upto !== undefined && rule.upto !== null;
          const upto = hasUpto ? sanitizeNumber(rule.upto, NaN, 0.01, 1000) : null;
          if (hasUpto && !Number.isFinite(upto)) return null;
          return { upto, step };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const left = a.upto === null ? Number.POSITIVE_INFINITY : a.upto;
          const right = b.upto === null ? Number.POSITIVE_INFINITY : b.upto;
          return left - right;
        });

      if (normalized.length > 0) {
        bidIncrements = normalized;
      }
    }

    AI_INSTRUCTIONS = {
      keyPlayers,
      keyPlayerScore,
      targetPrices: mergedTargetPrices,
      targetPriceFlex: {
        minFactor: sanitizeNumber(mergedTargetPriceFlex.minFactor, DEFAULT_AI_INSTRUCTIONS.targetPriceFlex.minFactor, 0.5, 1),
        maxFactor: sanitizeNumber(mergedTargetPriceFlex.maxFactor, DEFAULT_AI_INSTRUCTIONS.targetPriceFlex.maxFactor, 1, 1.6),
        ceilingFactor: sanitizeNumber(mergedTargetPriceFlex.ceilingFactor, DEFAULT_AI_INSTRUCTIONS.targetPriceFlex.ceilingFactor, 1, 1.8)
      },
      targetValuationSpread: sanitizeNumber(profile.targetValuationSpread, DEFAULT_AI_INSTRUCTIONS.targetValuationSpread, 0.005, 0.2),
      nameScores: mergedNameScores,
      demandWeights: {
        name: sanitizeNumber(mergedDemandWeights.name, DEFAULT_AI_INSTRUCTIONS.demandWeights.name, 0, 2),
        tier: sanitizeNumber(mergedDemandWeights.tier, DEFAULT_AI_INSTRUCTIONS.demandWeights.tier, 0, 2)
      },
      roleBoosts: {
        allRounder: sanitizeNumber(mergedRoleBoosts.allRounder, DEFAULT_AI_INSTRUCTIONS.roleBoosts.allRounder, 0, 0.4),
        wicketkeeper: sanitizeNumber(mergedRoleBoosts.wicketkeeper, DEFAULT_AI_INSTRUCTIONS.roleBoosts.wicketkeeper, 0, 0.4)
      },
      tierPriceRules: {
        1: {
          minBase: sanitizeNumber(mergedTierPriceRules[1]?.minBase, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[1].minBase, 0.1, 50),
          minByDemand: sanitizeNumber(mergedTierPriceRules[1]?.minByDemand, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[1].minByDemand, 0, 20),
          maxBase: sanitizeNumber(mergedTierPriceRules[1]?.maxBase, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[1].maxBase, 0.1, 80),
          maxByDemand: sanitizeNumber(mergedTierPriceRules[1]?.maxByDemand, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[1].maxByDemand, 0, 30)
        },
        2: {
          minBase: sanitizeNumber(mergedTierPriceRules[2]?.minBase, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[2].minBase, 0.1, 40),
          minByDemand: sanitizeNumber(mergedTierPriceRules[2]?.minByDemand, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[2].minByDemand, 0, 20),
          maxBase: sanitizeNumber(mergedTierPriceRules[2]?.maxBase, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[2].maxBase, 0.1, 60),
          maxByDemand: sanitizeNumber(mergedTierPriceRules[2]?.maxByDemand, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[2].maxByDemand, 0, 30)
        },
        3: {
          minBase: sanitizeNumber(mergedTierPriceRules[3]?.minBase, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[3].minBase, 0.1, 20),
          minByDemand: sanitizeNumber(mergedTierPriceRules[3]?.minByDemand, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[3].minByDemand, 0, 10),
          maxBase: sanitizeNumber(mergedTierPriceRules[3]?.maxBase, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[3].maxBase, 0.1, 30),
          maxByDemand: sanitizeNumber(mergedTierPriceRules[3]?.maxByDemand, DEFAULT_AI_INSTRUCTIONS.tierPriceRules[3].maxByDemand, 0, 20)
        }
      },
      bidIncrements,
      biddingPressure: {
        normal: sanitizeNumber(mergedBiddingPressure.normal, DEFAULT_AI_INSTRUCTIONS.biddingPressure.normal, 0.1, 1),
        late: sanitizeNumber(mergedBiddingPressure.late, DEFAULT_AI_INSTRUCTIONS.biddingPressure.late, 0.1, 1),
        forceNormal: sanitizeNumber(mergedBiddingPressure.forceNormal, DEFAULT_AI_INSTRUCTIONS.biddingPressure.forceNormal, 0.1, 1),
        forceFastTrack: sanitizeNumber(mergedBiddingPressure.forceFastTrack, DEFAULT_AI_INSTRUCTIONS.biddingPressure.forceFastTrack, 0.1, 1),
        demandBoostScale: sanitizeNumber(mergedBiddingPressure.demandBoostScale, DEFAULT_AI_INSTRUCTIONS.biddingPressure.demandBoostScale, 0, 2),
        demandBoostCap: sanitizeNumber(mergedBiddingPressure.demandBoostCap, DEFAULT_AI_INSTRUCTIONS.biddingPressure.demandBoostCap, 0, 1),
        min: sanitizeNumber(mergedBiddingPressure.min, DEFAULT_AI_INSTRUCTIONS.biddingPressure.min, 0.1, 1),
        max: sanitizeNumber(mergedBiddingPressure.max, DEFAULT_AI_INSTRUCTIONS.biddingPressure.max, 0.1, 1)
      }
    };
  } catch (_err) {
    // Keep defaults when instruction profile is unavailable or invalid.
  }
}

loadAIInstructions();

app.get('/api/ai/profile', (_req, res) => {
  loadAIInstructions();
  res.json({
    success: true,
    profile: getCurrentAIProfileSnapshot()
  });
});

app.post('/api/ai/train', (req, res) => {
  const instructionText = String(req.body?.instructions || '').trim();
  if (!instructionText) {
    res.status(400).json({ success: false, error: 'Instruction text is required.' });
    return;
  }

  try {
    const { profile, applied } = buildUpdatedProfileFromInstructions(instructionText);
    writeAIProfileToDisk(profile);
    loadAIInstructions();

    res.json({
      success: true,
      applied,
      profile: getCurrentAIProfileSnapshot()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to train AI profile: ${err.message}` });
  }
});

app.post('/api/ai/reset', (_req, res) => {
  try {
    writeAIProfileToDisk(deepClone(DEFAULT_AI_INSTRUCTIONS));
    loadAIInstructions();
    res.json({
      success: true,
      profile: getCurrentAIProfileSnapshot()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to reset AI profile: ${err.message}` });
  }
});

function getConfiguredTargetPrice(playerData = {}) {
  const nameKey = normalizePlayerName(playerData.name);
  if (!nameKey) return null;
  const configuredPrice = Number(AI_INSTRUCTIONS.targetPrices?.[nameKey]);
  if (!Number.isFinite(configuredPrice) || configuredPrice <= 0) return null;
  return roundBidByMode(configuredPrice, 'ai');
}

function getLegacyNameScore(playerData = {}) {
  const nameKey = normalizePlayerName(playerData.name);
  const tierBase = playerData.tier === 1 ? 0.88 : (playerData.tier === 2 ? 0.72 : 0.52);
  const legacyScoreMap = AI_INSTRUCTIONS.nameScores;

  if (legacyScoreMap[nameKey] !== undefined) {
    return legacyScoreMap[nameKey];
  }

  // Fallback for unknown/generated names: use tier-first baseline with slight role influence.
  const role = String(playerData.role || '').toLowerCase();
  const roleBoost = role.includes('all-rounder')
    ? AI_INSTRUCTIONS.roleBoosts.allRounder
    : (role.includes('wicketkeeper') ? AI_INSTRUCTIONS.roleBoosts.wicketkeeper : 0);
  return clamp(tierBase + roleBoost, 0.25, 0.92);
}

function getTierAverageAnchor(playerData = {}) {
  const tier = Number(playerData.tier || 3);
  if (tier === 1) return 14;
  if (tier === 2) return 8.5;
  return 2.6;
}

function getTierGuardrails(playerData = {}) {
  const tier = Number(playerData.tier || 3);
  if (tier === 1) return { min: 10, max: 24 };
  if (tier === 2) return { min: 4, max: 14 };
  return { min: 0.5, max: 5 };
}

function getUnsoldPenaltyFactor(timesUnsold = 0) {
  const unsold = Math.max(0, Number(timesUnsold || 0));
  if (unsold >= 4) return 0.85;
  if (unsold >= 2) return 0.92;
  return 1;
}

function buildSyntheticFiveSeasonPrices(playerData = {}) {
  const basePrice = Math.max(0.2, Number(playerData.basePrice || 0.2));
  const tierAnchor = getTierAverageAnchor(playerData);
  const seed = stringHash(`${normalizePlayerName(playerData.name)}|${playerData.tier}|${playerData.role}|${basePrice}`);
  const seedShift = ((seed % 21) - 10) / 100; // -0.10 to 0.10
  const center = Math.max(basePrice, tierAnchor * (0.92 + seedShift));
  const factors = [0.84, 0.92, 1, 1.08, 1.16];

  return factors.map((factor) => roundBidByMode(Math.max(basePrice, center * factor), 'ai'));
}

function getPlayerFiveSeasonPrices(playerData = {}) {
  const key = normalizePlayerName(playerData.name);
  const knownHistory = key ? PLAYER_FIVE_SEASON_HISTORY[key] : null;

  if (Array.isArray(knownHistory) && knownHistory.length > 0) {
    return knownHistory;
  }

  return buildSyntheticFiveSeasonPrices(playerData);
}

function getAuctionHistorySnapshotFromPlayerData(playerData = {}) {
  const history = playerData && typeof playerData === 'object' ? playerData.auctionHistory : null;
  if (!history || typeof history !== 'object') return null;

  const pricesByYear = history.pricesByYear && typeof history.pricesByYear === 'object'
    ? history.pricesByYear
    : {};
  const orderedYears = [2021, 2022, 2023, 2024, 2025];
  const soldPrices = orderedYears
    .map((year) => Number(pricesByYear[year]))
    .filter((price) => Number.isFinite(price) && price > 0)
    .map((price) => Number(price.toFixed(2)));

  const market = history.market && typeof history.market === 'object' ? history.market : {};
  const marketMin = Number(market.min);
  const marketTarget = Number(market.target);
  const marketMax = Number(market.max);
  const hasMarketBand = Number.isFinite(marketMin) && marketMin > 0
    && Number.isFinite(marketTarget) && marketTarget > 0
    && Number.isFinite(marketMax) && marketMax > 0;

  return {
    soldPrices,
    timesUnsold: Math.max(0, toSafeNumber(history.timesUnsold, 0)),
    soldSeasonsCount: Math.max(0, toSafeNumber(history.soldSeasonsCount, soldPrices.length)),
    retainedSeasonsCount: Math.max(0, toSafeNumber(history.retainedSeasonsCount, 0)),
    marketBand: hasMarketBand
      ? {
          min: Number(marketMin.toFixed(2)),
          target: Number(marketTarget.toFixed(2)),
          max: Number(marketMax.toFixed(2))
        }
      : null
  };
}

function getRecencyWeightedAuctionPrice(playerData = {}) {
  const history = getAuctionHistorySnapshotFromPlayerData(playerData);
  if (!history) return null;

  const pricesByYear = playerData?.auctionHistory?.pricesByYear;
  if (!pricesByYear || typeof pricesByYear !== 'object') return null;

  const weighted = [
    { year: 2021, weight: 1 },
    { year: 2022, weight: 2 },
    { year: 2023, weight: 3 },
    { year: 2024, weight: 4 },
    { year: 2025, weight: 5 }
  ]
    .map(({ year, weight }) => ({ price: Number(pricesByYear[year]), weight }))
    .filter(({ price }) => Number.isFinite(price) && price > 0);

  if (weighted.length === 0) return null;

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const weightedTotal = weighted.reduce((sum, item) => sum + (item.price * item.weight), 0);
  if (!totalWeight) return null;

  return Number((weightedTotal / totalWeight).toFixed(2));
}

function getLatestKnownAuctionPrice(playerData = {}) {
  const pricesByYear = playerData?.auctionHistory?.pricesByYear;
  if (!pricesByYear || typeof pricesByYear !== 'object') return null;

  for (const year of [2025, 2024, 2023, 2022, 2021]) {
    const price = Number(pricesByYear[year]);
    if (Number.isFinite(price) && price > 0) {
      return Number(price.toFixed(2));
    }
  }

  return null;
}

function getPlayerSoldHistorySnapshot(playerData = {}) {
  const fromPlayerHistory = getAuctionHistorySnapshotFromPlayerData(playerData);
  if (
    fromPlayerHistory
    && (
      fromPlayerHistory.soldPrices.length > 0
      || fromPlayerHistory.marketBand
      || Number(fromPlayerHistory.timesUnsold || 0) > 0
      || Number(fromPlayerHistory.soldSeasonsCount || 0) > 0
      || Number(fromPlayerHistory.retainedSeasonsCount || 0) > 0
    )
  ) {
    return {
      soldPrices: fromPlayerHistory.soldPrices,
      timesUnsold: fromPlayerHistory.timesUnsold,
      soldSeasonsCount: fromPlayerHistory.soldSeasonsCount,
      retainedSeasonsCount: fromPlayerHistory.retainedSeasonsCount,
      marketBand: fromPlayerHistory.marketBand
    };
  }

  const nameKey = normalizePlayerName(playerData.name);
  const fromEightSeason = nameKey ? PLAYER_EIGHT_SEASON_HISTORY[nameKey] : null;

  if (fromEightSeason && Array.isArray(fromEightSeason.soldPrices) && fromEightSeason.soldPrices.length > 0) {
    return {
      soldPrices: fromEightSeason.soldPrices,
      timesUnsold: Number(fromEightSeason.timesUnsold || 0),
      soldSeasonsCount: fromEightSeason.soldPrices.length,
      retainedSeasonsCount: 0,
      marketBand: null
    };
  }

  const fallbackSeries = getPlayerFiveSeasonPrices(playerData);
  return {
    soldPrices: Array.isArray(fallbackSeries) ? fallbackSeries : [],
    timesUnsold: 0,
    soldSeasonsCount: Array.isArray(fallbackSeries) ? fallbackSeries.length : 0,
    retainedSeasonsCount: 0,
    marketBand: null
  };
}

function getPlayerHistoryPricingModel(playerData = {}) {
  const snapshot = getPlayerSoldHistorySnapshot(playerData);
  const basePrice = Math.max(0.2, Number(playerData.basePrice || 0.2));
  const nameKey = normalizePlayerName(playerData.name);
  const marketBand = snapshot.marketBand || (nameKey ? PLAYER_MARKET_VALUES[nameKey] : null);

  if (marketBand) {
    const min = roundBidByMode(Math.max(basePrice, Number(marketBand.min || basePrice)), 'ai');
    const max = roundBidByMode(Math.max(min, Number(marketBand.max || min)), 'ai');
    const target = roundBidByMode(
      clamp(Number(marketBand.target || ((min + max) / 2)), min, max),
      'ai'
    );

    return {
      target,
      min,
      max,
      unsoldPenaltyFactor: getUnsoldPenaltyFactor(snapshot.timesUnsold ?? marketBand.timesUnsold ?? 0),
      pricesCount: Math.max(
        0,
        Number(snapshot.soldSeasonsCount || marketBand.soldSeasonsCount || 0)
          + Number(snapshot.retainedSeasonsCount || 0)
      )
    };
  }

  const validPrices = snapshot.soldPrices
    .map((price) => Number(price))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (validPrices.length === 0) {
    const unsoldPenaltyFactor = getUnsoldPenaltyFactor(snapshot.timesUnsold);
    const hasUnsoldOnlyHistory = Number(snapshot.timesUnsold || 0) > 0;
    const conservativeCeiling = hasUnsoldOnlyHistory
      ? Math.max(basePrice, basePrice * 1.05)
      : Math.max(basePrice, basePrice * 1.1);

    return {
      target: roundBidByMode(basePrice, 'ai'),
      min: roundBidByMode(basePrice, 'ai'),
      max: roundBidByMode(conservativeCeiling, 'ai'),
      unsoldPenaltyFactor,
      pricesCount: 0
    };
  }

  const minSold = Math.min(...validPrices);
  const maxSold = Math.max(...validPrices);
  const recencyWeighted = getRecencyWeightedAuctionPrice(playerData);
  const latestKnownPrice = getLatestKnownAuctionPrice(playerData);
  const midRange = (minSold + maxSold) / 2;
  const historyCenter = Number.isFinite(recencyWeighted)
    ? ((recencyWeighted * 0.7) + (midRange * 0.3))
    : midRange;
  const momentumBase = Number.isFinite(recencyWeighted) && recencyWeighted > 0
    ? recencyWeighted
    : midRange;
  let breakoutAdjustedCenter = historyCenter;

  if (Number.isFinite(latestKnownPrice) && latestKnownPrice > 0) {
    const breakoutRatio = latestKnownPrice / Math.max(0.2, momentumBase);
    if (breakoutRatio >= 1.55) {
      // Raise valuation for genuine latest-season breakouts so AI doesn't underprice prime-form players.
      const breakoutWeight = clamp(0.32 + ((breakoutRatio - 1.55) * 0.28), 0.32, 0.72);
      breakoutAdjustedCenter = ((historyCenter * (1 - breakoutWeight)) + (latestKnownPrice * breakoutWeight));
    }
  }

  const unsoldPenaltyFactor = getUnsoldPenaltyFactor(snapshot.timesUnsold);
  const penalizedTarget = breakoutAdjustedCenter * unsoldPenaltyFactor;

  const target = Math.max(basePrice, penalizedTarget);
  const bandMin = Math.max(basePrice, Math.min(minSold, target * 0.9));
  const bandMax = Math.max(bandMin, Math.max(maxSold, target * 1.1));

  return {
    target: roundBidByMode(target, 'ai'),
    min: roundBidByMode(bandMin, 'ai'),
    max: roundBidByMode(bandMax, 'ai'),
    unsoldPenaltyFactor,
    pricesCount: validPrices.length
  };
}

function getPlayerFiveSeasonAveragePrice(playerData = {}) {
  const model = getPlayerHistoryPricingModel(playerData);
  return roundBidByMode(model.target, 'ai');
}

function computePlayerDemandScore(playerData = {}, mode = ROOM_MODES.AI) {
  const legacyNameScore = getLegacyNameScore(playerData);
  const tierBaseline = playerData.tier === 1 ? 0.84 : (playerData.tier === 2 ? 0.66 : 0.46);
  const historyModel = getPlayerHistoryPricingModel(playerData);
  const fiveSeasonAverage = historyModel.target;
  const tierAnchor = getTierAverageAnchor(playerData);
  const historySignal = clamp(fiveSeasonAverage / Math.max(0.5, tierAnchor), 0.3, 1);
  const unsoldRiskDrag = clamp(historyModel.unsoldPenaltyFactor, 0.75, 1);

  // Price-history-first demand model with unsold risk drag.
  const score = ((historySignal * 0.75) + (legacyNameScore * 0.2) + (tierBaseline * 0.05)) * unsoldRiskDrag;
  return clamp(score, 0.2, 1);
}

function getTierPriceBand(playerData = {}, demandScore = 0.5) {
  const explicitTarget = getConfiguredTargetPrice(playerData);
  if (Number.isFinite(explicitTarget)) {
    const min = explicitTarget * AI_INSTRUCTIONS.targetPriceFlex.minFactor;
    const max = explicitTarget * AI_INSTRUCTIONS.targetPriceFlex.maxFactor;
    return {
      min: roundBidByMode(min, 'ai'),
      max: roundBidByMode(Math.max(min, max), 'ai')
    };
  }

  const historyModel = getPlayerHistoryPricingModel(playerData);
  return {
    min: historyModel.min,
    max: historyModel.max
  };
}

function estimatePlayerTargetPrice(playerData = {}, mode = ROOM_MODES.AI) {
  const configuredTarget = getConfiguredTargetPrice(playerData);
  if (Number.isFinite(configuredTarget)) {
    return configuredTarget;
  }

  const demandScore = computePlayerDemandScore(playerData, mode);
  const { min, max } = getTierPriceBand(playerData, demandScore);
  const historyModel = getPlayerHistoryPricingModel(playerData);
  return roundBidByMode(clamp(historyModel.target, min, max), 'ai');
}

function getPlayerAuctionCeiling(playerData = {}, mode = ROOM_MODES.AI) {
  const configuredTarget = getConfiguredTargetPrice(playerData);
  if (Number.isFinite(configuredTarget)) {
    const ceiling = configuredTarget * AI_INSTRUCTIONS.targetPriceFlex.ceilingFactor;
    return roundBidByMode(Math.max(configuredTarget, ceiling), 'ai');
  }

  const demandScore = computePlayerDemandScore(playerData, mode);
  const { max } = getTierPriceBand(playerData, demandScore);
  const historyModel = getPlayerHistoryPricingModel(playerData);
  const ceiling = Math.max(max, historyModel.target * 1.08);
  return roundBidByMode(ceiling, 'ai');
}

function getPlayerAIMinimumReserve(playerData = {}, room = null) {
  const historyModel = getPlayerHistoryPricingModel(playerData);
  const demandScore = computePlayerDemandScore(playerData, room?.mode || ROOM_MODES.AI);
  const unsoldStreak = Number(room?.aiUnsoldStreak || 0);
  const isMarquee = String(playerData?.auctionPrimaryCategory || '').trim() === 'Marquee Players'
    || (Array.isArray(playerData?.auctionTags) && playerData.auctionTags.includes('Marquee Players'))
    || Boolean(playerData?.isKeyPlayer);

  let reserveFloor = Number(historyModel.min || playerData?.basePrice || 0.2);

  if (isMarquee || Number(historyModel.target || 0) >= 10 || Number(historyModel.min || 0) >= 8) {
    reserveFloor = Math.max(reserveFloor, Number(historyModel.target || reserveFloor) * 0.78);
  } else if (Number(historyModel.target || 0) >= 6 || demandScore >= 0.72) {
    reserveFloor = Math.max(reserveFloor, Number(historyModel.target || reserveFloor) * 0.68);
  }

  const softenerFloor = isMarquee || Number(historyModel.target || 0) >= 10 ? 0.88 : 0.82;
  const softenedReserve = reserveFloor * clamp(1 - (unsoldStreak * 0.03), softenerFloor, 1);
  return roundBidByMode(Math.max(playerData?.basePrice || 0.2, softenedReserve), room?.mode || ROOM_MODES.AI);
}

function getAIOpeningBid(playerData = {}) {
  // Real-auction behavior: every player starts at listed base price.
  return roundBidByMode(Number(playerData.basePrice || 0), 'ai');
}

function calculateNextAIBid(room, playerData) {
  const currentBid = Number(room.currentPlayer?.currentBid || 0);
  const naturalNextBid = calculateNextBid(currentBid, 'ai');
  const demandScore = computePlayerDemandScore(playerData, room.mode);
  const ceiling = getPlayerAuctionCeiling(playerData, room.mode);

  const isFastTrack = Boolean(room.fastTrackEndAt && room.fastTrackEndAt > Date.now());
  if (!isFastTrack) {
    return Math.min(naturalNextBid, ceiling);
  }

  const { min } = getTierPriceBand(playerData, demandScore);
  const targetPrice = estimatePlayerTargetPrice(playerData, room.mode);
  const remainingSec = Math.max(1, Math.ceil((room.fastTrackEndAt - Date.now()) / 1000));

  let desiredStepTarget = targetPrice;
  if (currentBid < min) {
    // Ensure fast-track can realistically reach tier floor before time expires.
    desiredStepTarget = Math.max(targetPrice, min);
  }

  const catchUpStep = Math.max(getAIBidIncrement(currentBid), (desiredStepTarget - currentBid) / remainingSec);
  const acceleratedBid = roundBidByMode(currentBid + catchUpStep, 'ai');
  return clamp(acceleratedBid, naturalNextBid, ceiling);
}

function getTeamPlayerValuation(room, teamCode, playerData) {
  if (!playerData || !playerData.id) return Number.POSITIVE_INFINITY;

  if (!room.playerValuationCache) room.playerValuationCache = {};
  if (!room.playerValuationCache[playerData.id]) room.playerValuationCache[playerData.id] = {};

  if (room.playerValuationCache[playerData.id][teamCode] !== undefined) {
    return room.playerValuationCache[playerData.id][teamCode];
  }

  const seed = stringHash(`${room.code}|${teamCode}|${playerData.id}`);
  const demandScore = computePlayerDemandScore(playerData, room.mode);
  const { min, max } = getTierPriceBand(playerData, demandScore);
  const historyModel = getPlayerHistoryPricingModel(playerData);
  const dynamicSpread = Number.isFinite(historyModel.target) && historyModel.target > 0
    ? clamp(((historyModel.max - historyModel.min) / historyModel.target) * 0.45, 0.03, 0.2)
    : AI_INSTRUCTIONS.targetValuationSpread;
  const effectiveSpread = Math.max(AI_INSTRUCTIONS.targetValuationSpread, dynamicSpread);
  const configuredTarget = getConfiguredTargetPrice(playerData);
  const seedShift = (((seed % 21) - 10) / 10); // -1 to +1
  const variation = Number.isFinite(configuredTarget)
    ? (1 + (seedShift * effectiveSpread))
    : (1 + (seedShift * Math.max(0.08, effectiveSpread)));
  const valuation = roundBidByMode(clamp(estimatePlayerTargetPrice(playerData, room.mode) * variation, min, max), 'ai');
  room.playerValuationCache[playerData.id][teamCode] = valuation;
  return valuation;
}

function canTeamBidForPlayer(room, teamCode, bidAmount, playerData) {
  const team = room.teams[teamCode];
  if (!team) return false;
  if (team.purse < bidAmount) return false;
  if (team.players.length >= 25) return false;

  if (playerData && playerData.country !== 'India' && team.overseasCount >= 8) {
    return false;
  }

  if (isAIMode(room.mode) && playerData) {
    const ceiling = getPlayerAuctionCeiling(playerData, room.mode);
    if (bidAmount > ceiling) return false;

    const valuation = getTeamPlayerValuation(room, teamCode, playerData);
    if (bidAmount > valuation) return false;
  }

  return true;
}

function emitBidUpdateWithSkipPrivacy(room, payload, io) {
  const skippedTeams = room.currentPlayerSkippedTeams || {};

  for (const participant of room.players || []) {
    if (participant.connected === false) continue;
    if (!participant.id) continue;

    if (participant.team && skippedTeams[participant.team]) {
      // Skip-mode team does not see intermediate bids for this player.
      continue;
    }

    io.to(participant.id).emit('bidUpdate', payload);
  }
}

function runAIBidCycle(room, io) {
  clearAIBidTimeout(room);
  const roomAvailablePlayers = getRoomAvailablePlayers(room);

  if (!isAIMode(room.mode) || !room.currentPlayer || room.timeLeft <= 1) {
    return;
  }

  room.aiBidTimeout = setTimeout(() => {
    if (!isAIMode(room.mode) || !room.currentPlayer || room.timeLeft <= 1) {
      return;
    }

    const playerData = roomAvailablePlayers.find((p) => p.id === room.currentPlayer.id) || room.currentPlayer;
    const demandScore = computePlayerDemandScore(playerData, room.mode);
    const nextBid = calculateNextAIBid(room, playerData);

    const aiBidCandidates = Object.entries(room.teams)
      .filter(([code, team]) => !team.socketId && code !== room.currentHighestBidder && canTeamBidForPlayer(room, code, nextBid, playerData))
      .map(([code]) => {
        const valuation = getTeamPlayerValuation(room, code, playerData);
        const headroom = Math.max(0, valuation - nextBid);
        const score = Math.max(0.05, 0.08 + (headroom / Math.max(1, valuation)) + (demandScore * 0.45));
        return { code, score };
      });

    if (aiBidCandidates.length === 0) {
      runAIBidCycle(room, io);
      return;
    }

    const isFastTrack = Boolean(room.fastTrackEndAt && room.fastTrackEndAt > Date.now());
    const pressureRules = AI_INSTRUCTIONS.biddingPressure;
    const basePressure = room.forceAIBidCurrent
      ? (isFastTrack ? 1 : pressureRules.forceNormal)
      : (room.timeLeft <= 3 ? pressureRules.late : pressureRules.normal);
    const demandBoost = clamp((demandScore - 0.5) * pressureRules.demandBoostScale, 0, pressureRules.demandBoostCap);
    const biddingPressure = clamp(basePressure + demandBoost, pressureRules.min, pressureRules.max);
    if (Math.random() > biddingPressure) {
      runAIBidCycle(room, io);
      return;
    }

    const totalScore = aiBidCandidates.reduce((sum, candidate) => sum + candidate.score, 0);
    let randomPick = Math.random() * Math.max(totalScore, 0.0001);
    let bidderCode = aiBidCandidates[0].code;
    for (const candidate of aiBidCandidates) {
      randomPick -= candidate.score;
      if (randomPick <= 0) {
        bidderCode = candidate.code;
        break;
      }
    }
    room.currentPlayer.currentBid = nextBid;
    room.currentHighestBidder = bidderCode;
    room.currentBidTeams[bidderCode] = true;
    recordCurrentBid(room, bidderCode, nextBid);
    room.timeLeft = getPostBidTimeLeft(room, 10);

    emitBidUpdateWithSkipPrivacy(room, {
      team: bidderCode,
      bid: nextBid,
      player: room.currentPlayer
    }, io);

    runAIBidCycle(room, io);
  }, (room.fastTrackEndAt && room.fastTrackEndAt > Date.now())
    ? (240 + Math.floor(Math.random() * 420))
    : (900 + Math.floor(Math.random() * 2200)));
}

// ============ HELPER FUNCTIONS ============

function getManualBidIncrement(currentBid) {
  return currentBid < 2 ? 0.1 : 0.2;
}

function getAIBidIncrement(currentBid) {
  const rules = Array.isArray(AI_INSTRUCTIONS.bidIncrements) ? AI_INSTRUCTIONS.bidIncrements : [];
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') continue;
    const step = Number(rule.step);
    if (!Number.isFinite(step) || step <= 0) continue;
    if (rule.upto === null || rule.upto === undefined) {
      return step;
    }
    const upto = Number(rule.upto);
    if (Number.isFinite(upto) && currentBid < upto) {
      return step;
    }
  }

  if (currentBid < 1) return 0.05;
  if (currentBid < 2) return 0.1;
  if (currentBid < 5) return 0.2;
  if (currentBid < 10) return 0.25;
  if (currentBid < 20) return 0.5;
  return 1;
}

function roundBidByMode(amount, mode) {
  if (isAIMode(mode)) {
    return Number(amount.toFixed(2));
  }
  return Number(amount.toFixed(1));
}

function calculateNextBid(currentBid, mode = 'manual') {
  const increment = isAIMode(mode) ? getAIBidIncrement(currentBid) : getManualBidIncrement(currentBid);
  return roundBidByMode(currentBid + increment, mode);
}

function validateBid(room, teamCode, bidAmount) {
  const team = room.teams[teamCode];
  const player = room.currentPlayer;
  const roomAvailablePlayers = getRoomAvailablePlayers(room);
  
  if (!player) return { valid: false, reason: 'No player on auction' };
  if (room.currentPlayerSkippedTeams && room.currentPlayerSkippedTeams[teamCode]) {
    return { valid: false, reason: 'You skipped this player. Wait for next player.' };
  }
  if (room.currentHighestBidder === teamCode) return { valid: false, reason: 'You are already the highest bidder' };
  if (bidAmount > team.purse) return { valid: false, reason: 'Insufficient budget' };
  
  const minIncrement = isAIMode(room.mode)
    ? getAIBidIncrement(player.currentBid)
    : getManualBidIncrement(player.currentBid);
  const minAllowedBid = roundBidByMode(player.currentBid + minIncrement, room.mode);
  if (Math.abs(bidAmount - minAllowedBid) > 0.001) {
    return { valid: false, reason: `Next valid bid is ₹${minAllowedBid} Cr` };
  }
  
  const playerData = roomAvailablePlayers.find((p) => p.id === player.id) || player;

  if (isAIMode(room.mode)) {
    const ceiling = getPlayerAuctionCeiling(playerData, room.mode);
    if (bidAmount > ceiling + 0.001) {
      return { valid: false, reason: `AI mode cap for this player is ₹${ceiling} Cr` };
    }
  }

  if (playerData && playerData.country !== 'India') {
    if (team.overseasCount >= 8) {
      return { valid: false, reason: 'Overseas quota full (max 8)' };
    }
  }
  
  if (team.players.length >= 25) {
    return { valid: false, reason: 'Squad is full (max 25 players)' };
  }
  
  return { valid: true };
}

function isAuctionReadyForPlayingXI(room) {
  if (!room || room.phase !== ROOM_PHASES.AUCTION) return false;

  const competitionTeamCodes = getCompetitionTeamCodes(room);
  if (competitionTeamCodes.length === 0) return false;

  const roomAvailablePlayers = getRoomAvailablePlayers(room);
  if (roomAvailablePlayers.length === 0) return true;

  return competitionTeamCodes.every((teamCode) => {
    const squadSize = Array.isArray(room.teams?.[teamCode]?.players) ? room.teams[teamCode].players.length : 0;
    return squadSize >= MIN_SQUAD_SIZE_FOR_PLAYING_XI || squadSize >= 25;
  });
}

function initializePlayingXIPhase(room) {
  const competitionTeamCodes = getCompetitionTeamCodes(room);

  room.phase = ROOM_PHASES.PLAYING_XI;
  room.playingXICompetitionTeams = competitionTeamCodes;
  room.playingXISelections = room.playingXISelections || {};
  room.rankings = [];
  room.currentPlayer = null;
  room.currentHighestBidder = null;
  room.currentPlayerSkippedTeams = {};
  room.currentBidTeams = {};
  room.currentBidHistory = [];
  room.fastTrackEndAt = null;
  room.forceAIBidCurrent = false;
  room.reserveExtendedCurrentPlayer = false;

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  clearAIBidTimeout(room);

  for (const teamCode of competitionTeamCodes) {
    const recommendedPlayerIds = buildRecommendedPlayingXIPlayerIds(room, teamCode);
    const autoLock = isAIMode(room.mode) && !room.teams?.[teamCode]?.socketId;

    room.playingXISelections[teamCode] = {
      playerIds: recommendedPlayerIds,
      locked: autoLock,
      autoFilled: autoLock,
      lockedAt: autoLock ? Date.now() : null
    };
  }

  if (allCompetitionTeamsLocked(room)) {
    computePlayingXIRankings(room);
  }
}

function startPlayingXIPhase(room, io) {
  if (!room || room.phase === ROOM_PHASES.PLAYING_XI) return;

  const competitionTeamCodes = getCompetitionTeamCodes(room);
  if (competitionTeamCodes.length === 0) {
    io.to(room.code).emit('gameEnd', 'Auction complete.');
    return;
  }

  initializePlayingXIPhase(room);

  io.to(room.code).emit('gameEnd', 'Auction complete. Opening Playing XI room...');
  io.to(room.code).emit('playingXIStarted', {
    roomCode: room.code,
    phase: room.phase
  });
}

function startTimer(room, io) {
  if (!room || room.phase !== ROOM_PHASES.AUCTION) return;
  if (room.timer) clearInterval(room.timer);
  
  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timerTick', room.timeLeft);
    
    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      finalizeSale(room, io);
    }
  }, 1000);
}

function finalizeSale(room, io) {
  if (!room || room.phase !== ROOM_PHASES.AUCTION) return;
  clearAIBidTimeout(room);
  const roomAvailablePlayers = getRoomAvailablePlayers(room);

  const activePlayerSnapshot = room.currentPlayer
    ? roomAvailablePlayers.find((p) => p.id === room.currentPlayer.id) || room.currentPlayer
    : null;

  if (room.currentHighestBidder && room.currentPlayer) {
    const buyerTeam = room.teams[room.currentHighestBidder];
    const playerData = roomAvailablePlayers.find((p) => p.id === room.currentPlayer.id) || activePlayerSnapshot;
    
    if (buyerTeam && playerData) {
      let finalSalePrice = room.currentPlayer.currentBid;
      let shouldSell = true;

      if (isAIMode(room.mode)) {
        const demandScore = computePlayerDemandScore(playerData, room.mode);
        const ceiling = getPlayerAuctionCeiling(playerData, room.mode);
        finalSalePrice = Math.min(finalSalePrice, ceiling);
        const bidTeamCount = Object.keys(room.currentBidTeams || {}).length;
        const hasStrongDemand = bidTeamCount >= (demandScore >= 0.78 ? 1 : 2);
        const adaptiveFloor = getPlayerAIMinimumReserve(playerData, room);

        if (finalSalePrice < adaptiveFloor - 0.001) {
          if (!room.reserveExtendedCurrentPlayer && hasStrongDemand) {
            room.reserveExtendedCurrentPlayer = true;
            room.timeLeft = 3;
            startTimer(room, io);
            runAIBidCycle(room, io);
            io.to(room.code).emit('message', `${playerData.name} reserve extension: final calls...`);
            return;
          }

          if (!hasStrongDemand && demandScore < 0.8) {
            shouldSell = false;
          }
        }
        room.currentPlayer.currentBid = finalSalePrice;
      }

      // Remove from available players
      const index = roomAvailablePlayers.findIndex((p) => p.id === playerData.id);
      if (index !== -1) roomAvailablePlayers.splice(index, 1);

      if (shouldSell) {
        buyerTeam.purse -= finalSalePrice;
        buyerTeam.players.push({
          id: playerData.id,
          name: playerData.name,
          role: playerData.role,
          country: playerData.country,
          price: finalSalePrice,
          boughtInAuction: true,
          image: playerData.image
        });
        buyerTeam.totalPlayers++;
        if (playerData.country !== 'India') buyerTeam.overseasCount++;

        io.to(room.code).emit('playerSold', {
          player: playerData,
          buyer: room.currentHighestBidder,
          price: finalSalePrice,
          teams: room.teams
        });

        room.soldPlayers.push({
          id: playerData.id,
          name: playerData.name,
          role: playerData.role,
          buyer: room.currentHighestBidder,
          price: finalSalePrice
        });
        room.aiUnsoldStreak = 0;
      } else {
        io.to(room.code).emit('playerUnsold', {
          player: playerData,
          teams: room.teams
        });

        room.unsoldPlayers.push({
          id: playerData.id,
          name: playerData.name,
          role: playerData.role,
          basePrice: playerData.basePrice
        });
        room.aiUnsoldStreak = Number(room.aiUnsoldStreak || 0) + 1;
      }
    }
  } else if (activePlayerSnapshot) {
    if (isAIMode(room.mode)) {
      const demandScore = computePlayerDemandScore(activePlayerSnapshot, room.mode);
      const historyModel = getPlayerHistoryPricingModel(activePlayerSnapshot);
      const openingBid = getAIOpeningBid(activePlayerSnapshot);
      const unsoldStreak = Number(room.aiUnsoldStreak || 0);
      const aiEligibleTeams = Object.entries(room.teams)
        .filter(([code, team]) => !team.socketId && canTeamBidForPlayer(room, code, openingBid, activePlayerSnapshot))
        .map(([code]) => code);

      const adaptiveReserveFloor = getPlayerAIMinimumReserve(activePlayerSnapshot, room);
      const autoSellProbability = clamp(0.04 + (demandScore * 0.18) + (unsoldStreak * 0.08), 0, 0.45);

      if (
        aiEligibleTeams.length > 0
        && openingBid + 0.001 >= adaptiveReserveFloor
        && Math.random() <= autoSellProbability
      ) {
        const buyer = aiEligibleTeams[Math.floor(Math.random() * aiEligibleTeams.length)];
        const buyerTeam = room.teams[buyer];

        buyerTeam.purse -= openingBid;
        buyerTeam.players.push({
          id: activePlayerSnapshot.id,
          name: activePlayerSnapshot.name,
          role: activePlayerSnapshot.role,
          country: activePlayerSnapshot.country,
          price: openingBid,
          boughtInAuction: true,
          image: activePlayerSnapshot.image
        });
        buyerTeam.totalPlayers++;
        if (activePlayerSnapshot.country !== 'India') buyerTeam.overseasCount++;

        const index = roomAvailablePlayers.findIndex((p) => p.id === activePlayerSnapshot.id);
        if (index !== -1) roomAvailablePlayers.splice(index, 1);

        io.to(room.code).emit('playerSold', {
          player: activePlayerSnapshot,
          buyer,
          price: openingBid,
          teams: room.teams
        });

        room.soldPlayers.push({
          id: activePlayerSnapshot.id,
          name: activePlayerSnapshot.name,
          role: activePlayerSnapshot.role,
          buyer,
          price: openingBid
        });
        room.aiUnsoldStreak = 0;
      } else {
        // In AI mode/manual timer expiry with no bids, treat as unsold and move on.
        const index = roomAvailablePlayers.findIndex((p) => p.id === activePlayerSnapshot.id);
        if (index !== -1) roomAvailablePlayers.splice(index, 1);

        io.to(room.code).emit('playerUnsold', {
          player: activePlayerSnapshot,
          teams: room.teams
        });

        room.unsoldPlayers.push({
          id: activePlayerSnapshot.id,
          name: activePlayerSnapshot.name,
          role: activePlayerSnapshot.role,
          basePrice: activePlayerSnapshot.basePrice
        });
        room.aiUnsoldStreak = unsoldStreak + 1;
      }
    } else {
      // Manual mode timer expiry with no bids -> unsold.
      const index = roomAvailablePlayers.findIndex((p) => p.id === activePlayerSnapshot.id);
      if (index !== -1) roomAvailablePlayers.splice(index, 1);

      io.to(room.code).emit('playerUnsold', {
        player: activePlayerSnapshot,
        teams: room.teams
      });

      room.unsoldPlayers.push({
        id: activePlayerSnapshot.id,
        name: activePlayerSnapshot.name,
        role: activePlayerSnapshot.role,
        basePrice: activePlayerSnapshot.basePrice
      });
    }
  }
  
  room.currentPlayer = null;
  room.currentHighestBidder = null;
  room.currentPlayerSkippedTeams = {};
  room.currentBidTeams = {};
  room.currentBidHistory = [];
  room.reserveExtendedCurrentPlayer = false;
  room.forceAIBidCurrent = false;
  room.fastTrackEndAt = null;
  io.to(room.code).emit('availablePlayers', roomAvailablePlayers);

  if (isAuctionReadyForPlayingXI(room)) {
    startPlayingXIPhase(room, io);
    return;
  }

  if (isAIMode(room.mode) && roomAvailablePlayers.length > 0) {
    setTimeout(() => {
      nominateNextPlayer(room, io);
    }, 3000);
  }
}

function nominateNextPlayer(room, io) {
  if (!room || room.phase !== ROOM_PHASES.AUCTION) return;
  const roomAvailablePlayers = getRoomAvailablePlayers(room);

  if (isAuctionReadyForPlayingXI(room)) {
    startPlayingXIPhase(room, io);
    return;
  }

  if (roomAvailablePlayers.length === 0) {
    startPlayingXIPhase(room, io);
    return;
  }
  
  // For demo, pick first available player
  // In real app, you'd have logic to pick by tier/category
  const nextPlayer = roomAvailablePlayers[0];
  
  room.currentPlayer = {
    id: nextPlayer.id,
    name: nextPlayer.name,
    role: nextPlayer.role,
    country: nextPlayer.country,
    basePrice: nextPlayer.basePrice,
    currentBid: isAIMode(room.mode) ? getAIOpeningBid(nextPlayer) : nextPlayer.basePrice,
    tier: nextPlayer.tier,
    image: nextPlayer.image,
    stats: nextPlayer.stats || {},
    profile: nextPlayer.profile || {},
    auctionHistory: nextPlayer.auctionHistory || {}
  };
  room.currentHighestBidder = null;
  room.timeLeft = 10;
  room.currentPlayerSkippedTeams = {};
  room.currentBidTeams = {};
  room.currentBidHistory = [];
  room.reserveExtendedCurrentPlayer = false;
  room.forceAIBidCurrent = false;
  room.fastTrackEndAt = null;
  
  if (room.timer) clearInterval(room.timer);
  startTimer(room, io);
  if (isAIMode(room.mode)) {
    runAIBidCycle(room, io);
  }
  
  io.to(room.code).emit('playerNominated', room.currentPlayer);
  io.to(room.code).emit('availablePlayers', roomAvailablePlayers);
}

// ============ SOCKET.IO EVENTS ============

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Create room
  socket.on('createRoom', (data) => {
    const { roomName, password, mode, playerName } = data || {};
    const safeRoomName = sanitizeRoomName(roomName);
    const safePlayerName = sanitizeDisplayName(playerName);
    const requestedMode = String(mode || '').toLowerCase();
    const normalizedMode = normalizeRoomMode(requestedMode);

    if (!safeRoomName) {
      socket.emit('error', 'Please enter a valid room name.');
      return;
    }

    if (!safePlayerName) {
      socket.emit('error', 'Please enter your display name.');
      return;
    }

    let roomCode = '';
    try {
      roomCode = generateUniqueRoomCode();
    } catch (_error) {
      socket.emit('error', 'Could not generate a unique join code. Please try again.');
      return;
    }

    const newRoom = {
      name: safeRoomName,
      code: roomCode,
      password: String(password || '').trim() || null,
      mode: normalizedMode,
      phase: ROOM_PHASES.AUCTION,
      teams: buildFreshTeams(),
      availablePlayers: buildInitialAvailablePlayers(),
      currentPlayer: null,
      currentHighestBidder: null,
      currentPlayerSkippedTeams: {},
      currentBidTeams: {},
      currentBidHistory: [],
      reserveExtendedCurrentPlayer: false,
      forceAIBidCurrent: false,
      fastTrackEndAt: null,
      aiUnsoldStreak: 0,
      timeLeft: 10,
      timer: null,
      aiBidTimeout: null,
      soldPlayers: [],
      unsoldPlayers: [],
      playingXICompetitionTeams: [],
      playingXISelections: {},
      rankings: [],
      auctioneer: socket.id,
      players: [{ id: socket.id, name: safePlayerName, team: null, connected: true }],
      messages: [],
      pendingRemovals: {},
      cleanupTimeout: null
    };

    activeRooms.set(roomCode, newRoom);
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, roomName: safeRoomName, mode: normalizedMode });
    socket.emit('message', `Room created successfully. Share join code ${roomCode} with friends.`);
  });
  
  // Join room
  socket.on('joinRoom', (data) => {
    const { roomCode, password, playerName } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const safePlayerName = sanitizeDisplayName(playerName);
    const submittedPassword = String(password || '').trim();
    const room = activeRooms.get(normalizedRoomCode);

    if (!normalizedRoomCode) {
      socket.emit('error', 'Please enter a valid room code.');
      return;
    }

    if (!safePlayerName) {
      socket.emit('error', 'Please enter your display name.');
      return;
    }

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.password && room.password !== submittedPassword) {
      socket.emit('error', 'Incorrect password');
      return;
    }

    const existingPlayer = findPlayerByName(room, safePlayerName);
    if (!existingPlayer && room.players.length >= MAX_PLAYERS_PER_ROOM) {
      socket.emit('error', `Room is full (${MAX_PLAYERS_PER_ROOM} players max).`);
      return;
    }

    socket.join(normalizedRoomCode);
    const player = attachSocketToRoomPlayer(room, socket, safePlayerName);
    const releasedAuctioneerTeam = ensureManualAuctioneerControlOnly(room);
    if (player.team) {
      socket.team = player.team;
    } else {
      delete socket.team;
    }

    socket.emit('roomJoined', {
      roomCode: normalizedRoomCode,
      roomName: room.name || normalizedRoomCode,
      mode: normalizeRoomMode(room.mode),
      phase: room.phase || ROOM_PHASES.AUCTION,
      teams: room.teams,
      soldPlayers: room.soldPlayers || [],
      unsoldPlayers: room.unsoldPlayers || [],
      auctioneerId: room.auctioneer,
      auctionState: room.currentPlayer
        ? {
            player: room.currentPlayer,
            currentHighestBidder: room.currentHighestBidder,
            timeLeft: room.timeLeft,
            skippedTeams: room.currentPlayerSkippedTeams || {}
          }
        : null
    });
    if (releasedAuctioneerTeam) {
      io.to(normalizedRoomCode).emit('teamsUpdate', room.teams);
      io.to(normalizedRoomCode).emit('message', 'Manual mode keeps the auctioneer in control-only mode. Team selection has been cleared for the auctioneer.');
    }
    io.to(normalizedRoomCode).emit('playersUpdate', buildPlayersSnapshot(room));
    io.to(normalizedRoomCode).emit('teamsUpdate', room.teams);
    socket.emit('availablePlayers', getRoomAvailablePlayers(room));
    socket.emit('message', `Welcome to room ${normalizedRoomCode}, ${player.name}!`);
  });
  
  // Select team
  socket.on('selectTeam', (data) => {
    const { roomCode, teamCode, playerName } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    
    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Team selection is closed for this room.');
      return;
    }

    const normalizedTeamCode = String(teamCode || '').trim().toUpperCase();
    const team = room.teams[normalizedTeamCode];
    if (!team) {
      socket.emit('error', 'Invalid team selected.');
      return;
    }

    const player = findPlayerBySocketId(room, socket.id);
    if (!player) {
      socket.emit('error', 'Please rejoin the room and try again.');
      return;
    }

    if (normalizeRoomMode(room.mode) === ROOM_MODES.MANUAL && room.auctioneer === socket.id) {
      socket.emit('error', 'Auctioneer controls the manual room and cannot select a franchise team.');
      return;
    }

    if (player.team && player.team !== normalizedTeamCode) {
      socket.emit('error', 'Team already locked for this player.');
      return;
    }

    if (team.socketId) {
      socket.emit('error', 'Team already taken');
      return;
    }

    team.socketId = socket.id;
    player.team = normalizedTeamCode;

    socket.team = normalizedTeamCode;
    socket.emit('teamSelected', { teamCode: normalizedTeamCode, team: team });
    io.to(normalizedRoomCode).emit('playersUpdate', buildPlayersSnapshot(room));
    io.to(normalizedRoomCode).emit('teamsUpdate', room.teams);
    io.to(normalizedRoomCode).emit('message', `${sanitizeDisplayName(playerName) || player.name} joined as ${team.name}`);
  });
  
  // Start auction (auctioneer only)
  socket.on('startAuction', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Auction already moved to Playing XI stage.');
      return;
    }
    
    if (room.auctioneer !== socket.id) {
      socket.emit('error', 'Only auctioneer can start the auction');
      return;
    }

    const releasedAuctioneerTeam = ensureManualAuctioneerControlOnly(room);
    if (releasedAuctioneerTeam) {
      delete socket.team;
      io.to(normalizedRoomCode).emit('teamsUpdate', room.teams);
      io.to(normalizedRoomCode).emit('playersUpdate', buildPlayersSnapshot(room));
      io.to(normalizedRoomCode).emit('message', 'Auctioneer stays in control-only mode in manual rooms, so the auctioneer team has been released.');
    }

    if (isAIMode(room.mode)) {
      const anyHumanTeamSelected = room.players.some((p) => p.connected !== false && p.team);
      if (!anyHumanTeamSelected) {
        socket.emit('error', 'Select at least one human team before starting AI mode.');
        return;
      }
    }
    
    nominateNextPlayer(room, io);
    io.to(normalizedRoomCode).emit('auctionStarted', { mode: room.mode });
  });
  
  // Nominate player (auctioneer only)
  socket.on('nominatePlayer', (data) => {
    const { roomCode, playerId } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    const roomAvailablePlayers = room ? getRoomAvailablePlayers(room) : null;

    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Auction already moved to Playing XI stage.');
      return;
    }
    if (isAIMode(room.mode)) {
      socket.emit('error', 'AI mode is active. Manual nomination is disabled in this room.');
      return;
    }
    if (room.auctioneer !== socket.id) {
      socket.emit('error', 'Only auctioneer can nominate players');
      return;
    }

    const normalizedPlayerId = Number(playerId);
    if (!Number.isFinite(normalizedPlayerId)) {
      socket.emit('error', 'Invalid player selected.');
      return;
    }

    const player = roomAvailablePlayers.find((p) => p.id === normalizedPlayerId);
    if (!player) {
      socket.emit('error', 'Player not found or already sold');
      return;
    }
    
    room.currentPlayer = {
      id: player.id,
      name: player.name,
      role: player.role,
      country: player.country,
      basePrice: player.basePrice,
      currentBid: player.basePrice,
      tier: player.tier,
      image: player.image,
      stats: player.stats || {},
      profile: player.profile || {}
    };
    room.currentHighestBidder = null;
    room.timeLeft = 10;
    room.currentBidHistory = [];
    
    if (room.timer) clearInterval(room.timer);
    startTimer(room, io);
    
    io.to(normalizedRoomCode).emit('playerNominated', room.currentPlayer);
    io.to(normalizedRoomCode).emit('availablePlayers', roomAvailablePlayers);
  });
  
  // Place bid
  socket.on('placeBid', (data) => {
    const { roomCode, bidAmount } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    
    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Auction already moved to Playing XI stage.');
      return;
    }
    if (!room.currentPlayer) {
      socket.emit('error', 'No player on auction');
      return;
    }
    const teamCode = getSocketTeamCode(room, socket.id);
    if (!teamCode) {
      socket.emit('error', 'You haven\'t selected a team yet');
      return;
    }

    const normalizedBidAmount = Number(bidAmount);
    if (!Number.isFinite(normalizedBidAmount) || normalizedBidAmount <= 0) {
      socket.emit('error', 'Invalid bid amount.');
      return;
    }

    const validation = validateBid(room, teamCode, normalizedBidAmount);
    if (!validation.valid) {
      socket.emit('error', validation.reason);
      return;
    }
    
    room.currentPlayer.currentBid = normalizedBidAmount;
    room.currentHighestBidder = teamCode;
    room.currentBidTeams[teamCode] = true;
    recordCurrentBid(room, teamCode, normalizedBidAmount);
    room.timeLeft = getPostBidTimeLeft(room, 10);
    
    emitBidUpdateWithSkipPrivacy(room, {
      team: teamCode,
      bid: normalizedBidAmount,
      player: room.currentPlayer
    }, io);

    if (isAIMode(room.mode)) {
      runAIBidCycle(room, io);
    }
  });
  
  // Finalize sale (auctioneer only)
  socket.on('finalizeSale', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Auction already moved to Playing XI stage.');
      return;
    }

    if (isAIMode(room.mode)) {
      socket.emit('error', 'AI mode controls sold/unsold automatically.');
      return;
    }
    
    if (room.auctioneer !== socket.id) {
      socket.emit('error', 'Only auctioneer can finalize sale');
      return;
    }
    
    if (room.timer) clearInterval(room.timer);
    finalizeSale(room, io);
  });
  
  // Mark unsold
  socket.on('markUnsold', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    const roomAvailablePlayers = room ? getRoomAvailablePlayers(room) : null;
    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Auction already moved to Playing XI stage.');
      return;
    }

    if (isAIMode(room.mode)) {
      socket.emit('error', 'AI mode controls sold/unsold automatically.');
      return;
    }

    clearAIBidTimeout(room);
    
    if (room.auctioneer !== socket.id) {
      socket.emit('error', 'Only auctioneer can mark unsold');
      return;
    }
    
    if (room.currentPlayer) {
      const playerData = roomAvailablePlayers.find((p) => p.id === room.currentPlayer.id);
      if (!playerData) {
        socket.emit('error', 'Player not found in room pool.');
        return;
      }

      io.to(normalizedRoomCode).emit('message', `${playerData.name} went unsold!`);
      io.to(normalizedRoomCode).emit('playerUnsold', {
        player: playerData,
        teams: room.teams
      });

      room.unsoldPlayers.push({
        id: playerData.id,
        name: playerData.name,
        role: playerData.role,
        basePrice: playerData.basePrice
      });
      
      // Remove from available players
      const index = roomAvailablePlayers.findIndex((p) => p.id === playerData.id);
      if (index !== -1) roomAvailablePlayers.splice(index, 1);
    }
    
    room.currentPlayer = null;
    room.currentHighestBidder = null;
    room.currentBidHistory = [];
    io.to(normalizedRoomCode).emit('availablePlayers', roomAvailablePlayers);

    if (isAuctionReadyForPlayingXI(room)) {
      startPlayingXIPhase(room, io);
      return;
    }

    if (isAIMode(room.mode) && roomAvailablePlayers.length > 0) {
      setTimeout(() => {
        nominateNextPlayer(room, io);
      }, 2000);
    }
  });

  // Skip only your bid for current player (AI mode)
  socket.on('skipMyBid', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;
    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('error', 'Auction already moved to Playing XI stage.');
      return;
    }

    if (!isAIMode(room.mode)) {
      socket.emit('error', 'Skip bid is available only in AI mode.');
      return;
    }

    if (!room.currentPlayer) {
      socket.emit('error', 'No active player to skip.');
      return;
    }

    const teamCode = getSocketTeamCode(room, socket.id);
    if (!teamCode) {
      socket.emit('error', 'Select a team first.');
      return;
    }

    if (!room.currentPlayerSkippedTeams) room.currentPlayerSkippedTeams = {};
    room.currentPlayerSkippedTeams[teamCode] = true;
    if (room.currentBidTeams && room.currentBidTeams[teamCode]) {
      delete room.currentBidTeams[teamCode];
    }
    const skippedHighestBidder = room.currentHighestBidder === teamCode;
    let adjustedState = null;
    if (skippedHighestBidder) {
      adjustedState = rebuildAuctionLeaderAfterSkip(room);
    }
    room.forceAIBidCurrent = true;
    room.fastTrackEndAt = Date.now() + 4000;
    room.timeLeft = getPostBidTimeLeft(room, 4);

    io.to(normalizedRoomCode).emit('bidSkipUpdate', {
      team: teamCode,
      playerId: room.currentPlayer.id,
      playerName: room.currentPlayer.name,
      timeLeft: room.timeLeft
    });
    io.to(normalizedRoomCode).emit('timerTick', room.timeLeft);

    if (adjustedState) {
      io.to(normalizedRoomCode).emit('auctionStateAdjusted', {
        playerId: room.currentPlayer.id,
        team: adjustedState.team,
        bid: adjustedState.bid
      });
    }

    runAIBidCycle(room, io);
  });
  
  // Switch auction mode (disabled: mode is locked from room creation)
  socket.on('setAuctionMode', (data) => {
    const { roomCode, mode } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    
    if (!room) return;
    if (room.auctioneer !== socket.id) {
      socket.emit('error', 'Only auctioneer can change mode');
      return;
    }

    socket.emit('error', `Mode is locked as ${room.mode.toUpperCase()} for this room. Create a new room to use ${String(mode || '').toUpperCase()}.`);
  });
  
  // Send chat message
  socket.on('sendMessage', (data) => {
    const { roomCode, message, playerName } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    
    if (!room) return;

    const safeMessage = sanitizeChatMessage(message);
    if (!safeMessage) return;

    const msgData = {
      player: sanitizeDisplayName(playerName) || 'Player',
      message: safeMessage,
      time: new Date().toLocaleTimeString()
    };
    
    room.messages.push(msgData);
    io.to(normalizedRoomCode).emit('newMessage', msgData);
  });
  
  // Get available players
  socket.on('getAvailablePlayers', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;

    if (room.phase !== ROOM_PHASES.AUCTION) {
      socket.emit('availablePlayers', []);
      return;
    }

    socket.emit('availablePlayers', getRoomAvailablePlayers(room));
  });
  
  // Get my squad
  socket.on('getMySquad', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    const teamCode = room ? getSocketTeamCode(room, socket.id) : null;
    if (!room || !teamCode) return;

    const myTeam = room.teams[teamCode];
    socket.emit('mySquad', myTeam);
  });
  
  // Get all teams
  socket.on('getAllTeams', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;
    const viewerTeamCode = getSocketTeamCode(room, socket.id);
    
    socket.emit('allTeams', buildAllTeamsDashboardSnapshot(room, viewerTeamCode));
  });

  socket.on('getPlayingXIState', (roomCode) => {
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;

    socket.emit('playingXIState', buildPlayingXISnapshot(room, socket.id));
  });

  socket.on('savePlayingXISelection', (data) => {
    const { roomCode, playerIds } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;

    if (room.phase !== ROOM_PHASES.PLAYING_XI) {
      socket.emit('error', 'Playing XI room is not open yet.');
      return;
    }

    const teamCode = getSocketTeamCode(room, socket.id);
    if (!teamCode || !(room.playingXICompetitionTeams || []).includes(teamCode)) {
      socket.emit('error', 'Only participating franchise owners can edit Playing XI.');
      return;
    }

    const currentSelection = room.playingXISelections?.[teamCode];
    if (currentSelection?.locked) {
      socket.emit('error', 'Playing XI is already locked for your team.');
      return;
    }

    const squadIds = new Set((room.teams?.[teamCode]?.players || []).map((player) => Number(player.id)));
    const normalizedIds = [...new Set(
      (Array.isArray(playerIds) ? playerIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && squadIds.has(value))
    )].slice(0, PLAYING_XI_SIZE);

    room.playingXISelections[teamCode] = {
      ...(currentSelection || {}),
      playerIds: normalizedIds,
      locked: false,
      autoFilled: false,
      lockedAt: null
    };

    io.to(normalizedRoomCode).emit('playingXIStateChanged', { roomCode: normalizedRoomCode });
  });

  socket.on('lockPlayingXI', (data) => {
    const { roomCode, playerIds } = data || {};
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const room = activeRooms.get(normalizedRoomCode);
    if (!room) return;

    if (room.phase !== ROOM_PHASES.PLAYING_XI) {
      socket.emit('error', 'Playing XI room is not open yet.');
      return;
    }

    const teamCode = getSocketTeamCode(room, socket.id);
    if (!teamCode || !(room.playingXICompetitionTeams || []).includes(teamCode)) {
      socket.emit('error', 'Only participating franchise owners can lock Playing XI.');
      return;
    }

    const currentSelection = room.playingXISelections?.[teamCode];
    if (currentSelection?.locked) {
      socket.emit('error', 'Playing XI is already locked for your team.');
      return;
    }

    const idsToLock = Array.isArray(playerIds) && playerIds.length > 0
      ? playerIds
      : (currentSelection?.playerIds || []);
    const validation = validatePlayingXISelection(room, teamCode, idsToLock);
    if (!validation.valid) {
      socket.emit('error', validation.reason);
      return;
    }

    room.playingXISelections[teamCode] = {
      ...(currentSelection || {}),
      playerIds: validation.playerIds,
      locked: true,
      autoFilled: false,
      lockedAt: Date.now()
    };

    if (allCompetitionTeamsLocked(room)) {
      computePlayingXIRankings(room);
      io.to(normalizedRoomCode).emit('message', 'All Playing XI selections are locked. Rankings are ready.');
    } else {
      io.to(normalizedRoomCode).emit('message', `${room.teams?.[teamCode]?.name || teamCode} locked Playing XI.`);
    }

    io.to(normalizedRoomCode).emit('playingXIStateChanged', {
      roomCode: normalizedRoomCode,
      allTeamsLocked: allCompetitionTeamsLocked(room)
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Keep room and team ownership stable across refresh/navigation.
    // Players are marked offline and can reconnect with the same name later.
    for (const [roomCode, room] of activeRooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        player.connected = false;

        const pendingKey = String(player.name || '').trim().toLowerCase();
        if (pendingKey && room.pendingRemovals && room.pendingRemovals[pendingKey]) {
          clearTimeout(room.pendingRemovals[pendingKey]);
          delete room.pendingRemovals[pendingKey];
        }

        io.to(roomCode).emit('playersUpdate', buildPlayersSnapshot(room));
        io.to(roomCode).emit('message', `${player.name} disconnected. Team and auction progress are preserved.`);

        const hasConnectedPlayers = room.players.some((p) => p.connected !== false);
        if (!hasConnectedPlayers) {
          scheduleRoomCleanup(roomCode, room);
        }
      }
    }
  });
});

// ============ START SERVER ============
const BASE_PORT = Number(process.env.PORT) || 3000;

function startServer(port, attemptsLeft = 10) {
  server.listen(port, '0.0.0.0', () => {
    const publicUrl = publicBaseUrl || `http://localhost:${port}`;
    const bannerLines = [
      'IPL AUCTION GAME',
      '',
      'Server running on:',
      publicUrl,
      '',
      publicBaseUrl ? 'Permanent deployment mode is active.' : 'Share this URL with your friends!'
    ];
    const contentWidth = Math.max(...bannerLines.map((line) => line.length), 32);
    const topBottom = `+${'-'.repeat(contentWidth + 2)}+`;
    const renderedBanner = [
      topBottom,
      ...bannerLines.map((line) => `| ${line.padEnd(contentWidth)} |`),
      topBottom
    ].join('\n');

    console.log(`\n${renderedBanner}\n`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  });

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy, trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort, attemptsLeft - 1), 150);
      return;
    }

    console.error('Server failed to start:', err.message);
    process.exit(1);
  });
}

startServer(BASE_PORT);
