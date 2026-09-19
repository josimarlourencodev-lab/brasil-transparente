# Workflow (git) and Conventions

Required repository flow: **`develop` → tests → PR → `main`**. Never commit directly to `main`.

## Rules

- `main` = production (Vercel deploy).
- `develop` = consolidation of new/tested work.
- `main` and `develop` are **protected** (no direct push).

## Standard flow

```sh
git checkout develop
git checkout -b feature/<description>

# ... changes ...

git add <files>
git commit -m "feat: ..."          # message in PT, repo style (feat/ fix/ chore/)

# local tests before publishing
python -m pytest tests -q
pnpm test
pnpm typecheck
pnpm lint
pnpm build

git push -u origin feature/<description>
```

Then we create a Pull Request:
1. `feature/*` → `develop`
2. once green, merge (squash)
3. propagate `develop` → `main` (see below)

## develop → main propagation

Since `develop` and `main` have divergent squash histories, a direct `develop→main` PR usually comes in **"dirty"**. Standard workaround (reconciliation):

```sh
git checkout -b merge/develop-para-main origin/main
git merge origin/develop --no-ff            # resolve conflicts keeping the develop version
git diff origin/develop --stat              # should be empty (identical content)
git push -f origin merge/develop-para-main
# create a PR from this branch → main; merge (squash)
```

## Commit conventions

- Language: **pt-BR**.
- Prefix: `feat:`, `fix:`, `chore:`, `docs:`, `merge:`, `test:`.
- Concise style, referencing what changed (e.g. `feat(mobile): podcast em segundo plano`).

## Docs versioning

The rules in this document are the content of the root `AGENTS.md` — keeping it up to date helps the automated flow.