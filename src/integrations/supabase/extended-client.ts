
// Цей файл створює клієнт Supabase з розширеними типами для підтримки нових таблиць
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzjwkentllirumevvmhr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6andrZW50bGxpcnVtZXZ2bWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0OTY4MDQsImV4cCI6MjA1OTA3MjgwNH0.Z8v_Hf_Q9sJ4JsyXYxIg0aOJDiwmQo6pgw3L2uJwtCU";

// Створюємо клієнт без строгої типізації, який може працювати з новими таблицями
export const extendedSupabase = createClient(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
