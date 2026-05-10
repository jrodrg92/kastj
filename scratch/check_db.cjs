
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log("--- PROPOSALS ---");
  const { data: props } = await supabase.from('proposals').select('id, total_raised, title').limit(5);
  console.table(props);

  console.log("\n--- FUNDINGS ---");
  const { data: funds } = await supabase.from('fundings').select('*').limit(10);
  console.table(funds);
}

checkData();
