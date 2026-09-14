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
