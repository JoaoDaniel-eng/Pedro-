# Isolamento do banco — Bunker Rebellados

O servidor do Bunker lê exclusivamente `BUNKER_DATABASE_URL`. Ele não usa `DATABASE_URL` como fallback. Se `BUNKER_DATABASE_URL` não existir, o processo não inicia.

## Configuração no Render

1. Abra o **Web Service do Bunker Rebellados**, não o serviço do Açaí.
2. Em **Settings**, confira o repositório e o **Root Directory**. O Root Directory deve apontar para a pasta `bunker` se ela estiver dentro de um repositório maior; se o repositório contiver diretamente os arquivos do Bunker, deixe vazio.
3. Em **Environment**, configure `BUNKER_DATABASE_URL` com a connection string do banco PostgreSQL exclusivo do Bunker. Não basta criar uma URL diferente: confirme no provedor que ela pertence a uma instância/base distinta.
4. Remova `DATABASE_URL` do serviço Bunker para evitar confusão. A aplicação não a utiliza, mas sua presença pode indicar configuração antiga.
5. Faça **Manual Deploy → Clear build cache & deploy**.
6. Abra os logs de inicialização e procure: `[Bunker] PostgreSQL ativo: database=...; user=...`. O nome exibido precisa ser o banco do Bunker e deve ser diferente do banco usado pelo Açaí.

## Verificação independente

No SQL editor/consola de cada banco, execute:

```sql
SELECT current_database() AS database_name, current_user AS database_user;
```

Compare os resultados. Se o nome do banco for igual, ou se ambos os serviços estiverem ligados à mesma instância/base, ainda não estão isolados. Uma connection string pode ser diferente e mesmo assim apontar para o mesmo banco.

## Cuidados

- Não compartilhe connection strings, senhas ou `JWT_SECRET` em mensagens.
- Não execute exclusões de teste em produção.
- Não altere as variáveis do serviço Açaí para corrigir o Bunker.
- Esta alteração de código não consegue mudar a configuração do Render automaticamente; o serviço precisa receber o deploy deste pacote e a variável correta.
