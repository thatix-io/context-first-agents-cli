# Contrato de Contexto (formato)

Todo agente efêmero é spawnado com um contrato. Este é exatamente o objeto que o
Orquestrador compila por nó e cola no prompt do subagente. É o que mantém o contexto de
cada agente **pequeno, delimitado e auditável** — o núcleo da arquitetura.

```json
{
  "agentId": "agent-w001",
  "archetype": "implementer",
  "objective": "<objetivo específico e delimitado deste worker>",
  "repository": "<repo-id ou null para workers de sessão>",
  "read": [
    { "type": "index", "path": "../metaspecs/specs/index.md", "reason": "roteador de contexto" },
    { "type": "hint",  "path": "../metaspecs/specs/technical/API_SPECIFICATION.md", "reason": "hint do repo" }
  ],
  "mayDiscover": [
    "referências alcançáveis a partir dos índices acima",
    "arquivos deste repositório necessários para o objetivo"
  ],
  "mustNotAssume": [
    "regras de negócio não ditas",
    "contratos externos não indexados",
    "requisitos ausentes na spec aprovada"
  ],
  "writeBoundary": ["worktree atribuído do <repo-id>"],
  "limits": { "policy": "select-do-not-dump", "maxFiles": 20 },
  "return": ["summary", "changes", "evidence", "tests", "unresolved", "confidence"]
}
```

## Regras que o Orquestrador deve garantir ao compilar um contrato

- `read` inclui TODOS os `orchestration.indexes` mais o `context[]` do repo — mas só
  caminhos que existem em disco. Descarte o resto silenciosamente.
- Workers de sessão (integrator, tester, reviewer) têm `repository: null` e
  `writeBoundary: ["apenas artefatos da sessão"]`.
- Nunca expanda `read` para "o repo inteiro". Descoberta é permitida (`mayDiscover`), mas
  parte dos índices, não de um dump cego de diretório.
- O contrato é o ÚNICO contexto de projeto que o subagente recebe além do objetivo.
  Não cole a conversa inteira nos subagentes.

## Formato de retorno que todo agente deve produzir

```markdown
### summary
<um parágrafo: o que foi feito>

### changes
<arquivos criados/modificados, por repo>

### evidence
<comandos rodados, saídas, links>

### tests
<testes adicionados/rodados e resultado>

### unresolved
<dúvidas, conflitos de spec, stops Jidoka — ou "nenhum">

### confidence
<low | medium | high> + uma linha de motivo
```

## Modo workflow (Motor B — `orchestrate-execute`)

Dentro do workflow `orchestrate-execute` estas regras vêm **no seu prompt** (não precisa abrir
este arquivo); ficam registradas aqui como referência e para o Motor A.

### 1. Estado — um comando curto por marco
O seu prompt traz três comandos prontos para o seu `workers/<id>.json` (o dashboard o lê ao vivo):
`… start '<meta>' "<primeiro passo>"`, `… step "<o que agora>"`, `… finish done|blocked [VEREDITO] ["<por que bloqueou>"]`.
Use-os em **3–5 marcos**, não a cada ação. Ao terminar `blocked`, dê o motivo em uma linha (ele vira
o motivo "aguardando você" que a pessoa vê). Nunca grave `state.json` nem o arquivo de outro worker —
o orquestrador é o único escritor deles (ele leva o seu bloqueio para o `needsHuman` da sessão).

### 2. Relatório em disco, retorno estruturado curto
- Antes de retornar, grave o seu **relatório completo** (summary / changes / evidence / tests /
  unresolved / confidence, mais findings) no caminho de relatório do prompt (`workers/<id>.md`).
- Depois retorne o objeto estruturado (a chamada de ferramenta impõe o schema) com um **summary
  curto (≤ 3 linhas)** — o contexto do orquestrador é o mais caro; o detalhe fica no relatório.
- `status`: `done` | `blocked` — **na dúvida, `blocked`, nunca um `done` inventado**.
- `verdict` (gates): `PASS`/`BLOCKED` (reviewer), `GREEN`/`RED` (tester), `CONSISTENT`/`MISMATCH` (integrator).
- `findings[]` (gates): `severity` (`blocking` | `should-fix` | `nit`), **`repository` (o id do
  repo dono da correção — obrigatório em achados bloqueantes; é assim que o loop de correção roteia)**,
  `file`, `line`, `description`, `fix`.
- `commits[]` (implementers): os SHAs que você criou — as re-verificações revisam só eles.
- `spawn[]` (workers não-gate, opcional): `name`, `archetype`, `repository`, `dependsOn`, `brief`,
  flags `inScope` / `newRisk` honestas, `reason`. Propostas dentro do escopo e sem risco rodam
  sozinhas, o resto vai para o usuário. Proponha em vez de fazer trabalho fora do escopo você mesmo.

### 3. Saída de comandos enxuta (nos dois motores)
Rode testes/builds com reporters silenciosos ou de resumo; mande a saída completa para um log em
`<sessionDir>/logs/` e traga para o seu contexto só o resumo e as falhas
(ex.: `tail -n 40`, `grep -E "FAIL|Error"`). As falhas vêm completas — só o ruído é cortado.
