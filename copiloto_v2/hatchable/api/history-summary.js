import { db } from "hatchable";
export const access = "member";
export const methods = ["GET"];
const cent = n => Number(n)/100;
function money(c){return Math.round(Number(c))/100;}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const {rows}=await db.query("SELECT trade_date,net_cents,source_note,audit_state FROM official_trading_days ORDER BY trade_date ASC",[]);
 const sessions=rows.map(r=>({
   date: typeof r.trade_date==="string" ? r.trade_date.slice(0,10) : new Date(r.trade_date).toISOString().slice(0,10),
   net_cents:Number(r.net_cents),
   net_brl:money(r.net_cents),
   source:r.source_note,
   state:r.audit_state
 })).filter(r=>r.state==="OFICIAL");
 const wins=sessions.filter(s=>s.net_cents>0),losses=sessions.filter(s=>s.net_cents<0);
 const plus=wins.reduce((a,s)=>a+s.net_cents,0),minus=losses.reduce((a,s)=>a+s.net_cents,0);
 const total=plus+minus, n=sessions.length;
 const sorted=sessions.map(s=>s.net_cents).sort((a,b)=>a-b);
 const median=n?(sorted[Math.floor((n-1)/2)]+sorted[Math.floor(n/2)])/2:0;
 let equity=0,peak=0,drawdown=0;
 for(const s of sessions){equity+=s.net_cents;peak=Math.max(peak,equity);drawdown=Math.max(drawdown,peak-equity);}
 return res.json({
  source:"NOTAS_E_CONTROLE_NOTION",dataset:"EMPRESA_OFICIAL",
  market_price_source:"NONE",is_market_backtest:false,
  note:"Estudo do resultado financeiro de pregões. Não contém preços/horários, nem permite inferir como o WIN se comportou.",
  updated_reference:"2026-10-10",
  operational:"SEM TRADE",canSendOrders:false,
  totals:{sessions:n,positive:wins.length,negative:losses.length,net_brl:money(total),
   mean_brl:n?money(Math.round(total/n)):null,
   median_brl:n?money(median):null,
   mean_positive_brl:wins.length?money(Math.round(plus/wins.length)):null,
   mean_negative_brl:losses.length?money(Math.round(minus/losses.length)):null,
   profit_factor:minus!==0?Number((plus/Math.abs(minus)).toFixed(3)):null,
   drawdown_brl:money(drawdown)},
  sessions
 });
}