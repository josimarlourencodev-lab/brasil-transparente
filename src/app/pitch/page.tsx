import type { Metadata } from "next";
import { PitchGallery } from "@/components/pitch-gallery";
import { JsonLd } from "@/components/json-ld";
import { absoluto } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pitch — O Brasil Transparente",
  description:
    "Apresentação do Brasil Transparente em 10 slides: o problema da informação política fragmentada, a proposta de monitoramento neutro e as fontes de verificação.",
  alternates: { canonical: "/pitch" },
};

export default function PitchPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: "Pitch do Brasil Transparente",
          url: absoluto("/pitch"),
          description:
            "Apresentação em 10 slides com narração do projeto Brasil Transparente.",
          about: "monitoramento político neutro e verificável",
        }}
      />
      <PitchGallery />
    </>
  );
}