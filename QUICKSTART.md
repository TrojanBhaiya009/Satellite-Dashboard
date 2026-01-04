# 🚀 QUICK START GUIDE

## One-Command Startup (Windows)

```powershell
cd "Dashboard sat"
.\start.bat
```

This opens two terminals automatically:

- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

---

## Manual Startup (All Platforms)

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

You should see:

```
✓ MongoDB connected
🚀 Server running on port 5000
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

You should see:

```
  ➜  Local:   http://localhost:5173/
```

---

## First Time Setup

### 1. Install Dependencies (if not done)

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start MongoDB

**Windows (if installed locally):**

- MongoDB should be running as a service automatically
- Or run: `mongosh` to verify connection

**Mac:**

```bash
brew services start mongodb-community
```

**Linux:**

```bash
sudo systemctl start mongod
```

**Or use MongoDB Atlas (Cloud):**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Copy connection string
4. Update `backend/.env`: `MONGODB_URI=<your-connection-string>`

### 3. Run the Application

Use `start.bat` (Windows) or run the two terminal commands above.

---

## Test the Application

### Create Account

1. Open `http://localhost:5173`
2. Click "Create Account"
3. Fill in details and submit

### Create a Dataset

1. Click the input fields in the left panel
2. Fill dataset info
3. Click "➕ Create Dataset"
4. See dataset appear in the list

### Run Analysis

1. Click a dataset to select it
2. Switch to "Analysis" tab in top right
3. Select analysis type from dropdown
4. Click "▶ Run Analysis"
5. Watch real-time progress with WebSocket updates!

---

## Default Configuration

**Backend** (running on `port 5000`):

- MongoDB: `mongodb://localhost:27017/satellite_db`
- Frontend allowed: `http://localhost:5173`

**Frontend** (running on `port 5173`):

- API URL: `http://localhost:5000`
- Auto-opens browser on `npm run dev`

---

## Project Structure

```
Dashboard sat/
├── backend/                 # Node.js + Express API
│   ├── models/             # MongoDB schemas
│   ├── controllers/        # Business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # JWT auth
│   ├── sockets/           # WebSocket handlers
│   ├── server.js          # Express server
│   └── .env              # Configuration
│
├── frontend/              # React + Vite app
│   ├── src/
│   │   ├── pages/        # Auth & Dashboard
│   │   ├── components/   # UI components
│   │   ├── services/     # API & WebSocket
│   │   ├── store/        # Zustand state
│   │   ├── App.jsx       # Main component
│   │   └── main.jsx      # Entry point
│   ├── index.html        # HTML template
│   ├── vite.config.js    # Vite config
│   └── .env             # Frontend config
│
├── README.md            # Full documentation
├── start.bat           # Windows startup script
├── start.sh            # Unix startup script
└── .gitignore
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/register     - Create account
POST   /api/auth/login        - Login
GET    /api/auth/profile      - Get user (requires token)
```

### Datasets

```
POST   /api/datasets          - Create dataset
GET    /api/datasets          - List all datasets
GET    /api/datasets/:id      - Get one dataset
PUT    /api/datasets/:id      - Update dataset
DELETE /api/datasets/:id      - Delete dataset
GET    /api/datasets/search   - Search datasets
```

### Analysis

```
POST   /api/analysis          - Create analysis
GET    /api/analysis          - List analyses
GET    /api/analysis/:id      - Get one analysis
DELETE /api/analysis/:id      - Delete analysis
GET    /api/analysis/dataset/:id - Get analyses for dataset
```

---

## Real-time Features

The app uses **Socket.io** for live updates:

- **Analysis Progress**: Watch progress bars update in real-time
- **Completion Notifications**: Get instant alerts when analysis finishes
- **Error Handling**: See errors immediately

---

## Troubleshooting

### Can't connect to MongoDB?

```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solutions:
1. Start MongoDB service (Windows: check Services)
2. Use MongoDB Atlas cloud URI instead
3. Check backend/.env has correct connection string
```

### Port already in use?

```
Error: listen EADDRINUSE :::5000

Solutions:
1. Kill process: taskkill /PID <pid> /F (Windows)
2. Or change port in backend/.env
3. Check no other instance is running
```

### CORS error in browser console?

```
Check:
1. Backend is running on http://localhost:5000
2. Frontend CORS_ORIGIN in backend/.env
3. Frontend running on http://localhost:5173
```

### WebSocket connection failed?

```
Solutions:
1. Verify backend is running
2. Check network/firewall settings
3. Clear browser cache and refresh
```

---

## Development Tips

### Hot Reload

- **Frontend**: Vite automatically reloads on code changes
- **Backend**: Nodemon automatically restarts on code changes

### Debug Mode

- Open browser DevTools (F12) for frontend debugging
- Check terminal logs for backend errors

### Environment Variables

- Copy `.env` files to use custom settings
- Never commit `.env` files (use `.env.example` instead)

---

## Next Steps

1. **Customize UI**: Edit files in `frontend/src/components`
2. **Add Features**: Create new API endpoints in `backend/routes`
3. **Improve Analysis**: Enhance algorithms in `backend/controllers/analysis.js`
4. **Deploy**: Use Vercel (frontend) and Heroku (backend)

---

## Commands Reference

```bash
# Backend
npm run dev        # Start with auto-reload
npm start         # Start production mode
npm install       # Install dependencies

# Frontend
npm run dev       # Start dev server with Vite
npm run build     # Build for production
npm install       # Install dependencies

# Project root
cd backend        # Enter backend directory
cd frontend       # Enter frontend directory
```

---

## Support

- Check `README.md` for full documentation
- Review API endpoints above
- Check browser console for frontend errors
- Check terminal for backend errors

---

**Happy Coding! 🚀**
