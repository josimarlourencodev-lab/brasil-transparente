import { NextResponse } from "next/server";
import { isAdminCookieHeader } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);

  let query = supabaseAdmin()
    .from("noticias")
    .select("id, titulo, categoria, tipo_fonte, status, publicado_em, contradicao_detectada")
    .order("coletado_em", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}