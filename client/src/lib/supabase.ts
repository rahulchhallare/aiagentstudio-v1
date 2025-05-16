import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to empty strings to avoid initialization errors
// (the actual client will be initialized once proper credentials are provided)
const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export default supabase;
