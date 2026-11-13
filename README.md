# NazaGestão IA

Sistema de gestão empresarial para **uma única empresa**, com foco inicial em vendas, estoque e financeiro.

## Arquitetura

- API: Node.js 20+ e Express.
- Banco de dados: PostgreSQL.
- Validação de entradas: Zod (a aplicar nas rotas e serviços de domínio).
- Segurança inicial: Helmet, CORS configurável, limite de payload.
- O HTML legado permanece preservado enquanto a interface é reconstruída por etapas.

## Módulos prioritários

1. Vendas: registrar itens, quantidades, preços, descontos e cancelamentos.
2. Estoque: saldo atual e histórico de movimentações.
3. Financeiro: contas a receber/pagar, vencimentos e pagamentos.

Uma venda concluída deverá atualizar venda, itens, estoque e financeiro dentro de uma única transação PostgreSQL. Cancelamentos deverão gerar movimentos de reversão, sem apagar o histórico.

## Executar localmente

1. Instale Node.js 20+ e PostgreSQL.
2. Copie `.env.example` para `.env` e configure `DATABASE_URL`.
3. Crie um banco vazio chamado `nazagestao`.
4. Execute: `psql "$DATABASE_URL" -f database/schema.sql`.
5. Instale dependências: `npm install`.
6. Inicie: `npm run dev`.
7. Verifique `GET /api/health`.

## Estado da reconstrução

Esta é a fundação inicial. Ainda faltam autenticação, rotas e serviços de domínio, testes automatizados, interface nova, migrações versionadas, deploy e validação operacional. Não use em produção até concluir essas etapas.
