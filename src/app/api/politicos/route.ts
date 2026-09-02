import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase()
    .from("politicos")
    .select("id, nome, partido, cargo, biografia, termos_busca, criado_em")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}