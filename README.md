# SatelliteFusion Dashboard

**What is this?** A web app that lets you work with satellite imagery — pull in data from Sentinel-2, Landsat, or ISRO satellites, run analyses on it, and see the results on interactive maps and charts. Everything updates in real time, so you can watch your analysis progress live.

Built with React, Node.js, Express, and MongoDB (the MERN stack). Originally created for the HyperSpace Innovation Hackathon 2024.

---

## What Can It Do?

- **Work with multiple satellites** — Sentinel-2, Landsat 8/9, and ISRO Cartosat are all supported, with automatic band mapping so you don't have to configure everything manually.
- **Run spectral analyses** — Calculate things like NDVI (vegetation health), NDBI (built-up areas), NDMI (moisture), NDWI (water), and EVI (enhanced vegetation). Great for environmental monitoring.
- **Detect changes over time** — Compare satellite images from different dates to see how an area has changed (deforestation, urban growth, etc.).
- **Spot anomalies** — Automatically flag unusual patterns in the data using statistical methods.
- **See everything on a map** — Interactive maps powered by Leaflet, with layer controls so you can toggle different views on and off.
- **Real-time updates** — When you kick off an analysis, you'll see a live progress bar. No refreshing needed — it's all handled through WebSockets.
- **User accounts** — Sign up, log in, and your datasets and analyses are saved to your account.
- **Clean, dark UI** — Looks good, works on mobile, and doesn't rely on heavy CSS frameworks.

---

## Tech Stack (The Short Version)

**Frontend:** React 18, Vite (fast builds), Leaflet (maps), Chart.js (charts), Zustand (state), Socket.io (live updates)

**Backend:** Node.js + Express, MongoDB + Mongoose, Socket.io, JWT auth, bcrypt for passwords

**No Docker required** — just Node.js 18+ and MongoDB (local or cloud).

---

## How the Project Is Organized

```
backend/
  models/         → Database schemas (User, Dataset, Analysis)
  controllers/    → Business logic for each resource
  routes/         → API endpoint definitions
  middleware/     → JWT auth checks
  sockets/        → WebSocket event handlers
  server.js       → App entry point

frontend/
  src/
    pages/        → Auth and Dashboard views
    components/   → Map, Toolbar, DatasetPanel, AnalysisPanel
    services/     → API client and Socket.io setup
    store/        → Zustand state management
    App.jsx       → Routing and layout
```

---

## Getting Started

### What You'll Need

- **Node.js 18 or newer** — grab it from https://nodejs.org
- **MongoDB** — either installed locally, or a free cloud account at https://www.mongodb.com/cloud/atlas (Atlas is easiest if you don't want to install anything)

### 1. Set Up Your Database

**If you're using MongoDB Atlas (recommended):**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Set up a cluster and grab your connection string
3. You'll paste that into the backend config in the next step

**If you have MongoDB installed locally**, just make sure it's running. You can check by opening a terminal and typing `mongosh` — if it connects, you're good.

### 2. Install Everything

```powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up Your Config

Create or edit these two `.env` files:

**backend/.env:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/satellite_db
JWT_SECRET=pick-something-random-and-long
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

If you're using Atlas, replace the `MONGODB_URI` with your Atlas connection string.

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start It Up

You'll need **two terminal windows** — one for the backend, one for the frontend.

**Terminal 1 (Backend):**
```powershell
cd backend
npm run dev
```

You should see something like:
```
MongoDB connected
Server running on port 5000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

You should see:
```
VITE ready
Local: http://localhost:5173/
```

### 5. Use It

1. Open **http://localhost:5173** in your browser
2. Create an account
3. Add a satellite dataset (pick a satellite, draw a region, set the date)
4. Run an analysis and watch the results come in live
5. Explore the data on the map and in the charts

---

## API Overview

All API calls (except register/login) need a `Bearer` token in the `Authorization` header. You get this token when you sign up or log in.

### Auth

| Endpoint | What it does |
|---|---|
| `POST /api/auth/register` | Create a new account. Send `name`, `email`, `password`, and optionally `organization`. Returns a token. |
| `POST /api/auth/login` | Log in with `email` and `password`. Returns a token. |
| `GET /api/auth/profile` | Get your profile info. |

### Datasets

| Endpoint | What it does |
|---|---|
| `POST /api/datasets` | Create a new satellite dataset. Specify the satellite, region (as a GeoJSON polygon), date, cloud cover, resolution, and bands. |
| `GET /api/datasets` | List all your datasets. |
| `GET /api/datasets/:id` | Get details for one dataset. |
| `PUT /api/datasets/:id` | Update a dataset. |
| `DELETE /api/datasets/:id` | Delete a dataset. |

### Analysis

| Endpoint | What it does |
|---|---|
| `POST /api/analysis` | Start a new analysis on a dataset. Types: `spectral-indices`, `change-detection`, `anomaly-detection`, `classification`. |
| `GET /api/analysis` | List all your analyses. |
| `GET /api/analysis/:id` | Get details and results for one analysis. |
| `DELETE /api/analysis/:id` | Delete an analysis. |

### Real-Time Events (WebSockets)

The app uses Socket.io to push live updates to your browser. Here's what you can listen for:

- **`analysis_progress`** — Tells you the current progress percentage while an analysis is running.
- **`analysis_completed`** — Fires when an analysis finishes, with the full results.
- **`analysis_failed`** — Fires if something goes wrong, with the error message.

You can also subscribe to updates for specific datasets or analyses so you only get notifications for what you care about.

---

## Quick Code Examples

### Running an Analysis

```javascript
// Create a dataset, then analyze it
const dataset = await datasetAPI.create({
  name: 'Deforestation Monitor',
  satellite: 'Sentinel-2',
  region: { type: 'Polygon', coordinates: [...] },
  acquisitionDate: '2024-01-15',
  cloudCover: 10,
  resolution: '10m'
})

const analysis = await analysisAPI.create({
  datasetId: dataset._id,
  type: 'spectral-indices'
})

// Watch progress in real time
socket.on('analysis_progress', (data) => updateUI(data.progress))
socket.on('analysis_completed', (data) => displayResults(data.results))
```

### Comparing Satellite Images Over Time

```javascript
const analysis = await analysisAPI.create({
  datasetId: newerDataset._id,
  type: 'change-detection',
  parameters: { referenceDatasetId: olderDataset._id }
})
```

---

## Data Models at a Glance

**User** — name, email, hashed password, role (user or admin), organization

**Dataset** — which satellite, the geographic region (GeoJSON polygon), acquisition date, cloud cover percentage, resolution, spectral bands, processing status

**Analysis** — linked to a dataset, analysis type, parameters, results (spectral index values, statistics like mean/median/std, anomalies), progress percentage, timestamps

---

## Common Issues and Fixes

**"Can't connect to MongoDB"**
Make sure MongoDB is actually running. On Windows, check your Services panel. If you're using Atlas, double-check your connection string in `backend/.env` and make sure your IP is whitelisted.

**"Port 5000 is already in use"**
Something else is using that port. On Windows, run `netstat -ano | findstr :5000` to find the process, then `taskkill /PID <PID> /F` to stop it. Or just change the port in `backend/.env`.

**"CORS error in the browser"**
Make sure both the backend and frontend are running, and that the `CORS_ORIGIN` in `backend/.env` matches the frontend URL (usually `http://localhost:5173`).

**"WebSocket won't connect"**
Usually means the backend isn't running. Start it up and try again. Also check your firewall settings if you're on a corporate network.

---

## Deploying to Production

**Backend** — works great on Heroku, Render, Railway, or any Node.js host. Just set your environment variables (`MONGODB_URI`, `JWT_SECRET`, etc.) and push.

**Frontend** — deploy to Vercel, Netlify, or any static hosting. Run `npm run build` and upload the `dist` folder — or just connect your repo and let the platform handle it.

---

## License

MIT — use it however you want.

## Contributing

Pull requests and issues are welcome. Jump in!

---

*Originally built for the HyperSpace Innovation Hackathon 2024.*
