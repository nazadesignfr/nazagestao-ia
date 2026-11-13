import { Router } from 'express';
import { z } from 'zod';
import { createSale } from './sales.service.js';

export const salesRouter = Router();

const saleSchema = z.object({
  customerId: z.number().int().positive().nullable().optional(),
  discount: z.number().nonnegative().default(0),
  dueDate: z.string().date().nullable().optional(),
  paymentMethod: z.string().max(30).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative().optional()
  })).min(1),
});

salesRouter.post('/', async (request, response, next) => {
  try {
    const payload = saleSchema.parse(request.body);
    const sale = await createSale(payload);
    response.status(201).json({ sale });
  } catch (error) {
    if (error.name === 'ZodError') {
      return response.status(400).json({ error: 'Dados da venda inválidos.', details: error.issues });
    }
    if (/estoque insuficiente|inválid|não encontrado/i.test(error.message)) {
      return response.status(422).json({ error: error.message });
    }
    next(error);
  }
});
