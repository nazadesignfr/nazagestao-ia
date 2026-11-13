import { pool } from '../../db/pool.js';

export async function cancelSale(saleId, userId = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const saleResult = await client.query('SELECT id, sale_number, status FROM sales WHERE id = $1 FOR UPDATE', [saleId]);
    if (!saleResult.rowCount) {
      const error = new Error('Venda não encontrada.');
      error.status = 404;
      throw error;
    }
    const sale = saleResult.rows[0];
    if (sale.status === 'cancelled') {
      const error = new Error('Esta venda já está cancelada.');
      error.status = 409;
      throw error;
    }
    const { rows: lines } = await client.query(
      'SELECT product_id, quantity FROM sale_items WHERE sale_id = $1 ORDER BY product_id',
      [saleId]
    );
    for (const line of lines) {
      await client.query('UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2', [line.quantity, line.product_id]);
      await client.query(
        "INSERT INTO stock_movements (product_id, sale_id, movement_type, quantity, notes, created_by) VALUES ($1, $2, 'sale_reversal', $3, $4, $5)",
        [line.product_id, saleId, line.quantity, `Estorno da venda #${sale.sale_number}`, userId]
      );
    }
    await client.query(
      "UPDATE financial_entries SET status = 'cancelled' WHERE sale_id = $1 AND entry_type = 'receivable' AND status = 'open'",
      [saleId]
    );
    await client.query("UPDATE sales SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1", [saleId]);
    await client.query('COMMIT');
    return { id: sale.id, status: 'cancelled', reversedItems: lines.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
