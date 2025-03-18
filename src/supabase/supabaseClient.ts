import { createClient } from '@supabase/supabase-js';

// These environment variables are set in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helper functions
export const signUp = async (email: string, password: string, displayName?: string) => {
  return await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
        full_name: displayName || email.split('@')[0]
      }
    }
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

// New function to update a user's profile
export const updateUserProfile = async (displayName: string) => {
  return await supabase.auth.updateUser({
    data: { 
      display_name: displayName,
      full_name: displayName
    }
  });
};

// New function to check if a display name is already taken
export const isDisplayNameTaken = async (displayName: string) => {
  if (!displayName.trim()) return false;
  
  const { data, error } = await supabase
    .from('user_stats')
    .select('id')
    .eq('user_display_name', displayName.trim())
    .limit(1);
    
  if (error) {
    console.error('Error checking display name:', error);
    // If there's an error, we'll assume the name is not taken to allow the user to continue
    return false;
  }
  
  // If we got any results, the name is taken
  return data && data.length > 0;
}; 