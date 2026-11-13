import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const stockRouter = Router();

stockRouter.get('/products', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, sku, name, unit, sale_price, cost_price, stock_quantity, min_stock,
              (stock_quantity <= min_stock) AS low_stock
       FROM products WHERE active = TRUE ORDER BY name`
    );
    response.json({ products: rows });
  } catch (error) {
    next(error);
  }
});

stockRouter.get('/movements', async (request, response, next) => {
  try {
    const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 200);
    const { rows } = await pool.query(
      `SELECT sm.id, sm.product_id, p.name AS product_name, sm.sale_id, sm.movement_type,
              sm.quantity, sm.notes, sm.created_at
       FROM stock_movements sm JOIN products p ON p.id = sm.product_id
       ORDER BY sm.created_at DESC LIMIT $1`,
      [limit]
    );
    response.json({ movements: rows });
  } catch (error) {
    next(error);
  }
});
