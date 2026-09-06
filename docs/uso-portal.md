# Uso — Portal (site)

O portal público em `https://brasil-transparente-rust.vercel.app` apresenta notícias e políticas monitoradas de forma neutra e referenciada. (Domínio próprio `brasiltransparente.com.br` é evolução futura.)

## Navegação

- **Home / Notícias**: lista de matérias coletadas e sintetizadas, com busca.
- **Políticos**: galeria de candidatos com biografia, foto e histórico.
- **Detalhe da notícia**: resumo, envolvidos, categoria e **links para fontes primárias**; quando há contradição com histórico, isso é **apontado** com referência factual.
- **Podcast** (`/podcast`): episódios semanais com thumbnail, duração, data e player de áudio embutido.
- **O Brasil Transparente** (`/pitch`): apresentação do projeto com slides, narração em voz IA e vídeo para download.
- **Documentação** (`/documentacao`): página interna com sobre, funcionamento autônomo, princípios e acessos — sem sair do portal.
- **GitHub**: link no header (e "Repositório GitHub" no rodapé) abre o código-fonte em nova aba.

## O que esperar do conteúdo

- **Neutralidade**: o texto é sintetizado por IA a partir das fontes, sem opinião editorial. Fontes oficiais e de oposição aparecem lado a lado.
- **Referências**: toda matéria aponta para as fontes; contradições trazem `descricao` e `referencias`.
- **Filtro editorial**: matérias de celebridades, esportes, futebol e entretenimento **não são publicadas** (restrição no pipeline desde 2026-09).

## Busca

A busca filtra por termo no título/conteúdo (`?q=`). Busca textual avançada (pg_trgm) é evolução futura.

## PWA

O site pode ser instalado como app (manifest + service worker) para acesso rápido e navegação básica offline.
