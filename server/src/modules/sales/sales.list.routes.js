import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { cancelSale } from './sales.cancel.js';

export const salesListRouter = Router();

salesListRouter.get('/', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.sale_number, s.customer_id, c.name AS customer_name, s.status,
              s.subtotal, s.discount, s.total, s.created_at, s.cancelled_at
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       ORDER BY s.created_at DESC LIMIT 100`
    );
    response.json({ sales: rows });
  } catch (error) { next(error); }
});

salesListRouter.post('/:id/cancel', async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return response.status(400).json({ error: 'ID de venda inválido.' });
    response.json({ sale: await cancelSale(id, request.user.id) });
  } catch (error) {
    if (error.status) return response.status(error.status).json({ error: error.message });
    next(error);
  }
});
