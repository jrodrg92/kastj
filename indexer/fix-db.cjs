const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Verificando tabla pending_transactions...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.pending_transactions (
      hash TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now()
    );
    ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public Read Pending" ON public.pending_transactions;
    CREATE POLICY "Public Read Pending" ON public.pending_transactions FOR SELECT USING (true);
    
    GRANT ALL ON public.pending_transactions TO service_role;
    GRANT SELECT ON public.pending_transactions TO anon, authenticated;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Error ejecutando SQL:', error.message);
  } else {
    console.log('Tabla y políticas configuradas correctamente.');
  }
}

run();
