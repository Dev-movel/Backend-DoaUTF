Markdown

# 🚀 API de Usuários: Node.js + PostgreSQL + Docker

Bem-vindo ao repositório da nossa primeira API RESTful modular! Este projeto foi desenvolvido para demonstrar na prática como construir um servidor backend estruturado, conectar a um banco de dados relacional e documentar os *endpoints* de forma profissional.

## 🛠️ Tecnologias Utilizadas
* **Node.js** & **Express.js**: Para o servidor web e roteamento.
* **PostgreSQL**: Banco de dados relacional.
* **Docker & Docker Compose**: Para orquestração da infraestrutura (banco de dados e pgAdmin).
* **Swagger (OpenAPI)**: Para documentação interativa e testes da API.
* **pg**: Driver nativo para comunicação entre Node.js e PostgreSQL.

---

## 📋 Pré-requisitos
Antes de começar, certifique-se de ter as seguintes ferramentas instaladas na sua máquina:
1. [Git](https://git-scm.com/)
2. [Node.js](https://nodejs.org/) (Versão 18 ou superior)
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Rodando em segundo plano)

---

## 💻 Como Rodar o Projeto Passo a Passo

### Passo 1: Clonar o Repositório
Abra o seu terminal e clone este repositório para a sua máquina local:
```bash
git clone https://github.com/Dev-movel/Backend-DoaAi.git
```

### Passo 2: Subir a Infraestrutura (Banco de Dados)
Não precisamos instalar o PostgreSQL no computador! Vamos usar o Docker para baixar e rodar um contêiner pronto com o banco de dados e a interface do pgAdmin. No terminal, execute:

```bash
docker compose up -d
```
A flag -d significa "detached", liberando o seu terminal para o próximo passo. O Postgres estará rodando na porta 5432.

### Passo 3: Instalar as Dependências do Node.js
Agora precisamos baixar as bibliotecas de código (como o Express e o driver do Postgres) que a nossa API utiliza. Execute:

```bash
npm install
```

### Passo 4: Ligar o Servidor Backend
Com o banco rodando e as dependências instaladas, inicie a API. O nosso código já possui uma rotina de inicialização automática: ao ligar, ele verificará o banco de dados e criará a tabela usuarios sozinho caso ela não exista.

```bash
node --watch server.js
```
A flag --watch faz com que o servidor reinicie automaticamente toda vez que você salvar uma alteração no código.

## 🧪 Como Testar a API (Swagger)

A nossa API não tem uma interface visual tradicional (Frontend), mas implementamos o Swagger para facilitar os testes!

Abra o seu navegador e acesse: http://localhost:3000/api-docs

Para Cadastrar um Usuário (POST):

Clique na rota verde POST /usuarios.

Clique no botão "Try it out".

Altere os valores de "nome" e "email" no campo de texto JSON.

Clique em "Execute". Role para baixo e verifique se o Server response retornou código 201.

Para Listar os Usuários (GET):

Clique na rota azul GET /usuarios.

Clique no botão "Try it out" e depois em "Execute".

Você verá a lista de usuários salvos vindo diretamente do banco de dados!
