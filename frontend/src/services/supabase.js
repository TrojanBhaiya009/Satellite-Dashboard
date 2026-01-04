import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rttoxolpatntrkrcetpdzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dG94b2xwYXRua3JjZXRwZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjE2OTIsImV4cCI6MjA4MzAzNzY5Mn0.dwCnBByEBhmZsu72u0KD8qNqe-Y3TxWlIu1Ehz0XzRo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Watch auth changes
export const setupAuthListener = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session);
  });
};
