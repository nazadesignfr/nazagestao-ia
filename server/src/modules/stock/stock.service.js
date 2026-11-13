import { pool } from '../../db/pool.js';

export async function moveStock({ productId, quantity, type, notes = null, userId = null }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id, name, stock_quantity FROM products WHERE id = $1 AND active = TRUE FOR UPDATE',
      [productId]
    );
    if (!rows.length) {
      const error = new Error('Produto não encontrado ou inativo.');
      error.status = 404;
      throw error;
    }
    const current = Number(rows[0].stock_quantity);
    const next = type === 'entry' ? current + quantity : current + quantity;
    if (next < 0) {
      const error = new Error('A saída não pode deixar o estoque negativo.');
      error.status = 422;
      throw error;
    }
    await client.query('UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2', [next, productId]);
    const movementType = type === 'entry' ? 'entry' : 'adjustment';
    await client.query(
      'INSERT INTO stock_movements (product_id, movement_type, quantity, notes, created_by) VALUES ($1, $2, $3, $4, $5)',
      [productId, movementType, Math.abs(quantity), notes || (type === 'entry' ? 'Entrada manual' : 'Ajuste manual'), userId]
    );
    await client.query('COMMIT');
    return { productId, previousQuantity: current, stockQuantity: next };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
