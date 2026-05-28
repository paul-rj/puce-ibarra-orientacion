import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uahymywduuozqscibvuq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHlteXdkdXVvenFzY2lidnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDU4MjEsImV4cCI6MjA5NDk4MTgyMX0.IX5vWlm_XWa7Dgo2jSAl4VebRVc9AhMC3QmqGTuHPOE'

export const supabase = createClient(supabaseUrl, supabaseKey)