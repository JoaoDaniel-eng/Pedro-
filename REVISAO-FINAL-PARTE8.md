# Revisão final — Parte 8

Data: 10/11/2026  
Projeto: Bunker Rebellados

## Resultado desta revisão

- Revisada a versão acumulada até a Parte 7, sem iniciar um projeto novo.
- Atualizado o identificador estático dos arquivos e do cache do PWA para `20261110-parte8-revisao`.
- Confirmado que o catálogo público apresenta as quatro categorias comerciais: hambúrgueres, pizzas, porções e bebidas.
- Confirmados os dois destaques e os respectivos arquivos WebP.
- Executada a suíte automatizada: **152 testes aprovados, 0 falhas**.
- Verificada a sintaxe de todos os arquivos JavaScript do servidor, scripts públicos, painel, ferramentas de desenvolvimento e service worker.

## Itens que continuam pendentes de validação externa

1. **PostgreSQL real:** não há conexão com a base de produção neste ambiente. Aplicar/validar as migrações em uma cópia de homologação antes de publicar.
2. **Compra ponta a ponta:** concluir um pedido real de cada categoria em ambiente de teste, incluindo adicionais, edição/cancelamento, cupom, frete/retirada e impressão.
3. **Navegadores e dispositivos:** conferir visualmente desktop, celular, tema claro/escuro e instalação/atualização do PWA.
4. **ESLint:** o comando `npm run lint` não pôde ser executado porque o binário `eslint` não está instalado neste ambiente (`sh: eslint: not found`). Não foi tratado como teste aprovado.
5. **Configuração comercial:** confirmar WhatsApp, horários, bairros/taxas, links sociais, chave Pix e demais dados reais antes da publicação. Os produtos e preços do cardápio são demonstrativos.

## Compatibilidade histórica

Ainda existem referências internas a açaí/trufados em serviços, rotas, testes e registros antigos. Elas não fazem parte das quatro categorias do catálogo público atual. Parte delas está ligada a pedidos históricos e ao mecanismo legado de estoque; removê-las automaticamente poderia quebrar leitura, edição ou cancelamento de pedidos antigos. A limpeza dessas estruturas exige uma migração de dados planejada e backup, portanto foram preservadas nesta revisão.

O arquivo `public/js/app.js` contém código legado que não é carregado pela página principal atual (que usa os módulos em `public/js/site/`). Não deve ser usado como ponto de entrada do site.

## Comandos recomendados antes do deploy

```bash
npm ci
npm test
npm run lint
```

Depois, em homologação com `DATABASE_URL` configurada, iniciar o servidor e executar o roteiro `TESTES-MANUAIS.md` com pedidos de teste. Não executar testes destrutivos diretamente na base de produção.
