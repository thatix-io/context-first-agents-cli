# Início do Desenvolvimento

Este comando inicia o desenvolvimento de uma funcionalidade no workspace atual.

## 📍 IMPORTANTE: Entenda a Estrutura

**Workspace** (onde você trabalhará):
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree com branch feature/<ISSUE-ID>
├── repo-2/          # worktree com branch feature/<ISSUE-ID>
├── context.md       # contexto (imutável - criado por este comando)
├── architecture.md  # arquitetura (imutável - criado por este comando)
└── plan.md          # plano (mutável - criado por /plan)
```

**Repositórios principais** (apenas leitura):
```
{base_path}/repo-1/  # repo principal (branch main/master)
{base_path}/repo-2/  # repo principal (branch main/master)
```

**REGRA DE OURO**:
- ✅ Leia metaspecs e código dos repositórios principais (read-only)
- ✅ Crie `context.md` e `architecture.md` em `.sessions/<ISSUE-ID>/`
- ❌ NUNCA faça checkout nos repositórios principais
- ❌ NUNCA modifique código neste comando (use `/work` depois)

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


## 📚 Carregar MetaSpecs

**Localizar MetaSpecs automaticamente**:
1. Leia `context-manifest.json` do orchestrator
2. Encontre o repositório com `"role": "metaspecs"`
3. Leia `ai.properties.md` para obter o `base_path`
4. O metaspecs está em: `{base_path}/{metaspecs-repo-id}/`
5. Leia os arquivos `index.md` relevantes:
   - Contexto de negócio
   - Stack, arquitetura e padrões técnicos
   - Convenções do projeto
   - ADRs (Architecture Decision Records)

## 🎯 Contexto do Projeto

Antes de iniciar, carregue o contexto consultando:
- `context-manifest.json` - Estrutura de repositórios
- MetaSpecs (localizado acima) - Arquitetura e padrões
- `diretório do workspace` - Informações do workspace atual

## ⚙️ Configuração Inicial

1. **Verificar Workspace**:
   - Confirme que está no workspace correto (verifique `diretório do workspace`)
   - Liste os repositórios disponíveis no workspace

2. **Verificar Branches**:
   - Para cada repositório no workspace, verifique a branch atual
   - Confirme que todas as branches estão sincronizadas

3. **Carregar Especificação**:
   - **Se task manager configurado**: Leia a issue usando o MCP apropriado
   - **Senão**: Peça ao usuário o arquivo de especificação ou descrição da feature

4. **Atualizar Status** (se task manager configurado):
   - Mova a issue para "Em Progresso"

## 📋 Análise e Entendimento

Analise a especificação e construa entendimento completo respondendo:

### Negócio
- **Por que** isso está sendo construído?
- **Quem** se beneficia?
- **Qual** métrica queremos impactar?

### Funcional
- **Qual resultado esperado**? (comportamento do usuário, output do sistema)
- **Quais componentes** serão criados/modificados em cada repositório?
- **Quais integrações** entre repositórios são necessárias?

### Técnico
- **Stack aprovada**? Verificar contra especificações técnicas
- **Padrões arquiteturais**? Verificar ADRs (se disponíveis)
- **Dependências novas**? Justificar e documentar
- **Como testar**? (conforme padrões do projeto)

### Validação contra Metaspecs

Se metaspecs estiverem disponíveis, validar:
- Alinhado com estratégia e roadmap?
- Usa stack tecnológica aprovada?
- Respeita Architecture Decision Records?
- Segue regras de negócio documentadas?

## 🤔 Perguntas de Esclarecimento

Após análise inicial, formule **3-5 clarificações mais importantes**:

**Exemplos de perguntas relevantes**:
- Qual repositório deve conter a lógica principal?
- Como os repositórios devem se comunicar?
- Há dependências entre as mudanças nos diferentes repos?
- Qual a ordem de implementação recomendada?
- Há impacto em APIs ou contratos entre serviços?

## 💾 Criação do Context.md

**IMPORTANTE**: Este arquivo é **IMUTÁVEL** após aprovação. Não deve ser modificado por comandos subsequentes.

Crie arquivo `./.sessions/<ISSUE-ID>/context.md` com:

```markdown
# Context: [Nome da Feature]

## Por Que
[Valor de negócio, persona atendida, métrica impactada]

## O Que
[Funcionalidades principais, comportamento esperado]

## Como
[Abordagem técnica, componentes, repositórios afetados]

## Validação contra Metaspecs
- [x] Alinhado com estratégia de produto
- [x] Atende persona correta
- [x] Métrica impactada documentada
- [x] Usa stack aprovada
- [x] Respeita ADRs
- [x] Sem conflitos com limitações conhecidas

## Dependências
[Bibliotecas, APIs, componentes existentes]

## Restrições
[Limitações técnicas, performance targets, budget]

## Testes
[E2E críticos, unit tests necessários, cobertura esperada]
```

**Após criar `context.md`, peça revisão e aprovação do usuário antes de prosseguir.**

---

## 🏗️ Criação do Architecture.md

**IMPORTANTE**: Este arquivo é **IMUTÁVEL** após aprovação. Não deve ser modificado por comandos subsequentes.

### Princípios Arquiteturais (OBRIGATÓRIO)

**ANTES de criar a arquitetura, você DEVE:**

1. **Ler ADRs (Architecture Decision Records)**:
   - Liste ADRs em metaspecs
   - Leia TODOS os ADRs relevantes para a feature
   - Identifique restrições e padrões obrigatórios

2. **Consultar padrões arquiteturais**:
   - Leia guias de estrutura do projeto em metaspecs
   - Leia padrões de código em metaspecs
   - Identifique padrões existentes no código (use Glob/Grep para encontrar exemplos similares)

3. **Validar compliance com ADRs**:
   - Para cada ADR relevante, verifique se a solução proposta respeita as decisões
   - Documente compliance no architecture.md
   - Se houver violação, justifique ou proponha correção

4. **Analisar código existente**:
   - Use Glob/Grep para encontrar componentes/módulos similares
   - Entenda padrões e estruturas existentes
   - Alinhe nova implementação com padrões do projeto

### Estrutura do Documento de Arquitetura

Crie arquivo `./.sessions/<ISSUE-ID>/architecture.md` com:

```markdown
# Architecture: [Nome da Feature]

## Visão Geral
[Visão de alto nível do sistema antes e depois da mudança]

## Componentes Afetados
[Lista de componentes e suas relações, dependências]

### Diagrama de Componentes
[Descrição textual ou diagrama Mermaid dos componentes]

### Fluxo de Dados
1. [Passo 1 do fluxo]
2. [Passo 2 do fluxo]
3. [Passo 3 do fluxo]

## Estrutura de Diretórios Proposta
[Baseada em padrões do projeto]

```
repo-1/
├── src/
│   ├── components/
│   │   └── NewComponent.tsx (CRIAR)
│   └── services/
│       └── NewService.ts (CRIAR)
```

## Padrões e Melhores Práticas
[Padrões que serão mantidos ou introduzidos]

## Validação de ADRs
[Lista de ADRs consultados e compliance]

- [x] ADR-001: [Nome] - Compliant
- [x] ADR-002: [Nome] - Compliant

## Dependências Externas
[Bibliotecas que serão usadas ou adicionadas]

## Decisões Técnicas

### Decisão 1: [Título]
**Contexto**: [Por que precisamos decidir isso]
**Opções consideradas**:
- Opção A: [Prós e contras]
- Opção B: [Prós e contras]
**Decisão**: [Opção escolhida]
**Justificativa**: [Por que escolhemos esta opção]

## Restrições e Suposições
[Limitações técnicas e premissas]

## Trade-offs
[Alternativas consideradas e por que não foram escolhidas]

## Consequências
**Positivas**:
- [Benefício 1]
- [Benefício 2]

**Negativas**:
- [Custo/limitação 1]
- [Custo/limitação 2]

## Arquivos Principais
[Lista dos principais arquivos a serem editados/criados]

- `repo-1/src/components/NewComponent.tsx` (CRIAR)
- `repo-1/src/services/NewService.ts` (CRIAR)
- `repo-2/src/controllers/NewController.ts` (CRIAR)
```

**Após criar `architecture.md`, peça revisão e aprovação do usuário antes de prosseguir.**

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Passo

**Após aprovação do usuário dos arquivos `context.md` e `architecture.md`**:

```bash
/plan
```

Este comando criará o planejamento técnico detalhado da implementação.

---

## ⚠️ IMPORTANTE: Arquivos Imutáveis

**`context.md` e `architecture.md` são IMUTÁVEIS após aprovação.**

- ✅ Podem ser LIDOS por comandos subsequentes (`/plan`, `/work`)
- ❌ NÃO devem ser MODIFICADOS por nenhum comando
- ❌ Se houver necessidade de mudança, discuta com o usuário e crie novos arquivos ou atualize a issue no task manager
