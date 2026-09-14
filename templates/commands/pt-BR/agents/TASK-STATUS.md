# Sincronização de status da task (helper compartilhado)

Como os comandos movem a issue no gerenciador de tarefas conforme o fluxo avança. Leia
isto sempre que um comando atingir um **gatilho** abaixo.

## Passos

1. Leia `ai.properties.md`. Se `task_management_system` for `none` (ou ausente), **não faça nada**.
2. Para o **gatilho** atual, busque `status_<gatilho>` no bloco de status-map.
   - Se estiver **em branco/ausente**, pule a movimentação (o usuário optou por não mapear).
   - Leia também o `comment_<gatilho>` opcional.
3. Mova a issue pelo MCP apropriado do tracker configurado:
   - **Valor sem prefixo** → é o **status-alvo**. Faça a transição da issue para esse
     status (ache a transição cujo destino corresponde).
   - **Valor com prefixo `transition:`** → é o **nome da transição**. Aplique-a pelo nome.
4. Se `comment_<gatilho>` estiver definido, poste-o como comentário na issue.
5. **Nunca falhe o comando por causa disto.** Se a chamada ao tracker der erro (status não
   encontrado, sem permissão, offline), registre um aviso de uma linha e continue — a
   sincronização é best-effort; o que importa é o trabalho.

## Gatilhos (chaves fixas)

| Gatilho         | Dispara quando…                                  | Comando        |
|-----------------|--------------------------------------------------|----------------|
| `spec_ready`    | a spec/PRD é aprovada                             | `/spec`        |
| `work_started`  | a orquestração começa a executar agentes         | `/orchestrate` |
| `in_review`     | a pull request é aberta                           | `/pr`          |
| `reopened`      | uma checagem/revisão reabre a sessão para corrigir | `/pre-pr`, `/pr` |
| `blocked`       | um reviewer/tester bloqueia (achado bloqueante)  | `/orchestrate`, `/pre-pr` |
| `done`          | a task é concluída e aprovada                     | `/orchestrate` (ou `/pr` após merge) |

Exemplo: no `work_started`, se `status_work_started: Em Progresso`, transicione a issue
para "Em Progresso". Se `status_work_started: transition:Iniciar Desenvolvimento`, aplique
a transição "Iniciar Desenvolvimento". Se estiver em branco, não faça nada.
