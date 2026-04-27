# RAI - Rede Social

## Stack Tecnológico

### Backend
- **Framework:** Nest.js
- **ORM:** Prisma
- **Database:** PostgreSQL (desenvolvimento: SQLite)
- **Autenticação:** JWT + bcrypt

### Frontend
- **Framework:** Angular
- **Estilização:** SCSS / TailwindCSS

### Mobile (futuro)
- **Framework:** Flutter

## Estrutura do Projeto

```
rai/
├── backend/          # API Nest.js
├── frontend/         # Frontend Angular
└── mobile/          # App Flutter (futuro)
```

## Começando

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- PostgreSQL (ou SQLite para desenvolvimento)

### Instalação

Instale as dependências da raiz, do backend e do frontend:

```bash
npm install

cd backend
npm install
npm run prisma:generate
npm run prisma:migrate

cd ../frontend
npm install
```

### Rodando o projeto

Na raiz do projeto, execute backend e frontend juntos com um único comando:

```bash
npm run dev
```

Esse comando inicia:
- Backend: `backend` com `npm run start:dev`
- Frontend: `frontend` com `npm start`

Se precisar rodar separadamente:

```bash
npm run dev:backend
npm run dev:frontend
```

## Funcionalidades

- [x] Cadastro/Login de usuários
- [x] Feed de postagens
- [x] Criar/editar/deletar postagens
- [x] Mídia em postagens (imagem, YouTube)
- [x] Preview de links
- [x] Likes com atualização otimista
- [x] Comentários/respostas
- [x] Respostas aninhadas (nested replies)
- [x] Responder a comentários
- [x] Editar/respostas
- [x] Deletar postagens e respostas
- [x] Perfil do usuário
- [x] Seguir usuários

---

**Última atualização:** Abril 2026
