# Métricas de Qualidade

Este comando coleta e analisa métricas de qualidade do código e do processo de desenvolvimento.

## 🎯 Objetivo

Medir e documentar a qualidade da implementação através de métricas objetivas:
- Cobertura de testes
- Complexidade do código
- Dívida técnica
- Performance
- Conformidade com padrões

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


## 📋 Pré-requisitos

- Implementação concluída (após `/work`)
- Testes implementados
- Build funcionando

## 📊 Métricas a Coletar

### 1. Cobertura de Testes

Para cada repositório modificado:

```bash
cd <repositório>

# Executar testes com cobertura (exemplos por stack):
# Node.js: npm run test:coverage / jest --coverage
# Python: pytest --cov=src tests/
# Java: mvn jacoco:report / gradle jacocoTestReport
# Go: go test -cover ./...
# Ruby: rspec --coverage
# Rust: cargo tarpaulin
# PHP: ./vendor/bin/phpunit --coverage-html coverage/
# C#: dotnet test /p:CollectCoverage=true

# Capturar resultados
```

Documente:
```markdown
## Cobertura de Testes

### <repo-1>
- **Cobertura Total**: X%
- **Statements**: X%
- **Branches**: X%
- **Functions**: X%
- **Lines**: X%
- **Arquivos não cobertos**: [lista]

### <repo-2>
[Mesmo formato]
```

### 2. Complexidade do Código

Analise a complexidade ciclomática dos arquivos modificados:

```markdown
## Complexidade do Código

### Arquivos com Alta Complexidade
- **arquivo1.ts**: Complexidade 15 (recomendado: < 10)
- **arquivo2.ts**: Complexidade 12

### Recomendações
- [Sugestão de refatoração 1]
- [Sugestão de refatoração 2]
```

### 3. Qualidade do Código

```bash
# Executar linting (exemplos por stack):
# Node.js: npm run lint / eslint .
# Python: flake8 . / pylint src/
# Java: mvn checkstyle:check
# Go: golangci-lint run
# Ruby: rubocop
# Rust: cargo clippy

# Verificar formatação (exemplos por stack):
# Node.js: prettier --check .
# Python: black --check .
# Java: mvn formatter:validate
# Go: gofmt -l .
# Ruby: rubocop --format-only
# Rust: cargo fmt --check

# Análise estática (exemplos por stack):
# Node.js: npm run analyze (se configurado)
# Python: mypy src/ / bandit -r src/
# Java: mvn pmd:check / spotbugs:check
# Go: go vet ./...
# Ruby: brakeman (para Rails)
# Rust: cargo audit
```

Documente:
```markdown
## Qualidade do Código

### Linting
- **Erros**: 0
- **Warnings**: X
- **Warnings Justificados**: [lista com justificativas]

### Formatação
- **Status**: ✅ Conforme / ⚠️ Ajustes necessários

### Análise Estática
- **Problemas Críticos**: 0
- **Problemas Médios**: X
- **Problemas Baixos**: Y
```

### 4. Performance

Se aplicável, meça performance:

```markdown
## Performance

### Benchmarks
- **Operação X**: Yms (baseline: Zms)
- **Operação Y**: Yms (baseline: Zms)

### Otimizações Aplicadas
- [Otimização 1 e impacto]
- [Otimização 2 e impacto]

### Gargalos Identificados
- [Gargalo 1 e plano de mitigação]
```

### 5. Tamanho e Impacto

```markdown
## Tamanho e Impacto

### Linhas de Código
- **Adicionadas**: +X linhas
- **Removidas**: -Y linhas
- **Modificadas**: Z linhas

### Arquivos
- **Novos**: X arquivos
- **Modificados**: Y arquivos
- **Removidos**: Z arquivos

### Dependências
- **Novas dependências**: [lista]
- **Tamanho do bundle**: +X KB
```

### 6. Dívida Técnica

Identifique dívida técnica introduzida ou resolvida:

```markdown
## Dívida Técnica

### Dívida Introduzida
- **Item 1**: [Descrição e justificativa]
  - Severidade: Alta / Média / Baixa
  - Plano de resolução: [quando e como resolver]

### Dívida Resolvida
- **Item 1**: [O que foi resolvido]
  - Impacto: [melhoria obtida]
```

## 📄 Relatório de Métricas

Crie `./.sessions/<ISSUE-ID>/metrics.md`:

```markdown
# Relatório de Métricas - [ISSUE-ID]

**Data**: [data/hora]
**Repositórios**: [lista]

## Resumo Executivo

- **Cobertura de Testes**: X% (meta: Y%)
- **Qualidade do Código**: ✅ / ⚠️ / ❌
- **Performance**: ✅ / ⚠️ / ❌
- **Dívida Técnica**: Baixa / Média / Alta

## Métricas Detalhadas

[Incluir todas as seções acima]

## Comparação com Baseline

| Métrica | Antes | Depois | Variação |
|---------|-------|--------|----------|
| Cobertura | X% | Y% | +Z% |
| Complexidade Média | X | Y | +Z |
| Bundle Size | X KB | Y KB | +Z KB |

## Ações Recomendadas

1. [Ação 1 - prioridade alta]
2. [Ação 2 - prioridade média]
3. [Ação 3 - prioridade baixa]

## Aprovação para Merge

- [ ] Cobertura de testes >= meta
- [ ] Sem problemas críticos de qualidade
- [ ] Performance dentro dos requisitos
- [ ] Dívida técnica documentada e aprovada
```

## 🎯 Metas de Qualidade

Se o projeto tiver metas definidas nas metaspecs, valide:

```markdown
## Validação contra Metas

### Metas do Projeto
- **Cobertura mínima**: 80%
- **Complexidade máxima**: 10
- **Performance**: < 100ms

### Status
- Cobertura: ✅ 85% (meta: 80%)
- Complexidade: ⚠️ 12 (meta: 10) - Justificado
- Performance: ✅ 85ms (meta: 100ms)
```

## 🚨 Alertas

Se alguma métrica estiver fora do aceitável:
1. 🛑 **DOCUMENTE** o problema
2. 💬 **ALERTE** o usuário
3. 🔧 **PROPONHA** ações corretivas
4. ⏸️ **CONSIDERE** bloquear o merge até resolução

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🎯 Resultado

Após executar este comando, você terá:
- Relatório completo de métricas
- Comparação com baseline e metas
- Identificação de problemas de qualidade
- Recomendações de ações
- Base objetiva para aprovação de merge
