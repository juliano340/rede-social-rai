# 🤖 Prompt para Open Code Go

Use este prompt para passar as tasks ao Open Code Go.

---

## FASE 1: PLAN MODE (Análise & Design)

**Use isto primeiro para validar arquitetura sem committar código:**

```
Projeto: RAI - Rede Social (NestJS + Angular)
Repositório: D:\sandbox\minimax\rai

CONTEXTO:
Estou melhorando a performance de uma rede social. Já tenho análise completa 
em D:\sandbox\minimax\rai\ARCHITECTURE_REVIEW.md e plano detalhado em 
D:\sandbox\minimax\rai\.development\PLANO-ARQUITETURA.md

TAREFA ATUAL (PHASE 1):
Implementar ISSUE #1: N+1 Like Queries (prioridade P0)

ESPECIFICAÇÃO COMPLETA:
Leia: D:\sandbox\minimax\rai\.development\ESPECIFICACOES\ISSUE-1-N1-LIKES.md

MODO: PLAN (não commita ainda, só analisa)

EXECUTE EM PLAN MODE:

1. **Análise Arquitetural**
   - Revise ARCHITECTURE_REVIEW.md seção "ISSUE 1"
   - Valide que encontra os arquivos mencionados (home.component.ts, posts.service.ts)
   - Confirme problema: 20 chamadas separadas isLiked() após feed load

2. **Design Backend**
   - Analise backend/src/posts/posts.service.ts findAll()
   - Desenhe mudança: adicionar isLiked na resposta (não em query separada)
   - Valide: Prisma includes permite { likes: { where: { userId } } }?

3. **Design Frontend**
   - Analise frontend home.component.ts linhas 1618-1626
   - Desenhe: remover forEach com isLiked() e extrair do response
   - Valide: PostResponse DTO pode ter isLiked: boolean

4. **Testes**
   - Enum testes necessários:
     * Backend: findAll() inclui isLiked
     * Frontend: não chama isLiked() endpoint
     * E2E: network tab mostra 1 call (não 21)
   
5. **Riscos & Rollback**
   - Identifique breaking changes
   - Desenhe plano de rollback (zero mudança no schema)

DELIVERABLES:
- Plan file com arquitetura proposta
- Diagram de antes/depois
- Lista de mudanças exatas (files + linhas)
- Teste strategy

IMPORTANTE: Não é pra fazer git commit, só análise.
```

---

## FASE 2: BUILD MODE (Implementação)

**Após validar o plan, use isto para executar:**

```
Projeto: RAI - Rede Social (NestJS + Angular)
Repositório: D:\sandbox\minimax\rai

CONTEXTO:
Plan foi validado. Agora vamos implementar ISSUE #1: N+1 Like Queries

ESPECIFICAÇÃO:
D:\sandbox\minimax\rai\.development\ESPECIFICACOES\ISSUE-1-N1-LIKES.md

MODO: BUILD (execute, teste, commita)

EXECUTE:

1. **Backend Changes**
   - Arquivo: backend/src/posts/posts.service.ts
   - Mudança: Seção "Backend Changes > Backend - Service Layer"
   - Teste: npm test -- posts.service.spec.ts
   - Validar: isLiked incluído, sem raw likes array

2. **Frontend Changes**
   - Arquivo: frontend/src/app/services/posts.service.ts
   - Mudança: Remover isLiked() method (seção spec)
   
   - Arquivo: frontend/src/app/components/home/home.component.ts
   - Mudança: Substituir forEach com isLiked() by extract from response
   - Teste: npm test -- home.component.spec.ts
   - Validar: postLikes signal alimentado do response

3. **E2E Tests**
   - Crie: e2e/like-flow.spec.ts
   - Valide: Network tab mostra 1 /posts call (não 21)

4. **Git Workflow**
   - Branch: feature/issue-1-n1-likes
   - Commits:
     * "backend: include isLiked in post response"
     * "frontend: extract like status from response"
     * "tests: add E2E for like flow"
   - PR: Inclua checklist de CRITERIOS-ACEITACAO.md

ANTES DE PUSH:
- [ ] Todos testes passing (npm test)
- [ ] Build succeeds (npm run build)
- [ ] Network tab: 1 call /posts (não 21)
- [ ] No console errors
- [ ] TypeScript strict mode ok

DELIVERABLES:
- PR aberto com link para D:\sandbox\minimax\rai\.development\CHECKLIST\CRITERIOS-ACEITACAO.md
- Todos ACs marcados como done
- Performance screenshots (antes/depois)
```

---

## 📋 Alternativa: Prompt Genérico (Copy & Paste)

Se preferir um prompt único que ele adapta:

```
**PROJETO:** RAI - Rede Social Improvement
**REPO:** D:\sandbox\minimax\rai

Estou melhorando performance da rede social. Tenho documentação completa em:
- Plano geral: .development/PLANO-ARQUITETURA.md
- Issue atual: .development/ESPECIFICACOES/ISSUE-{N}-*.md
- Testes: .development/TESTES/TESTES-BACKEND.md
- Acceptance Criteria: .development/CHECKLIST/CRITERIOS-ACEITACAO.md

**PRÓXIMA TAREFA:** 
Implementar [ISSUE #1 | #2 | #3 | etc] conforme spec.

**MODO:** [PLAN | BUILD]

**INSTRUÇÕES:**
1. Leia a spec correspondente (.development/ESPECIFICACOES/)
2. Se PLAN: Desenha arquitetura, testes, riscos (sem código)
3. Se BUILD: Implementa backend + frontend + testes, abre PR

**CRITÉRIO DE SUCESSO:**
Todos AC em .development/CHECKLIST/CRITERIOS-ACEITACAO.md passando.
```

---

## 🎯 Recomendação: Qual Modo Usar?

| Cenário | Modo | Por quê |
|---------|------|--------|
| **Primeira vez** | PLAN | Valida arquitetura antes de código |
| **Issue pequena (#1, #4)** | PLAN → BUILD | Rápido, seguro |
| **Issue complexa (#2, #3)** | PLAN → PLAN review → BUILD | Múltiplas PRs, menos risco |
| **Refactor grande (#5, #6)** | PLAN → design → BUILD | Muito impacto, precisa aprovação |

---

## 📌 Meu Conselho

**Comece com PLAN MODE:**

1. ✅ Valida sem comprometer código
2. ✅ Identifica riscos cedo
3. ✅ Alinha arquitetura antes de code
4. ✅ Gera plano para referência futura
5. ✅ Open Code entende escopo exato

**Depois de PLAN aprovado:**

1. Faça BUILD MODE
2. Ele implementa + testa
3. Você traz resultado aqui
4. Cloud Code reavalia metrics

---

## 🚀 Começar Agora

1. **Copie um dos prompts acima**
2. **Substitua {N} pelo número da issue** (1-6)
3. **Cole no Open Code (PLAN MODE primeiro)**
4. **Aguarde plan file**
5. **Revise e aprove**
6. **Passe BUILD MODE**

Qual issue quer começar? #1 é mais simples (2-3 dias), recomendo!
