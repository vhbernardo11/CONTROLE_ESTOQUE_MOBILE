const $=id=>document.getElementById(id);
const brl=n=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const pts=n=>(n>0?"+":"")+Number(n).toLocaleString("pt-BR")+" pts";
const nd=(str)=>str.split("-").reverse().join("/");
let official=null;
function el(tag,text,cl){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cl)x.className=cl;return x}
function createCell(row,text,cl){const td=el("td",text,cl);row.append(td);return td}
async function getOfficial(){
 try{
  const response=await fetch("/api/history-summary",{cache:"no-store"});
  if(!response.ok)throw new Error("Acesso indisponível ("+response.status+"). Entre com a conta do projeto.");
  const j=await response.json();
  if(j.dataset!=="EMPRESA_OFICIAL"||j.market_price_source!=="NONE"||j.operational!=="SEM TRADE")throw new Error("Resposta não atende ao contrato de segurança.");
  official=j;
  $("net").textContent=brl(j.totals.net_brl);$("net").classList.add("negative");
  $("days").textContent=j.totals.sessions;
  $("mean-win").textContent=brl(j.totals.mean_positive_brl);
  $("mean-loss").textContent=brl(j.totals.mean_negative_brl);
  const t=j.totals;
  $("diagnosis").textContent=t.positive+" pregões positivos, "+t.negative+" negativos. Média geral "+brl(t.mean_brl)+". Fator entre soma de ganhos/soma de perdas: "+(t.profit_factor??"—")+". Maior queda acumulada a partir de topo: "+brl(t.drawdown_brl)+".";
  $("official-state").textContent=j.note;
  const tbody=$("table-days");tbody.replaceChildren();
  for(const day of [...j.sessions].reverse()){
   const tr=el("tr");
   createCell(tr,nd(day.date));
   createCell(tr,brl(day.net_brl),day.net_brl<0?"negative":"positive");
   createCell(tr,day.source);
   tbody.append(tr);
  }
  draw(j.sessions);
 }catch(e){
  $("diagnosis").textContent="Não foi possível carregar os resultados: "+e.message;
  $("table-days").textContent="Histórico indisponível; nenhum valor será estimado.";
  $("net").textContent="—";
 }
}
function draw(sessions){
 const svg=$("equity");svg.replaceChildren();if(!sessions.length)return;
 const NS="http://www.w3.org/2000/svg";
 const make=(name,attrs)=>{const n=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));svg.append(n);return n};
 const cum=[0];for(const s of sessions)cum.push(cum.at(-1)+s.net_cents);
 let min=Math.min(0,...cum),max=Math.max(0,...cum);
 const extra=Math.max(10000,(max-min)*.15);min-=extra;max+=extra;
 const X=i=>24+i/(cum.length-1)*545,Y=v=>175-(v-min)/(max-min)*139;
 for(let i=0;i<4;i++){const y=31+i*48;make("line",{x1:24,y1:y,x2:569,y2:y,stroke:"#2a4561","stroke-width":1})}
 make("line",{x1:24,y1:Y(0),x2:569,y2:Y(0),stroke:"#d1b070","stroke-dasharray":"5 4","stroke-width":1});
 make("polyline",{points:cum.map((c,i)=>X(i)+","+Y(c)).join(" "),stroke:"#ff8c96","stroke-width":2.7,fill:"none","stroke-linejoin":"round"});
 for(const i of [0,cum.length-1]){
  make("circle",{cx:X(i),cy:Y(cum[i]),r:3,fill:"#ff8c96"});
 }
 let txt=make("text",{x:26,y:199,fill:"#99b2cb","font-size":12});txt.textContent="15/09";
 txt=make("text",{x:520,y:199,fill:"#99b2cb","font-size":12});txt.textContent="09/10";
}
function parseNumber(x){
 const raw=String(x).trim().replace(/\s/g,"");
 if(!raw)return NaN;
 if(raw.includes(",")){
  if(!/^-?[\d.]+,\d+$/.test(raw))return NaN;
  return Number(raw.replaceAll(".","").replace(",","."));
 }
 if(!/^-?\d+(?:\.\d+)?$/.test(raw))return NaN;
 return Number(raw);
}
function parseFile(content){
 if(content.charCodeAt(0)===0xFEFF)content=content.slice(1);
 const lines=content.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const headers=["data","hora","ativo","abertura","maxima","minima","fechamento","volume"];
 const head=lines.shift()?.split(";").map(x=>x.trim().toLowerCase());
 if(JSON.stringify(head)!==JSON.stringify(headers))throw Error("Cabeçalho incorreto. Use o modelo CSV vazio.");
 if(!lines.length||lines.length>1500)throw Error("São aceitos de 1 a 1500 registros no arquivo.");
 const bars=[];
 for(let i=0;i<lines.length;i++){
  const cols=lines[i].split(";").map(x=>x.trim());
  if(cols.length!==8)throw Error("Linha "+(i+2)+" não possui 8 colunas.");
  const [date,time,ticker,...values]=cols;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error("Data inválida na linha "+(i+2));
  if(!/^\d{2}:\d{2}(:\d{2})?$/.test(time))throw Error("Hora inválida na linha "+(i+2));
  const [open,high,low,close,vol]=values.map(parseNumber);
  if(![open,high,low,close,vol].every(Number.isFinite)||!Number.isSafeInteger(vol))throw Error("Número inválido na linha "+(i+2));
  bars.push({date,time,ticker,open,high,low,close,volume:vol});
 }
 return bars;
}
function compare(days){
 const box=$("market-insight");box.replaceChildren();
 const title=el("h2","Comparação com nossos pregões oficiais");box.append(title);
 if(!official){box.append(el("p","Os resultados da EMPRESA não foram carregados. Os candles foram analisados separadamente.","small"));return}
 let matched=0;
 for(const day of days){
  const r=official.sessions.find(x=>x.date===day.date);
  const p=el("p");
  if(!r){p.textContent=nd(day.date)+": candles importados, mas sem resultado financeiro oficial vinculado.";box.append(p);continue}
  matched++;
  p.textContent=nd(day.date)+" — mercado: movimento abertura→fechamento "+pts(day.session_movement_points)+
  "; EMPRESA: "+brl(r.net_brl)+". Esses dois números não provam causalidade nem o que você fez intradia.";
  box.append(p);
 }
 if(matched===0)box.append(el("p","Sem datas coincidentes com os 17 pregões registrados.","small"));
}
function showMarket(data){
 if(data.operational!=="SEM TRADE"||data.canSendOrders!==false||data.source!=="UPLOAD_USUARIO"||data.market_feed_live!==false)throw Error("Resposta não atende à política sem ordens.");
 $("market-report").hidden=false;
 $("m-days").textContent=data.total_days;$("m-candles").textContent=data.total_candles;
 const tbody=$("table-market");tbody.replaceChildren();
 for(const day of data.days){
  const tr=el("tr");createCell(tr,nd(day.date)+" "+day.ticker);
  createCell(tr,pts(day.session_movement_points),day.session_movement_points<0?"negative":"positive");
  createCell(tr,pts(day.range_points));createCell(tr,day.number_of_candles);
  tbody.append(tr);
 }
 compare(data.days);$("market-report").scrollIntoView({behavior:"smooth"});
}
async function analyze(){
 const file=$("file").files?.[0];if(!file){$("upload-status").textContent="Escolha um arquivo CSV primeiro.";return}
 if(file.size>500000){$("upload-status").textContent="Arquivo acima do limite de 500 KB.";return}
 const button=$("analyze-file");button.disabled=true;
 $("upload-status").textContent="Verificando arquivo e enviando para análise cloud...";
 try{
  const bars=parseFile(await file.text());
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),12000);
  let resp;
  try{resp=await fetch("/api/history-candles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bars}),cache:"no-store",signal:ctrl.signal})}
  finally{clearTimeout(timeout)}
  const data=await resp.json();
  if(!resp.ok)throw Error((data.error||"Arquivo rejeitado")+(data.row?" (linha "+(data.row+1)+")":""));
  showMarket(data);
  $("upload-status").textContent="Análise concluída na nuvem: "+data.total_days+" dias e "+data.total_candles+" candles. Dados não armazenados.";
 }catch(e){$("upload-status").textContent="Não foi possível analisar: "+e.message;}
 finally{button.disabled=false}
}
function template(){
 const h="data;hora;ativo;abertura;maxima;minima;fechamento;volume\n";
 const url=URL.createObjectURL(new Blob(["\ufeff",h],{type:"text/csv;charset=utf-8"}));
 const a=el("a");a.href=url;a.download="modelo_historico_win_vazio.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
$("analyze-file").addEventListener("click",analyze);
$("download-template").addEventListener("click",template);
getOfficial();