import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rttoxolpatntrkrcetpdzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dG94b2xwYXRua3JjZXRwZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjE2OTIsImV4cCI6MjA4MzAzNzY5Mn0.dwCnBByEBhmZsu72u0KD8qNqe-Y3TxWlIu1Ehz0XzRo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDemo() {
  try {
    console.log('🔧 Setting up demo account...\n');

    // Try to sign up demo user
    const { data, error } = await supabase.auth.signUp({
      email: 'demo@example.com',
      password: 'Demo@12345',
      options: {
        data: {
          name: 'Demo User'
        }
      }
    });

    if (error && !error.message.includes('already exists')) {
      throw error;
    }

    if (error && error.message.includes('already exists')) {
      console.log('✅ Demo account already exists!');
    } else {
      console.log('✅ Demo account created successfully!');
    }

    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    demo@example.com');
    console.log('🔑 Password: Demo@12345');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDemo();
