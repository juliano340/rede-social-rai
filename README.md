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

**Backend:**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
```

## Funcionalidades

- [x] Cadastro/Login de usuários
- [x] Feed de postagens
- [x] Criar postagens
- [x] Perfil do usuário
- [ ] Seguir usuários
- [x] Likes e respostas