# NazaGestão IA

ERP SaaS em reconstrução, com API Node.js 20+, Express e PostgreSQL.

## Recursos da fundação
- Login JWT com expiração, seleção de empresa e associação usuário/empresa.
- Papéis por empresa (admin/operator).
- Migração multiempresa preservando os registros legados na empresa de ID 1.
- Isolamento de dados por empresa nas rotas de vendas, estoque e financeiro, reforçado por PostgreSQL Row Level Security.
- Venda transacional: itens, baixa de estoque, histórico e conta a receber.
- Cancelamento transacional com estorno de estoque.
- CI para testes e verificação de sintaxe.

## Instalação local
1. Instale Node.js 20+ e PostgreSQL.
2. Crie um banco vazio e execute `psql "$DATABASE_URL" -f database/schema.sql`.
3. Copie `.env.example` para `.env` e configure DATABASE_URL, CORS_ORIGIN, JWT_SECRET e BOOTSTRAP_SECRET com segredos aleatórios próprios (JWT_SECRET com no mínimo 32 caracteres).
4. Execute `npm install`.
5. Aplique a migração: `psql "$DATABASE_URL" -f database/migrations/002_multi_tenant.sql`.
6. Inicie com `npm run dev` e confira `GET /api/health`.

## Configuração inicial
Faça POST para `/api/auth/bootstrap` com `name`, `email`, `password` (mínimo 12 caracteres), `companyName` e `bootstrapSecret`. Essa rota só funciona enquanto não houver usuários cadastrados. Em seguida, use POST `/api/auth/login` e envie `Authorization: Bearer <token>` nas rotas privadas.

## Rotas disponíveis
- `POST /api/auth/bootstrap`, `POST /api/auth/login`
- `GET /api/auth/companies`, `POST /api/auth/companies`, `POST /api/auth/select-company`
- `GET /api/stock/products`, `POST /api/stock/products`
- `GET /api/stock/movements`, `POST /api/stock/movements`
- `GET /api/sales`, `POST /api/sales`, `POST /api/sales/:id/cancel`
- `GET /api/finance/entries`
- `GET /api/health`

## Limitações que ainda impedem declarar produção
A reconstrução ainda não inclui interface SaaS completa, cadastro/convite de usuários para empresas existentes, CRUD de clientes, fluxo de baixa/pagamento de contas a pagar e receber, planos/assinaturas, recuperação de senha, auditoria administrativa, nem configuração de hospedagem/backup/monitoramento. A migração ainda precisa ser aplicada e validada em um PostgreSQL real com backup. Não use dados reais antes dos testes de integração e revisão de segurança.

Nunca publique o arquivo `.env` nem reutilize segredos de exemplo.
