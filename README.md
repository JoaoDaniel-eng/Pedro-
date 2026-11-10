# Lanchonete — pedidos online e painel administrativo

Mesma estrutura do projeto Açaí da Roça (Node 20 + Express 5 + PostgreSQL, frontend em HTML/CSS/JS puro), enxuta e adaptada para lanchonete.

## Estrutura
- `src/` — `server.js`, `app.js`, `db/` (pool + schema/seed), `routes/` (public, orders, admin), `services/` (pricing, orderCode), `middleware/auth.js`
- `public/` — `index.html`, `admin.html`, `404.html`, `css/`, `js/` (app.js, admin.js), `images/`

## Rodar
1. `cp .env.example .env` e preencha `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WHATSAPP_NUMBER`, `STORE_NAME`.
2. `npm install` → `npm start` → http://localhost:3000 (painel em `/admin`).
3. `npm test` roda os testes de preço.

Tabelas e cardápio de exemplo são criados ao iniciar (edite `MENU` em `src/db/init.js`).

## O que já tem
Cardápio por categoria, carrinho, entrega/retirada, taxa configurável, preço calculado no servidor, código do pedido (LN-XXXXXX), WhatsApp pré-preenchido, acompanhamento por código + telefone, painel com login (JWT), pedidos com troca de status (atualiza a cada 15 s), edição de preço/disponibilidade, abrir/fechar loja.

## Do projeto original que ficou de fora (dá para trazer depois)
Contas de clientes, cupons, fidelidade, avaliações, caixa, relatórios, estoque, backup, painel /dev, PWA offline, impressão térmica.
