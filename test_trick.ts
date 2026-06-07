import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mizzhoiredeweqdxdjam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1penpob2lyZWRld2VxZHhkamFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDAwMDIsImV4cCI6MjA5NTkxNjAwMn0.ptiZ0b726Hv75yO9wrL0sLM3DtQOPHaAHNB1rRwTYyw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('approve_task_submission', { 
    p_submission_id: '00000000-0000-0000-0000-000000000000', 
    p_user_id: 'fc262f89-1a39-41d1-a46d-e8ffc7a6e797', 
    p_reward: -5 
  });
  console.log('Test trick:', data, error);
}
check();
