# Validação contra Metaspecs

Este comando valida requisitos, decisões ou implementações contra as metaspecs do projeto.

## ⚠️ IMPORTANTE: Modo de Operação

**Este comando é para VALIDAÇÃO:**
- ✅ Validar contra metaspecs
- ✅ **LER** arquivos dos repositórios (read-only)
- ✅ Gerar relatório de validação
- ❌ **NÃO fazer checkout de branches nos repositórios principais**
- ❌ **NÃO modificar código**
- ❌ **NÃO modificar `context.md` ou `architecture.md`**

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


## 🎯 Objetivo

Garantir alinhamento com:
- Estratégia de produto
- Arquitetura técnica
- Padrões e convenções
- ADRs (Architecture Decision Records)

## 📋 Quando Usar

Execute este comando:
- Após `/spec` - validar PRD
- Após `/plan` - validar plano técnico
- Durante `/work` - validar decisões de implementação
- Antes de `/pr` - validação final

## 📚 Carregar MetaSpecs

**Localizar MetaSpecs automaticamente**:
1. Leia `context-manifest.json` do orchestrator
2. Encontre o repositório com `"role": "metaspecs"`
3. Leia `ai.properties.md` para obter o `base_path`
4. O metaspecs está em: `{base_path}/{metaspecs-repo-id}/`

## 🔍 Processo de Validação

### 1. Identificar Metaspecs Disponíveis

Navegue até o diretório de metaspecs e identifique quais metaspecs existem:

```bash
ls -la {base_path}/{metaspecs-repo-id}/
```

### 2. Validação de Negócio

Se existirem metaspecs de negócio (`repositório de MetaSpecs (seção de negócio)`):

```markdown
## Validação de Negócio

### Estratégia de Produto
- **Arquivo**: `repositório de MetaSpecs (seção de negócio)PRODUCT_STRATEGY.md`
- **Validação**: [Esta feature está alinhada com a estratégia?]
- **Status**: ✅ Alinhado / ⚠️ Parcialmente / ❌ Desalinhado
- **Notas**: [Observações]

### Personas
- **Arquivo**: `repositório de MetaSpecs (seção de negócio)CUSTOMER_PERSONAS.md`
- **Validação**: [Atende a persona correta?]
- **Status**: ✅ Alinhado / ⚠️ Parcialmente / ❌ Desalinhado
- **Notas**: [Observações]

### Métricas
- **Arquivo**: `repositório de MetaSpecs (seção de negócio)PRODUCT_METRICS.md`
- **Validação**: [Métrica de sucesso está documentada?]
- **Status**: ✅ Alinhado / ⚠️ Parcialmente / ❌ Desalinhado
- **Notas**: [Observações]
```

### 3. Validação Técnica

Se existirem metaspecs técnicas (`repositório de MetaSpecs (seção técnica)`):

```markdown
## Validação Técnica

### Stack Tecnológica
- **Arquivo**: `repositório de MetaSpecs (seção técnica)meta/stack.md`
- **Validação**: [Usa apenas tecnologias aprovadas?]
- **Status**: ✅ Conforme / ⚠️ Exceção justificada / ❌ Não conforme
- **Notas**: [Tecnologias usadas e justificativas]

### Arquitetura
- **Arquivo**: `repositório de MetaSpecs (seção técnica)ARCHITECTURE.md`
- **Validação**: [Segue padrões arquiteturais?]
- **Status**: ✅ Conforme / ⚠️ Parcialmente / ❌ Não conforme
- **Notas**: [Observações]

### ADRs (Architecture Decision Records)
- **Diretório**: `repositório de MetaSpecs (seção técnica)adr/`
- **Validação**: [Respeita decisões arquiteturais documentadas?]
- **ADRs Relevantes**: [Lista de ADRs verificados]
- **Status**: ✅ Conforme / ⚠️ Conflito menor / ❌ Conflito crítico
- **Notas**: [Observações]

### Regras de Negócio
- **Arquivo**: `repositório de MetaSpecs (seção técnica)BUSINESS_LOGIC.md`
- **Validação**: [Implementa regras de negócio corretamente?]
- **Status**: ✅ Conforme / ⚠️ Parcialmente / ❌ Não conforme
- **Notas**: [Observações]
```

### 4. Validação de Padrões

```markdown
## Validação de Padrões

### Código
- **Arquivo**: `repositório de MetaSpecs (seção técnica)CODE_STANDARDS.md`
- **Validação**: [Segue padrões de código?]
- **Status**: ✅ Conforme / ⚠️ Pequenos desvios / ❌ Não conforme

### Testes
- **Arquivo**: `repositório de MetaSpecs (seção técnica)TEST_STANDARDS.md`
- **Validação**: [Estratégia de testes adequada?]
- **Status**: ✅ Conforme / ⚠️ Parcialmente / ❌ Não conforme

### Documentação
- **Arquivo**: `repositório de MetaSpecs (seção técnica)DOC_STANDARDS.md`
- **Validação**: [Documentação adequada?]
- **Status**: ✅ Conforme / ⚠️ Parcialmente / ❌ Não conforme
```

### 5. Identificação de Conflitos

Se houver conflitos ou desalinhamentos:

```markdown
## Conflitos Identificados

### Conflito 1: [Descrição]
- **Severidade**: Crítico / Alto / Médio / Baixo
- **Metaspec**: [Arquivo que está sendo violado]
- **Descrição**: [Detalhe do conflito]
- **Recomendação**: [Como resolver]

### Conflito 2: [Descrição]
[Mesmo formato acima]
```

### 6. Exceções Justificadas

Se houver desvios justificados:

```markdown
## Exceções Justificadas

### Exceção 1: [Descrição]
- **Metaspec**: [Arquivo que está sendo desviado]
- **Desvio**: [O que está diferente]
- **Justificativa**: [Por que é necessário]
- **Aprovação**: [Quem aprovou]
- **Documentação**: [Onde foi documentado]
```

## 📄 Salvamento do Relatório de Validação

**PRIORIDADE 1: Usar MCP (Model Context Protocol)**

- Leia `ai.properties.md` do orchestrator para identificar o `task_management_system`
- Use o MCP apropriado para adicionar o relatório à issue:
  - Adicione como comentário na issue
  - Atualize labels/tags conforme resultado (ex: "validated", "needs-adjustment", "blocked")
  - Se houver conflitos críticos, atualize status da issue
- Informe ao usuário: "✅ Relatório de validação adicionado à issue [ID]"

**FALLBACK: Criar arquivo .md apenas se MCP falhar**

Se o MCP não estiver disponível ou falhar, crie `./.sessions/<ISSUE-ID>/check-report.md`:

```markdown
# Relatório de Validação - [ISSUE-ID]

**Data**: [data/hora]
**Fase**: [spec/plan/work/pre-pr]

## Status Geral
✅ Validado / ⚠️ Validado com ressalvas / ❌ Não validado

## Validações Realizadas
- Negócio: ✅ / ⚠️ / ❌
- Técnica: ✅ / ⚠️ / ❌
- Padrões: ✅ / ⚠️ / ❌

## Conflitos
[Lista de conflitos, se houver]

## Exceções
[Lista de exceções justificadas, se houver]

## Recomendações
1. [Recomendação 1]
2. [Recomendação 2]

## Aprovação
- [ ] Aprovado para prosseguir
- [ ] Requer ajustes
- [ ] Bloqueado
```

Informe ao usuário: "⚠️ Relatório salvo localmente em .sessions/ (task manager não disponível)"

## 🚨 Ação em Caso de Conflitos

Se conflitos críticos forem encontrados:
1. 🛑 **PARE** o processo atual
2. 📝 **DOCUMENTE** todos os conflitos
3. 💬 **ALERTE** o usuário e stakeholders
4. **Via MCP**: Atualize status da issue para "Bloqueado" ou "Requer Ajustes"
5. 🔄 **AJUSTE** o plano/implementação conforme necessário
6. ✅ **REVALIDE** após ajustes

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🎯 Resultado

Após validação:
- Se ✅: Prossiga para próxima fase
- Se ⚠️: Documente ressalvas e prossiga com aprovação
- Se ❌: Corrija conflitos antes de prosseguir
