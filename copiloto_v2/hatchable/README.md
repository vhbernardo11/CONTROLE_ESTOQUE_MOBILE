# Copiloto WIN 2.0 — Backend cloud privado (Hatchable)

Projeto hospedado **separado** do antigo simulador no Wix e dos projetos RENDA EXTRA DT pré-existentes.

**URL implantada:** https://copiloto-win-20-api.hatchable.site

**Hatchable project ID:** `proj_d48A8ja0M7LR` · projeto `personal` privado (owner/collaborators).

## Objetivo e limites

- Processar no backend os cenários **SINTÉTICOS** do site mobile, via `POST /api/analyze`. Não é feed B3, não monitora WIN real e não pode validar oportunidades reais.
- `GET /api/status` verifica flags explícitas de segurança: `marketData: DESLIGADO`, `orderRoutingEnabled: false`, `realTradeAuthorised: false`.
- `access = "member"` em ambas as APIs. Ao tentar acesso anônimo, o gateway nega com HTTP 401 (teste confirmado).
- O backend recebe apenas cenário, seed e quantidade de passos, reconstitui o replay deterministicamente e calcula preço, VWAP, delta, imbalance sintético.
- Rejeita dados incorretos com HTTP 400; sempre retorna `operational = "SEM TRADE"` e `canSendOrders = false`.
- Nenhuma conta B3/Santander, licença ProfitDLL, senha, ordem, envio/cancelamento ou gestão de posições.
- Proteção do site privado: usuários precisam acessar pelo login Hatchable apropriado. Não mudar para público nem copiar tokens de sessão para código.

## Arquitetura

`public/index.html` + `app.js` + `engine.js` = interface mobile;
`lib/engine.js` = cálculos no backend;
`api/status.js` = saúde segura;
`api/analyze.js` = cálculo na nuvem;
`public/manifest.webmanifest` + `icon.svg` = atalho no celular.

Os arquivos em `public/` da implantação atual são as mesmas versões da branch
`feature/copiloto-v2-marketdata-readonly-20261010` do diretório `copiloto_v2/web/`.
Quando a API remota falha, frontend declara `DEMO LOCAL — SEM API` e continua **SEM TRADE**.

## Validação da implantação de 10/10/2026

- Análise autenticada (membro): HTTP 200, cálculo de 120 eventos fictícios, `CLOUD_SERVERLESS`, `ALTA SIMULADA` e `SEM TRADE`.
- Health autenticado: HTTP 200, `marketData: DESLIGADO`, roteamento desligado.
- Requisição anônima a ambos endpoints: HTTP 401.
- Dados inválidos: HTTP 400.
- Teste de deploy: sem alertas nem erros.

## Pendências obrigatórias antes de qualquer dado real

1. Confirmar contrato/licença DLL Feed, uso da DLL numa VPS Windows e direito de dados da B3.
2. Provisionar **separadamente** um coletor Windows x64 privado; Hatchable/Vercel serverless não executa DLL Windows nativa nem suporta processo de ticks contínuo.
3. Projetar autenticação fim a fim, criptografia e autorização dos alertas se dados licenciados forem transmitidos para o dashboard.
4. Validar estados e atraso/qualidade de feed, custo e estratégia via shadow mode sem ordem.
5. O usuário continuará executando **apenas manualmente no Profit Mobile**, após avaliação e liberação independente do plano de risco.

**Não mesclar com `main` sem aprovação e não substituir o simulador publicado.**
