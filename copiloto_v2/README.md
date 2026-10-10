# Copiloto WIN 2.0 — laboratório read-only

**Versão offline, sem feed de bolsa e sem corretora.** Esta pasta é um protótipo separado do simulador existente, publicado anteriormente via Wix. Não altera nenhum dos arquivos da raiz do repositório. Não habilita o envio de ordens.

## O que faz

- Lê eventos JSONL locais com ticker explícito de mini-índice (WIN) ou minidólar (WDO), timestamps com fuso e quantidades positivas.
- Calcula VWAP ponderada, delta por agressor declarado e razão de quantidades bid/ask quando esses campos são fornecidos.
- Rejeita ticker misturado, timestamp sem fuso, eventos fora de sequência, tick inválido e dados no futuro.
- Classifica a idade da última amostra em ATUAL ou ATRASADO.
- Mesmo quando os dados são recentes, retorna sempre **SEM TRADE**, modo LABORATORIO_OFFLINE, roteamento_habilitado=false e operacao_real_autorizada=false.

## Como testar (sem dependências adicionais)

Python 3.10+.

1. Entre na pasta copiloto_v2.
2. Execute: python -m unittest discover -s tests -v
3. Execute: python cli.py examples/ticks_sinteticos.jsonl --replay-clock
4. Repita sem --replay-clock para ver o estado ATRASADO.

O relógio do replay testa apenas o status de frescor; **não é informação real de mercado**. Nenhum resultado autoriza trading.

## Quando houver licença

A ProfitDLL não está incluída aqui. O futuro conector deve carregar Win64/ProfitDLL.dll, inicializar **somente** DLLInitializeMarketLogin, aguardar confirmação de login, dados e ativação, coletar callbacks rapidamente para fila thread-safe e detectar desconexão. Nunca utilizar DLLInitializeLogin nem funções de roteamento neste projeto. Confirmar licenciamento, B3 e permissão de nuvem com a Nelogica antes da implementação.

Para verificar direito de acesso: https://ajuda.nelogica.com.br/hc/pt-br/articles/51583791325211-Como-obter-acesso-%C3%A0-ProfitDLL

**Status: apenas laboratório offline; não integrado, não publicado e não conectado ao mercado.**
