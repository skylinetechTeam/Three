import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://fplfizngqozlnxkzevyg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbGZpem5ncW96bG54a3pldnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzE3NTYsImV4cCI6MjA2ODk0Nzc1Nn0.jTkKTHIrk8mmmU-gUTrs_gPkyC5D-xsZWTO363yGbfE";



export const supabase = createClient(supabaseUrl, supabaseAnonKey);
