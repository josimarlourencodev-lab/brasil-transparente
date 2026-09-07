import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo";

const ESTATICAS: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
  {
    url: `${SITE_URL}/noticias`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/politicos`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/podcast`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/documentacao`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    url: `${SITE_URL}/pitch`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dinamicas: MetadataRoute.Sitemap = [];

  try {
    const [{ data: noticias }, { data: politicos }] = await Promise.all([
      supabase()
        .from("noticias")
        .select("id, publicado_em")
        .eq("status", "publicado")
        .order("publicado_em", { ascending: false })
        .limit(1000),
      supabase()
        .from("politicos")
        .select("id, atualizado_em")
        .eq("ativo", true)
        .limit(1000),
    ]);

    for (const n of noticias ?? []) {
      dinamicas.push({
        url: `${SITE_URL}/noticias/${n.id}`,
        lastModified: n.publicado_em ?? new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const p of politicos ?? []) {
      dinamicas.push({
        url: `${SITE_URL}/politicos/${p.id}`,
        lastModified: p.atualizado_em ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (err) {
    console.error("sitemap: falha ao buscar dados dinâmicos", err);
  }

  return [...ESTATICAS, ...dinamicas];
}