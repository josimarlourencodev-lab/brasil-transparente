import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CasoFicha } from "@/lib/ficha";
import { resumirFicha } from "@/lib/ficha";

export async function GET() {
  const { data, error } = await supabase()
    .from("politicos")
    .select("id, nome, partido, cargo, biografia, foto_url, termos_busca, criado_em")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = data.map((p) => p.id);
  const { data: casos, error: erroCasos } = await supabase()
    .from("ficha_politico")
    .select("*")
    .in("politico_id", ids);

  if (erroCasos) {
    return NextResponse.json({ error: erroCasos.message }, { status: 500 });
  }

  const fichas = new Map<number, CasoFicha[]>();
  const todos = (casos ?? []) as CasoFicha[];
  for (const c in todos) {
    const caso = todos[c];
    if (!fichas.has(caso.politico_id)) fichas.set(caso.politico_id, []);
    fichas.get(caso.politico_id)!.push(caso);
  }

  return NextResponse.json(
    data.map((p) => ({ ...p, ficha: resumirFicha(fichas.get(p.id) ?? []) }))
  );
}