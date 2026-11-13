import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from './auth.js';

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode=code; return this; }, json(body) { this.body=body; return this; } };
}
test('requireRole permite papel autorizado',()=>{
  let called=false;requireRole('admin')({user:{role:'admin'}},response(),()=>{called=true;});assert.equal(called,true);
});
test('requireRole bloqueia papel sem permissão',()=>{
  const res=response();let called=false;requireRole('admin')({user:{role:'operator'}},res,()=>{called=true;});assert.equal(called,false);assert.equal(res.statusCode,403);
});
