# Refinamento de Requisitos

Você é um especialista em produto encarregado de ajudar a refinar requisitos para o projeto.

## ⚠️ IMPORTANTE: Este Comando NÃO Implementa Código

**Este comando é APENAS para planejamento e documentação:**
- ✅ Validar requisitos contra metaspecs
- ✅ Criar especificação refinada
- ✅ Salvar documentação em `.sessions/`
- ✅ Atualizar issue no task manager
- ❌ **NÃO implementar código**
- ❌ **NÃO fazer edits em arquivos de código**
- ❌ **NÃO executar testes ou deploy**

**Próximo passo**: `/spec [ISSUE-ID]` para criar PRD completo baseado nos requisitos refinados.

---

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


## Objetivo

Transformar um requisito inicial em especificação refinada e validada, pronta para se tornar PRD completo.

## Processo

### 1. Fase de Esclarecimento

Leia o requisito inicial e faça perguntas para alcançar clareza total sobre:
- **Objetivo**: Por que construir isso?
- **Valor de Negócio**: Qual métrica/persona impacta?
- **Escopo**: O que inclui e o que NÃO inclui?
- **Interações**: Quais features/componentes existentes são afetados?

Continue fazendo perguntas até ter entendimento completo.

### 2. Validação Contra Metaspecs

**IMPORTANTE**: Primeiro leia `ai.properties.md` para obter o `base_path`. Os índices JÁ devem estar em contexto (você rodou `/warm-up`). Consulte os índices e leia APENAS os documentos relevantes para validar o requisito.

**Processo de Validação**:

1. **Consulte os índices carregados** pelo `/warm-up`:
   - Leia `context-manifest.json` para encontrar o repositório com `role: "metaspecs"`
   - Obtenha o `id` desse repositório (ex: "my-project-metaspecs")
   - Leia `ai.properties.md` para obter o `base_path`
   - O repositório de metaspecs está em: `{base_path}/{metaspecs-id}/`
   - Consulte `{base_path}/{metaspecs-id}/index.md` - Visão geral do projeto
   - Consulte índices específicos (ex: `specs/business/index.md`, `specs/technical/index.md`)

2. **Identifique documentos relevantes** para este requisito específico:
   - Em `specs/business/`: Quais documentos de negócio são relevantes?
   - Em `specs/technical/`: Quais documentos técnicos são relevantes?

3. **Leia APENAS os documentos relevantes** identificados (não leia tudo!)

4. **Valide o requisito** contra as metaspecs lidas:
   - ✅ Alinhamento com estratégia e visão de produto
   - ✅ Atende necessidades das personas corretas
   - ✅ Compatível com stack tecnológica aprovada
   - ✅ Respeita decisões arquiteturais (ADRs)
   - ✅ Segue regras de negócio existentes
   - ⚠️ Identifique conflitos ou violações

**Se identificar violações**: 🛑 **PARE** e peça esclarecimento ao usuário antes de prosseguir (Princípio Jidoka).

### 3. Fase de Resumo e Aprovação

Uma vez que tenha coletado informações suficientes e validado contra metaspecs, apresente um resumo estruturado com:
- **Feature**: Nome da funcionalidade
- **Objetivo**: Por que construir (1-2 frases)
- **Valor de Negócio**: Métrica, persona, fase do roadmap (consulte metaspecs)
- **Escopo**: O que INCLUI e o que NÃO INCLUI
- **Componentes Afetados**: Lista baseada na arquitetura atual (consulte metaspecs técnicas)
- **Validação contra Metaspecs**: ✅ Aprovado / ⚠️ Atenção necessária
- **Estimativa de Esforço**: Pequeno (< 1 dia) / Médio (1-3 dias) / Grande (3-5 dias) / Muito Grande (> 5 dias)

**Avaliação de Complexidade e Sugestão de Quebra**:

**Se a implementação parecer grande** (> 5 dias de esforço estimado):
- 🚨 **Sugira quebrar em múltiplas issues menores**
- Explique o racional da quebra (ex: "Esta feature envolve 3 áreas distintas que podem ser implementadas independentemente")
- Proponha uma quebra **lógica** baseada em:
  - Funcionalidades independentes
  - Repositórios diferentes
  - Camadas da aplicação (backend, frontend, infra)
  - Fases de implementação (MVP, melhorias, otimizações)
- Exemplo de quebra:
  ```
  Issue Original: "Sistema de notificações multi-canal"
  
  Quebra Sugerida:
  - FIN-201: Infraestrutura de filas e workers (backend)
  - FIN-202: Notificações por email (backend + templates)
  - FIN-203: Notificações push (backend + mobile)
  - FIN-204: Preferências de notificação (frontend + backend)
  ```
- **Importante**: A decisão final é do usuário - ele pode aceitar a quebra ou manter como issue única

**Se o usuário aceitar a quebra**:
- Documente cada issue separadamente
- Adicione referências cruzadas entre as issues relacionadas
- Sugira ordem de implementação se houver dependências
- Cada issue quebrada deve passar pelo mesmo processo de refinamento

Peça aprovação do usuário e incorpore feedback se necessário.

**Dica**: Você pode pesquisar no código-base ou internet antes de finalizar, se necessário.

### 4. Salvamento dos Requisitos Refinados

Uma vez que o usuário aprove, salve os requisitos:

**IMPORTANTE**: Sempre crie backup local E atualize o task manager (se configurado).

**Processo de Salvamento**:

1. **SEMPRE criar backup local primeiro**:
   - Crie arquivo completo em `./.sessions/<ISSUE-ID>/refined.md` (ex: `./.sessions/FIN-5/refined.md`)
   - Onde `<ISSUE-ID>` é o ID da issue (ex: FIN-5, FIN-123)
   - Inclua TODOS os detalhes do refinamento (backup completo)

2. **Se task manager estiver configurado** (leia `ai.properties.md` para identificar `task_management_system`):
   - Identifique a ferramenta MCP do task manager
   - **Atualize o BODY (description) da issue** com versão CONCISA dos requisitos refinados
     - Para Jira: Use MCP do Jira com campo `description`
     - Para Linear: Use MCP do Linear com campo `description`
     - Para GitHub: Use MCP do GitHub com campo `body`
     - Para Azure Boards: Use MCP do Azure Boards com campo `description`
     - Inclua todo o conteúdo refinado no campo description/body da issue
     - Se o conteúdo for muito extenso e houver erro de API, considere criar versão resumida
   - **SEMPRE sobrescrever** o body existente (não adicionar ao final)

**Observação**:
- O backup local SEMPRE está salvo e completo
- Se houver erro de API, verifique manualmente se a issue foi atualizada no task manager

**Template de Saída**:

**IMPORTANTE**: O template padrão para requisitos refinados pode estar documentado no repositório de metaspecs. Consulte `{base_path}/{metaspecs-id}/specs/refined/` ou similar.

**Template COMPLETO** (para backup local `.sessions/<ISSUE-ID>/refined.md`):
- **Metadados**: Issue, ID, Task Manager, Projeto, Data, Sprint, Prioridade
- **🎯 POR QUE**: Razões, valor de negócio, métrica, persona, alinhamento estratégico
- **📦 O QUE**: Funcionalidades detalhadas, componentes afetados, integrações, escopo negativo completo
- **🔧 COMO**: Stack, padrões de código, estrutura de arquivos, dependências, ordem de implementação, failure modes, considerações de performance/custo/UX
- **✅ Validação contra Metaspecs**: Documentos consultados (business e technical), ADRs verificados, resultado da validação
- **📊 Métricas de Sucesso**: Técnicas, produto/UX, critérios de aceitação
- **🔄 Impacto no Produto**: Alinhamento com objetivos, habilitadores, riscos mitigados
- **⚠️ Limitações Conhecidas**: Limitações do MVP
- **📝 Checklist de Implementação**: Tarefas por área (backend, frontend, testes, segurança, etc.)

**Template para Task Manager**:
```markdown
# [Nome Feature] - Requisitos Refinados

**Sprint X** | **Y dias** | **Prioridade**

## Objetivo
[1-2 parágrafos: o que é e por que fazer]

## Escopo

### Principais Funcionalidades
- Funcionalidade 1: [resumo]
- Funcionalidade 2: [resumo]
- Validações/Guards: [resumo]

### Componentes Afetados
- Componente 1: [tipo de mudança]
- Componente 2: [tipo de mudança]

### Segurança
✅ [item 1] ✅ [item 2] ✅ [item 3]

## Escopo Negativo
❌ [item 1] ❌ [item 2] ❌ [item 3]

## Stack
[Tech stack resumida por área]

## Estrutura
[Árvore de arquivos RESUMIDA - principais módulos apenas]

## Failure Modes (Evitar)
🔴 [crítico 1] 🔴 [crítico 2]
🟡 [médio 1] 🟡 [médio 2]

## Critérios de Aceitação
- [ ] [item 1]
- [ ] [item 2]
- [ ] [item 3]

## Validação
**ADRs**: [lista]
**Specs**: [principais]
**Status**: ✅ Aprovado

**Impacto**: [resumo]
**Limitações**: [resumo]

---
📄 **Documento completo**: `.sessions/<ISSUE-ID>/refined.md`
```

**Audiência**: Desenvolvedor IA com capacidades similares às suas. Seja conciso mas completo.

---

**Requisito para Refinar**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Passo

**Após aprovação do usuário e salvamento dos requisitos refinados**, o fluxo natural é:

```bash
/spec [ISSUE-ID]
```

**Exemplo**: `/spec FIN-3`

Este comando irá criar um PRD (Product Requirements Document) completo baseado nos requisitos refinados, detalhando funcionalidades, user stories, critérios de aceitação e validações finais.
