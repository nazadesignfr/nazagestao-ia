import express from 'express';import cors from 'cors';import helmet from 'helmet';import {pool} from './db/pool.js';import {requireAuth} from './auth/auth.js';import {authRouter} from './auth/auth.routes.js';import {salesRouter} from './modules/sales/sales.routes.js';import {salesListRouter} from './modules/sales/sales.list.routes.js';import {stockRouter} from './modules/stock/stock.routes.js';import {financeRouter} from './modules/finance/finance.routes.js';
export const app=express();app.disable('x-powered-by');app.use(helmet());app.use(cors({origin:process.env.CORS_ORIGIN?.split(',')??false}));app.use(express.json({limit:'1mb'}));
app.get('/api/health',async(_q,s)=>{try{await pool.query('SELECT 1');s.json({status:'ok',database:'connected'});}catch{s.status(503).json({status:'error',database:'unavailable'});}});
app.use('/api/auth',authRouter);
app.use('/api/sales',requireAuth,salesRouter,salesListRouter);
app.use('/api/stock',requireAuth,stockRouter);
app.use('/api/finance',requireAuth,financeRouter);
app.use((e,_q,s,_n)=>{console.error(e);s.status(e.status||500).json({error:e.status?e.message:'Erro interno do servidor.'});});
