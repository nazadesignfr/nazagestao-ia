import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const financeRouter = Router();

financeRouter.get('/entries', async (request, response, next) => {
  try {
    const status = ['open', 'paid', 'cancelled'].includes(request.query.status) ? request.query.status : null;
    const { rows } = await pool.query(
      `SELECT id, sale_id, entry_type, description, amount, due_date, paid_at, status, payment_method, created_at
       FROM financial_entries
       WHERE ($1::text IS NULL OR status = $1)
       ORDER BY due_date NULLS LAST, created_at DESC LIMIT 200`,
      [status]
    );
    response.json({ entries: rows });
  } catch (error) {
    next(error);
  }
});
