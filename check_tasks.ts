import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mizzhoiredeweqdxdjam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1penpob2lyZWRld2VxZHhkamFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDAwMDIsImV4cCI6MjA5NTkxNjAwMn0.ptiZ0b726Hv75yO9wrL0sLM3DtQOPHaAHNB1rRwTYyw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {  
  const { data: all } = await supabase.from('tasks').select('task_type');
  const counts = {};
  all?.forEach(t => {
     counts[t.task_type] = (counts[t.task_type] || 0) + 1;
  });
  console.log(counts);
}
run();
