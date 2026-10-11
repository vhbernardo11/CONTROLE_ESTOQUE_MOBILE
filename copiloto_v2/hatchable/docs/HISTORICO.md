# Histórico Copiloto WIN 2.0 (10/10/2026)
Nova tela protegida no celular: https://copiloto-win-20-api.hatchable.site/historico.html

Duas fontes DISTINTAS:
- EMPRESA: resultados oficiais líquidos por dia confirmados no Notion, lidos da tabela privada `official_trading_days` via `GET /api/history-summary`. As linhas oficiais **não estão neste GitHub público**; foram carregadas somente no banco privado Hatchable. Não representam comportamento do mercado.
- MERCADO: candles OHLCV importados explicitamente pelo usuário via CSV, enviados sob login ao `POST /api/history-candles` e analisados temporariamente no servidor. **Não são persistidos**. Sem arquivo real importado, não há leitura técnica de pregões anteriores.
- O CSV segue `data;hora;ativo;abertura;maxima;minima;fechamento;volume`; ISO AAAA-MM-DD, hora São Paulo HH:mm:ss, WINV26 etc, tick 5 pontos, inteiro positivo volume.
- Com candles é possível descrever amplitude, movimento de abertura a fechamento e volume, mas NÃO calcular delta agressor verdadeiro nem VWAP tick a tick. Proxy do preço típico ponderado é rotulado como tal.
- APIs são restritas a colaboradores (Hatchable private). Todo o fluxo permanece em `SEM TRADE`, sem envio/alteração/cancelamento de ordens. Conexão real com B3/ProfitDLL ainda NÃO foi feita.

Próxima fase: confirmada a licença de Market Data e uso de nuvem, coletor Windows x64 privado via `DLLInitializeMarketLogin` e `GetHistoryTrades` dia a dia, com `THistoryTradeCallback` e `TProgressCallback`. Ver documentação oficial: https://ajuda.nelogica.com.br/hc/pt-br/articles/11973319153563-Como-requisitar-trades-hist%C3%B3ricos-com-a-ProfitDLL
