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

## Implantação inicial (Render + Neon)

O arquivo `render.yaml` descreve a API no plano gratuito do Render. O comando de inicialização executa primeiro `npm run db:migrate`, que prepara o schema e aplica a migração multiempresa uma única vez, com bloqueio no PostgreSQL para evitar duas migrações simultâneas.

1. Crie um projeto PostgreSQL no Neon e copie a connection string com SSL.
2. No Render, conecte este repositório e escolha **Blueprint** para detectar `render.yaml`.
3. Preencha `DATABASE_URL` com a connection string do Neon e `CORS_ORIGIN` com a origem exata do frontend (sem barra no final). Não compartilhe esses valores em mensagens ou no Git.
4. Aguarde o deploy e confirme que `/api/health` retorna `status: ok`.
5. Faça o cadastro inicial usando `POST /api/auth/bootstrap` com o segredo `BOOTSTRAP_SECRET`, guardado nas variáveis privadas do Render. Depois, remova/rotacione o segredo de bootstrap e mantenha-o fora do navegador.

**Importante:** esta configuração publica somente a API. O repositório ainda precisa de uma interface web completa e de testes de integração com PostgreSQL antes de ser considerado um ERP pronto para clientes. O plano gratuito pode suspender o serviço após inatividade; mantenha backups independentes do banco.
