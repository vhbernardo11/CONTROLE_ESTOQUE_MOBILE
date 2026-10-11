# Copiloto WIN 2.0 — sonda em nuvem Windows (somente Market Data)

**IMPORTANTE — CONEXÃO LIVE NÃO EXECUTADA.** Este diretório executa um teste em Windows x64 no GitHub Actions **SEM** credenciais, **SEM** biblioteca ProfitDLL e **SEM** login. Não são cotações reais nem alertas.

## Uso, quando houver licença e autorização de nuvem por escrito

- Credenciais privadas e chave de ativação devem ser **inseridas pelo titular no cofre do provedor**, nunca aqui no chat, no GitHub, em e-mail comum ou no código. Se alguma senha foi compartilhada em conversa, ela deve ser **trocada antes do primeiro uso**.
- Biblioteca proprietária: armazenar em local privado autorizado (Windows VM); **NÃO** fazer commit do ZIP nem publicar URL de download com token.
- Preparar Windows x64 e Python x64. Validar a DLL oficial, custos, termos B3, direitos de hospedagem remota e taxa de licenciamento.
- A sonda **padrão** `python marketdata_probe.py` imprime `OFFLINE`; não lê segredos nem tenta login.
- No ambiente privado aprovado, definir `PROFITDLL_CLOUD_APPROVED=yes` e disponibilizar no cofre somente: `PROFITDLL_ACTIVATION_KEY`, `PROFITDLL_USERNAME`, `PROFITDLL_PASSWORD`. Não usar senha de roteamento. Nenhuma dessas variáveis é configurada aqui.
- **Somente após autorização** executar manualmente no Windows privado:
```powershell
python marketdata_probe.py --connect --dll "C:\CaminhoPrivado\Win64\ProfitDLL.dll" --timeout 45
```
- Carrega exclusivamente `DLLInitializeMarketLogin`, `SetHealthCallback`, `GetHealthStatus` e `DLLFinalize`. Não carrega nem chama funções de envio, alteração, cancelamento ou consulta de ordens.
- O estado `HANDSHAKE_VALIDADO` exige os três eventos e saúde responsiva, mas **não prova recebimento de negócios**. Não assinamos ticker. **SEM TRADE sempre.**
- O workflow `copiloto-windows-smoke.yml` nunca usa `--connect`; não é ferramenta de login.
- A documentação enviada pelo usuário (Manual ProfitDLL 4.0.0.42) prevê máximo de 30 dias de histórico em GetHistoryTrades e intervalos inferiores a 10 dias para WIN/WDO. Estudar um pregão por solicitação quando conectar feed autorizado.

O usuário dispõe apenas de celular. A configuração do cofre e a autorização contratual exigem confirmação pelo próprio titular na interface do provedor. Não é possível assumir acesso permanente ao Gmail, senhas e 2FA a partir desta conversa.

## Fase atual

Laboratório web no Wix e Hatchable continuam intactos; a `main` e o simulador original não são alterados. Sem VPS Windows permanente contratada e sem preço/ativação verificados. Nenhum custo iniciado. Toda decisão operacional continua **SEM TRADE**, e ordens manuais via Profit Mobile permanecem fora do sistema.
