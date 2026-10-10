# Copiloto WIN 2.0 — teste Linux gratuito (sem login)

Este laboratório valida **APENAS** se Ubuntu x86_64 consegue criar um prefixo Wine 64-bit e executar **Python Windows x64** com ABI WinDLL/WINFUNCTYPE compatível com o pré-requisito básico da ProfitDLL.

A Nelogica publicou tutorial oficial: https://ajuda.nelogica.com.br/hc/pt-br/articles/54973527417243-ProfitDLL-no-Linux-Saiba-como-acessar-e-utilizar

## Motivo da mudança

Evitar comprar Windows cloud sem necessidade. A DLL permanece Windows x64, porém pode rodar num servidor Linux x86_64 com Wine. **Não equivale a Python Linux carregando DLL diretamente** e requer licença válida e permissão contratual para uso na nuvem.

## Como rodar, do celular

GitHub Actions -> "Copiloto WIN 2.0 - Linux Wine teste gratuito (SEM LOGIN)" -> "Run workflow" na branch `feature/copiloto-v2-marketdata-readonly-20261010`.

O workflow:
- Instala o Wine disponível no Ubuntu runner (para teste preliminar, **não** o WineHQ 11 do tutorial de referência);
- Cria prefixo Win64 temporário, sem root e sem persistência;
- Baixa **somente Python Windows x64 público** e verifica ABI de 64 bits;
- **Não importa nem executa ProfitDLL.dll**, não acessa Nelogica/B3, não lê nenhum segredo;
- Não depende de senhas, CPF, ativação nem códigos 2FA.
- Finaliza automaticamente; **não é hospedagem contínua**.

## Depois do teste

Se o teste passar, este resultado confirma apenas o **pré-requisito ABI** e possibilidade técnica preliminar; **não valida DLL 4.0.0.42, estabilidade de callbacks, rede Market Data, licença, memória disponível numa instância gratuita ou permissão de nuvem**.

Para 24/7 candidato: Oracle Cloud Always Free **AMD x86_64**, até duas instâncias micro de 1 GB/1/8 OCPU (fonte oficial: https://docs.oracle.com/pt-br/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm). Viabilidade de Wine+ProfitDLL nessa configuração **desconhecida**. A versão ARM tem mais memória, mas Wine x64 **não roda diretamente** em ARM.

Outros: Google e2-micro Free Tier x86_64 em regiões selecionadas dos EUA (https://docs.cloud.google.com/free/docs/free-cloud-features?hl=pt-BR). Consumo de CPU, memória, rede e B3 precisa ser testado sem riscos financeiros.

**Custo desta ação: R$ 0 de recursos adicionais dentro dos limites de GitHub Actions de repositório público.** Nunca instalar DLL proprietária ou credenciais em runners públicos efêmeros como teste de conveniência. O usuário só opera manualmente no Profit Mobile.

### Painel já existente

- Wix mobile DEMO: https://headless-bqqbnhthrag-vhbernardo11-140c.wix-site-host.com
- Hatchable histórico privado: https://copiloto-win-20-api.hatchable.site/historico.html
- Simulador original: mantido sem mudanças.

### Alternativas estudadas

- https://github.com/diogojrdev/profitdll-wrapper — wrapper Python Windows com `mode="market_data"` mas contém API de ordens, não incorporar sem auditoria e isolamento.
- https://www.youtube.com/watch?v=qNUIdvr6TbI — Edgard Matos demonstra ProfitDLL, ativação e SubscribeTicker no Windows; não prova Wine.
- https://www.youtube.com/watch?v=FiwFIG9wFKc — Cherry Servers demonstra instalação Wine no Ubuntu 24.04; não prova ProfitDLL.
- A B3 fornece boletins de consulta via site, mas proíbe coleta automatizada de páginas, inclusive por IA: https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/boletins-diarios/pesquisa-por-pregao/pesquisa-por-pregao/.
- Não supor que gráficos gratuitos de WIN/TradingView autorizam stream, API ou envio automático de ticks.

**Status: NÃO CONECTADO AO MERCADO, SEM TRADE.**
