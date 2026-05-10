import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hash, type, payload } = body;

    if (!hash || !type || !payload) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Guardamos en una tabla de transacciones pendientes para que el indexador o la UI 
    // puedan mostrar feedback inmediato antes de la confirmación on-chain.
    const { error } = await supabase
      .from("pending_transactions")
      .upsert({
        hash: hash.toLowerCase(),
        type,
        payload,
        status: "pending",
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error saving pending transaction:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error /api/tx/pending:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
