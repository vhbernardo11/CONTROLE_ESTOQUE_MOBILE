import { makeSession, stepSession, evaluate } from "../lib/engine.js";
export const access = "member";
export const methods = ["POST"];
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  const b=typeof req.body==="string" ? safeJSON(req.body) : req.body;
  if(!b || typeof b !== "object" || !["alta","baixa","lateral","volatil"].includes(b.scenario)
     || !Number.isInteger(b.steps) || b.steps<0 || b.steps>400
     || !Number.isInteger(b.seed) || b.seed<0 || b.seed>4294967295){
    return res.status(400).json({error:"Parâmetros inválidos",operational:"SEM TRADE",canSendOrders:false});
  }
  try {
    const s=makeSession(b.scenario,b.seed);
    stepSession(s,b.steps);
    const a=evaluate(s);
    return res.json({
      source:"DEMO_SINTETICA",calculatedOn:"CLOUD_SERVERLESS",
      timestamp:new Date().toISOString(),
      instrument:"WIN — DEMONSTRAÇÃO",
      ...a,operational:"SEM TRADE",
      canSendOrders:false,canSuggestRealTrade:false,
    });
  }catch{
    return res.status(500).json({error:"Falha interna de cálculo",operational:"SEM TRADE",canSendOrders:false});
  }
}
function safeJSON(s){try{return JSON.parse(s)}catch{return null}}