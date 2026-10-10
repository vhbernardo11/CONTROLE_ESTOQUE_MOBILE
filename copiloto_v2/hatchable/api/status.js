export const access = "member";
export const methods = ["GET"];
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 return res.json({
   ok:true,service:"Copiloto WIN 2.0",processing:"CLOUD_SERVERLESS",
   mode:"LABORATORIO_SINTETICO",marketData:"DESLIGADO",
   provider:"NENHUM",connected:false,licenceVerified:false,
   orderRoutingEnabled:false,realTradeAuthorised:false,
   manualExecutionOnly:true,policy:"SEM TRADE",
   checkedAt:new Date().toISOString()
 });
}