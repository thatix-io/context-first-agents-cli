# Execuções headless e arquivo de resultado (protocolo compartilhado)

Como um comando se comporta com `--headless` e `--result <arquivo>`. Todo comando que lista essas
flags segue este arquivo; um **comando próprio do projeto** (ex.: o seu `test-env`) pode aderir
acrescentando uma seção "Modo" que aponte para cá. Contrato dos arquivos: `SESSION-STATE.md`.

`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>` (rodado no diretório do
orquestrador). Se o helper não existir, edite o `state.json` / grave os arquivos à mão com os
mesmos campos.

## Flags

Tire as flags dos argumentos antes de lê-los — o resto é o ISSUE-ID / texto.

- **`--headless`** — nunca faça perguntas. Toda pergunta ou gate humano vira um item
  `needsHuman` (abaixo), o status é definido e **o comando encerra**. Nunca chute uma resposta e
  nunca escolha uma opção no lugar da pessoa.
- **`--result <arquivo>`** — quando o comando termina — sucesso, parado num gate ou falha — a
  **última ação** grava o arquivo de resultado (abaixo). O caminho é absoluto ou relativo ao
  diretório atual. Funciona com ou sem `--headless`.
- Sem flags o comando é interativo, exatamente como antes.

## Transformando uma pergunta em `needsHuman`

```bash
SS need <prefixo>-<slug> decision "<a pergunta, uma linha>" "<opções + como responder>" <ref>
```

- **id**: `<prefixo>-<slug>`, estável entre execuções (`refine-scope`, `spec-auth-model`,
  `testenv-ports`). O prefixo é o do comando (cada comando diz qual).
- **kind**: `decision` para pergunta ou escolha · `approval` para um sim/não sobre um artefato
  (plano, requisitos refinados, PRD) · `access` para credenciais, permissões ou ambiente ·
  `failure` quando algo quebrou e só uma pessoa resolve.
- **howToResolve**: as **opções concretas** (`(a) … (b) … (c) …`, marcando a que você
  recomendaria) **e como responder**: *"Responda em `.sessions/<ISSUE-ID>/approval.json`
  (`approved: true`, sua escolha em `notes`) e rode de novo `/<comando> <ISSUE-ID> --headless` —
  ou rode `/<comando> <ISSUE-ID>` e responda na conversa."*
- **ref**: um arquivo da sessão com o detalhe (ex.: `refine-questions.md`): o contexto, cada
  pergunta e suas opções — para a pessoa responder sem ler esta conversa.
- Várias perguntas → um item por pergunta (o mesmo arquivo como `ref`).

## Continuando depois da resposta

Numa nova execução, se o `SS show` listar itens pendentes com o prefixo deste comando, consuma a
resposta primeiro — `SS apply-approval` — e aja conforme o `result`:
- `approved` → os itens foram resolvidos; `notes` traz as respostas da pessoa (uma escolha por
  item, ou ajustes). Continue de onde o comando parou, aplicando-as.
- `rejected` → o helper definiu `status: done` + `rejected: true`. Informe as notes e pare.
- `missing` / `stale` / `invalid` → interativo: faça as perguntas pendentes na conversa (depois
  `SS resolve <id>`); `--headless`: não mude nada e encerre (gravando o resultado).

## Gravando o arquivo de resultado (`--result <arquivo>`)

```bash
SS result <arquivo> <comando>                 # a sessão existe: lê o state.json
node .claude/bin/session-state.mjs result <arquivo> <comando> \
  --need <id> decision "<motivo>" "<opções + como responder>"   # nenhuma sessão foi criada
```

- `<comando>`: o id do comando, o caminho dele em `.claude/commands/` com `:` —
  `orchestrate`, `engineer:pre-pr`, `engineer:pr`, `engineer:merge`, `products:collect`,
  `products:refine`, `products:spec`, `engineer:test-env`.
- Formato gravado (um objeto JSON; `needsHuman` é a lista da sessão):
  ```json
  { "command": "products:refine", "issueId": "ISSUE-42", "status": "awaiting_approval", "phase": "refine",
    "needsHuman": [{ "id": "refine-approval", "kind": "approval", "reason": "…", "since": "…", "howToResolve": "…", "ref": "refined.md" }],
    "at": "2026-10-16T12:00:00Z" }
  ```
- Opções: `--issue <id>`, `--status <status>`, `--phase <fase>` sobrescrevem o que foi lido;
  `--need …` / `--need-json '<json>'` acrescentam itens só ao resultado. Sem sessão, `issueId` e
  `phase` são `null` se não forem informados.
- **Uma execução terminada nunca informa `running`.** Se o comando falhar de forma inesperada,
  registre antes — `SS need <prefixo>-failed failure "<o que falhou>" "<como tentar de novo>"` — e
  então grave o resultado. Uma execução que terminou bem deixa o status a que chegou (`done`,
  `planned`, `pr_open`…).
- Helper ausente, ou anterior à 0.16 (`unknown command "result"`): grave o mesmo JSON à mão em `<arquivo>`.
