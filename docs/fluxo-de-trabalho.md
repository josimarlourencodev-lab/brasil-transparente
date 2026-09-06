# Fluxo de trabalho (git) e convenções

Fluxo obrigatório do repositório: **`develop` → testes → PR → `main`**. Nunca commitar direto em `main`.

## Regras

- `main` = produção (deploy da Vercel).
- `develop` = consolidação do trabalho novo/testado.
- `main` e `develop` são **protegidas** (sem push direto).

## Fluxo padrão

```sh
git checkout develop
git checkout -b feature/<descricao>

# ... alterações ...

git add <arquivos>
git commit -m "feat: ..."          # mensagem em PT, estilo do repo (feat/ fix/ chore/)

# testes locais antes de publicar
python -m pytest tests -q
pnpm test
pnpm typecheck
pnpm lint
pnpm build

git push -u origin feature/<descricao>
```

Depois criamos um Pull Request:
1. `feature/*` → `develop`
2. quando verde, merge (squash)
3. propagar `develop` → `main` (ver abaixo)

## Propagação develop → main

Como `develop` e `main` têm históricos squash divergentes, um PR direto `develop→main` costuma vir **"dirty"**. Contorno padrão (reconciliação):

```sh
git checkout -b merge/develop-para-main origin/main
git merge origin/develop --no-ff            # resolver conflitos mantendo a versão da develop
git diff origin/develop --stat              # deve ficar vazio (conteúdo idêntico)
git push -f origin merge/develop-para-main
# criar PR deste branch → main; merge (squash)
```

## Convenções de commit

- Idioma: **pt-BR**.
- Prefixo: `feat:`, `fix:`, `chore:`, `docs:`, `merge:`, `test:`.
- Estilo conciso, referenciando o que mudou (ex.: `feat(mobile): podcast em segundo plano`).

## Versionamento de docs

As regras deste documento são o conteúdo do `AGENTS.md` da raiz — mantê-lo atualizado ajuda o fluxo automatizado.
