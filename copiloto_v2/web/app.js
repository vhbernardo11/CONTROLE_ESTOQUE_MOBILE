import {makeSession,stepSession,scenarioLabels,SECURITY} from "./engine.js";
const $=id=>document.getElementById(id);
const pt=n=>Math.round(n).toLocaleString("pt-BR");
const two=n=>String(Math.floor(n)).padStart(2,"0");
const fmtTime=n=>[Math.floor(n/3600)%24,Math.floor(n/60)%60,n%60].map(two).join(":");
const JKEY="copiloto_win_v2_demo_journal_1";
const S={scenario:"alta",seed:18421,steps:0,speed:1,session:makeSession("alta",18421),
  running:false,timer:null,pending:false,lastReq:0,lastCloud:null,lastTechnical:null,
  cloudOnline:false,cloudError:false,notes:readNotes()};
let toastHandle;
function showToast(msg){
 const node=$("toast");node.textContent=msg;node.classList.add("show");
 clearTimeout(toastHandle);toastHandle=setTimeout(()=>node.classList.remove("show"),3500);
}
function readNotes(){try{const v=JSON.parse(localStorage.getItem(JKEY)||"[]");return Array.isArray(v)?v.slice(0,50):[]}catch{return []}}
function saveNotes(){try{localStorage.setItem(JKEY,JSON.stringify(S.notes))}catch{showToast("Anotações não puderam ser salvas neste navegador.")}}
function renderNotes(){
 const box=$("journal");box.replaceChildren();
 if(!S.notes.length){box.className="journal-empty";box.textContent="Nenhuma anotação ainda.";return}
 box.className="";
 for(const rec of S.notes){
  const row=document.createElement("div");row.className="entry";
  const head=document.createElement("strong");head.textContent=new Date(rec.date).toLocaleString("pt-BR");
  const p=document.createElement("p");p.textContent=rec.note;
  const sub=document.createElement("small");sub.textContent=rec.analysis;
  row.append(head,p,sub);box.append(row);
 }
}
function addNote(){
 const note=$("note").value.trim();if(!note){showToast("Escreva uma observação primeiro.");return}
 const analysis=S.lastCloud?.technical||"SEM ANÁLISE";
 S.notes.unshift({date:new Date().toISOString(),note:note.slice(0,800),analysis:analysis+" • DEMONSTRAÇÃO"});
 S.notes=S.notes.slice(0,50);saveNotes();renderNotes();$("note").value="";
 showToast("Anotação salva neste navegador.");
}
function exportCSV(){
 if(!S.notes.length){showToast("Não há anotações para exportar.");return}
 const esc=x=>'"'+String(x).replaceAll('"','""')+'"';
 const data=[["data","anotacao","cenario"].map(esc).join(";"),
 ...S.notes.map(r=>[r.date,r.note,r.analysis].map(esc).join(";"))].join("\r\n");
 const url=URL.createObjectURL(new Blob(["\ufeff",data],{type:"text/csv;charset=utf-8;"}));
 const a=document.createElement("a");a.href=url;a.download="copiloto_win_v2_diario_demo.csv";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function reportText(){
 const a=S.lastCloud;
 if(!a)return "SEM TRADE\nAnálise em nuvem ainda não recebida.\nDados B3: DESLIGADOS.";
 return [
 "COPILOTO WIN 2.0 — SOMENTE DEMONSTRAÇÃO",
 "Cenário: "+scenarioLabels[S.scenario],
 "Fonte: SINTÉTICA (não é B3)",
 "Cálculo: API na nuvem",
 "Preço simulado: "+pt(a.price),
 "VWAP simulada: "+pt(a.vwap),
 "Delta sintético: "+a.delta,
 "Leitura técnica: "+a.technical,
 "Explicação: "+a.reason,
 "Decisão operacional: SEM TRADE",
 "Entrada real: NÃO AUTORIZADA",
 "Execução: EXCLUSIVAMENTE MANUAL, fora deste site.",
 "Motivos: "+a.blocks.join(" | "),
 "Data de cálculo: "+new Date(a.timestamp).toLocaleString("pt-BR")
 ].join("\n");
}
function setRisks(blocks){
 const root=$("risk-list");root.replaceChildren();
 for(const txt of blocks){
  const line=document.createElement("div");line.textContent=txt;root.append(line);
 }
}
function renderCloud(){
 const a=S.lastCloud;
 $("operational").textContent="SEM TRADE";
 $("operational-reason").textContent=S.cloudError?
   "API indisponível: nenhuma leitura de mercado é válida. SEM TRADE.":
   "Dados fictícios e trading real em pausa. Nenhuma operação é autorizada.";
 $("cloud-indicator").textContent="Servidor: "+(S.cloudOnline?"online":"não confirmado");
 $("tech-status").textContent=S.cloudError?"SEM ANÁLISE":(a?.technical||"AGUARDAR");
 $("tech-reason").textContent=S.cloudError?"Serviço de análise inacessível. Nenhum alerta é válido.":(a?.reason||"Inicie o replay para analisar uma amostra.");
 $("calculation-source").textContent=S.cloudError?"FALHA SEGURA":(a?"API NA NUVEM":"Aguardando API cloud");
 $("analysis-clock").textContent=a?.timestamp?new Date(a.timestamp).toLocaleTimeString("pt-BR"):"—";
 $("api-analysis").textContent=S.cloudError?"Falha — seguro":(a?"API de análise ativa":"Não testada");
 setRisks(S.cloudError?["Conexão com API não confirmada.","Sem dados autorizados da B3.","Protocolo de pausa ativo."]:
   (a?.blocks||["Somente dados SINTÉTICOS, sem conexão B3.","Protocolo de pausa ativo."]));
 $("report-text").textContent=reportText();
}
async function checkStatus(){
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6500);
  let res;
  try{res=await fetch("/api/status",{cache:"no-store",signal:controller.signal})}finally{clearTimeout(timeout)}
  if(!res.ok)throw Error("Status HTTP "+res.status);
  const j=await res.json();
  if(j.orderRoutingEnabled!==false||j.realTradeAuthorised!==false||j.marketData!=="DESLIGADO")throw Error("Contrato de segurança inesperado");
  S.cloudOnline=true;
  $("api-status").textContent="ONLINE / SEGURO";
 }catch{
  S.cloudOnline=false;
  $("api-status").textContent="INACESSÍVEL";
 }
 renderCloud();
}
async function cloudAnalysis(){
 if(S.pending)return;
 S.pending=true;
 const signature=S.scenario+"|"+S.seed+"|"+S.steps;
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  let res;
  try{
   res=await fetch("/api/analyze",{method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({scenario:S.scenario,seed:S.seed,steps:S.steps}),
    signal:controller.signal});
  }finally{clearTimeout(timeout)}
  if(!res.ok)throw Error("API recusou dados");
  const data=await res.json();
  if(data.source!=="DEMO_SINTETICA"||data.operational!=="SEM TRADE"||
      data.canSendOrders!==false||data.canSuggestRealTrade!==false)throw Error("Política inválida");
  if(signature!==S.scenario+"|"+S.seed+"|"+S.steps)return; // resposta obsoleta
  const previous=S.lastTechnical;
  S.lastCloud=data;S.cloudError=false;S.cloudOnline=true;
  S.lastTechnical=data.technical;
  if(previous && previous!==data.technical && data.events>20){
   showToast("Leitura DEMO: "+data.technical+". Decisão: SEM TRADE.");
  }
 }catch{
  S.cloudError=true;S.lastCloud=null;S.lastTechnical=null;
 }finally{
  S.pending=false;renderCloud();
 }
}
function renderValues(){
 const s=S.session;
 $("price").textContent=pt(s.price);
 $("change").textContent=(s.price-s.open>=0?"+":"")+pt(s.price-s.open)+" pts · simulado";
 $("vwap").textContent=s.denominator?pt(s.vwap):"—";
 $("distance").textContent=s.denominator?(s.price-s.vwap>=0?"+":"")+pt(s.price-s.vwap)+" pontos da VWAP":"Aguardando";
 $("delta").textContent=s.events.length?(s.lastDelta>=0?"+":"")+pt(s.lastDelta):"—";
 $("aggressor").textContent=s.lastDelta>100?"Simulação compradora":s.lastDelta< -100?"Simulação vendedora":"Sem domínio claro";
 $("imbalance").textContent=s.events.length?s.imbalance.toFixed(2).replace(".",","):"—";
 $("time").textContent=fmtTime(s.second)+" • DEMO";
 $("high").textContent=pt(s.high);
 $("low").textContent=pt(s.low);
 $("samples").textContent=S.steps+" eventos fictícios";
 $("start").disabled=S.running||S.steps>=400;
 $("pause").disabled=!S.running;
 drawChart();
}
function drawChart(){
 const canvas=$("chart");if(!canvas)return;
 const box=canvas.getBoundingClientRect();
 const w=Math.max(320,box.width),h=Math.max(150,box.height),dpr=Math.min(2,window.devicePixelRatio||1);
 const newW=Math.round(w*dpr),newH=Math.round(h*dpr);
 if(canvas.width!==newW||canvas.height!==newH){canvas.width=newW;canvas.height=newH}
 const ctx=canvas.getContext("2d");if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const rows=S.session.events.slice(-140);
 const values=rows.flatMap(x=>[x.price,x.vwap]);
 let lo=values.length?Math.min(...values):187950;
 let hi=values.length?Math.max(...values):188050;
 if(hi-lo<70){hi+=45;lo-=45}else{const extra=(hi-lo)*.14;hi+=extra;lo-=extra}
 const left=15,right=w-52,top=15,bottom=h-25;
 const Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
 ctx.strokeStyle="#29445f";ctx.lineWidth=.65;ctx.font="10px system-ui";ctx.fillStyle="#7492ae";
 for(let i=0;i<=4;i++){const y=top+(bottom-top)*i/4;
  ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
  const p=hi-(hi-lo)*i/4;ctx.fillText(pt(p),right+5,y+3);}
 if(!rows.length){ctx.textAlign="center";ctx.fillStyle="#6f8ba6";ctx.font="13px system-ui";
  ctx.fillText("Inicie um cenário para visualizar o replay",w/2,h/2);ctx.textAlign="left";return}
 for(const [key,color] of [["vwap","#ddb573"],["price","#69b3ff"]]){
  ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=key==="price"?2.25:1.6;
  rows.forEach((row,i)=>{const x=left+i/Math.max(rows.length-1,1)*(right-left),y=Y(row[key]);
   i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
  ctx.stroke();
 }
 const x=right,y=Y(rows.at(-1).price);
 ctx.fillStyle="#84c6ff";ctx.beginPath();ctx.arc(x,y,3.4,0,Math.PI*2);ctx.fill();
}
function reset(){
 S.running=false;clearInterval(S.timer);S.timer=null;
 S.scenario=$("scenario").value;
 S.steps=0;S.session=makeSession(S.scenario,S.seed);S.lastCloud=null;S.cloudError=false;S.lastTechnical=null;
 renderValues();renderCloud();cloudAnalysis();
}
function tick(){
 if(!S.running)return;
 if(S.steps>=400){stop();showToast("Replay concluído. Reinicie para estudar outro cenário.");return}
 const n=Math.min(S.speed,400-S.steps);
 stepSession(S.session,n);S.steps+=n;renderValues();
 if(Date.now()-S.lastReq>1700&&!S.pending){S.lastReq=Date.now();cloudAnalysis()}
}
function start(){
 if(S.running||S.steps>=400)return;
 S.running=true;renderValues();tick();
 S.timer=setInterval(tick,800);
}
function stop(){S.running=false;clearInterval(S.timer);S.timer=null;renderValues();cloudAnalysis()}
function switchScreen(next){
 for(const x of document.querySelectorAll(".screen"))x.classList.toggle("active",x.id==="screen-"+next);
 for(const x of document.querySelectorAll(".nav")){
  const active=x.dataset.target===next;
  x.classList.toggle("active",active);
  if(active)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current");
 }
 window.scrollTo({top:0,behavior:"instant"});
 if(next==="painel")requestAnimationFrame(drawChart);
}
function init(){
 document.querySelectorAll(".nav").forEach(x=>x.addEventListener("click",()=>switchScreen(x.dataset.target)));
 $("start").addEventListener("click",start);
 $("pause").addEventListener("click",stop);
 $("reset").addEventListener("click",()=>{reset();showToast("Replay sintético reiniciado.")});
 $("scenario").addEventListener("change",()=>{reset();showToast("Cenário fictício alterado.")});
 $("speed").addEventListener("change",e=>{S.speed=Number(e.target.value)||1});
 $("save-note").addEventListener("click",addNote);
 $("export").addEventListener("click",exportCSV);
 $("refresh-status").addEventListener("click",checkStatus);
 $("copy-report").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(reportText());showToast("Relatório de demonstração copiado.")}
  catch{showToast("Cópia indisponível neste navegador.");}
 });
 window.addEventListener("resize",drawChart);
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&S.running){stop();showToast("Replay pausado ao sair da tela.");}});
 renderNotes();renderValues();renderCloud();checkStatus();cloudAnalysis();
 setInterval(checkStatus,45000);
}
init();
