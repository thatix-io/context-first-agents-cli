# Criação de Pull Request

Este comando cria Pull Requests para todos os repositórios modificados no workspace.

## 📋 Pré-requisitos

Antes de criar PRs, certifique-se de que:
- Executou `/pre-pr` e todas as validações passaram
- Todos os commits foram feitos
- Todos os testes estão passando
- A documentação está atualizada

## 📋 Configuração do Projeto

**⚠️ IMPORTANTE: Sempre leia os arquivos de configuração do projeto ANTES de executar este comando!**

### Arquivos Obrigatórios

1. **`context-manifest.json`** (raiz do orchestrator)
   - Lista de repositórios do projeto
   - Roles de cada repositório (metaspecs, application, etc.)
   - URLs e dependências entre repositórios

2. **`ai.properties.md`** (raiz do orchestrator)
   - Configurações do projeto (`project_name`, `base_path`)
   - Sistema de gerenciamento de tarefas (`task_management_system`)
   - Credenciais e configurações específicas

### Como Ler

```bash
# 1. Ler context-manifest.json
cat context-manifest.json

# 2. Ler ai.properties.md
cat ai.properties.md
```

### Informações Essenciais

Após ler os arquivos, você terá:
- ✅ Lista completa de repositórios do projeto
- ✅ Localização do repositório de metaspecs
- ✅ Base path para localizar repositórios
- ✅ Sistema de task management configurado
- ✅ Configurações específicas do projeto

**🛑 NÃO prossiga sem ler estes arquivos!** Eles contêm informações críticas para a execução correta do comando.


## 🛑 CRÍTICO: ONDE TRABALHAR

**⚠️ ATENÇÃO: Se precisar fazer ajustes de última hora, TODO CÓDIGO DEVE SER CRIADO DENTRO DO WORKTREE!**

**✅ CORRETO** - Trabalhar dentro do worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/README.md  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/CHANGELOG.md  ✅
```

**❌ ERRADO** - NUNCA criar código fora do worktree:
```
<orchestrator>/.sessions/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/file.ts  ❌
{base_path}/<repo-name>/file.ts  ❌ (repositório principal!)
```

**REGRA ABSOLUTA**:
- 🛑 **Qualquer ajuste de código** (docs, changelog, fixes) **DEVE estar em** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NUNCA modifique** o repositório principal em `{base_path}/<repo-name>/`
- ✅ **Trabalhe APENAS** dentro do worktree do repositório específico

## 🎯 Processo de Criação de PRs

### 1. Identificar Repositórios Modificados

Para cada repositório no workspace, verifique:
```bash
cd <repositório>
git status
git log origin/main..HEAD  # Ver commits não pushados
```

### 2. Push das Branches

Para cada repositório modificado:
```bash
cd <repositório>
git push origin <branch-name>
```

### 3. Criar Pull Requests

Para cada repositório, crie um PR usando o GitHub CLI ou interface web:

**Usando GitHub CLI**:
```bash
cd <repositório>
gh pr create --title "[ISSUE-ID] Título da Feature" \
  --body "$(cat ../.sessions/<ISSUE-ID>/pr-description.md)" \
  --base main
```

**Após abrir a(s) PR(s)**, mova a task — gatilho `in_review`: siga `agents/TASK-STATUS.md`
(usa o status que você mapeou em `ai.properties.md`; ignora se não houver task manager).

**Template de Descrição do PR**:

```markdown
## 🎯 Objetivo

[Breve descrição do que esta PR faz]

## 📝 Mudanças

### Repositório: <nome-do-repo>

- [Mudança 1]
- [Mudança 2]
- [Mudança 3]

## 🔗 Relacionamentos

- **Issue**: <ISSUE-ID>
- **PRs Relacionados**: 
  - <repo-1>#<PR-number>
  - <repo-2>#<PR-number>

## ✅ Checklist

- [ ] Código implementado e testado
- [ ] Testes unitários adicionados/atualizados
- [ ] Testes de integração passando
- [ ] Documentação atualizada
- [ ] Sem breaking changes (ou documentados)
- [ ] Revisado por pares (após criação do PR)

## 🧪 Como Testar

1. [Passo 1]
2. [Passo 2]
3. [Resultado esperado]

## 📸 Screenshots/Demos

[Se aplicável, adicione screenshots ou links para demos]

## 🔍 Notas para Revisores

- [Ponto de atenção 1]
- [Ponto de atenção 2]
```

### 4. Vincular PRs

Se houver múltiplos PRs (um por repositório):
- Adicione links cruzados entre os PRs
- Documente a ordem de merge recomendada
- Indique dependências entre PRs

### 5. Atualizar Issue no Task Manager

Se task manager estiver configurado:
- Mova a issue para "Em Revisão" ou "PR Aberto"
- Adicione links dos PRs na issue
- Adicione comentário com resumo das mudanças

### 6. Documentação da Sessão

Atualize `./.sessions/<ISSUE-ID>/pr.md`:

```markdown
# [Título da Feature] - Pull Requests

## PRs Criados

### <repo-1>
- **Link**: <URL do PR>
- **Status**: Aberto
- **Commits**: X commits

### <repo-2>
- **Link**: <URL do PR>
- **Status**: Aberto
- **Commits**: Y commits

## Ordem de Merge Recomendada

1. <repo-1> - [Justificativa]
2. <repo-2> - [Justificativa]

## Notas para Merge

- [Nota importante 1]
- [Nota importante 2]
```

## 🔍 Checklist Final

Antes de solicitar revisão:
- [ ] Todos os PRs criados
- [ ] Descrições completas e claras
- [ ] PRs vinculados entre si
- [ ] Issue atualizada no task manager
- [ ] Testes passando em CI/CD
- [ ] Documentação da sessão completa

## 📢 Comunicação

Notifique o time sobre os PRs:
- Mencione revisores relevantes
- Destaque mudanças críticas ou breaking changes
- Indique urgência se aplicável

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🚨 Comentários de revisão / problemas na PR → correção via agentes

Se a revisão da PR (ou o CI da PR) apontar algo que precisa mudar, **NÃO** trate a tarefa
como concluída. Comporte-se como o `/orchestrate`: **reabra a sessão e spawne agentes
corretivos** — não corrija de forma ad-hoc.

1. 🔴 **Reabra a sessão como ATIVA**: em `.sessions/<ISSUE-ID>/state.json` defina
   `status:"running"` e atualize `updatedAt` (crie um `state.json` mínimo se não existir).
   **Mova a task** — gatilho `reopened`: siga `agents/TASK-STATUS.md`.
2. 🧩 **Um worker por comentário/ajuste** em `.sessions/<ISSUE-ID>/workers/<id>.json`, com
   `name` descritivo (ex.: `fix:pr-feedback-back`), `status:"pending"`, `steps:[]`.
3. 🤖 **Spawne os agentes (Task tool)** em ondas como o `/orchestrate`, atualizando
   `status`/`currentStep`/`steps[]` no worktree da sessão; cada um aplica o ajuste, roda
   os testes e faz commit.
4. ✅ **Só então** marque os workers `done`, `state.json.status:"done"`, e responda os
   comentários na PR. **Enquanto houver ajuste pendente, `status` NUNCA é `done`** — a
   tarefa permanece ATIVA no dashboard até tudo estar resolvido e aprovado.

## 🎯 Próximos Passos

1. Aguardar revisão dos PRs
2. Responder comentários e fazer ajustes (via o fluxo de agentes acima)
3. Após aprovação, rode **`/merge <ISSUE-ID>`** para integrar na main (atualiza a base,
   resolve conflitos com agentes, confirma e faz o merge na ordem recomendada)
4. Limpar o workspace da sessão quando concluída
