import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Test Supabase connection
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count()', { count: 'exact' });
    
    if (error) throw error;
    
    res.json({
      status: 'healthy',
      message: '✓ Supabase connected',
      database: 'PostgreSQL (Supabase)',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: '✗ Supabase connection failed',
      error: err.message
    });
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    // Store user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'user',
        organization: 'SatelliteFusion User'
      });

    if (profileError) throw profileError;

    res.json({
      success: true,
      user: authData.user,
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      session: data.session,
      user: data.user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Datasets Routes
app.post('/api/datasets', async (req, res) => {
  try {
    const { userId, name, satellite, region, cloudCover, resolution } = req.body;

    const { data, error } = await supabase
      .from('datasets')
      .insert({
        user_id: userId,
        name,
        satellite,
        region: JSON.stringify(region),
        cloud_cover: cloudCover,
        resolution,
        created_at: new Date()
      })
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/datasets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analysis Routes
app.post('/api/analysis', async (req, res) => {
  try {
    const { userId, datasetId, analysisType } = req.body;

    const { data, error } = await supabase
      .from('analysis')
      .insert({
        user_id: userId,
        dataset_id: datasetId,
        analysis_type: analysisType,
        status: 'completed',
        progress: 100,
        results: {
          ndvi: [0.72, 0.71, 0.69, 0.65, 0.58],
          ndbi: [0.12, 0.14, 0.16, 0.22, 0.28],
          ndmi: [0.68, 0.67, 0.65, 0.62, 0.58],
          ndwi: [0.35, 0.33, 0.30, 0.25, 0.18],
          evi: [1.85, 1.82, 1.78, 1.70, 1.58]
        },
        created_at: new Date()
      })
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     🛰️  SatelliteFusion Dashboard        ║
║          Powered by Supabase              ║
╚═══════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🗄️  Database: PostgreSQL (Supabase)
📡 API: http://localhost:${PORT}/api
🌐 Frontend: http://localhost:5173

Ready to process satellite data! 🌍
  `);
});
