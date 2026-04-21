# Plano de Refatoração: Feed Comments

## Problema Identificado

Ao clicar no botão de comentários nos posts do feed, os comentários não são carregados. O botão funciona na página **Home** mas não na página **Profile**.

### Causa Raiz

- `PostEditService.toggleReply()` apenas define estado mas não carrega dados da API
- `HomeComponent` tinha uma implementação local que funcionava (porém duplicada)
- `ProfileComponent` usava diretamente o método incompleto do serviço

---

## Código Duplicado Encontrado

| Recurso | Onde | Problema |
|---------|------|----------|
| `loadingReplies = signal(false)` | HomeComponent (linha 1522) | Duplicado - já existe no Service |
| `postReplies = signal<Reply[]>([])` | ProfileComponent (linha 373) | Duplicado - já existe no Service |
| `loadReplies()` method | HomeComponent (linha 1908) | Duplicado - deveria estar no Service |
| `toggleReply()` incompleto | PostEditService | Não carrega os replies |

---

## Solução Proposta: Composable Pattern

### Estrutura de Arquivos

```
src/app/
 ├── composables/
  │   └── use-replies.ts         ← NOVO: Lógica centralizada
  │
  ├── services/
  │   └── post-edit.service.ts  ← Permanece inalterado
  │
  └── pages/
        ├── home/
        │   └── home.component.ts    ← Usa useReplies()
        └── profile/
            └── profile.component.ts ← Usa useReplies()
```

### O que é o useReplies()

Composable (hook) que encapsula toda lógica relacionada a comentários de posts:

```typescript
export function useReplies(postsService: PostsService) {
  // Signals
  const postReplies = signal<Reply[]>([]);
  const loadingReplies = signal(false);
  const replyingToPost = signal<string | null>(null);
  const replyContent = signal('');
  const isSubmittingReply = signal(false);
  const replyingToComment = signal<string | null>(null);
  const replyingToCommentContent = signal('');
  const editingReply = signal<string | null>(null);
  const editReplyContent = signal('');
  const savingReply = signal(false);
  const editingNestedReply = signal<string | null>(null);
  const editNestedReplyContent = signal('');

  // Métodos
  function loadRepliesForPost(postId: string): void { ... }
  function toggleReply(postId: string): void { ... }
  function cancelReply(): void { ... }
  function submitReply(postId: string, content: string): void { ... }
  function toggleReplyToComment(replyId: string): void { ... }
  function cancelReplyToComment(): void { ... }
  function submitReplyToComment(postId: string, replyId: string, content: string): void { ... }
  function startEditReply(reply: Reply): void { ... }
  function cancelEditReply(): void { ... }
  function saveEditReply(postId: string, replyId: string, content: string): void { ... }
  function deleteReply(postId: string, replyId: string): void { ... }
  function startEditNestedReply(reply: Reply): void { ... }
  function cancelEditNestedReply(): void { ... }
  function saveEditNestedReply(postId: string, replyId: string, parentReplyId: string, content: string): void { ... }
  function deleteNestedReply(postId: string, replyId: string, parentReplyId: string): void { ... }

  return {
    // Signals expostos
    postReplies,
    loadingReplies,
    replyingToPost,
    replyContent,
    isSubmittingReply,
    replyingToComment,
    replyingToCommentContent,
    editingReply,
    editReplyContent,
    savingReply,
    editingNestedReply,
    editNestedReplyContent,

    // Métodos expostos
    loadRepliesForPost,
    toggleReply,
    cancelReply,
    submitReply,
    toggleReplyToComment,
    cancelReplyToComment,
    submitReplyToComment,
    startEditReply,
    cancelEditReply,
    saveEditReply,
    deleteReply,
    startEditNestedReply,
    cancelEditNestedReply,
    saveEditNestedReply,
    deleteNestedReply,
  };
}
```

---

## Plano de Implementação (3 Passos)

### Passo 1: Criar o Composable

**Arquivo:** `src/app/composables/use-replies.ts`

Criar novo arquivo com toda lógica de comentários extraída e centralizada.

---

### Passo 2: Refatorar HomeComponent

**Arquivo:** `src/app/pages/home/home.component.ts`

**Mudanças:**
- Remover signal duplicado `loadingReplies`
- Remover método duplicado `loadReplies()`
- Importar e usar `useReplies()`
- Simplificar handlers para usar métodos do composable

---

### Passo 3: Refatorar ProfileComponent

**Arquivo:** `src/app/pages/profile/profile.component.ts`

**Mudanças:**
- Remover signal duplicado `postReplies`
- Importar e usar `useReplies()`
- Simplificar handlers para usar métodos do composable

---

## Resultado Esperado

### Métricas Antes

| Métrica | Valor |
|---------|-------|
| Sinais duplicados | 2 |
| Métodos duplicados | 1 |
| Pontos de manutenção | 3 arquivos |

### Métricas Depois

| Métrica | Valor |
|---------|-------|
| Sinais duplicados | 0 |
| Métodos duplicados | 0 |
| Pontos de manutenção | 1 arquivo (`use-replies.ts`) |

### Benefícios Comprovados

- **Manutenção fácil**: Mudar um lugar afeta Home e Profile automaticamente
- **SRP respeitado**: Cada arquivo tem uma responsabilidade
- **Testável**: Lógica isolada pode ser testada independentemente
- **Reutilizável**: Qualquer novo componente pode usar o composable
- **Robusto**: Se funcionar em um lugar, funciona em todos

---

## Comportamento Garantido

### Antes (Inconsistente)

```
Home: click → toggleReply() + loadReplies() ✅
Profile: click → toggleReply() ❌ (não carrega)
```

### Depois (Consistente)

```
Home: click → useReplies.toggleReply() + useReplies.loadRepliesForPost() ✅
Profile: click → useReplies.toggleReply() + useReplies.loadRepliesForPost() ✅
```

---

## Como Usar em Novos Componentes

```typescript
import { useReplies } from '../../composables/use-replies';
import { PostsService } from '../../services/posts.service';

@Component({ ... })
export class MyComponent {
  private postsService = inject(PostsService);
  replies = useReplies(this.postsService);

  onToggleReplies(postId: string) {
    this.replies.toggleReply(postId);
  }
}
```

---

## Erros de Compilação Detectados Après a Implémentation

### Erro 1: Duplicate member "onCloseReplies"

**Arquivo:** `profile.component.ts`
**Causa:** Método duplicado em duas posições (linhas 473 e 799)
**Correção:** Remover método duplicado (o que usava `postEdit` diretamente)

---

### Erro 2-5: Type Mismatch em Getters

**Arquivo:** `home.component.ts`
**Causa:** Getters retornando Signal em vez de valor (faltava `()`)

| Getter | Linha | Correção |
|-------|-------|----------|
| `replyContent` | 1542 | `this.replies.replyContent()` |
| `replyingToCommentContent` | 1548 | `this.replies.replyingToCommentContent()` |
| `editReplyContent` | 1551 | `this.replies.editReplyContent()` |
| `editNestedReplyContent` | 1560 | `this.replies.editNestedReplyContent()` |

---

### Erro 6-7: Duplicate postsService

**Arquivos:** `home.component.ts`, `profile.component.ts`
**Causa:** Variável declarada duas vezes (uma com `inject()`, outra no constructor)
**Correção:** Remover duplicata do constructor

---

### Erro 8: Type Undefined em formatDate

**Arquivo:** `profile.component.ts`
**Linha:** 125
**Código:** `formatDate(profile()?.createdAt)`
**Erro:** `Type 'undefined' is not assignable to type 'string'`
**Causa:** `profile()?.createdAt` pode retornar `undefined`

**Correção (Best Practice):**
```html
Entrou em {{ formatDate(profile()?.createdAt ?? '') }}
```

**Motivo da escolha:** Não modifica função compartilhada, mantém type safety original.

---

## Problema Pendente: Comentários Não São Exibidos

### Síntese do Problema

O botão de comentário indica que há comentários (contagem correta), mas ao clicar não exibe nenhum conteúdo na seção de comentários.

### Fluxo Esperado (Funcionando Corretamente)

```
1. Usuário clica no botão reply no PostCard
   ↓
2. PostCard emite evento (replyToggle)="post.id"
   ↓
3. Componente pai (Home/Profile) recebe ID no handler
   ↓
4. Chama useReplies.toggleReply(postId)
   ↓
5. toggleReply executa:
   - openReplyForm(postId) → define replyingToPost signal
   - loadRepliesForPost(postId) → faz chamada HTTP
   ↓
6. postsService.getReplies(postId) → HTTP GET para /posts/{id}/replies
   ↓
7. API retorna { replies: [...] }
   ↓
8. postReplies.set(data.replies || [])
   ↓
9. Template verifica @if (replies.replyingToPost() === post.id)
   ↓
10. Se verdadeiro → exibe app-reply-section com [replies]="postReplies()"
```

### Possíveis Causas do Problema

| # | Causa | Descrição | Como Verificar |
|---|------|----------|------------|
| 1 | API retornando array vazio | Network tab mostra response vazio |
| 2 | Signal não observado | console.log no subscribe não executa |
| 3 | Erro HTTP silencioso | Network failed request |
| 4 | Condição @if falhando | replyingToPost não retorna valor esperado |
| 5 | Tipo incompatível | post.id !== replyingToPost() (tipos diferentes) |

---

### Plano de Diagnóstico

#### Passo 1: Verificar Chamada API (Network)

Ferramenta: Chrome DevTools → Network
Filtrar por: `/replies`
Verificar: Request é feito? Response tem dados?

#### Passo 2: Verificar Fluxo no Browser (Console Log Temporário)

Adicionar no composable use-replies.ts temporariamente:

```typescript
const loadRepliesForPost = (postId: string): void => {
  loadingReplies.set(true);
  console.log('[DEBUG] Carregando replies para post:', postId);  // ADD THIS

  postsService.getReplies(postId).subscribe({
    next: (data) => {
      console.log('[DEBUG] Response recebido:', data);  // ADD THIS
      console.log('[DEBUG] Replies array:', data.replies);  // ADD THIS
      postReplies.set(data.replies || []);
      loadingReplies.set(false);
    },
    error: (err) => {
      console.error('[DEBUG] Erro:', err);  // ADD THIS
      loadingReplies.set(false);
    }
  });
};
```

#### Passo 3: Verificar Template Bindings

No template, verificar:
- `[replies]="postReplies()"` → retorna array?
- `[loading]="loadingReplies()"` → signal funciona?
- `@if (replies.replyingToPost() === post.id)` → condição é true?

---

### Correções Identificadas

#### Correção 1: API Response Format

Se `data.replies` está undefined, ajustar:

```typescript
// ANTES (use-replies.ts linha 32):
postReplies.set(data.replies || []);

// DEPOIS:
postReplies.set(data?.replies || data?.data?.replies || []);
```

#### Correção 2: Verificar Tipos

Se condição `@if` falhar, pode ter problema de tipo:

```html
<!-- Verificar se post.id e replyingToPost() são do mesmo tipo -->
@if (replies.replyingToPost() === post.id)
```

Verificar no código:
- `post.id` é `string`?
- `replyingToPost()` retorna `string | null`?

---

### Checklist de Investigação

- [ ] Verificar se request HTTP é feito (Network tab)
- [ ] Verificar resposta da API
- [ ] Adicionar console.log temporário
- [ ] Verificar valores no console
- [ ] Testar correção de formato da resposta
- [ ] Testar em produção

---

## Checklist de Implementação

- [x] Criar `src/app/composables/use-replies.ts`
- [x] Extrair lógica de replies para o composable
- [x] Refatorar `home.component.ts` para usar `useReplies()`
- [x] Refatorar `profile.component.ts` para usar `useReplies()`
- [x] Corrigir erros de compilação (8 erros)
- [ ] Diagnosticar problema de comentários não exibidos
- [ ] Testar aplicação em ambiente de desenvolvimento

---

**Documento criado em:** 2026-04-20
**Atualizado em:** 2026-04-20
**Por:** opencode