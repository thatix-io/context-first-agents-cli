# Planejamento Técnico

Este comando cria o plano técnico detalhado para implementação da feature.

## 📋 Pré-requisitos

- PRD criado via `/spec`
- Análise inicial feita via `/start`
- Arquivos `context.md` e `architecture.md` criados e aprovados

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

**Workspace**:
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree (será usado no /work)
├── repo-2/          # worktree (será usado no /work)
├── context.md       # contexto (imutável - LER)
├── architecture.md  # arquitetura (imutável - LER)
└── plan.md          # plano (mutável - CRIAR)
```

**Repositórios principais** (apenas leitura):
```
{base_path}/repo-1/  # repo principal (branch main/master)
{base_path}/repo-2/  # repo principal (branch main/master)
```

**REGRA DE OURO**:
- ✅ Leia `context.md` e `architecture.md` (imutáveis)
- ✅ Crie `plan.md` em `.sessions/<ISSUE-ID>/`
- ✅ Leia código dos repositórios principais (read-only)
- ❌ NUNCA faça checkout nos repositórios principais
- ❌ NUNCA modifique `context.md` ou `architecture.md`

## ⚠️ IMPORTANTE: Arquivos Imutáveis

**Este comando deve LER mas NÃO MODIFICAR:**
- ✅ **LER** `.sessions/<ISSUE-ID>/context.md` (imutável)
- ✅ **LER** `.sessions/<ISSUE-ID>/architecture.md` (imutável)
- ✅ **CRIAR** `.sessions/<ISSUE-ID>/plan.md` (mutável - será atualizado durante `/work`)
- ❌ **NÃO modificar `context.md` ou `architecture.md`**

## 📚 Carregar MetaSpecs

**Localizar MetaSpecs automaticamente**:
1. Leia `context-manifest.json` do orchestrator
2. Encontre o repositório com `"role": "metaspecs"`
3. Leia `ai.properties.md` para obter o `base_path`
4. O metaspecs está em: `{base_path}/{metaspecs-repo-id}/`
5. Leia os arquivos `index.md` relevantes para garantir conformidade com:
   - Arquitetura do sistema
   - Padrões de design e código
   - Estrutura de pastas e arquivos
   - Convenções de nomenclatura

## 🎯 Objetivo

Criar um plano técnico detalhado que guiará a implementação, dividindo o trabalho em unidades menores e sequenciais.

## 📝 Estrutura do Plano

### 1. Visão Geral Técnica

```markdown
# Plano Técnico - [Título da Feature]

## Resumo
[Breve descrição técnica do que será implementado]

## Repositórios Envolvidos
- **<repo-1>**: [Papel nesta feature]
- **<repo-2>**: [Papel nesta feature]

## Abordagem Técnica
[Estratégia geral de implementação]
```

### 2. Arquitetura da Solução

```markdown
## Arquitetura

### Diagrama de Componentes
[Descrição textual ou ASCII art dos componentes e suas relações]

### Fluxo de Dados
1. [Passo 1 do fluxo]
2. [Passo 2 do fluxo]
3. [Passo 3 do fluxo]

### Integrações
- **<repo-1> → <repo-2>**: [Como se comunicam]
- **Sistema → API Externa**: [Se houver]
```

### 3. Decisões Técnicas

```markdown
## Decisões Técnicas

### Decisão 1: [Título]
**Contexto**: [Por que precisamos decidir isso]
**Opções consideradas**:
- Opção A: [Prós e contras]
- Opção B: [Prós e contras]
**Decisão**: [Opção escolhida]
**Justificativa**: [Por que escolhemos esta opção]

### Decisão 2: [Título]
[Mesmo formato acima]
```

### 4. Plano de Implementação

Divida o trabalho em unidades pequenas e sequenciais:

```markdown
## Plano de Implementação

### Fase 1: [Nome da Fase]
**Objetivo**: [O que será alcançado nesta fase]
**Repositórios**: [repos afetados]

#### Tarefa 1.1: [Descrição]
- **Repo**: <repo-1>
- **Arquivos**: [arquivos a criar/modificar]
- **Descrição**: [O que fazer]
- **Testes**: [Testes a implementar]
- **Estimativa**: [tempo estimado]

#### Tarefa 1.2: [Descrição]
- **Repo**: <repo-2>
- **Arquivos**: [arquivos a criar/modificar]
- **Descrição**: [O que fazer]
- **Testes**: [Testes a implementar]
- **Estimativa**: [tempo estimado]

### Fase 2: [Nome da Fase]
[Mesmo formato acima]

### Fase 3: [Nome da Fase]
[Mesmo formato acima]
```

### 5. Estrutura de Arquivos

Para cada repositório, defina a estrutura:

```markdown
## Estrutura de Arquivos

### <repo-1>
```
src/
├── components/
│   ├── NewComponent.tsx (CRIAR)
│   └── ExistingComponent.tsx (MODIFICAR)
├── services/
│   └── NewService.ts (CRIAR)
└── tests/
    └── NewComponent.test.tsx (CRIAR)
```

### <repo-2>
```
src/
├── controllers/
│   └── NewController.ts (CRIAR)
└── tests/
    └── NewController.test.ts (CRIAR)
```
```

### 6. APIs e Contratos

```markdown
## APIs e Contratos

### Endpoints Novos

#### POST /api/resource
**Request**:
```json
{
  "field1": "string",
  "field2": "number"
}
```

**Response**:
```json
{
  "id": "string",
  "status": "string"
}
```

### Endpoints Modificados

#### GET /api/resource/:id
**Mudanças**: [O que muda]
**Breaking Change**: Sim / Não
```

### 7. Estratégia de Testes

```markdown
## Estratégia de Testes

### Testes Unitários
- **<repo-1>**: [Componentes/funções a testar]
- **<repo-2>**: [Componentes/funções a testar]

### Testes de Integração
- **Cenário 1**: [Descrição e repos envolvidos]
- **Cenário 2**: [Descrição e repos envolvidos]

### Testes E2E (se aplicável)
- **Fluxo 1**: [Descrição]
- **Fluxo 2**: [Descrição]
```

### 8. Riscos Técnicos

```markdown
## Riscos Técnicos

### Risco 1: [Descrição]
- **Impacto**: Alto / Médio / Baixo
- **Probabilidade**: Alta / Média / Baixa
- **Mitigação**: [Como mitigar]
- **Plano B**: [Alternativa se ocorrer]

### Risco 2: [Descrição]
[Mesmo formato acima]
```

### 9. Checklist de Implementação

```markdown
## Checklist de Implementação

### Fase 1
- [ ] Tarefa 1.1
- [ ] Tarefa 1.2
- [ ] Testes da Fase 1

### Fase 2
- [ ] Tarefa 2.1
- [ ] Tarefa 2.2
- [ ] Testes da Fase 2

### Fase 3
- [ ] Tarefa 3.1
- [ ] Tarefa 3.2
- [ ] Testes da Fase 3

### Finalização
- [ ] Documentação atualizada
- [ ] Code review
- [ ] Testes de integração
- [ ] PR criado
```

## 📄 Salvamento do Plano

Salve em `./.sessions/<ISSUE-ID>/plan.md`

## 🔍 Revisão

Revise o plano verificando:
- Todas as tarefas estão claras e executáveis
- Dependências entre tarefas estão identificadas
- Estimativas são realistas
- Riscos foram considerados
- Estratégia de testes é adequada

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Passo

Após aprovação do plano:

```bash
/work
```

Este comando iniciará a execução da primeira unidade de trabalho do plano.
