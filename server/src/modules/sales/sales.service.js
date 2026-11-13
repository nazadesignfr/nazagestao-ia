import { pool } from '../../db/pool.js';

export async function createSale({ customerId = null, discount = 0, dueDate = null, paymentMethod = null, notes = null, items, userId = null }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let subtotal = 0;
    const normalized = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantidade inválida.');

      const result = await client.query(
        'SELECT id, name, sale_price, cost_price, stock_quantity FROM products WHERE id = $1 AND active = TRUE FOR UPDATE',
        [item.productId]
      );
      if (!result.rowCount) throw new Error(`Produto ${item.productId} não encontrado ou inativo.`);
      const product = result.rows[0];
      if (Number(product.stock_quantity) < quantity) throw new Error(`Estoque insuficiente para ${product.name}.`);

      const unitPrice = item.unitPrice === undefined ? Number(product.sale_price) : Number(item.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('Preço inválido.');
      const lineTotal = Number((quantity * unitPrice).toFixed(2));
      subtotal = Number((subtotal + lineTotal).toFixed(2));
      normalized.push({ product, quantity, unitPrice, lineTotal });
    }

    const finalDiscount = Number(discount);
    if (!Number.isFinite(finalDiscount) || finalDiscount < 0 || finalDiscount > subtotal) throw new Error('Desconto inválido.');
    const total = Number((subtotal - finalDiscount).toFixed(2));

    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, subtotal, discount, total, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, sale_number, total, created_at`,
      [customerId, subtotal, finalDiscount, total, notes, userId]
    );
    const sale = saleResult.rows[0];

    for (const line of normalized) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, unit_cost, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, line.product.id, line.product.name, line.quantity, line.unitPrice, line.product.cost_price, line.lineTotal]
      );
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2',
        [line.quantity, line.product.id]
      );
      await client.query(
        `INSERT INTO stock_movements (product_id, sale_id, movement_type, quantity, notes, created_by)
         VALUES ($1, $2, 'sale', $3, $4, $5)`,
        [line.product.id, sale.id, line.quantity, `Venda #${sale.sale_number}`, userId]
      );
    }

    if (total > 0) {
      await client.query(
        `INSERT INTO financial_entries (sale_id, entry_type, description, amount, due_date, status, payment_method)
         VALUES ($1, 'receivable', $2, $3, $4, 'open', $5)`,
        [sale.id, `Venda #${sale.sale_number}`, total, dueDate, paymentMethod]
      );
    }

    await client.query('COMMIT');
    return { ...sale, subtotal, discount: finalDiscount, items: normalized.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
