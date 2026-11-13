import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from './pool.js';

const migrationVersion = '002_multi_tenant';
const client = await pool.connect();

try {
  await client.query('SELECT pg_advisory_lock($1)', [741905132]);
  const schema = await readFile(resolve(process.cwd(), 'database/schema.sql'), 'utf8');
  await client.query(schema);
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [migrationVersion]);
  if (applied.rowCount === 0) {
    const migration = await readFile(resolve(process.cwd(), 'database/migrations/002_multi_tenant.sql'), 'utf8');
    await client.query(migration);
    await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [migrationVersion]);
    console.log(`Migração ${migrationVersion} aplicada.`);
  } else {
    console.log('Banco de dados já está atualizado.');
  }
} catch (error) {
  console.error('Falha ao preparar o banco de dados:', error);
  process.exitCode = 1;
} finally {
  try { await client.query('SELECT pg_advisory_unlock($1)', [741905132]); } catch {}
  client.release();
  await pool.end();
}
