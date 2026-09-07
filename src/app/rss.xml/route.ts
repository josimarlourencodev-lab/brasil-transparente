import { supabase } from "@/lib/supabase";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

function escapar(xml: string): string {
  return xml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { data: noticias } = await supabase()
    .from("noticias")
    .select("id, titulo, resumo, categoria, publicado_em, url")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(50);

  const items = (noticias ?? [])
    .map((n) => {
      const link = `${SITE_URL}/noticias/${n.id}`;
      const data =
        n.publicado_em
          ? new Date(n.publicado_em).toUTCString()
          : new Date().toUTCString();
      return `    <item>
      <title>${escapar(n.titulo)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${link}</guid>
      <pubDate>${data}</pubDate>
      <category>${escapar(n.categoria)}</category>
      <description>${escapar(n.resumo ? n.resumo.slice(0, 500) : "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapar(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>Monitoramento neutro e independente do histórico de políticos brasileiros.</description>
    <language>pt-br</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}