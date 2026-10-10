import test from 'node:test';
import assert from 'node:assert/strict';
import {SECURITY, makeSession, stepSession, evaluate, validateFeed} from '../engine.js';
test('modo seguro sem B3 e sem roteamento', ()=>{
  assert.equal(SECURITY.liveEnabled,false);
  assert.equal(SECURITY.routingEnabled,false);
  assert.equal(SECURITY.manualExecutionOnly,true);
});
test('suporta quatro cenários', ()=>{
 for(const mode of ['alta','baixa','lateral','volatil']){
  const s=makeSession(mode); stepSession(s,40); assert.equal(s.events.length,40);
  assert.equal(evaluate(s).operational,'SEM TRADE');
 }
});
test('VWAP ponderada e preços positivos', ()=>{
 const s=stepSession(makeSession('alta'),42);
 const total=s.events.reduce((a,e)=>a+e.price*e.vol,0);
 const qty=s.events.reduce((a,e)=>a+e.vol,0);
 assert.ok(Math.abs(s.vwap-total/qty)<1e-8);
 assert.equal(s.price % 5,0);
});
test('determinístico para mesma semente', ()=>{
 const a=stepSession(makeSession('baixa',42),90);
 const b=stepSession(makeSession('baixa',42),90);
 assert.deepEqual(a.events,b.events);
});
test('invalidação de cenário incorreto e excesso', ()=>{
 assert.throws(()=>makeSession('inexistente'));
 assert.throws(()=>stepSession(makeSession(),9999));
});
test('jamais cria preço de entrada ou stop executável', ()=>{
 for(const mode of ['alta','baixa','lateral','volatil']){
   const p=evaluate(stepSession(makeSession(mode,667),180));
   assert.equal(p.canSendOrders,false);
   assert.equal(p.canSuggestRealTrade,false);
   assert.equal(p.entryPrice,null);
   assert.equal(p.stopPrice,null);
 }
});
test('feed ausente/atrasado/bogus desabilitado', ()=>{
 assert.equal(validateFeed(null),'SEM FEED');
 assert.equal(validateFeed({source:'SINTETICO',connected:true}),'SEM FEED');
 assert.equal(validateFeed({source:'PROFITDLL',connected:true,timestamp:1000},9000),'ATRASADO');
 assert.equal(validateFeed({source:'PROFITDLL',connected:true,timestamp:1000},2000),'NÃO HABILITADO');
});
test('flag de falha de status gera veto adicional', ()=>{
 const p=evaluate(makeSession(),{connectionError:true});
 assert.ok(p.blocks.some(x=>x.includes('Falha')));
});
