import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine import parse_trade, evaluate

T = datetime(2026, 10, 9, 13, 15, 2, tzinfo=timezone.utc)


def sample(**overrides):
    base = {"ticker": "WINV26", "instante": "2026-10-09T13:15:00Z", "preco": 200000,
            "quantidade": 2, "agressor": "COMPRA", "bid_qty": 140, "ask_qty": 100}
    base.update(overrides)
    return parse_trade(base)


class EngineTests(unittest.TestCase):
    def test_fresh_simulation_never_unlocks_orders(self):
        r = evaluate([sample()], now=T)
        self.assertEqual(r["frescor"], "ATUAL")
        self.assertEqual(r["status"], "SEM TRADE")
        self.assertFalse(r["operacao_real_autorizada"])
        self.assertFalse(r["roteamento_habilitado"])
        self.assertEqual(r["vwap"], 200000)
        self.assertEqual(r["delta_agressor"], 2)
        self.assertEqual(r["imbalance_livro"], 1.4)

    def test_stale_data_blocks(self):
        r = evaluate([sample()], now=T + timedelta(minutes=1))
        self.assertEqual(r["frescor"], "ATRASADO")
        self.assertEqual(r["status"], "SEM TRADE")

    def test_future_timestamp_blocks(self):
        r = evaluate([sample()], now=T - timedelta(minutes=1))
        self.assertEqual(r["frescor"], "INVALIDO")
        self.assertEqual(r["status"], "SEM TRADE")

    def test_missing_book_is_none_not_fabricated(self):
        r = evaluate([sample(bid_qty=None, ask_qty=None)], now=T)
        self.assertIsNone(r["imbalance_livro"])

    def test_two_events_weighted_vwap_and_delta(self):
        a = sample()
        b = sample(instante="2026-10-09T13:15:01Z", preco=200010, quantidade=1, agressor="VENDA")
        r = evaluate([a, b], now=T)
        self.assertAlmostEqual(r["vwap"], 200003.333, places=3)
        self.assertEqual(r["delta_agressor"], 1)

    def test_out_of_order_and_mixed_assets_block(self):
        a = sample()
        b = sample(instante="2026-10-09T13:14:59Z")
        self.assertIn("ordem", evaluate([a, b], now=T)["motivo"])
        wdo = sample(ticker="WDOV26", preco=5700.5)
        self.assertIn("misturados", evaluate([a, wdo], now=T)["motivo"])

    def test_bad_input_is_rejected(self):
        cases = [{"instante": "2026-10-09T13:15:00"}, {"quantidade": -2},
                 {"preco": 200003}, {"ticker": "WINFUT"}, {"agressor": "?"},
                 {"bid_qty": 50, "ask_qty": None}]
        for change in cases:
            with self.subTest(change=change), self.assertRaises(ValueError):
                sample(**change)

    def test_no_events_is_safe(self):
        r = evaluate([], now=T)
        self.assertEqual(r["status"], "SEM TRADE")
        self.assertIsNone(r["vwap"])


if __name__ == "__main__":
    unittest.main()
