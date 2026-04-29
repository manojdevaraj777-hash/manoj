## IPL Auction Game

Real-time multiplayer IPL-style auction game built with Node.js, Express, and Socket.IO.

### Features

- Live room-based auction with host + team managers
- Manual mode and AI-auctioneer mode
- Lobby, live auction stage, and team dashboard
- AI profile training APIs for tuning auction behavior
- Room-isolated player pools (parallel rooms do not interfere)

### Tech Stack

- Node.js
- Express
- Socket.IO
- Vanilla HTML/CSS/JS frontend

### Project Structure

- `server.js` - backend server, room lifecycle, bidding engine, AI behavior
- `public/` - frontend pages (`index.html`, `lobby.html`, `auction.html`, `team-dashboard.html`)
- `data/` - player and AI profile data
- `utils/` - helper modules and CSV import script

### Setup

1. Install dependencies:
```bash
npm install
```

2. Optional environment config (`.env`):
```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
PUBLIC_BASE_URL=http://localhost:3000
```

3. Run locally:
```bash
npm run dev
```
or
```bash
npm start
```

### Scripts

- `npm start` - start server
- `npm run dev` - start with nodemon
- `npm run import:players` - generate normalized player JSON from CSV (`data/ipl-players-imported.json`)
- `npm run select:top400` - keep top 400 players from CSV using market value + form + record, and write selection report (`data/top-400-selection-report.json`)
- `npm run build:market-data` - fetch official IPL auction pages (2021-2025), rebuild:
  - `data/player-price-history-5-seasons.json`
  - `data/ipl-name-sold-unsold.csv`
  - `data/player-market-values-2021-2025.json`
- `npm run build:rankings` - build 2021-2025 ranking list and replace AI key players:
  - `data/ipl-top-rankings-2021-2025.json`
  - `data/ai-auctioneer-profile.json` (`keyPlayers`, `nameScores`)
- `npm run enrich:source618` - enrich `data/all-player-list.csv` to the full schema with auction-derived details (base price in Cr, age/styles/matches when available, form from 2021-2025 sold/unsold)

### Runtime Data Files

- `data/all-player-list.csv` - primary player master list used by backend
- `data/final-player-source.csv` - auction history mapping merged into backend player payloads
- `data/ai-auctioneer-profile.json` - AI profile/persona and key players
- `data/player-market-values-2021-2025.json` - optional market value bands used when available

### Security and Production Baseline

- Configurable CORS allowlist via `ALLOWED_ORIGINS`
- Optional `PUBLIC_BASE_URL` / `APP_BASE_URL` support for deployed domains
- Basic secure headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)
- Input sanitization for room name, display name, and chat messages
- Idle-room cleanup timer to avoid stale room growth

### Permanent Deployment (Render)

This app is now deploy-ready for Render with a health check endpoint and `render.yaml`.

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from this repo.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
4. Set these environment variables in Render:
```env
NODE_ENV=production
ALLOWED_ORIGINS=*
PUBLIC_BASE_URL=https://your-app-name.onrender.com
```
5. After the first deploy, open the Render URL and create rooms from that public URL only.
6. For a custom domain later, update `PUBLIC_BASE_URL` to that domain.

Notes:
- Render's docs say web services support WebSockets, custom domains, and a public `onrender.com` URL.
- Render's free web service spins down after 15 minutes of inactivity and is not recommended for production. If you want the app to stay awake for friends, use a paid always-on web service.

### Notes

- This project keeps in-memory room state. Restarting the server resets active rooms.
- For truly permanent match state, add persistent storage (Redis/Postgres). Right now rooms reset if the server restarts or redeploys.
- For production hardening, next recommended steps are persistent storage (Redis/Postgres), auth, and automated tests.
