# Pesquisa GitHub — alternativas para Copiloto WIN 2.0 (10/10/2026)

**Critério:** funcionamento integral em servidor na nuvem; apenas acesso pelo navegador do celular; leitura de dados licenciados B3 e geração de análises/alertas; **execução exclusivamente manual no Profit Mobile**. Sem roteamento de ordens no código Copiloto e sem tocar no simulador Wix/branch `main`.

## Repositórios estudados

1. [diogojrdev/profitdll-wrapper](https://github.com/diogojrdev/profitdll-wrapper) — **principal referência para ingestão Python**. Licença declarada MIT. Inclui `ProfitClient(mode="market_data")`, `examples/01_subscribe_ticker.py`, `02_price_depth.py`, `05_market_data_streamer.py` e ingestão histórica/SQLite. Trabalha sob Windows + DLL proprietária separada + licença Nelogica. **ATENÇÃO:** o pacote também contém API de roteamento e scripts de bot; não copiar/importar o módulo completo em ambiente com conta de trading sem fazer auditoria de superfície. Preferir implementação reduzida com somente símbolos de Market Data, sem funções de ordens e sem credenciais de roteamento. Não executado aqui.
2. [aiev/nelogica-relay-server](https://github.com/aiev/nelogica-relay-server) — servidor TCP nativo Windows para distribuir dados da ProfitDLL. **REJEITADO COMO ESTÁ:** suporta PlaceOrder, ChangeOrder, CancelOrder, ClosePosition e comandos de custódia, além de TCP sem autenticação/TLS. A configuração informa que a presença de senha pode habilitar trading. Não expor na internet; não implantar sem refatoração e auditoria. Versão indicada no README: ProfitDLL 4.0.0.37, anterior ao manual enviado pelo usuário (4.0.0.42).
3. [YouTrade/DLLNelogica](https://github.com/YouTrade/DLLNelogica) — bons exemplos didáticos de callbacks, estado de login e cotações em C#, mas também envia e cancela ordens; útil somente como documentação e referência de testes.
4. [nicksauro/data-downloader](https://github.com/nicksauro/data-downloader) — foco em histórico e backtesting, bancos Parquet/SQLite e qualidade de arquivos; app desktop Windows, não painel mobile e não serve como feed ao vivo completo por si só. Verificar presença de DLL proprietária em repositórios terceiros e termos de licença; **não copiar arquivos binários**.
5. [rlquilez/nelogica-profitdll](https://github.com/rlquilez/nelogica-profitdll) — manual ProfitDLL 4.0.0.42 convertido para Markdown; referência técnica para revisão de ABI/callbacks. Não é coletor nem painel.

## Arquitetura decidida

Servidor privado na nuvem -> modo estritamente Market Data -> fila e motor determinístico -> estados de dados/saúde -> análise com explicações e veto do motor de risco -> dashboard privado HTTPS para celular -> **usuário executa manualmente** no Profit Mobile.

O `profitdll-wrapper` é **referência de implementação**, não dependência já instalada no Copiloto. Não reutilizar scripts com funções de roteamento sem revisão profunda; ideal é um adaptador com *allowlist* exclusivamente read-only. Validar direitos de exibição remota de dados B3/ProfitDLL e custo de VPS antes de qualquer serviço online.

Sem licença verificada, permanecer com replay sintético e CI no GitHub Actions (não serve como servidor de feed 24/7). O projeto existente segue na branch isolada; **nenhuma chamada à ProfitDLL real e nenhuma ordem executada**.

## Passos seguintes

- [ ] Verificar licença DLL Feed vinculada à conta Nelogica e autorização de uso em VPS/nuvem.
- [ ] Inspecionar os métodos e tipos do exemplo oficial enviado e do wrapper, mapear somente callbacks/assinaturas necessários.
- [ ] Criar testes de contrato (estado, tempo, falhas, desconexão, saúde, vencimento) usando fixtures sintéticas.
- [ ] Validar viabilidade de hospedagem privada cloud/Windows x64 *antes* de gastar.
- [ ] Depois construir PWA responsivo somente leitura com alertas condicionais, fonte/timestamp e veto SEM TRADE por padrão.

**Não há, entre os repositórios examinados, uma solução pronta e auditada que forneça simultaneamente DLL Market Data + análise IA + alertas mobile em nuvem + garantias operacionais.** O conjunto de referências acelera a construção, mas não dispensa integração/testes.
