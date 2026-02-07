# 🚀 Deployment Guide - SatelliteFusion Dashboard

This guide will help you deploy your SatelliteFusion Dashboard to the cloud for free.

## Architecture Overview

```
┌─────────────────────┐      ┌─────────────────────┐
│   Frontend (React)  │ ───► │   Backend (Node.js) │
│      Vercel         │      │      Render         │
└─────────────────────┘      └─────────────────────┘
                                      │
                                      ▼
                             ┌─────────────────────┐
                             │   Database (Postgres)│
                             │      Supabase       │
                             └─────────────────────┘
```

---

## 📋 Prerequisites

1. **GitHub Account** - https://github.com
2. **Vercel Account** - https://vercel.com (sign up with GitHub)
3. **Render Account** - https://render.com (sign up with GitHub)
4. **Supabase Account** (optional) - https://supabase.com

---

## Step 1: Push Code to GitHub

### 1.1 Create a new GitHub repository

1. Go to https://github.com/new
2. Name it `satellite-dashboard` (or any name you prefer)
3. Keep it **Public** or **Private**
4. DON'T initialize with README (we already have code)
5. Click **Create repository**

### 1.2 Push your code

Open terminal in your project folder and run:

```bash
cd "D:\Dashboard sat"

# Initialize git (if not already)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - SatelliteFusion Dashboard"

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/satellite-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your `satellite-dashboard` repository
5. Configure the service:

| Setting            | Value                     |
| ------------------ | ------------------------- |
| **Name**           | `satellite-dashboard-api` |
| **Root Directory** | `backend`                 |
| **Environment**    | `Node`                    |
| **Build Command**  | `npm install`             |
| **Start Command**  | `npm start`               |
| **Plan**           | `Free`                    |

### 2.2 Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key                 | Value                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`          | `production`                                                         |
| `PORT`              | `10000`                                                              |
| `CORS_ORIGIN`       | `https://your-frontend.vercel.app` (update after deploying frontend) |
| `SUPABASE_URL`      | Your Supabase URL (optional)                                         |
| `SUPABASE_ANON_KEY` | Your Supabase anon key (optional)                                    |
| `JWT_SECRET`        | `your-random-secret-string-here`                                     |

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-5 minutes)
3. Copy your backend URL: `https://satellite-dashboard-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `satellite-dashboard` repository
4. Configure the project:

| Setting              | Value           |
| -------------------- | --------------- |
| **Root Directory**   | `frontend`      |
| **Framework Preset** | `Vite`          |
| **Build Command**    | `npm run build` |
| **Output Directory** | `dist`          |

### 3.2 Add Environment Variables

Click **"Environment Variables"** and add:

| Key                          | Value                                              |
| ---------------------------- | -------------------------------------------------- |
| `VITE_API_URL`               | `https://satellite-dashboard-api.onrender.com/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk key (get from clerk.com)                |

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for deployment (takes 1-2 minutes)
3. Your frontend URL: `https://satellite-dashboard.vercel.app`

---

## Step 4: Update CORS Settings

Go back to Render and update the `CORS_ORIGIN` environment variable:

```
CORS_ORIGIN=https://your-project-name.vercel.app
```

Then click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Step 5: Set Up Supabase (Optional - for Database)

If you want persistent data storage:

### 5.1 Create Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in project details and wait for setup

### 5.2 Create Tables

Go to **SQL Editor** and run:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  satellite TEXT,
  region JSONB,
  cloud_cover NUMERIC,
  resolution TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis table
CREATE TABLE analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  dataset_id UUID REFERENCES datasets(id),
  type TEXT,
  results JSONB,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
```

### 5.3 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
3. Add these to your Render environment variables

---

## Step 6: Set Up Clerk Authentication (Optional)

### 6.1 Create Clerk Application

1. Go to https://clerk.com
2. Create a new application
3. Choose authentication methods (Email, Google, etc.)

### 6.2 Get API Keys

1. Go to **API Keys**
2. Copy **Publishable Key**
3. Add to Vercel as `VITE_CLERK_PUBLISHABLE_KEY`
4. Redeploy on Vercel

---

## 🎉 Deployment Complete!

Your app should now be live at:

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-project-api.onrender.com`

### Troubleshooting

| Issue              | Solution                                                |
| ------------------ | ------------------------------------------------------- |
| CORS errors        | Update `CORS_ORIGIN` in Render to match your Vercel URL |
| API not responding | Check Render logs for errors                            |
| Build failed       | Check build logs in Vercel/Render                       |
| Auth not working   | Verify Clerk keys are correct                           |

### Free Tier Limitations

- **Render**: Server sleeps after 15 min of inactivity (first request takes ~30s to wake up)
- **Vercel**: 100GB bandwidth/month
- **Supabase**: 500MB database, 1GB file storage

---

## Quick Commands Reference

```bash
# Check git status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub (triggers auto-deploy)
git push origin main

# View Vercel deployments
npx vercel

# View Render logs
# Go to render.com dashboard → Your service → Logs
```

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Clerk Docs: https://clerk.com/docs
