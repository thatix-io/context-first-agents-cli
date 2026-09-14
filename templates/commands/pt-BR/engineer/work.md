# Execução do Trabalho

Este comando executa uma unidade de trabalho no workspace atual, implementando parte do plano técnico.

## 📋 Pré-requisitos

Antes de executar, certifique-se de que:
- Executou `/start` e `/plan` para ter o planejamento técnico
- Está no workspace correto: `<orchestrator>/.sessions/<ISSUE-ID>/`
- Tem os arquivos `.sessions/<ISSUE-ID>/` disponíveis:
  - `context.md` (imutável)
  - `architecture.md` (imutável)
  - `plan.md` (mutável)

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


## 📍 IMPORTANTE: Entenda a Estrutura

**Workspace** (onde você trabalha):
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree com branch feature/<ISSUE-ID>
├── repo-2/          # worktree com branch feature/<ISSUE-ID>
├── context.md       # contexto (imutável)
├── architecture.md  # arquitetura (imutável)
└── plan.md          # plano (mutável)
```

**Repositórios principais** (NÃO tocar):
```
{base_path}/repo-1/  # repo principal (branch main/master)
{base_path}/repo-2/  # repo principal (branch main/master)
```

**REGRA DE OURO**:
- ✅ Trabalhe APENAS dentro de `<orchestrator>/.sessions/<ISSUE-ID>/`
- ✅ Faça commits nos worktrees dentro do workspace
- ❌ NUNCA faça checkout nos repositórios principais
- ❌ NUNCA navegue para `{base_path}/{repo-id}/`

## 🛑 CRÍTICO: ONDE CRIAR CÓDIGO

**⚠️ ATENÇÃO: TODO CÓDIGO DEVE SER CRIADO DENTRO DO WORKTREE DO REPOSITÓRIO!**

**✅ CORRETO** - Criar código dentro do worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/tests/test.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/package.json  ✅
```

**❌ ERRADO** - NUNCA criar código diretamente em .sessions:
```
<orchestrator>/.sessions/src/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/src/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/file.ts  ❌
```

**REGRA ABSOLUTA**:
- 🛑 **TODO arquivo de código** (`.ts`, `.js`, `.py`, `.java`, etc.) **DEVE estar dentro de** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NUNCA crie código** diretamente em `<orchestrator>/.sessions/` ou `<orchestrator>/.sessions/<ISSUE-ID>/`
- ✅ **Único lugar válido**: Dentro do worktree do repositório específico

## ⚠️ IMPORTANTE: Arquivos Imutáveis

**Este comando deve LER mas NÃO MODIFICAR:**
- ✅ **LER** `.sessions/<ISSUE-ID>/context.md` (imutável)
- ✅ **LER** `.sessions/<ISSUE-ID>/architecture.md` (imutável)
- ✅ **ATUALIZAR** `.sessions/<ISSUE-ID>/plan.md` (marcar progresso)
- ✅ **IMPLEMENTAR** código **DENTRO DO WORKTREE**: `.sessions/<ISSUE-ID>/<repo-name>/`
- ✅ **FAZER COMMITS** nos worktrees: `.sessions/<ISSUE-ID>/<repo-name>/`
- ❌ **NÃO modificar `context.md` ou `architecture.md`**
- ❌ **NÃO fazer checkout de branches nos repositórios principais (fora do workspace)**
- 🛑 **NUNCA criar código em `.sessions/` ou `.sessions/<ISSUE-ID>/` diretamente**

## 📚 Carregar MetaSpecs

**Localizar MetaSpecs automaticamente**:
1. Leia `context-manifest.json` do orchestrator
2. Encontre o repositório com `"role": "metaspecs"`
3. Leia `ai.properties.md` para obter o `base_path`
4. O metaspecs está em: `{base_path}/{metaspecs-repo-id}/`
5. Leia os arquivos `index.md` relevantes durante a implementação para:
   - Seguir padrões de código
   - Respeitar arquitetura definida
   - Usar convenções corretas

## 🎯 Objetivo

Implementar uma unidade de trabalho específica do plano, que pode envolver:
- Criar novos arquivos/componentes
- Modificar arquivos existentes
- Adicionar testes
- Atualizar documentação

## 📝 Processo de Trabalho

**⚠️ IMPORTANTE: CONTROLE DE PROGRESSO**

Este comando executa o trabalho em **fases incrementais**. Após completar cada **FASE PRINCIPAL** (ex: Fase 1 → Fase 2):

1. 🛑 **PARE** a execução
2. 📊 **APRESENTE** um resumo do que foi feito
3. ❓ **PERGUNTE** ao desenvolvedor se ele quer:
   - Revisar o código implementado
   - Fazer ajustes antes de continuar
   - Prosseguir para a próxima fase

**IMPORTANTE**:
- ✅ **PAUSE** entre fases principais (Fase 1 → Fase 2 → Fase 3)
- ❌ **NÃO pause** entre subfases (Fase 1.1 → Fase 1.2 → Fase 1.3)

**NÃO implemente tudo de uma vez**. Trabalhe fase principal por fase principal, aguardando confirmação do desenvolvedor.

---

### 1. Identificar Unidade de Trabalho

Com base no plano técnico (`./.sessions/<ISSUE-ID>/plan.md`), identifique:
- Qual tarefa específica será implementada agora
- Em qual(is) repositório(s) do workspace
- Quais arquivos serão criados/modificados
- Dependências com outras tarefas

### 2. Implementação



**IMPORTANTE**: Trabalhe APENAS dentro do workspace em `.sessions/<ISSUE-ID>/`

Para cada repositório no workspace:

```bash
# Navegue para o worktree dentro do workspace
cd <orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/

# Verifique que está na branch correta
git branch  # deve mostrar * feature/<ISSUE-ID>

# Implemente o código aqui
```

Execute a implementação seguindo:
- **Padrões do projeto**: Consulte guias de estilo e arquitetura
- **Stack aprovada**: Use apenas tecnologias documentadas nas metaspecs
- **Testes**: Implemente testes conforme padrões do projeto
- **Documentação**: Atualize comentários e docs quando necessário



### 3. Validação Local

Antes de commitar:
- Execute testes unitários/integração
- Verifique linting e formatação
- Confirme que não quebrou funcionalidades existentes



### 4. Commit

Para cada repositório modificado **dentro do workspace**:

```bash
# Navegue para o worktree dentro do workspace
cd <orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/

# Adicione as mudanças
git add .

# Commit
git commit -m "tipo: descrição concisa

- Detalhe 1
- Detalhe 2

Refs: <ISSUE-ID>"
```

**Tipos de commit**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

**⚠️ PAUSA OBRIGATÓRIA**: Após completar TODA a fase principal (identificação + implementação + validação + commit + atualização do plan.md), **PARE** e mostre ao desenvolvedor:
- Resumo completo da fase
- Arquivos criados/modificados
- Commits realizados
- Pergunte se ele quer revisar ou prosseguir para a próxima fase

### 5. Atualização do Plan.md

**A CADA tarefa completada**, atualize `./.sessions/<ISSUE-ID>/plan.md`:

```markdown
#### 1.1 - [Nome da Tarefa] [Completada ✅]
- [Detalhe 1]
- [Detalhe 2]
- [Detalhe 3]

**Arquivos**:
- `path/to/file1.ts` ✅
- `path/to/file2.vue` ✅

**Testes**:
- Unit test: [Descrição] ✅
- Integration test: [Descrição] ✅

**Comentários**:
- Decisão: [Explicação de decisão técnica importante]
- Aprendizado: [Algo aprendido durante implementação]
```

**Marque status das tarefas**:
- `[Não Iniciada ⏳]` - Tarefa ainda não começou
- `[Em Progresso ⏰]` - Tarefa sendo trabalhada agora
- `[Completada ✅]` - Tarefa finalizada e validada

## 🔍 Checklist de Qualidade

Antes de considerar a unidade completa:
- [ ] Código implementado e testado
- [ ] Testes passando
- [ ] Linting/formatação OK
- [ ] Documentação atualizada (se necessário)
- [ ] Commit realizado em todos os repos afetados
- [ ] `plan.md` atualizado com progresso e comentários

## ⚠️ Princípio Jidoka

Se encontrar problemas durante a implementação:
1. 🛑 **PARE** a implementação
2. 📝 **DOCUMENTE** o problema encontrado
3. 💬 **ALERTE** o usuário e discuta soluções
4. 🔄 **AJUSTE** o plano se necessário

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🎯 Próximos Passos

- **Continuar implementação**: Execute `/work` novamente para próxima unidade
- **Finalizar feature**: Quando tudo estiver implementado, execute `/pre-pr`

## 💡 Dicas

- Trabalhe em unidades pequenas e incrementais
- Commit frequentemente (atomic commits)
- Documente decisões importantes na sessão
- Mantenha os repositórios sincronizados entre si
