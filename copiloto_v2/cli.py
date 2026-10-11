"""Leitor de replay JSONL; sem rede, credenciais ou ordens."""
import argparse
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
from engine import evaluate, parse_trade


def main() -> int:
    parser = argparse.ArgumentParser(description="Laboratorio read-only Copiloto WIN 2.0")
    parser.add_argument("arquivo", type=Path, help="Replay JSON Lines local")
    parser.add_argument("--replay-clock", action="store_true",
                        help="Simular relogio 2 segundos apos ultimo evento (continua SEM TRADE)")
    args = parser.parse_args()
    try:
        with args.arquivo.open(encoding="utf-8") as file:
            events = [parse_trade(json.loads(line)) for line in file if line.strip()]
        now = events[-1].instante + timedelta(seconds=2) if events and args.replay_clock else datetime.now(timezone.utc)
        report = evaluate(events, now=now)
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        report = {"modo": "LABORATORIO_OFFLINE", "status": "SEM TRADE",
                  "operacao_real_autorizada": False, "roteamento_habilitado": False,
                  "motivo": "Arquivo rejeitado: " + str(exc)}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report.get("ticker") else 2


if __name__ == "__main__":
    raise SystemExit(main())
