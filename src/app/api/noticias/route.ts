import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("categoria");
  const q = searchParams.get("q");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  let query = supabase()
    .from("noticias")
    .select("*, politica:politicos(*)")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(limit);

  if (filter) {
    query = query.eq("categoria", filter);
  }

  if (q && q.trim()) {
    const term = q.trim().replace(/%/g, "\\%");
    query = query.or(
      `titulo.ilike.%${term}%,resumo.ilike.%${term}%,metadata->>envolvidos.ilike.%${term}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}