export default function handler(req,res){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store, max-age=0");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="GET")return res.status(405).json({error:"Método não permitido"});
  return res.status(200).json({
    ok:true, service:"Copiloto WIN 2.0", processing:"CLOUD_SERVERLESS",
    mode:"LABORATORIO_SINTETICO", marketData:"DESLIGADO",
    provider:"NENHUM", connected:false, licenceVerified:false,
    orderRoutingEnabled:false, realTradeAuthorised:false,
    manualExecutionOnly:true,
    policy:"SEM TRADE", checkedAt:new Date().toISOString()
  });
}
