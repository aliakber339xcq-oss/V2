import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://mizzhoiredeweqdxdjam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1penpob2lyZWRld2VxZHhkamFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDAwMDIsImV4cCI6MjA5NTkxNjAwMn0.ptiZ0b726Hv75yO9wrL0sLM3DtQOPHaAHNB1rRwTYyw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const fileContent = fs.readFileSync('supabase_setup.sql', 'utf-8');
  
  // Extract and run request_withdrawal
  const matchReq = fileContent.match(/CREATE OR REPLACE FUNCTION request_withdrawal[\s\S]*?\$\$ LANGUAGE plpgsql SECURITY DEFINER;/);
  if (matchReq) {
    const resReq = await supabase.rpc('execute_sql', { sql: matchReq[0] });
    console.log('request_withdrawal:', resReq.error || 'success');
  }

  // Extract and run process_withdrawal
  const matchProc = fileContent.match(/CREATE OR REPLACE FUNCTION process_withdrawal[\s\S]*?\$\$ LANGUAGE plpgsql SECURITY DEFINER;/);
  if (matchProc) {
    const resProc = await supabase.rpc('execute_sql', { sql: matchProc[0] });
    console.log('process_withdrawal:', resProc.error || 'success');
  }
}
run();
