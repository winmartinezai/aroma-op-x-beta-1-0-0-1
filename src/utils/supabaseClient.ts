
import { createClient } from '@supabase/supabase-js';

// Configuration via Environment Variables
// In Vite, variables must start with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase Credentials missing. Cloud features will be disabled.");
}

// Create a single instance to be used throughout the app
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
