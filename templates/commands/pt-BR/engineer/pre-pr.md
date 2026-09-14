# Preparação para Pull Request

Este comando valida que tudo está pronto para criar Pull Requests.

## 📋 Pré-requisitos

- Implementação completa (todas as tarefas do `/plan` executadas)
- Todos os commits realizados
- Workspace limpo e organizado

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

Garantir que a implementação está completa, testada e pronta para revisão antes de criar os PRs.

## 🛑 CRÍTICO: ONDE TRABALHAR

**⚠️ ATENÇÃO: TODO CÓDIGO (testes, fixes, ajustes) DEVE SER CRIADO DENTRO DO WORKTREE!**

**✅ CORRETO** - Trabalhar dentro do worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/tests/test.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/.eslintrc.js  ✅
```

**❌ ERRADO** - NUNCA criar código fora do worktree:
```
<orchestrator>/.sessions/test.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/test.ts  ❌
{base_path}/<repo-name>/test.ts  ❌ (repositório principal!)
```

**REGRA ABSOLUTA**:
- 🛑 **TODO código** (testes, fixes, configurações) **DEVE estar em** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NUNCA modifique** o repositório principal em `{base_path}/<repo-name>/`
- ✅ **Trabalhe APENAS** dentro do worktree do repositório específico

## ✅ Checklist de Validação

### 1. Completude da Implementação

```markdown
## Verificação de Completude

- [ ] Todas as tarefas do plano foram executadas
- [ ] Todos os requisitos funcionais do PRD foram implementados
- [ ] Todos os critérios de aceitação foram atendidos
- [ ] Nenhuma funcionalidade ficou pela metade
```

### 2. Qualidade do Código

Para cada repositório modificado:

```bash
cd <repositório>

# Verificar status
git status

# Verificar linting (exemplos por stack):
# Node.js: npm run lint / yarn lint / pnpm lint
# Python: flake8 . / pylint src/ / black --check .
# Java: mvn checkstyle:check / gradle check
# Go: golangci-lint run / go vet ./...
# Ruby: rubocop
# Rust: cargo clippy
# PHP: ./vendor/bin/phpcs
# C#: dotnet format --verify-no-changes

# Verificar formatação (exemplos por stack):
# Node.js: npm run format:check / prettier --check .
# Python: black --check . / autopep8 --diff .
# Java: mvn formatter:validate
# Go: gofmt -l . / go fmt ./...
# Ruby: rubocop --format-only
# Rust: cargo fmt --check

# Verificar build (exemplos por stack):
# Node.js: npm run build / yarn build
# Python: python setup.py build
# Java: mvn compile / gradle build
# Go: go build ./...
# Ruby: rake build
# Rust: cargo build
```

Checklist:
```markdown
## Qualidade do Código

### <repo-1>
- [ ] Linting sem erros
- [ ] Formatação correta
- [ ] Build sem erros
- [ ] Sem warnings críticos

### <repo-2>
- [ ] Linting sem erros
- [ ] Formatação correta
- [ ] Build sem erros
- [ ] Sem warnings críticos
```

### 3. Testes

Para cada repositório:

```bash
cd <repositório>

# Executar testes unitários (exemplos por stack):
# Node.js: npm run test:unit / jest / vitest
# Python: pytest tests/unit / python -m unittest
# Java: mvn test / gradle test
# Go: go test ./... -short
# Ruby: rspec spec/unit / rake test:unit
# Rust: cargo test --lib
# PHP: ./vendor/bin/phpunit --testsuite=unit
# C#: dotnet test --filter Category=Unit

# Executar testes de integração (exemplos por stack):
# Node.js: npm run test:integration
# Python: pytest tests/integration
# Java: mvn verify / gradle integrationTest
# Go: go test ./... -run Integration
# Ruby: rspec spec/integration
# Rust: cargo test --test '*'
# PHP: ./vendor/bin/phpunit --testsuite=integration

# Verificar cobertura (exemplos por stack):
# Node.js: npm run test:coverage / jest --coverage
# Python: pytest --cov=src tests/
# Java: mvn jacoco:report / gradle jacocoTestReport
# Go: go test -cover ./...
# Ruby: rspec --coverage
# Rust: cargo tarpaulin
# PHP: ./vendor/bin/phpunit --coverage-html coverage/
```

Checklist:
```markdown
## Testes

### <repo-1>
- [ ] Todos os testes unitários passando
- [ ] Todos os testes de integração passando
- [ ] Cobertura de testes adequada (>= X%)
- [ ] Novos testes adicionados para novas funcionalidades

### <repo-2>
- [ ] Todos os testes unitários passando
- [ ] Todos os testes de integração passando
- [ ] Cobertura de testes adequada (>= X%)
- [ ] Novos testes adicionados para novas funcionalidades
```

### 4. Documentação

```markdown
## Documentação

- [ ] README atualizado (se necessário)
- [ ] Comentários de código adequados
- [ ] Documentação de APIs atualizada (se houver mudanças)
- [ ] Changelog atualizado
- [ ] Documentação técnica atualizada nas metaspecs (se aplicável)
```

### 5. Commits

```markdown
## Commits

- [ ] Todos os commits têm mensagens claras e descritivas
- [ ] Commits seguem o padrão do projeto (conventional commits, etc.)
- [ ] Não há commits com mensagens genéricas ("fix", "update", etc.)
- [ ] Commits estão organizados logicamente
- [ ] Não há commits de debug ou temporários
```

### 6. Sincronização

```markdown
## Sincronização

- [ ] Branches estão atualizadas com a branch base (main/develop)
- [ ] Não há conflitos de merge
- [ ] Mudanças entre repositórios estão sincronizadas
- [ ] Dependências entre repos foram testadas
```

### 7. Segurança

```markdown
## Segurança

- [ ] Não há credenciais ou secrets no código
- [ ] Não há dados sensíveis em logs
- [ ] Dependências de segurança foram verificadas
- [ ] Não há vulnerabilidades conhecidas introduzidas
```

### 8. Performance

```markdown
## Performance

- [ ] Não há regressões de performance óbvias
- [ ] Queries/operações custosas foram otimizadas
- [ ] Não há memory leaks introduzidos
- [ ] Requisitos de performance do PRD foram atendidos
```

## 🔍 Validação Cruzada

Se múltiplos repositórios foram modificados:

```markdown
## Validação Cruzada

- [ ] Testei a integração entre os repositórios localmente
- [ ] APIs/contratos entre repos estão consistentes
- [ ] Não há breaking changes não documentados
- [ ] Ordem de deploy/merge está clara
```

## 📄 Preparação da Descrição do PR

Crie `./.sessions/<ISSUE-ID>/pr-description.md`:

```markdown
## 🎯 Objetivo
[Breve descrição do que esta feature faz]

## 📝 Mudanças Principais
- [Mudança 1]
- [Mudança 2]
- [Mudança 3]

## 🔗 Links
- **Issue**: [ISSUE-ID]
- **PRD**: [link ou caminho]
- **Plano Técnico**: [link ou caminho]

## ✅ Checklist
- [x] Código implementado e testado
- [x] Testes unitários adicionados/atualizados
- [x] Testes de integração passando
- [x] Documentação atualizada
- [x] Linting e formatação OK
- [x] Build sem erros

## 🧪 Como Testar
1. [Passo 1]
2. [Passo 2]
3. [Resultado esperado]

## 🔍 Notas para Revisores
- [Ponto de atenção 1]
- [Ponto de atenção 2]
```

## 🚨 Problemas Encontrados → correção via agentes (mini-orquestração)

Se alguma validação falhar (testes vermelhos, conflito, lint, quebra de contrato, achado
de segurança), **NÃO** marque a tarefa como concluída e **NÃO** siga para o PR. Em vez de
corrigir de forma ad-hoc, comporte-se como o `/orchestrate`: **reabra a sessão e spawne
agentes corretivos**.

1. 🔴 **Reabra a sessão como ATIVA** (para o dashboard mostrar que há trabalho em curso):
   - Em `.sessions/<ISSUE-ID>/state.json`, defina `status:"running"` e atualize `updatedAt`.
     (Se o arquivo não existir — sessão do fluxo antigo — crie um mínimo:
     `{ issueId, title, status:"running", createdAt, updatedAt, waves:[] }`.)
2. 🧩 **Monte um mini-grafo de correção** — um worker por problema/repo impactado, no mesmo
   formato do `/orchestrate` (arquétipos `implementer` para corrigir, `conflict-resolver`
   para conflitos de merge, `tester` para revalidar). Para cada worker crie
   `.sessions/<ISSUE-ID>/workers/<id>.json` com um `name` descritivo do conserto
   (ex.: `fix:back-tests`, `fix:front-contract`), `status:"pending"`, `steps:[]`.
3. 🤖 **Spawne os agentes (Task tool)** em ondas, exatamente como o `/orchestrate`:
   atualize `status`/`currentStep`/`steps[]` de cada worker enquanto trabalham, dentro do
   worktree da sessão (nunca no repo principal). Cada agente corrige seu escopo e roda os testes.
4. ✅ **Só então revalide** (`/pre-pr` de novo): rode a validação completa. Se passar,
   marque os workers como `done`, defina `state.json.status:"done"` e **agora sim** siga
   para o PR. Se ainda falhar, mantenha `running` e repita — a tarefa permanece ATIVA no
   dashboard até estar realmente resolvida.

> Regra de ouro: **enquanto houver conserto pendente, `status` NUNCA é `done`.** A tarefa
> só sai de "ativo" quando tudo passou.

## 📊 Relatório de Validação

Crie `./.sessions/<ISSUE-ID>/pre-pr-report.md`:

```markdown
# Relatório de Validação Pre-PR

**Data**: [data/hora]
**Issue**: [ISSUE-ID]

## Status Geral
✅ Pronto para PR / ⚠️ Pendências / ❌ Bloqueado

## Repositórios Validados
- **<repo-1>**: ✅ OK
- **<repo-2>**: ✅ OK

## Resumo de Testes
- **Testes Unitários**: X/X passando
- **Testes de Integração**: Y/Y passando
- **Cobertura**: Z%

## Pendências (se houver)
- [Pendência 1]
- [Pendência 2]

## Próximos Passos
- [x] Todas as validações passaram
- [ ] Executar `/pr` para criar Pull Requests
```

---

**Argumentos fornecidos**:

```
#$ARGUMENTS
```

---

## 🎯 Próximo Passo

Se todas as validações passaram:

```bash
/pr
```

Este comando criará os Pull Requests para todos os repositórios modificados.
