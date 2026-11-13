import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { moveStock } from './stock.service.js';

export const stockRouter = Router();

stockRouter.get('/products', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, sku, name, unit, sale_price, cost_price, stock_quantity, min_stock,
              (stock_quantity <= min_stock) AS low_stock
       FROM products WHERE active = TRUE ORDER BY name`
    );
    response.json({ products: rows });
  } catch (error) { next(error); }
});

stockRouter.post('/products', async (request, response, next) => {
  try {
    const data = z.object({
      sku: z.string().trim().max(60).nullable().optional(),
      name: z.string().trim().min(2).max(160),
      unit: z.string().trim().max(20).default('un'),
      salePrice: z.number().nonnegative().default(0),
      costPrice: z.number().nonnegative().default(0),
      minStock: z.number().nonnegative().default(0)
    }).parse(request.body);
    const { rows } = await pool.query(
      `INSERT INTO products (sku, name, unit, sale_price, cost_price, min_stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sku, name, unit, sale_price, cost_price, stock_quantity, min_stock`,
      [data.sku || null, data.name, data.unit, data.salePrice, data.costPrice, data.minStock]
    );
    response.status(201).json({ product: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') return response.status(400).json({ error: 'Dados inválidos.', details: error.issues });
    if (error.code === '23505') return response.status(409).json({ error: 'Este código SKU já está cadastrado.' });
    next(error);
  }
});

stockRouter.post('/movements', async (request, response, next) => {
  try {
    const data = z.object({
      productId: z.number().int().positive(),
      type: z.enum(['entry', 'exit']),
      quantity: z.number().positive(),
      notes: z.string().max(500).nullable().optional()
    }).parse(request.body);
    response.status(201).json({ movement: await moveStock({ ...data, userId: request.user.id }) });
  } catch (error) {
    if (error.name === 'ZodError') return response.status(400).json({ error: 'Dados inválidos.', details: error.issues });
    if (error.status) return response.status(error.status).json({ error: error.message });
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
       ORDER BY sm.created_at DESC LIMIT $1`, [limit]
    );
    response.json({ movements: rows });
  } catch (error) { next(error); }
});
