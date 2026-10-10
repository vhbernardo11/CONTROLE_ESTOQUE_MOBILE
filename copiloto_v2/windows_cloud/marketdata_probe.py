"""Sonda Market Data em Windows x64: sem ordens e sem dados pessoais em logs.

Modo padrão OFFLINE. A conexão exige --connect, ambiente Windows 64 bits,
um pacote oficial privado, credenciais no COFRE do executor e licença cloud.
Não utilizar credenciais compartilhadas em conversas/chat.
"""
import argparse
import ctypes
import json
import os
import platform
import sys
import time
from pathlib import Path
from threading import RLock

CONFIG = ("PROFITDLL_ACTIVATION_KEY", "PROFITDLL_USERNAME", "PROFITDLL_PASSWORD")
READY_LOGIN = (0, 0)
READY_MARKET = (2, 4)
READY_LICENSE = (3, 0)


def from_private_vault(environ=None):
    env = environ if environ is not None else os.environ
    values = [env.get(k, "") for k in CONFIG]
    if not all(isinstance(v, str) and v.strip() for v in values):
        raise ValueError("Segredos de conexão não foram configurados no cofre privado")
    return tuple(values)


class Status:
    def __init__(self):
        self.lock = RLock()
        self.states = {}
        self.health = None
        self.events = 0

    def update(self, kind, value):
        with self.lock:
            self.states[int(kind)] = int(value)
            self.events += 1

    def update_health(self, value):
        with self.lock:
            self.health = int(value)

    def view(self):
        with self.lock:
            ready = (self.states.get(0) == 0 and
                     self.states.get(2) == 4 and
                     self.states.get(3) == 0 and
                     self.health == 0)
            return {
                "login_ok": self.states.get(0) == 0,
                "market_ok": self.states.get(2) == 4,
                "activation_ok": self.states.get(3) == 0,
                "health_responsive": self.health == 0,
                "last_market_state": self.states.get(2),
                "handshake_only": bool(ready),
                "operational": "SEM TRADE",
                "order_routing_enabled": False,
                "market_event_subscription": False,
            }


def main(argv=None):
    cli = argparse.ArgumentParser()
    cli.add_argument("--dll", help="Caminho privado Win64/ProfitDLL.dll")
    cli.add_argument("--connect", action="store_true",
                     help="Tentativa EXPLÍCITA de autenticação somente leitura")
    cli.add_argument("--timeout", type=int, default=45)
    args = cli.parse_args(argv)
    if not args.connect:
        print(json.dumps({"status": "OFFLINE", "operational": "SEM TRADE",
                          "order_routing_enabled": False,
                          "reason": "Nenhum login sem --connect"}))
        return 0
    if platform.system() != "Windows" or sys.maxsize < 2**32:
        print(json.dumps({"status": "BLOQUEADO", "reason": "Requer Windows Python x64"}))
        return 2
    if os.environ.get("PROFITDLL_CLOUD_APPROVED") != "yes":
        print(json.dumps({"status": "BLOQUEADO",
                          "reason": "Falta autorização explícita do ambiente cloud"}))
        return 2
    if not args.dll or not 5 <= args.timeout <= 120:
        print(json.dumps({"status": "BLOQUEADO", "reason": "Caminho ou tempo inválido"}))
        return 2
    p = Path(args.dll).expanduser().resolve()
    if not p.is_file() or p.name.lower() != "profitdll.dll" or p.parent.name.lower() != "win64":
        print(json.dumps({"status": "BLOQUEADO", "reason": "DLL privada Win64 ausente"}))
        return 2
    try:
        key, login, password = from_private_vault()
    except ValueError:
        print(json.dumps({"status": "BLOQUEADO", "reason": "Cofre incompleto"}))
        return 2

    from ctypes import WinDLL, WINFUNCTYPE
    callback_type = WINFUNCTYPE(None, ctypes.c_int, ctypes.c_int)
    health_type = WINFUNCTYPE(None, ctypes.c_int)
    status = Status()

    @callback_type
    def on_state(kind, result):
        status.update(kind, result)

    @health_type
    def on_health(result):
        status.update_health(result)

    started = False
    try:
        dll = WinDLL(str(p))
        dll.DLLInitializeMarketLogin.argtypes = [
            ctypes.c_wchar_p, ctypes.c_wchar_p, ctypes.c_wchar_p,
            callback_type, *([ctypes.c_void_p] * 7)
        ]
        dll.DLLInitializeMarketLogin.restype = ctypes.c_int
        dll.SetHealthCallback.argtypes = [health_type]
        dll.SetHealthCallback.restype = ctypes.c_int
        dll.GetHealthStatus.argtypes = [ctypes.POINTER(ctypes.c_int)]
        dll.GetHealthStatus.restype = ctypes.c_int
        dll.DLLFinalize.argtypes = []
        dll.DLLFinalize.restype = ctypes.c_int

        # Nenhuma inscrição ticker; nenhuma função ou callback de ordens.
        result = dll.DLLInitializeMarketLogin(
            key, login, password, on_state,
            None, None, None, None, None, None, None
        )
        if result != 0:
            print(json.dumps({"status": "INICIALIZACAO_REJEITADA",
                              "return_code": int(result),
                              "operational": "SEM TRADE"}))
            return 3
        started = True
        if dll.SetHealthCallback(on_health) != 0:
            print(json.dumps({"status": "BLOQUEADO", "reason": "Monitor de saúde indisponível"}))
            return 3
        until = time.monotonic() + args.timeout
        while time.monotonic() < until:
            health = ctypes.c_int(-1)
            if dll.GetHealthStatus(ctypes.byref(health)) == 0:
                status.update_health(health.value)
            current = status.view()
            if current["handshake_only"]:
                print(json.dumps({
                    "status": "HANDSHAKE_VALIDADO",
                    "note": "Sem ticker, sem ticks reais e sem autorizar ordens",
                    **current
                }))
                return 0
            time.sleep(0.1)
        print(json.dumps({"status": "TIMEOUT_SEM_VALIDACAO", **status.view()}))
        return 3
    except (AttributeError, OSError, ValueError):
        print(json.dumps({"status": "FALHA_TECNICA",
                          "reason": "Biblioteca incompatível ou indisponível",
                          "operational": "SEM TRADE"}))
        return 4
    finally:
        if started:
            try:
                dll.DLLFinalize()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
