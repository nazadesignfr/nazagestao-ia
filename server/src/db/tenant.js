import { pool } from './pool.js';

// Cada operação de negócio recebe um contexto transacional de empresa.
// O PostgreSQL aplica RLS e nega acesso quando o contexto não está definido.
export async function withTenant(companyId, operation) {
  if (!Number.isSafeInteger(Number(companyId)) || Number(companyId) <= 0) throw new Error('Contexto de empresa inválido.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_company_id', $1, true)", [String(companyId)]);
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
