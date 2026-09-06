import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase()
    .from("podcast_episodios")
    .select("id, titulo, descricao, audio_url, thumb_url, duracao_seg, publicado_em")
    .order("publicado_em", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}