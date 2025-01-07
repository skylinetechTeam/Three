import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://uvrijaxthcqclczwwkhk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cmlqYXh0aGNxY2xjend3a2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDcxNDMsImV4cCI6MjA1MTQyMzE0M30.Go6WWaOo-dMgf79WRA3HINUFjm_2H9d12Q9IEmrNyKc";



export const supabase = createClient(supabaseUrl, supabaseAnonKey);
