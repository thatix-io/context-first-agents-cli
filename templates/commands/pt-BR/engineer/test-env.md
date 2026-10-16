# /test-env — Subir o ambiente de teste local de uma sessão

Sobe (ou derruba) o ambiente local de uma sessão para a feature ser exercitada à mão ou por
testes: os worktrees da sessão rodando juntos, com portas que não colidem com outras sessões.

> **Comando próprio do projeto.** Este é um ponto de partida genérico: adapte à sua stack
> (arquivos compose, scripts, portas, dados de seed). O `context-agents update:commands` só o
> instala quando o projeto não tem um comando `test-env` e **nunca o sobrescreve**.

**Argumento**: `#$ARGUMENTS` — `<ISSUE-ID> [down] [--headless] [--result <arquivo>]`.
- `down` (ou `stop`) — derruba o ambiente da sessão em vez de subir.
- `--headless` / `--result <arquivo>` — protocolo em `agents/HEADLESS.md` (prefixo dos itens `testenv-`).

## Configuração

Leia o `context-manifest.json` (repositórios, `role`, `testCommand`) e o `ai.properties.md`
(`base_path` e, se o projeto documentar, uma seção de **ambiente de teste**: portas base, arquivo
compose, script de subida, URLs de health, comando de seed).

## Estado da sessão

`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>` (formato em `SESSION-STATE.md`;
se o helper não existir, edite o `state.json` à mão). Este comando **não muda a fase**.
- Antes de registrar o primeiro item, guarde o status atual (`SS show`) em
  `SS set '{"testEnv":{"previousStatus":"<status>"}}'` — registrar um item leva a sessão para
  `blocked`; quando os itens forem resolvidos, volte: `SS status <previousStatus>`.
- Ambiente no ar: `SS set '{"testEnv":{"status":"up","urls":{"<serviço>":"<url>"},"stop":"<comando>","at":"<agora>"}}'`.
- Ambiente derrubado: `SS set '{"testEnv":{"status":"down","at":"<agora>"}}'`.

## Passos

### 1. Identificar a sessão
- ISSUE-ID informado → `.sessions/<ISSUE-ID>/` precisa existir.
- Ausente ou não encontrado → interativo: liste `.sessions/` e pergunte. `--headless`: não há onde
  registrar (sem sessão) — encerre com
  `node .claude/bin/session-state.mjs result <arquivo> engineer:test-env --need testenv-session decision "Qual sessão?" "(a) <ID-1> (b) <ID-2> … — rode de novo /test-env <ID> --headless"`.
- Se o `SS show` listar itens `testenv-*` pendentes, consuma a resposta primeiro
  (`SS apply-approval`, ver `agents/HEADLESS.md`).

### 2. Descobrir como este projeto sobe o ambiente
Nesta ordem, usando a primeira que se aplicar:
1. A receita do próprio projeto: a seção de ambiente de teste do `ai.properties.md`, ou scripts /
   arquivos compose no orquestrador (ex.: `infra/`).
2. Em cada worktree da sessão (`.sessions/<ISSUE-ID>/<repo>/`; caia para `{base_path}/<repo>` só
   nos repositórios que a sessão não alterou): `docker-compose.yml` / `compose.yaml`, um alvo do
   `Makefile` (`up`, `dev`), scripts do `package.json` (`dev`, `start`), o README.
- Vários candidatos sem escolha clara →
  `SS need testenv-recipe decision "Como o ambiente da <ISSUE-ID> deve subir?" "(a) <candidato 1> (b) <candidato 2> — <como responder>"`.
- Nada encontrado → `SS need testenv-recipe decision "Não foi encontrada uma forma de subir o ambiente" "(a) documentar no ai.properties.md (seção de ambiente de teste) (b) adaptar .claude/commands/engineer/test-env.md — depois rode de novo"`.
- Interativo: pergunte em vez de registrar; `--headless`: registre e encerre.

### 3. Portas e configuração (sem colisão entre sessões)
- Derive as portas das portas base do projeto + o número da issue (ex.: `3000 + 42`), ou mantenha
  as padrão quando só uma sessão roda por vez.
- Porta ocupada (`lsof -i :<porta>`) → `SS need testenv-ports decision "A porta <porta> está em uso por <processo>" "(a) parar <processo> (b) usar a porta <alternativa> — <como responder>"`.
- Faltam segredos / valores de `.env` / credenciais → `SS need testenv-access access "<o que falta>" "<onde colocar>"`
  (nunca invente um segredo). Copie `.env.example` → `.env` só para valores padrão não secretos.

### 4. Subir (ou derrubar) e checar a saúde
- Suba com a receita do passo 2 (em segundo plano) e confira: containers/processos rodando, a URL
  de health (se houver) respondendo, os logs sem erros de inicialização.
- Falhou depois de uma tentativa razoável de correção (ex.: rebuild) →
  `SS need testenv-failed failure "<serviço> não subiu: <causa em uma linha>" "<o que verificar/corrigir>"`, com as
  últimas linhas de log em `.sessions/<ISSUE-ID>/test-env.log`.
- `down` → derrube com a mesma receita e registre `testEnv.status: "down"`.
- No ar e saudável → registre o `testEnv` (acima); se itens `testenv-*` foram resolvidos nesta
  execução, `SS status <previousStatus>`.

### 5. Relatório
URLs por serviço, de onde vem o código de cada repositório (worktree ou base), como ver os logs,
parar, rebuildar e rodar o seed. `--result <arquivo>` → última ação: `SS result <arquivo> engineer:test-env`.
