import test from 'node:test';
import assert from 'node:assert/strict';
import analyze from '../api/analyze.js';
import status from '../api/status.js';
function makeResponse(){
 const headers={}; const out={code:200,headers,data:null};
 const res={
   setHeader:(k,v)=>{headers[k]=v;return res},
   status:n=>{out.code=n;return res},
   json:obj=>{out.data=obj;return res}
 };
 return {res,out};
}
test('cloud service always disallows live trading',()=>{
 const {res,out}=makeResponse();status({method:'GET'},res);
 assert.equal(out.code,200);
 assert.equal(out.data.orderRoutingEnabled,false);
 assert.equal(out.data.realTradeAuthorised,false);
 assert.equal(out.data.marketData,'DESLIGADO');
});
test('cloud analyzes demo but never authorizes entry',()=>{
 const {res,out}=makeResponse();
 analyze({method:'POST',body:{scenario:'alta',seed:100,steps:110}},res);
 assert.equal(out.code,200);
 assert.equal(out.data.calculatedOn,'CLOUD_SERVERLESS');
 assert.equal(out.data.operational,'SEM TRADE');
 assert.equal(out.data.canSendOrders,false);
 assert.equal(out.data.entryPrice,null);
 assert.ok(Number.isFinite(out.data.vwap));
});
test('cloud rejects malformed and excessive input',()=>{
 for(const body of [{scenario:'alta',steps:401,seed:5},{scenario:'routing',steps:4,seed:3},{},null]){
  const {res,out}=makeResponse();
  analyze({method:'POST',body},res);
  assert.equal(out.code,400);
  assert.equal(out.data.operational,'SEM TRADE');
 }
});
test('cloud disallows GET for analysis',()=>{
 const {res,out}=makeResponse();
 analyze({method:'GET'},res);
 assert.equal(out.code,405);
});
