
import { createClient } from '@supabase/supabase-js';

// Configuration via Environment Variables
// In Vite, variables must start with VITE_
// Keys provided by user for immediate fix
const FALLBACK_URL = 'https://bzyispmcewkvxgcqabru.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eWlzcG1jZXdrdnhnY3FhYnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjU5ODYsImV4cCI6MjA4MDkwMTk4Nn0.OV8m9NfURdQmgwNnd1U7Sgxk8Fk-skxCYQRWHiFsDsY';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase Credentials missing. Cloud features will be disabled.");
}

// Create a single instance to be used throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
