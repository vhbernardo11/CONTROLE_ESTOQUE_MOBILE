import test from "node:test";
import assert from "node:assert/strict";
import status,{access as statusAccess,methods as statusMethods} from "../api/status.js";
import analyze,{access as analyzeAccess,methods as analyzeMethods} from "../api/analyze.js";
import {makeSession,stepSession,evaluate} from "../lib/engine.js";

function makeRes(){
 const out={code:200,data:null,headers:{}};
 const res={
  status(n){out.code=n;return this},
  setHeader(k,v){out.headers[k.toLowerCase()]=v;return this},
  json(v){out.data=v;return this}
 };
 return {out,res};
}
test("endpoints exigem colaborador e restringem métodos",()=>{
 assert.equal(statusAccess,"member");
 assert.deepEqual(statusMethods,["GET"]);
 assert.equal(analyzeAccess,"member");
 assert.deepEqual(analyzeMethods,["POST"]);
});
test("status impede dados e roteamento reais",async()=>{
 const {res,out}=makeRes();
 await status({method:"GET"},res);
 assert.equal(out.code,200);
 assert.equal(out.data.marketData,"DESLIGADO");
 assert.equal(out.data.orderRoutingEnabled,false);
 assert.equal(out.data.realTradeAuthorised,false);
 assert.equal(out.data.policy,"SEM TRADE");
});
test("replay é reconstruído matematicamente no backend",async()=>{
 const {res,out}=makeRes();
 await analyze({method:"POST",body:{scenario:"alta",steps:120,seed:18421}},res);
 assert.equal(out.code,200);
 assert.equal(out.data.calculatedOn,"CLOUD_SERVERLESS");
 const session=stepSession(makeSession("alta",18421),120);
 assert.equal(out.data.vwap,evaluate(session).vwap);
 assert.equal(out.data.delta,evaluate(session).delta);
 assert.equal(out.data.source,"DEMO_SINTETICA");
});
test("nunca oferece ordem nem preço executável",async()=>{
 for(const scenario of ["alta","baixa","lateral","volatil"]){
  const {res,out}=makeRes();
  await analyze({method:"POST",body:{scenario,steps:160,seed:77}},res);
  assert.equal(out.data.operational,"SEM TRADE");
  assert.equal(out.data.canSendOrders,false);
  assert.equal(out.data.canSuggestRealTrade,false);
  assert.equal(out.data.entryPrice,null);
  assert.equal(out.data.stopPrice,null);
 }
});
test("parâmetros inválidos são recusados, sem exceções",async()=>{
 for(const body of [null,{}, {scenario:"alta",steps:999,seed:1},
   {scenario:"routing",steps:5,seed:1},
   {scenario:"alta",steps:10,seed:1.5}]){
   const {res,out}=makeRes();
   await analyze({method:"POST",body},res);
   assert.equal(out.code,400);
   assert.equal(out.data.operational,"SEM TRADE");
 }
});
