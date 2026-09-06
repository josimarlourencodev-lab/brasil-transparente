# Uso — App mobile

O app mobile (Expo) está disponível para **Android** via APK na release `v0.1.0-mobile`. Ele consome o mesmo backend do site.

## Instalação

1. Baixar `brasil-transparente-app-release.apk` da [release no GitHub](https://github.com/josimarlourencodev-lab/brasil-transparente/releases).
2. **Desinstalar** qualquer versão anterior do app (mesma assinatura/keystore).
3. Instalar o `.apk`.

## Funcionalidades

- **Notícias**: lista, busca e detalhe com fontes, envolvidos e contradições.
- **Políticos**: galeria de candidatos com foto, biografia e ficha.
- **Modo escuro**: compatível com o tema do sistema.
- **Podcast**:
  - Lista de episódios com **thumbnail**.
  - Player com **reprodução em segundo plano** — continua tocando com a tela bloqueada.
  - **Controles na notificação e na tela de bloqueio** com arte do episódio (thumbnail).
  - Botões de retroceder/avançar no lock screen.

## Permissões

Ao tocar para ouvir no Android 13+, o app pede **permissão de notificação** (necessária para exibir os controles do player em segundo plano).

## iOS

Bundles iOS (`*.hbc`) são publicados para uso com o Expo, mas **o processo de distribuição oficial documentado é o Android APK**.

## Dica

Para instalar/atualizar, ver também [Deploy e publicação](deploy.md) sobre o fluxo de build assinado.
