import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o llaves de Supabase no encontradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...');

  const tables = ['activity', 'fundings', 'proposals', 'sync_state', 'pending_transactions'];

  for (const table of tables) {
    console.log(`- Limpiando tabla: ${table}...`);
    const { error } = await supabase.from(table).delete().neq('id', -999999); // Borra todo
    
    if (error) {
      console.error(`❌ Error limpiando ${table}:`, error.message);
    }
  }

  console.log('✅ Base de datos limpia y lista para un nuevo despliegue.');
}

clearDatabase().catch(err => {
  console.error('💥 Error fatal durante la limpieza:', err);
  process.exit(1);
});
