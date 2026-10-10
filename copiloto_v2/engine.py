"""Copiloto WIN 2.0: validacao de eventos, metricas e bloqueio seguro.

Somente dados locais/simulados/historicos. Nenhum acesso a corretora,
nenhum feed B3 e nenhuma funcao de envio de ordens.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from math import isfinite
from typing import Iterable
import re

ASSET = re.compile(r"^(WIN|WDO)[FGHJKMNQUVXZ][0-9]{2}$")
MAX_DATA_AGE_SECONDS = 5


@dataclass(frozen=True)
class Trade:
    ticker: str
    instante: datetime
    preco: float
    quantidade: int
    agressor: str
    bid_qty: int | None = None
    ask_qty: int | None = None


def _positive_integer(value: object, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} deve ser inteiro positivo")
    return value


def parse_trade(obj: dict) -> Trade:
    """Interpreta esquema estrito. Timestamp exige fuso horario explicito."""
    if not isinstance(obj, dict):
        raise ValueError("Evento deve ser um objeto JSON")
    ticker = obj.get("ticker")
    if not isinstance(ticker, str) or not ASSET.fullmatch(ticker):
        raise ValueError("Ticker WIN/WDO com vencimento explicito obrigatorio")
    raw_ts = obj.get("instante")
    if not isinstance(raw_ts, str):
        raise ValueError("instante ISO8601 e obrigatorio")
    try:
        timestamp = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("instante ISO8601 invalido") from exc
    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError("instante sem fuso horario nao e aceito")
    raw_price = obj.get("preco")
    if isinstance(raw_price, bool) or not isinstance(raw_price, (int, float)):
        raise ValueError("preco deve ser numero")
    price = float(raw_price)
    if not isfinite(price) or price <= 0:
        raise ValueError("preco deve ser positivo e finito")
    tick = 5 if ticker.startswith("WIN") else 0.5
    if abs(price / tick - round(price / tick)) > 1e-7:
        raise ValueError("preco fora da grade de tick do ativo")
    quantity = _positive_integer(obj.get("quantidade"), "quantidade")
    aggr = obj.get("agressor")
    if aggr not in ("COMPRA", "VENDA", "INDEFINIDO"):
        raise ValueError("agressor deve ser COMPRA, VENDA ou INDEFINIDO")
    bid_qty, ask_qty = obj.get("bid_qty"), obj.get("ask_qty")
    if (bid_qty is None) != (ask_qty is None):
        raise ValueError("bid_qty e ask_qty devem vir juntos")
    if bid_qty is not None:
        bid_qty = _positive_integer(bid_qty, "bid_qty")
        ask_qty = _positive_integer(ask_qty, "ask_qty")
    return Trade(ticker, timestamp.astimezone(timezone.utc), price, quantity, aggr, bid_qty, ask_qty)


def evaluate(events: Iterable[Trade], *, now: datetime | None = None) -> dict:
    """Calcula metricas; NUNCA autoriza operacao real."""
    values = list(events)
    base = {
        "modo": "LABORATORIO_OFFLINE",
        "status": "SEM TRADE",
        "operacao_real_autorizada": False,
        "roteamento_habilitado": False,
        "motivo": "Sem eventos validos",
        "frescor": "DESCONHECIDO",
        "timestamp_utc": None,
        "ticker": None,
        "amostras": len(values),
        "vwap": None,
        "delta_agressor": None,
        "imbalance_livro": None,
        "idade_dados_s": None,
    }
    if not values:
        return base
    if now is None:
        now = datetime.now(timezone.utc)
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("now deve incluir fuso horario")
    now = now.astimezone(timezone.utc)
    first_ticker = values[0].ticker
    if any(v.ticker != first_ticker for v in values):
        return {**base, "motivo": "Ativos misturados: analise bloqueada"}
    if any(a.instante > b.instante for a, b in zip(values, values[1:])):
        return {**base, "motivo": "Eventos fora da ordem cronologica"}
    ts = values[-1].instante
    age = (now - ts).total_seconds()
    if age < 0:
        return {**base, "motivo": "Timestamp no futuro", "frescor": "INVALIDO"}
    total_qty = sum(v.quantidade for v in values)
    vwap = sum(v.preco * v.quantidade for v in values) / total_qty
    delta = sum(v.quantidade * (1 if v.agressor == "COMPRA" else -1 if v.agressor == "VENDA" else 0) for v in values)
    last = values[-1]
    imbalance = round(last.bid_qty / last.ask_qty, 4) if last.bid_qty is not None else None
    return {
        **base,
        "ticker": first_ticker,
        "timestamp_utc": ts.isoformat(),
        "idade_dados_s": round(age, 3),
        "frescor": "ATUAL" if age <= MAX_DATA_AGE_SECONDS else "ATRASADO",
        "vwap": round(vwap, 3),
        "delta_agressor": delta,
        "imbalance_livro": imbalance,
        "motivo": ("Dados de laboratorio sem autenticacao de origem B3 nem travas na corretora. SEM TRADE."
                   if age <= MAX_DATA_AGE_SECONDS else
                   "Dados antigos ou desconectados; SEM TRADE."),
    }
