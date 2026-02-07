# 🛰️ SatelliteFusion Dashboard - MERN MVP

A production-ready MERN stack application for real-time satellite data analysis and visualization. Integrates Sentinel-2, Landsat, and ISRO satellite imagery with advanced spectral analysis, change detection, and anomaly monitoring capabilities. Built for the HyperSpace Innovation Hackathon 2024.

## ✨ Key Features

- **Real-time Updates**: Socket.io powered live analysis progress and data streaming
- **Multi-Satellite Support**: Sentinel-2, Landsat 8/9, ISRO Cartosat with automatic band mapping
- **Advanced Spectral Analysis**: NDVI, NDBI, NDMI, NDWI, EVI calculations with visualizations
- **Change Detection**: Temporal analysis for monitoring land use and environmental changes
- **Anomaly Detection**: Statistical outlier detection using multiple methods
- **Interactive Maps**: Leaflet-based geospatial visualization with layer controls
- **User Authentication**: JWT-based secure authentication system
- **RESTful API**: Complete API documentation with WebSocket support
- **Real-time Collaboration**: Live dataset and analysis sharing via WebSockets
- **Modern UI/UX**: Sleek dark theme with responsive design, no heavy CSS frameworks

## 🏗️ Tech Stack

### Frontend

- **React 18** - Modern UI with hooks
- **Vite** - Lightning fast builds
- **Leaflet + React-Leaflet** - Interactive maps
- **Chart.js** - Real-time data visualization
- **Zustand** - Lightweight state management
- **Socket.io Client** - Real-time updates
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Hot Toast** - Toast notifications
- **Pure CSS** - No external CSS framework, custom styling

### Backend

- **Node.js + Express.js** - RESTful API server
- **MongoDB + Mongoose** - NoSQL database
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Stateless authentication
- **Bcryptjs** - Secure password hashing
- **Express Validator** - Input validation

### Infrastructure

- **No Docker** - Run natively on Windows/Mac/Linux
- **MongoDB** - Local or Atlas cloud
- **Node.js 18+** - Cross-platform runtime

## 📋 Project Structure

```
Dashboard sat/
├── backend/
│   ├── models/
│   │   ├── User.js              # User schema with authentication
│   │   ├── Dataset.js           # Satellite dataset model
│   │   └── Analysis.js          # Analysis results model
│   ├── controllers/
│   │   ├── auth.js              # Authentication logic
│   │   ├── datasets.js          # Dataset CRUD operations
│   │   └── analysis.js          # Analysis processing
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── datasets.js          # Dataset endpoints
│   │   └── analysis.js          # Analysis endpoints
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── sockets/
│   │   └── index.js             # WebSocket handlers
│   ├── server.js                # Express setup
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth.jsx         # Login/Register
│   │   │   └── Dashboard.jsx    # Main dashboard
│   │   ├── components/
│   │   │   ├── Map.jsx          # Leaflet map
│   │   │   ├── Toolbar.jsx      # Dataset creation
│   │   │   ├── DatasetPanel.jsx # Dataset list
│   │   │   └── AnalysisPanel.jsx# Analysis tools
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance
│   │   │   └── socket.js        # Socket.io setup
│   │   ├── store/
│   │   │   └── index.js         # Zustand stores
│   │   ├── App.jsx              # Main app with routing
│   │   ├── App.css              # Global styles
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
│
├── README.md
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (Download from https://nodejs.org)
- **npm** or **yarn** (comes with Node.js)
- **MongoDB** (local or free Atlas account at https://www.mongodb.com/cloud/atlas)

### Step 1: Set Up MongoDB

**Option A: Local MongoDB (Windows)**

```powershell
# If installed via MSI installer, MongoDB runs as a service automatically
# Verify it's running:
mongosh
# Should connect successfully
```

**Option B: MongoDB Atlas (Cloud - Recommended)**

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Copy the connection string and update `backend/.env`

### Step 2: Install Dependencies

```powershell
cd "Dashboard sat"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

cd ..
```

### Step 3: Configure Environment Variables

**Backend** (`backend/.env`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/satellite_db
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000
```

### Step 4: Run the Application

**Open two terminals:**

**Terminal 1 - Backend:**

```powershell
cd "Dashboard sat\backend"
npm run dev
```

Expected output:

```
✓ MongoDB connected
🚀 Server running on port 5000
📍 Environment: development
```

**Terminal 2 - Frontend:**

```powershell
cd "Dashboard sat\frontend"
npm run dev
```

Expected output:

```
  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:5173/
```

### Step 5: Open Application

1. Open browser to **http://localhost:5173**
2. Register a new account
3. Create a satellite dataset
4. Run spectral analysis with real-time progress
5. View results with interactive visualizations

## 📡 API Reference

### Authentication

#### Register

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "organization": "NASA"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "organization": "NASA"
  }
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure-password"
}

Response: { token, user }
```

#### Get Profile

```bash
GET /api/auth/profile
Authorization: Bearer <token>

Response: {
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "organization": "NASA"
}
```

### Datasets

#### Create Dataset

```bash
POST /api/datasets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Delhi Urban Analysis 2024",
  "satellite": "Sentinel-2",
  "region": {
    "type": "Polygon",
    "coordinates": [[[77, 28], [78, 28], [78, 29], [77, 29], [77, 28]]]
  },
  "acquisitionDate": "2024-01-15T00:00:00Z",
  "cloudCover": 15,
  "resolution": "10m",
  "bands": {
    "red": "B4",
    "green": "B3",
    "blue": "B2",
    "nir": "B8"
  }
}
```

#### List All Datasets

```bash
GET /api/datasets
Authorization: Bearer <token>

Response: [{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Delhi Urban Analysis 2024",
  "satellite": "Sentinel-2",
  "cloudCover": 15,
  "resolution": "10m",
  "acquisitionDate": "2024-01-15T00:00:00Z",
  "status": "completed",
  "createdAt": "2024-01-16T10:30:00Z",
  ...
}]
```

#### Get Single Dataset

```bash
GET /api/datasets/:id
Authorization: Bearer <token>
```

#### Update Dataset

```bash
PUT /api/datasets/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Updated Name", "cloudCover": 20 }
```

#### Delete Dataset

```bash
DELETE /api/datasets/:id
Authorization: Bearer <token>
```

### Analysis

#### Create Analysis

```bash
POST /api/analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "datasetId": "507f1f77bcf86cd799439011",
  "type": "spectral-indices",
  "parameters": {}
}

Available types:
- "spectral-indices" - Calculate NDVI, NDBI, NDMI, NDWI, EVI
- "change-detection" - Compare two datasets over time
- "anomaly-detection" - Find unusual patterns
- "classification" - Classify land cover types
```

#### Get All Analyses

```bash
GET /api/analysis
Authorization: Bearer <token>

Response: [{
  "_id": "507f1f77bcf86cd799439011",
  "type": "spectral-indices",
  "status": "completed",
  "progress": 100,
  "results": {
    "ndvi": [0.45, 0.52, 0.68, ...],
    "statistics": {
      "mean": 0.52,
      "std": 0.18,
      "min": 0.1,
      "max": 0.95,
      "median": 0.55
    }
  },
  ...
}]
```

#### Get Single Analysis

```bash
GET /api/analysis/:id
Authorization: Bearer <token>
```

#### Delete Analysis

```bash
DELETE /api/analysis/:id
Authorization: Bearer <token>
```

## 🔌 WebSocket Events

### Client → Server

```javascript
import socket from "./services/socket";

// Join user room for personal updates
socket.emit("join_room", userId);

// Subscribe to dataset updates
socket.emit("subscribe_dataset", datasetId);

// Subscribe to analysis updates
socket.emit("subscribe_analysis", analysisId);
```

### Server → Client

```javascript
import {
  onAnalysisProgress,
  onAnalysisCompleted,
  onAnalysisFailed,
} from "./services/socket";

// Real-time progress updates
onAnalysisProgress((data) => {
  console.log(`Analysis ${data.analysisId}: ${data.progress}%`);
});

// Analysis completion
onAnalysisCompleted((data) => {
  console.log("Results:", data.results);
});

// Error handling
onAnalysisFailed((data) => {
  console.error("Failed:", data.error);
});
```

## 💡 Usage Examples

### Example 1: Create and Analyze a Dataset

```javascript
import { datasetAPI, analysisAPI } from './services/api'

// Create dataset
const dataset = await datasetAPI.create({
  name: 'Deforestation Monitor',
  satellite: 'Sentinel-2',
  region: { type: 'Polygon', coordinates: [...] },
  acquisitionDate: '2024-01-15',
  cloudCover: 10,
  resolution: '10m'
})

// Run spectral analysis
const analysis = await analysisAPI.create({
  datasetId: dataset._id,
  type: 'spectral-indices'
})

// Listen for real-time updates
socket.on('analysis_progress', (data) => {
  updateUI(data.progress)
})

socket.on('analysis_completed', (data) => {
  displayResults(data.results)
})
```

### Example 2: Change Detection

```javascript
// Compare two datasets
const analysis = await analysisAPI.create({
  datasetId: newerDataset._id,
  type: "change-detection",
  parameters: {
    referenceDatasetId: olderDataset._id,
  },
});
```

### Example 3: User Authentication

```javascript
import { authAPI } from "./services/api";
import { useAuthStore } from "./store";

const handleLogin = async (email, password) => {
  const response = await authAPI.login({ email, password });

  // Store token and user
  useAuthStore.setState({
    token: response.data.token,
    user: response.data.user,
  });

  // Redirect to dashboard
  navigate("/dashboard");
};
```

## 🎨 UI Features

- **Modern Dark Theme**: Professional dark mode interface optimized for satellite imagery
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Progress**: Live analysis progress bars with WebSocket updates
- **Interactive Maps**: Leaflet maps with drawing tools and layer controls
- **Data Visualization**: Chart.js for spectral indices and statistics
- **Toast Notifications**: Non-intrusive success/error notifications
- **Smooth Animations**: CSS transitions and React animations

## 🔐 Security Features

- **JWT Authentication**: Stateless, secure token-based auth
- **Password Hashing**: Bcryptjs with salt rounds
- **Input Validation**: Express validator on all endpoints
- **CORS Protection**: Configurable origin restrictions
- **Environment Variables**: Secure credential management

## 📊 Data Models

### User

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|admin),
  organization: String,
  createdAt: Date
}
```

### Dataset

```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  satellite: String (Sentinel-2|Landsat-8|Landsat-9|ISRO-Cartosat),
  region: GeoJSON Polygon,
  acquisitionDate: Date,
  cloudCover: Number (0-100),
  resolution: String (10m|15m|30m|60m),
  bands: Map,
  imageUrl: String,
  metadata: Map,
  status: String (processing|completed|failed),
  fileSize: Number,
  processingTime: Number,
  createdAt: Date
}
```

### Analysis

```javascript
{
  datasetId: ObjectId (ref: Dataset),
  userId: ObjectId (ref: User),
  type: String (spectral-indices|change-detection|anomaly-detection|classification),
  parameters: Map,
  results: {
    ndvi, ndbi, ndmi, ndwi, evi: [Number],
    statistics: { mean, std, min, max, median },
    classification: Map,
    anomalies: [Object]
  },
  visualizationData: Map,
  status: String (pending|processing|completed|failed),
  progress: Number (0-100),
  startedAt: Date,
  completedAt: Date,
  createdAt: Date
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Ensure MongoDB is running (Windows: check Services)
2. Or use MongoDB Atlas cloud connection string
3. Update MONGODB_URI in backend/.env
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000

Solution:
# Find and kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

### CORS Error

```
Error: Access to XMLHttpRequest blocked by CORS policy

Solution:
1. Ensure backend is running on http://localhost:5000
2. Check CORS_ORIGIN in backend/.env matches frontend URL
3. Verify frontend is running on http://localhost:5173
```

### WebSocket Connection Failed

```
Solution:
1. Check backend is running
2. Verify Socket.io is initialized in server.js
3. Check network/firewall settings
```

## 📈 Performance Optimization

- **Vite**: Sub-second HMR for rapid development
- **Mongoose Indexing**: Optimized MongoDB queries
- **JWT Caching**: Reduced database hits
- **Socket.io Rooms**: Efficient WebSocket broadcasts
- **React Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Components load on demand

## 🚢 Deployment

### Backend (Heroku)

```bash
# Set environment variables on Heroku
heroku config:set MONGODB_URI=<your-atlas-url>
heroku config:set JWT_SECRET=<secure-key>

# Deploy
git push heroku main
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📝 License

MIT License - Built for HyperSpace Innovation Hackathon 2024

## 🤝 Contributing

Contributions welcome! Open issues or submit pull requests.

## 📧 Support

For issues or questions, open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the HyperSpace Innovation Hackathon 2024**
