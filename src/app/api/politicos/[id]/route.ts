import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const { data: politico, error } = await supabase()
    .from("politicos")
    .select("id, nome, partido, cargo, biografia, foto_url, termos_busca, criado_em, atualizado_em")
    .eq("ativo", true)
    .eq("id", id)
    .single();

  if (error || !politico) {
    return NextResponse.json({ error: "Político não encontrado." }, { status: 404 });
  }

  const { data: noticias, error: erroNoticias } = await supabase()
    .from("noticias")
    .select("id, titulo, url, url_fonte, resumo, categoria, tipo_fonte, publicado_em, coletado_em, status, imagem_url, contradicao_detectada, politico_id")
    .eq("status", "publicado")
    .or(
      `politico_id.eq.${id},titulo.ilike.%${politico.nome}%,resumo.ilike.%${politico.nome}%`
    )
    .order("publicado_em", { ascending: false })
    .limit(50);

  if (erroNoticias) {
    return NextResponse.json({ error: erroNoticias.message }, { status: 500 });
  }

  return NextResponse.json({ politico, noticias });
}