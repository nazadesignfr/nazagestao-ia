import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';

const secret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.');
  }
  return process.env.JWT_SECRET;
};

export async function bootstrapAdmin({ name, email, password, bootstrapSecret }) {
  if (!process.env.BOOTSTRAP_SECRET || bootstrapSecret !== process.env.BOOTSTRAP_SECRET) {
    const error = new Error('Credencial de configuração inválida.');
    error.status = 403;
    throw error;
  }
  const count = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (count.rows[0].count > 0) {
    const error = new Error('O usuário administrador já foi configurado.');
    error.status = 409;
    throw error;
  }
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, LOWER($2), $3, 'admin') RETURNING id, name, email, role",
    [name, email, hash]
  );
  return rows[0];
}

export async function login({ email, password }) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash, role, active FROM users WHERE email = LOWER($1)',
    [email]
  );
  const user = rows[0];
  if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error('E-mail ou senha inválidos.');
    error.status = 401;
    throw error;
  }
  const token = jwt.sign({ sub: String(user.id), role: user.role }, secret(), { expiresIn: '8h', issuer: 'nazagestao-ia' });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export function requireAuth(request, response, next) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = jwt.verify(token, secret(), { issuer: 'nazagestao-ia' });
    request.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    response.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ error: 'Você não tem permissão para esta operação.' });
    }
    next();
  };
}
