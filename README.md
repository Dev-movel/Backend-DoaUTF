# Backend — DoaUTF

API RESTful para o aplicativo DoaUTF, plataforma de doação entre alunos da UTFPR.

## Tecnologias

- **Node.js** + **Express.js**
- **PostgreSQL** (via Docker)
- **JWT** para autenticação
- **Nodemailer** (Gmail SMTP) para envio de e-mails
- **Swagger** para documentação interativa
- **WebSocket** para chat em tempo real

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/products/docker-desktop/) rodando em segundo plano
- Conta Google com **senha de app** habilitada (para envio de e-mails)

---

## Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/Dev-movel/Backend-DoaUTF.git
cd Backend-DoaUTF
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Servidor
PORT=3000

# Banco de dados (deve bater com o docker-compose.yml)
DB_USER=vic
DB_PASS=admin
DB_NAME=doautf_db
DB_HOST=localhost
DB_PORT=6123

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_aqui

# E-mail (Gmail SMTP)
MAIL_USER=seu_email@gmail.com
MAIL_PASS=sua_senha_de_app_google   # Não é a senha normal — veja abaixo
MAIL_FROM=DoaUTF <seu_email@gmail.com>

# URL do frontend (usada nos links enviados por e-mail)
# Atualize com a porta atual do frontend sempre que reiniciá-lo
FRONTEND_URL=http://localhost:PORTA_DO_FRONTEND
```

> **Como gerar a senha de app do Google:**
> Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crie uma senha de app para "Email" e cole em `MAIL_PASS`.

### 4. Subir o banco de dados

```bash
docker compose up -d
```

Isso sobe o PostgreSQL na porta `6123` e o pgAdmin na porta `6124`.

- **pgAdmin:** http://localhost:6124 — login: `admin@admin.com` / senha: `admin`
- Servidor no pgAdmin: host `db`, porta `5432`, usuário `vic`, senha `admin`

---

## Rodando o projeto

```bash
node --watch server.js
```

Na inicialização, o servidor automaticamente:
1. Conecta ao banco de dados
2. Cria todas as tabelas (se não existirem)
3. Inicializa o sistema de e-mail (Gmail SMTP)
4. Inicia o cron job de expiração de agendamentos (a cada hora)
5. Inicia o servidor WebSocket para chat

Acesse a documentação interativa em: **http://localhost:3000/api-docs**

---

## Migrations manuais

Algumas tabelas exigem migration manual (caso não sejam criadas automaticamente pelo `initDatabase`):

```bash
psql -U vic -h localhost -p 6123 -d doautf_db -f src/migrations/001_create_auth.sql
psql -U vic -h localhost -p 6123 -d doautf_db -f src/migrations/002_create_avaliacoes.sql
```

Isso cria/atualiza as tabelas: `email_verification`, `refresh_token`, `password_reset_token` e índices relacionados.

---

## Seed (dados iniciais)

Para popular o banco com dados de exemplo:

```bash
npm run seed
```

---

## Estrutura do projeto

```
src/
├── app.js                  # Configuração do Express e rotas
├── config/
│   ├── db.js               # Pool de conexão com o PostgreSQL
│   ├── mailer.js           # Configuração do Gmail SMTP (nodemailer)
│   └── swagger.js          # Configuração do Swagger
├── controllers/            # Lógica de negócio dos endpoints
├── database/
│   ├── initDatabase.js     # Criação automática das tabelas no startup
│   ├── schemas/            # Definições SQL de cada tabela
│   └── seed.js             # Script de dados iniciais
├── middlewares/            # Auth, upload, etc.
├── migrations/             # SQLs de alterações no banco
├── routes/                 # Definição das rotas da API
├── services/               # Serviços (notificações, etc.)
├── utils/                  # Utilitários gerais
└── websocket/              # Chat em tempo real (WebSocket)
server.js                   # Entry point — inicializa tudo
```

---

## Observações

- O `FRONTEND_URL` no `.env` precisa ser atualizado sempre que o frontend mudar de porta (ex: ao reiniciar o servidor de desenvolvimento). Ele é usado nos links enviados por e-mail (redefinição de senha).
- O sistema de e-mail falha silenciosamente se `MAIL_USER` ou `MAIL_PASS` estiverem incorretos — verifique os logs do servidor na inicialização pela mensagem `✅ Gmail SMTP pronto para envio`.
