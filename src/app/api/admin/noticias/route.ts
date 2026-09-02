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
    .select("id, titulo, categoria, tipo_fonte, status, publicado_em, contradicao_detectada, imagem_url")
    .order("coletado_em", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

type AdminNoticiaInput = {
  titulo?: unknown;
  url?: unknown;
  resumo?: unknown;
  categoria?: unknown;
  imagem_url?: unknown;
};

export async function POST(request: Request) {
  if (!isAdminCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: AdminNoticiaInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!titulo || !url) {
    return NextResponse.json(
      { error: "Título e URL são obrigatórios." },
      { status: 400 }
    );
  }
  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { error: "URL deve começar com http:// ou https://." },
      { status: 400 }
    );
  }

  const resumo = typeof body.resumo === "string" ? body.resumo.trim() : "";
  const categoria =
    typeof body.categoria === "string" && body.categoria.trim()
      ? body.categoria.trim()
      : "Outros";
  const imagem_url =
    typeof body.imagem_url === "string" ? body.imagem_url.trim() : "";
  const imagem =
    imagem_url && /^https?:\/\//.test(imagem_url) ? imagem_url : null;

  const { data, error } = await supabaseAdmin()
    .from("noticias")
    .upsert(
      {
        titulo,
        url,
        url_fonte: url,
        resumo: resumo || null,
        categoria,
        imagem_url: imagem,
        status: "publicado",
      },
      { onConflict: "url" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isAdminCookieHeader(request.headers.get("cookie"))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Parâmetro id inválido." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin().from("noticias").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}