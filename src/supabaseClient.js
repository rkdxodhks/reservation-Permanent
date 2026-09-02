import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fix #8: Removed debug console.log statements that were leaking to production
const finalUrl = supabaseUrl || "";
const finalKey = supabaseAnonKey || "";

// Supabase 클라이언트 생성
let supabase;
try {
  if (!finalUrl || !finalKey) {
    throw new Error("Supabase env vars not set");
  }
  supabase = createClient(finalUrl, finalKey);
} catch (error) {
  // Fallback stub so the app doesn't crash if env vars are missing
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      upsert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      delete: () => ({
        eq: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        match: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
  };
}

export { supabase };
