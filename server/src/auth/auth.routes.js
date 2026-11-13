import { Router } from 'express';
import { z } from 'zod';
import { bootstrapAdmin, login } from './auth.js';

export const authRouter = Router();

const bootstrapSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(160),
  password: z.string().min(12).max(200),
  bootstrapSecret: z.string().min(1)
});
const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(200)
});

authRouter.post('/bootstrap', async (request, response, next) => {
  try {
    const input = bootstrapSchema.parse(request.body);
    const user = await bootstrapAdmin(input);
    response.status(201).json({ user, message: 'Administrador criado. Faça login para continuar.' });
  } catch (error) {
    if (error.name === 'ZodError') return response.status(400).json({ error: 'Dados inválidos.', details: error.issues });
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    response.json(await login(input));
  } catch (error) {
    if (error.name === 'ZodError') return response.status(400).json({ error: 'Informe e-mail e senha válidos.' });
    next(error);
  }
});
