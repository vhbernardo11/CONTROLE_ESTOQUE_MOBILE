export const access="member";
export const methods=["POST"];
const TICK=5;
const allowed=/^WIN[FGHJKMNQUVXZ]\d{2}$/;
const isTick=n=>Math.abs(n/TICK-Math.round(n/TICK))<1e-6;
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const TIME=/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const acceptableDate=s=>{
 if(typeof s!=="string"||!ISO.test(s))return false;
 const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
};
function safeJson(s){try{return JSON.parse(s)}catch{return null}}
const finite=n=>typeof n==="number"&&Number.isFinite(n);
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const body=typeof req.body==="string"?safeJson(req.body):req.body;
 if(!body||!Array.isArray(body.bars)||body.bars.length<2||body.bars.length>1500)
  return res.status(400).json({status:"SEM TRADE",error:"Envie entre 2 e 1500 candles identificados por pregão."});
 const bars=body.bars;
 const buckets=new Map();let previous="";
 for(let i=0;i<bars.length;i++){
  const x=bars[i];
  if(!x||typeof x!=="object"||!acceptableDate(x.date)||
   typeof x.time!=="string"||!TIME.test(x.time)||typeof x.ticker!=="string"||!allowed.test(x.ticker)||
   !["open","high","low","close"].every(k=>finite(x[k])&&x[k]>0&&isTick(x[k]))||
   !Number.isSafeInteger(x.volume)||x.volume<=0||
   x.low>Math.min(x.open,x.close)||x.high<Math.max(x.open,x.close)||x.high<x.low
  )return res.status(400).json({status:"SEM TRADE",error:"Candle inválido, campos ou tick incorreto.",row:i+1});
  const hhmm=x.time.length===5?x.time+":00":x.time;
  if(hhmm<"09:00:00"||hhmm>"18:59:59")return res.status(400).json({status:"SEM TRADE",error:"Horário fora da janela de importação; confira fuso de São Paulo.",row:i+1});
  const key=x.date+"T"+hhmm;
  if(key<=previous)return res.status(400).json({status:"SEM TRADE",error:"Datas e horários repetidos ou fora de ordem.",row:i+1});
  previous=key;
  if(!buckets.has(x.date))buckets.set(x.date,[]);
  buckets.get(x.date).push(x);
 }
 const result=[];
 for(const [date,rows] of buckets){
  const asset=rows[0].ticker;
  if(rows.some(r=>r.ticker!==asset))
   return res.status(400).json({status:"SEM TRADE",error:"Contrato misturado no mesmo pregão.",day:date});
  const allVol=rows.reduce((a,b)=>a+b.volume,0);
  const high=Math.max(...rows.map(r=>r.high)),low=Math.min(...rows.map(r=>r.low));
  const open=rows[0].open,close=rows.at(-1).close;
  const typicalProxy=rows.reduce((a,r)=>a+((r.high+r.low+r.close)/3)*r.volume,0)/allVol;
  const ascending=rows.filter(r=>r.close>r.open).length;
  result.push({date,ticker:asset,number_of_candles:rows.length,
   period_start:rows[0].time,period_end:rows.at(-1).time,
   open,high,low,close,session_movement_points:close-open,
   range_points:high-low,volume_sum:allVol,
   rising_candle_share:Number((ascending/rows.length).toFixed(3)),
   weighted_typical_price_proxy:Number(typicalProxy.toFixed(2)),
   adequate_sample:rows.length>=10});
 }
 return res.json({
  source:"UPLOAD_USUARIO",kind:"CANDLES_HISTORICOS",origin_authenticated:false,
  market_feed_live:false,technical_execution_signal:false,
  disclaimer:"Sem verificação independente da autenticidade, periodicidade ou cobertura dos dados enviados.",
  do_not_infer:["VWAP tick a tick", "agressão e delta reais", "ordens do usuário", "qualidade da estratégia", "recomendação de trade"],
  calculations:"Preço típico por candle ponderado pelo volume é apenas PROXY, não VWAP real.",
  operational:"SEM TRADE",canSendOrders:false,
  total_days:result.length,total_candles:bars.length,days:result
 });
}