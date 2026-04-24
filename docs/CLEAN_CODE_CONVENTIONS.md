# Convenções de Clean Code — RAI

## Limites pragmáticos

| Artefato | Limite | Racional |
|----------|--------|----------|
| Componente Angular | 400 linhas | Facilita leitura e testes |
| Função/método | 30 linhas | Uma responsabilidade por função |
| Parâmetros de função | 4 | Mais que isso, use objeto/DTO |
| Nesting de if | 3 níveis | Extraia funções para clareza |

## Nomenclatura

- **Eventos de output**: usar sufixo do verbo no infinitivo + contexto (ex.: `saveEdit`, `deleteReply`, `toggleFollow`)
- **Payloads de evento**: preferir objetos nomeados em vez de parâmetros soltos (ex.: `{ replyId, postId }` em vez de dois argumentos separados)
- **Serviços de estado**: sufixo `StateService` (ex.: `ProfileStateService`, `FeedStateService`)
- **Serviços de API**: sufixo `Service` (ex.: `UsersService`, `PostsService`)

## Tipagem

- **Proibido `any` em novos arquivos**. Exceções precisam de comentário justificativo.
- Use `unknown` quando o tipo for realmente desconhecido, e faça narrowing antes de usar.
- Prefira interfaces sobre types para objetos de dados.
- Use `Prisma.PostGetPayload<...>` para tipagem interna de queries (não crie DTOs duplicados para uso interno).

## Tratamento de erro

- Sempre desligue estados de loading em `error` e `complete`.
- Centralize mensagens de erro comuns em constantes (`ERROR_MESSAGES`).
- Não silencie exceções: logue ou notifique o usuário.

## Regras de PR

1. **Um PR = uma preocupação**. Não misture refactor estrutural com mudança comportamental.
2. Execute `npm run build` no frontend e backend antes de abrir PR.
3. Adicione testes para fluxos críticos afetados.
4. Atualize esta documentação se introduzir novo padrão.

## Decisões aplicadas (Abril 2026)

1. **Paginação unificada**: Todos os endpoints usam cursor (nunca page/limit). Contrato: `{ items[], nextCursor, hasMore }`.
2. **PostEditService como estado central**: Toda lógica de estado de post/reply/interação vive em `PostEditService`, eliminando camada de proxy.
3. **URL validators extraídos**: Lógica de validação de URL pública em `backend/src/common/utils/url-validator.util.ts`.
4. **Template/styles externos**: Componentes acima de 400 linhas de template+styles usam arquivos `.html` e `.scss` separados.
5. **Tipagem estrita**: Proibido `any` em fluxos de edição/like/reply. Tipos `Post` e `Reply` obrigatórios.
