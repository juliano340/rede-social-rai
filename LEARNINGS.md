# Aprendizados - Projeto RAI

## Erros e Soluções

### 1. Erro 403 Forbidden ao criar post

**Sintoma:** POST para `/posts` retornava 403 Forbidden

**Causa:** O `AuthGuard` original apenas verificava se `request.user` existia, mas nunca validava o token JWT. O Passport não estava sendo usado corretamente.

**Solução:** Criar um `JwtAuthGuard` que estende o `AuthGuard` do Passport:

```typescript
// auth/guards/auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
```

**Importante:** 
- O `PassportModule.register({ defaultStrategy: 'jwt' })` precisa estar no AuthModule
- O `JwtStrategy` precisa validar o token e retornar o objeto com `userId`
- Os módulos que usam o guard precisam importar o `AuthModule`

---

### 2. Erro de dependência JwtService no AuthGuard

**Sintoma:** `Nest can't resolve dependencies of the AuthGuard (Reflector, ?)`

**Causa:** O AuthGuard global estava sendo usado no UsersModule e PostsModule que não tinham acesso ao JwtService.

**Solução:** Adicionar `AuthModule` como importação nos módulos:

```typescript
// users.module.ts
@Module({
  imports: [AuthModule],  // <-- Precisava disso
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

---

### 3. Erro 500 Internal Server Error ao criar post

**Sintoma:** POST retorna 500, erro no backend

**Causa:** O AuthGuard com Passport não estava configurado corretamente para injetar o JwtService.

**Solução:** Usar a abordagem de herdar do Passport AuthGuard em vez de implementar CanActivate manualmente.

---

### 4. Erros de TypeScript no Angular Frontend

**Sintomas:**
- `Cannot find module './app/interceptors/auth.interceptor'`
- `NG2: Object is possibly 'undefined'`

**Soluções:**
1. Corrigir path relativo no import: `./interceptors/auth.interceptor` (não `./app/...`)
2. Usar `?.[0]` com fallback para evitar erro de undefined:
   ```typescript
   // Errado
   {{ post.author.name?.charAt(0).toUpperCase() }}
   
   // Correto
   {{ (post.author.name?.[0] || '?').toUpperCase() }}
   ```

---

## Lições Aprendidas

### Nest.js + Passport + JWT
1. O AuthGuard deve extender `AuthGuard('jwt')` do Passport
2. O JwtStrategy precisa estar registrado como provider no módulo
3. O PassportModule precisa estar importado com `defaultStrategy: 'jwt'`
4. Ao usar guard global, módulos que precisam de autenticação devem importar AuthModule
5. O método `validate()` no JwtStrategy deve retornar objeto com os dados necessários (ex: `userId`)

### Angular Standalone Components
1. Paths de imports são relativos ao arquivo, não ao projeto
2. Para usar interceptors globais: `provideHttpClient(withInterceptors([authInterceptor]))`
3. Strict mode exige tratamento de null/undefined explícito

### Prisma
1.Relations bidirecionais precisam estar presentes em ambos os modelos
2. Sempre rodar `prisma generate` após mudanças no schema

---

## Debugging

- **401/403 no backend:** Verificar se o token está sendo enviado no header `Authorization: Bearer <token>`
- **Erro de dependência:** Verificar se os módulos têm as dependências necessárias importadas
- **500 no backend:** Ver logs do terminal Nest.js para stack trace completo