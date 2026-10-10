import {makeSession,stepSession,evaluate} from "../engine.js";
export default function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST")return res.status(405).json({error:"Método não permitido",operational:"SEM TRADE"});
 const body=typeof req.body==="string" ? safeJSON(req.body) : req.body;
 if(!body || !["alta","baixa","lateral","volatil"].includes(body.scenario) ||
    !Number.isInteger(body.steps) || body.steps<0 || body.steps>400 ||
    !Number.isInteger(body.seed) || body.seed<0 || body.seed>4294967295){
  return res.status(400).json({error:"Parâmetros inválidos",operational:"SEM TRADE",canSendOrders:false});
 }
 try{
  const s=makeSession(body.scenario,body.seed);
  stepSession(s,body.steps);
  const a=evaluate(s);
  return res.status(200).json({
   source:"DEMO_SINTETICA", calculatedOn:"CLOUD_SERVERLESS",
   timestamp:new Date().toISOString(), instrument:"WIN - DEMONSTRACAO",
   ...a,
   operational:"SEM TRADE", canSendOrders:false, canSuggestRealTrade:false
  });
 }catch(e){return res.status(500).json({error:"Falha no cálculo",operational:"SEM TRADE",canSendOrders:false})}
}
function safeJSON(str){try{return JSON.parse(str)}catch{return null}}
