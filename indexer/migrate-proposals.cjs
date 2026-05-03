const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Migrando tabla proposals...');
  
  const sql = `
    ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS tx_hash TEXT;
    CREATE INDEX IF NOT EXISTS idx_proposals_tx_hash ON public.proposals(tx_hash);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Error ejecutando migración:', error.message);
  } else {
    console.log('Campo tx_hash añadido correctamente a proposals.');
  }
}

run();
