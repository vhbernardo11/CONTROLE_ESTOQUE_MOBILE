// Copiloto WIN 2.0 — motor de demonstração determinístico, SEM ordem/sem B3.
export const SECURITY = Object.freeze({
  mode: "SINTETICO", liveEnabled: false, routingEnabled: false,
  manualExecutionOnly: true, realSignalsEnabled: false, sessionPaused: true
});
const ROUND = n => Math.round(n / 5) * 5;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const ST = Object.freeze({
  alta: {bias: 4.0, noise: 17, pull: 0.025},
  baixa: {bias: -4.0, noise: 17, pull: 0.025},
  lateral: {bias: 0, noise: 23, pull: 0.090},
  volatil: {bias: 0, noise: 75, pull: 0.014}
});
export const scenarioLabels = Object.freeze({
  alta: "Tendência de alta", baixa: "Tendência de baixa",
  lateral: "Mercado lateral", volatil: "Volatilidade elevada"
});
export function makeSession(scenario="alta", seed=18421) {
  if (!Object.hasOwn(ST, scenario)) throw new Error("Cenário inválido");
  return { scenario, seed: seed >>> 0, price: 188000, open: 188000,
    vwap: 188000, numerator: 0, denominator: 0, second: 36900,
    high: 188000, low: 188000, lastDelta: 0, imbalance: 1,
    events: [], state: "AGUARDAR", updated: null };
}
function random01(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function randNorm(s) {
  return (random01(s)+random01(s)+random01(s)+random01(s)-2) * 1.73;
}
export function stepSession(s, steps=1) {
  const c = ST[s.scenario];
  if (!c) throw new Error("Cenário inválido");
  if (!Number.isInteger(steps) || steps < 0 || steps > 500) throw new Error("Passos inválidos");
  for (let i=0; i<steps; i++) {
    const noise = randNorm(s) * c.noise;
    const correction = (s.vwap - s.price) * c.pull;
    const old = s.price;
    const move = c.bias + noise + correction;
    s.price = Math.max(1000, ROUND(old + move));
    const volume = 5 + Math.floor(random01(s)*65 + Math.abs(move)*0.55);
    const aggr = s.price > old ? 1 : s.price < old ? -1 : (random01(s)>.5?1:-1);
    s.numerator += s.price * volume;
    s.denominator += volume;
    s.vwap = s.numerator / s.denominator;
    s.second += 1;
    s.high = Math.max(s.high, s.price);
    s.low = Math.min(s.low, s.price);
    s.events.push({price:s.price,vwap:s.vwap,vol:volume,sign:aggr,t:s.second});
    if (s.events.length>220) s.events.shift();
    const w=s.events.slice(-30);
    s.lastDelta=w.reduce((a,e)=>a+e.vol*e.sign,0);
    s.imbalance=clamp(1+s.lastDelta/4000+(random01(s)-.5)*0.14,.35,2.6);
  }
  return s;
}
export function evaluate(s, extra={}) {
  const d=s.price-s.vwap;
  const v=s.high-s.low;
  let technical="AGUARDAR", reason="Aguardando alinhamento de tendência, VWAP e agressão.";
  if(s.events.length < 20){reason="Amostra insuficiente para avaliação.";}
  else if(s.scenario==="volatil" || v>950){technical="SEM SETUP";reason="Volatilidade incompatível com cenário de baixa exposição.";}
  else if(d>55 && s.lastDelta>150 && s.imbalance>1.07){technical="ALTA SIMULADA";reason="Preço acima da VWAP, delta e book simulados favoráveis à alta.";}
  else if(d< -55 && s.lastDelta< -150 && s.imbalance<.93){technical="BAIXA SIMULADA";reason="Preço abaixo da VWAP, delta e book simulados favoráveis à baixa.";}
  else if(Math.abs(d)<40){reason="Preço próximo da VWAP; sem confirmação de direção.";}
  const blocks = ["Somente dados SINTÉTICOS, sem conexão B3.", "Protocolo de pausa do trading real ativo."];
  if(extra.connectionError)blocks.unshift("Falha no serviço de status — operação bloqueada.");
  return Object.freeze({
    technical, reason, operational:"SEM TRADE",
    liveData:false, canSendOrders:false, canSuggestRealTrade:false,
    levelInvalidation:null, entryPrice:null, stopPrice:null, confidence:null,
    blocks, distance:Math.round(d), delta:s.lastDelta,
    imbalance:Number(s.imbalance.toFixed(2)), vwap:Number(s.vwap.toFixed(2)),
    price:s.price, high:s.high, low:s.low, events:s.events.length
  });
}
export function validateFeed(meta, currentMs=Date.now()) {
  // Preparado para futura integração, mas este MVP nunca promove um feed a REAL.
  if (!meta || meta.source!=="PROFITDLL" || meta.connected!==true) return "SEM FEED";
  if (typeof meta.timestamp!=="number" || !Number.isFinite(meta.timestamp)) return "TIMESTAMP INVÁLIDO";
  const age=currentMs-meta.timestamp;
  if(age<0 || age>5000)return "ATRASADO";
  return SECURITY.liveEnabled ? "EM AVALIAÇÃO" : "NÃO HABILITADO";
}