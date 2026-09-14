# Sincronização de status da task (helper compartilhado)

Como os comandos movem a issue no gerenciador de tarefas conforme o fluxo avança. Leia
isto sempre que um comando atingir um **gatilho** abaixo.

## Passos

1. Leia `ai.properties.md`. Se `task_management_system` for `none` (ou ausente), **não faça nada**.
2. Para o **gatilho** atual, busque `status_<gatilho>` no bloco de status-map.
   - Se estiver **em branco/ausente**, pule a movimentação (o usuário optou por não mapear).
   - Leia também o `comment_<gatilho>` opcional.
3. Mova a issue pelo MCP apropriado do tracker (veja as notas por tracker abaixo). Dois
   formatos de valor:
   - **Valor sem prefixo** → o **estado/coluna alvo**. Mova a issue para lá.
   - **Valor com prefixo `transition:`** → um **nome de transição**. Aplique-a pelo nome.
4. Se `comment_<gatilho>` estiver definido, poste-o como comentário na issue.
5. **Nunca falhe o comando por causa disto.** Se a chamada ao tracker der erro (status não
   encontrado, sem permissão, offline), registre um aviso de uma linha e continue — a
   sincronização é best-effort; o que importa é o trabalho.

## Por tracker: como mover

- **Jira / Linear / GitHub**: o valor é um **status de workflow** — transicione a issue
  para esse status (ou aplique a transição nomeada).
- **Azure DevOps**: os boards do Azure movem por **COLUNA do board** (`System.BoardColumn`),
  e várias colunas costumam compartilhar o mesmo `System.State` (ex.: "Doing" e "Code
  Review" são ambos `Active`). Então trate o valor como o **nome da coluna do board** e
  defina-o via o campo `System.BoardColumn` (MCP do Azure DevOps / `az boards work-item
  update`), NÃO mudando o estado. Só use o prefixo `transition:` se realmente quiser uma
  transição de estado.

## Gatilhos (chaves fixas)

| Gatilho         | Dispara quando…                                  | Comando        |
|-----------------|--------------------------------------------------|----------------|
| `spec_ready`    | a spec/PRD é aprovada                             | `/spec`        |
| `work_started`  | a orquestração começa a executar agentes         | `/orchestrate` |
| `in_review`     | a pull request é aberta                           | `/pr`          |
| `reopened`      | uma checagem/revisão reabre a sessão para corrigir | `/pre-pr`, `/pr`, `/merge` |
| `blocked`       | um reviewer/tester bloqueia (achado bloqueante)  | `/orchestrate`, `/pre-pr` |
| `in_test`       | a branch foi mergeada e está em validação        | `/merge`       |
| `done`          | a task é concluída e aprovada                     | `/merge` (ou `/orchestrate`) |

Exemplo (Jira): no `work_started`, se `status_work_started: Em Progresso`, transicione a
issue para "Em Progresso". Exemplo (Azure): se `status_work_started: Doing`, defina
`System.BoardColumn = "Doing"` no work item. Se um valor estiver em branco, não faça nada.
