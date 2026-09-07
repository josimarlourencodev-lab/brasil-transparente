import { HomeContent } from "@/components/home-content";
import { JsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organizacao`,
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/icons/icon-512.png`,
              },
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#site`,
              url: SITE_URL,
              name: SITE_NAME,
              description: SITE_DESCRIPTION,
              inLanguage: "pt-BR",
              publisher: { "@id": `${SITE_URL}/#organizacao` },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/noticias?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }}
      />
      <div className="h-full">
        <HomeContent />
      </div>
    </>
  );
}