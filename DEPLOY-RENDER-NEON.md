# Publicar o Bunker Rebellados — Render + Neon

1. Crie um projeto PostgreSQL no [Neon](https://neon.tech/) e copie a connection string com SSL. Use um banco exclusivo do Bunker.
2. Envie esta pasta para um repositório Git. Não envie `.env`, senhas, tokens ou backups.
3. No Render, escolha **New → Blueprint** e conecte o repositório. O `render.yaml` cria o serviço Node com `npm install`, `npm start` e health check em `/api/health`.
4. No serviço, preencha as variáveis marcadas como secretas/não sincronizadas:
   - `BUNKER_DATABASE_URL`: connection string do Neon;
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`: acesso do painel da loja (`/admin`);
   - `DEV_EMAIL` e `DEV_PASSWORD`: acesso separado do desenvolvedor (`/dev`);
   - `WHATSAPP_NUMBER`: número com DDI + DDD, somente números (ex.: `5521999999999`).
5. O `JWT_SECRET` é gerado pelo Blueprint. Guarde-o no Render; não o publique.
6. Faça o deploy e confira `/api/health`. No log, confirme a mensagem `[Bunker] PostgreSQL ativo` e verifique que o banco informado é o banco exclusivo do Bunker.
7. Configure `SITE_URL` com a URL pública do serviço (opcional, mas recomendado para SEO) e conecte o domínio próprio no Render se desejar.

## Estrutura

- `public/`: site do cliente, imagens, CSS, JavaScript, `/admin` e `/dev`.
- `src/`: servidor Express, rotas, autenticação, serviços e integração PostgreSQL.
- `render.yaml`: configuração do serviço no Render.
- `BUNKER_DATABASE_URL`: única variável aceita para o banco; não use `DATABASE_URL` como substituta.

O Neon é o banco externo. O Render hospeda a aplicação Node. O banco e o site devem permanecer independentes do projeto Açaí da Roça.
