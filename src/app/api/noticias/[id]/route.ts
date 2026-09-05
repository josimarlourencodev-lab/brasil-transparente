import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const noticiaId = Number(id);

  if (!Number.isInteger(noticiaId) || noticiaId <= 0) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const { data, error } = await supabase()
    .from("noticias")
    .select(
      "id, titulo, url, url_fonte, resumo, categoria, tipo_fonte, publicado_em, coletado_em, status, imagem_url, contradicao_detectada, contradicao_descricao, politico_id, metadata, politico:politicos(id, nome, partido, foto_url)"
    )
    .eq("id", noticiaId)
    .eq("status", "publicado")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Notícia não encontrada." }, { status: 404 });
  }

  return NextResponse.json(data);
}