"""Testes Windows cloud seguros, sem senha e sem executar DLL."""
import contextlib
import io
import json
import pathlib
import sys
import unittest

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from marketdata_probe import Status, from_private_vault, main


class ProbeTests(unittest.TestCase):
    def test_offline_default(self):
        out=io.StringIO()
        with contextlib.redirect_stdout(out):
            rc=main([])
        self.assertEqual(rc,0)
        self.assertEqual(json.loads(out.getvalue())["status"],"OFFLINE")

    def test_requires_three_vault_variables(self):
        with self.assertRaises(ValueError):
            from_private_vault({"PROFITDLL_USERNAME":"fake"})

    def test_only_mock_values(self):
        self.assertEqual(from_private_vault({
            "PROFITDLL_ACTIVATION_KEY":"fake-key",
            "PROFITDLL_USERNAME":"fake-user",
            "PROFITDLL_PASSWORD":"fake-pass",
        }),("fake-key","fake-user","fake-pass"))

    def test_unknown_state_never_ready(self):
        x=Status()
        self.assertFalse(x.view()["handshake_only"])
        self.assertEqual(x.view()["operational"],"SEM TRADE")

    def test_handshake_does_not_authorize_orders(self):
        x=Status()
        for k,v in [(0,0),(2,4),(3,0)]:
            x.update(k,v)
        self.assertFalse(x.view()["handshake_only"])
        x.update_health(0)
        self.assertTrue(x.view()["handshake_only"])
        self.assertFalse(x.view()["order_routing_enabled"])
        self.assertFalse(x.view()["market_event_subscription"])

    def test_market_warning_and_freeze_block(self):
        x=Status()
        for k,v in [(0,0),(2,4),(3,0)]:
            x.update(k,v)
        x.update_health(0)
        x.update(2,5)
        self.assertFalse(x.view()["handshake_only"])
        x.update(2,6)
        self.assertFalse(x.view()["handshake_only"])
        x.update(2,4)
        x.update_health(1)
        self.assertFalse(x.view()["handshake_only"])

    def test_no_routing_symbols_called(self):
        source=pathlib.Path(__file__).resolve().parents[1].joinpath("marketdata_probe.py").read_text(encoding="utf-8")
        for name in ("dll.DLLInitializeLogin", "dll.SendOrder", "dll.SendCancelOrder"):
            self.assertNotIn(name,source)


if __name__ == "__main__":
    unittest.main()
