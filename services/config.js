import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://zrgcuuiqdkjlpdsgckow.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ2N1dWlxZGtqbHBkc2dja293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTE1MjYsImV4cCI6MjA4NTI2NzUyNn0.yxb21v7_s_ddUr9A1hwdOClHuAJ_WNjihEAzymRVCoI";
export const supabase = createClient(supabaseUrl, supabaseKey);