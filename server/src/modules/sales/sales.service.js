import {withTenant} from '../../db/tenant.js';
export async function createSale({companyId,userId,customerId=null,discount=0,dueDate=null,paymentMethod=null,notes=null,items}){
 return withTenant(companyId,async c=>{
  let subtotal=0;const normalized=[];
  for(const item of items){const quantity=Number(item.quantity);if(!Number.isFinite(quantity)||quantity<=0)throw new Error('Quantidade inválida.');
   const r=await c.query('SELECT id,name,sale_price,cost_price,stock_quantity FROM products WHERE id=$1 AND company_id=$2 AND active=TRUE FOR UPDATE',[item.productId,companyId]);
   if(!r.rowCount)throw new Error('Produto não encontrado ou inativo.');const p=r.rows[0];if(Number(p.stock_quantity)<quantity)throw new Error('Estoque insuficiente para '+p.name+'.');
   const price=item.unitPrice===undefined?Number(p.sale_price):Number(item.unitPrice);if(!Number.isFinite(price)||price<0)throw new Error('Preço inválido.');
   const lineTotal=Number((quantity*price).toFixed(2));subtotal=Number((subtotal+lineTotal).toFixed(2));normalized.push({product:p,quantity,unitPrice:price,lineTotal});
  }
  const d=Number(discount);if(!Number.isFinite(d)||d<0||d>subtotal)throw new Error('Desconto inválido.');const total=Number((subtotal-d).toFixed(2));
  if(customerId){const customer=await c.query('SELECT id FROM customers WHERE id=$1 AND company_id=$2',[customerId,companyId]);if(!customer.rowCount)throw new Error('Cliente não encontrado nesta empresa.');}
  const s=(await c.query("INSERT INTO sales(company_id,customer_id,subtotal,discount,total,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,sale_number,total,created_at",[companyId,customerId,subtotal,d,total,notes,userId])).rows[0];
  for(const l of normalized){await c.query('INSERT INTO sale_items(company_id,sale_id,product_id,product_name,quantity,unit_price,unit_cost,line_total) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[companyId,s.id,l.product.id,l.product.name,l.quantity,l.unitPrice,l.product.cost_price,l.lineTotal]);
   await c.query('UPDATE products SET stock_quantity=stock_quantity-$1,updated_at=NOW() WHERE id=$2 AND company_id=$3',[l.quantity,l.product.id,companyId]);
   await c.query("INSERT INTO stock_movements(company_id,product_id,sale_id,movement_type,quantity,notes,created_by) VALUES($1,$2,$3,'sale',$4,$5,$6)",[companyId,l.product.id,s.id,l.quantity,'Venda #'+s.sale_number,userId]);}
  if(total>0)await c.query("INSERT INTO financial_entries(company_id,sale_id,entry_type,description,amount,due_date,status,payment_method) VALUES($1,$2,'receivable',$3,$4,$5,'open',$6)",[companyId,s.id,'Venda #'+s.sale_number,total,dueDate,paymentMethod]);
  return {...s,subtotal,discount:d,items:normalized.length};
 });
}
