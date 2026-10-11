# Laboratório Copiloto WIN 2.0 — Google Colab (grátis, temporário)

Abra pelo celular:
https://colab.research.google.com/github/vhbernardo11/CONTROLE_ESTOQUE_MOBILE/blob/feature/copiloto-v2-marketdata-readonly-20261010/copiloto_v2/colab/copiloto_profitdll_cloud.ipynb

Fluxo interativo:
1. Confirmar hardware CPU padrão e Ubuntu Linux x86_64.
2. Instalar Wine64 do Ubuntu e criar prefixo temporário.
3. Executar Python Windows x64 3.13.15 dentro do Wine para verificar ABI.
4. Baixar **diretamente do site oficial da Nelogica** o pacote completo ProfitDLL, extrair somente os arquivos Win64 para espaço temporário da sessão.
5. Testar carregamento da DLL e exports obrigatórios **sem login**.
6. Célula final opcional de handshake **exclusivamente** via `DLLInitializeMarketLogin`: exige confirmação explícita de licença cloud e **senha NOVA**; os campos são ocultos, dados ficam só em memória, fornecidos pelo titular na sessão Colab, passam ao processo Win por stdin. Jamais usar a senha que já apareceu no chat.

A célula final **não assina WINFUT**, **não entrega ticks nem faz backtest**; handshake não equivale a feed live. Nenhum roteamento de ordens. Nenhuma credencial no repositório ou no app cloud Hatchable.

Limites: Colab é temporário e prioriza atividades interativas; sessões gratuitas podem expirar em até 12h ou antes, hardware não garantido. Wine de Ubuntu pode ser 9.0, enquanto o tutorial oficial foi validado no WineHQ 11.0 e ProfitDLL 4.0.0.41 (o usuário recebeu manual 4.0.0.42). A compatibilidade real precisa de execução e testes.

Fonte oficial: https://ajuda.nelogica.com.br/hc/pt-br/articles/54973527417243-ProfitDLL-no-Linux-Saiba-como-acessar-e-utilizar
FAQ oficial Colab: https://research.google.com/colaboratory/intl/pt-BR/faq.html
