# /merge — Integrar a feature na main (após o /pr)

Fecha o ciclo depois do `/pr`: atualiza a base, resolve conflitos com agentes, confirma
com você e faz o merge — de forma **agnóstica** ao provedor de PR.

**Argumento**: `#$ARGUMENTS` (um ISSUE-ID; usa o `mainBranch` do manifest, padrão `main`).

## Regras de ouro
- ✅ Merge é **irreversível** → **SEMPRE** peça confirmação antes (Passo 4).
- ✅ Nunca faça o merge com testes vermelhos ou conflito não resolvido.
- ❌ Nunca marque a sessão como `done` antes do merge concluir.

---

## Passo 0 — Carregar contexto
Leia `context-manifest.json` (repos impactados + `mainBranch`) e `ai.properties.md`
(`base_path`, task manager, provedor de PR). Os repos impactados são os da sessão
(`.sessions/<ISSUE-ID>/<repo>/`, cada um um worktree na branch `feature/<ISSUE-ID>`).

## Passo 1 — Atualizar a base nos worktrees (evitar código antigo)
Para cada repo impactado, traga a `main` mais recente **antes** de qualquer merge, para não
integrar em cima de base velha:

```bash
git -C "<path-do-worktree>" fetch origin "<mainBranch>" --quiet
git -C "<path-do-worktree>" rebase "origin/<mainBranch>"
```

Se o `rebase` aplicar limpo (sem conflito) → siga. Se acusar conflito → Passo 2.

## Passo 2 — Conflitos → agentes de análise e correção
Se algum repo tiver conflito ao trazer a base, **NÃO** resolva de forma ad-hoc. Comporte-se
como o `/orchestrate`:

1. 🔴 Reabra a sessão como ATIVA: em `.sessions/<ISSUE-ID>/state.json` defina
   `status:"running"`, atualize `updatedAt`. **Mova a task** — gatilho `reopened`
   (siga `agents/TASK-STATUS.md`).
2. 🤖 Para cada repo em conflito, **spawne um agente `conflict-resolver`** (arquétipo em
   `agents/conflict-resolver.md`) com o worktree e a spec. Ele rebaseia sobre
   `origin/<mainBranch>`, resolve guiado pela spec, roda os testes e retorna
   `RESOLVED` / `NEEDS-HUMAN` / `CLEAN`. Registre o status em `workers/<id>.json`
   (`name` ex.: `merge-fix:<repo>`), atualizando `currentStep`/`steps[]`.
3. Se algum retornar `NEEDS-HUMAN`, **PARE** o merge e mostre os conflitos ao usuário.

## Passo 3 — Revalidar
Com a base integrada, rode o `testCommand` de cada repo impactado (do manifest) dentro do
worktree. Se algo ficar vermelho, **NÃO** siga — reporte e trate como no Passo 2.

## Passo 4 — Confirmar (obrigatório)
**PARE e apresente o plano de merge** antes de executar:
- repos a mergear e a branch (`feature/<ISSUE-ID>` → `<mainBranch>`);
- ordem de merge (respeite dependências entre repos, ex.: back antes do front);
- resultado dos testes; conflitos que foram resolvidos por agentes.
Só prossiga para o Passo 5 **após aprovação explícita** do usuário.

## Passo 5 — Fazer o merge (agnóstico ao provedor)
Descubra o provedor pelo remote de cada repo e use o caminho correspondente. **Preferir a
plataforma de PR**; se não houver PR/CLI, cair para merge local.

- **GitHub** (`gh` disponível): mergear a PR aberta pelo `/pr`:
  ```bash
  gh pr merge <PR|branch> --repo <owner/repo> --squash --delete-branch
  ```
  (use `--merge`/`--rebase` conforme a política do projeto). Respeita checks/aprovações do GitHub.
- **Outro provedor (GitLab, Bitbucket, Azure…)**: use o **MCP/CLI correspondente** para
  mergear o merge/pull request equivalente (ex.: `glab mr merge`, MCP do provedor).
- **Sem PR/provedor**: merge local no repo principal e push:
  ```bash
  git -C "{base_path}/<repo>" checkout "<mainBranch>"
  git -C "{base_path}/<repo>" pull --ff-only origin "<mainBranch>"
  git -C "{base_path}/<repo>" merge --no-ff "feature/<ISSUE-ID>"
  git -C "{base_path}/<repo>" push origin "<mainBranch>"
  ```

**Assim que o merge concluir**, **mova a task** — gatilho `in_test` (siga
`agents/TASK-STATUS.md`). Use isto quando o projeto valida pós-merge (ex.: coluna "Test"
no board); se não houver essa etapa, o `status_in_test` fica em branco e nada é movido.

## Passo 6 — Atualizar o base_repo e concluir
- Atualize o repo principal de cada repo mergeado:
  ```bash
  git -C "{base_path}/<repo>" checkout "<mainBranch>"
  git -C "{base_path}/<repo>" pull --ff-only origin "<mainBranch>"
  ```
- Remova os worktrees da sessão que já foram integrados
  (`git -C "{base_path}/<repo>" worktree remove ".../.sessions/<ISSUE-ID>/<repo>"`),
  se o fluxo do projeto assim exigir.
- Em `.sessions/<ISSUE-ID>/state.json`, defina `status:"done"`.
- **Mova a task** — gatilho `done` (siga `agents/TASK-STATUS.md`).
- Reporte: repos mergeados, ordem, PRs/commits, e o que foi resolvido por agentes.

## Escalação
Qualquer ambiguidade (política de merge indefinida, dependência de deploy, conflito não
resolvível) → **PARE** e pergunte ao usuário. Nunca force um merge.
