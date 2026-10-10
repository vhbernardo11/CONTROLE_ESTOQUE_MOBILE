# Copiloto WIN 2.0: arquitetura **100% nuvem + somente celular**

**Decisão do usuário em 10/10/2026:** Não possui nem deseja depender de computador próprio. O Copiloto deve executar coleta, cálculo e interpretação em um servidor na nuvem. A única interface do usuário será o navegador do celular. Ele opera **manualmente no Profit Mobile**. A IA e o código Copiloto **nunca enviam, alteram ou cancelam ordens**.

## Visão

```text
Nelogica / B3 (licença Market Data a confirmar)
    |
    v
Servidor privado na nuvem (Windows x64 ou alternativa validada)
    |
    +-- ProfitDLL Market Data: DLLInitializeMarketLogin, somente leitura
    +-- callback rápido -> fila -> motor determinístico de indicadores
    +-- verificador de integridade: heartbeat, licença, conexões, timestamps
    +-- filtro de riscos (fora da IA): mercado, disciplina, atraso, limites
    +-- painel HTTPS autenticado / notificações
    |
    v
Celular: análises e alertas (COMPRA/ VENDA/ AGUARDAR/ SEM TRADE)
    |
    v
Usuário decide e, quando liberado e adequado, opera manualmente no Profit Mobile
```

## Segurança obrigatória

- A PR fica isolada da branch `main` que contém simulador e site publicado. Não alterar `index.html` da raiz, nem Wix existente.
- A biblioteca `ProfitDLL.dll` é proprietária: **não versionar no repositório público**, nem subir credenciais, tokens ou chaves em GitHub Actions, issues, comentários ou ChatGPT.
- **Nunca** chamar `DLLInitializeLogin`, `SendOrder`, `CancelOrder`, `ChangeOrder` ou similares. A integração deve ser explícita e limitada a `DLLInitializeMarketLogin` (somente dados).
- Credenciais da Nelogica somente no cofre de segredos **privado do provedor cloud aprovado**; nenhum segredo no browser. Controle de acesso HTTPS, MFA quando disponível, limites e logs sem informações pessoais.
- O app não pode ser definido como `REAL` apenas porque existem números na tela: exige sessão conectada, licença validada, eventos recentes e origem autenticada. Se desconectar, perder heartbeat, dados atrasarem, o contrato vencer ou houver volatilidade extrema, exibir **SEM TRADE**.
- A IA recebe *snapshots* e explica cenários; regras de risco são código determinístico com veto absoluto. A IA não altera limites.
- Nenhum software de monitoramento garante que o Profit Mobile ficará bloqueado. Limites reais exigem configuração e validação separadas no Profit e na corretora.
- Enquanto o protocolo de pausa pós-09/10 não for cumprido, qualquer análise deve ser **educacional/simulada**, sem incentivos para retomada de negociação real.
- A sinalização futura é condicional, não promessa de lucro nem comando obrigatório: cenário/viés, preço de referência, invalidação, custos, stop técnico, hora, atualização do feed e motivo de veto. **O usuário executa apenas por escolha consciente.**

## Caminho econômico: nenhuma contratação imediata

1. **CI na nuvem sem custo de servidor permanente:** workflow GitHub Actions executa apenas testes Python offline com entradas sintéticas, sem segredos, sem conexão B3.
2. **Conferir licenciamento:** o ZIP veio da conta autenticada Nelogica; isso não prova Market Data ativo. Checar DLL Feed em Assinaturas, chave/permissão de uso cloud e direito aos dados B3.
3. **Orçamento antes do deploy:** escolher VPS Windows x64 ou configuração Linux/Wine explicitamente homologada/testada; serviços sempre ligados geram custo. Não contratar nem executar DLL antes da autorização/licença.
4. **Teste restrito em cloud privada:** verificar somente handshake Market Data, callbacks, frescor, desligamento seguro, nenhum símbolo de roteamento; depois consultar dados por ticker com logs de validação.
5. **Camada web privada mobile:** publicar projeto **separado** do Wix atual após confirmar endpoint e autenticação. Nunca exibir informações de usuário ou dados de bolsa licenciados em site público.
6. **Shadow mode:** testar por pelo menos 20 sessões sem enviar ordens e comparar sinais com resultados, custos, MAE/MFE e drawdown, sem tratar essa amostra mínima como prova de rentabilidade.
7. **NADA de execução automática:** nem agora nem em qualquer fase sem nova decisão explícita do usuário.

## Status em 10/10/2026

- Simulador Wix original preservado e funcionando conforme histórico do projeto (não checado em tempo real neste commit).
- PR nº 1 e módulo offline `copiloto_v2/` separados da `main`.
- Biblioteca incluída no ZIP original do usuário foi examinada estaticamente; **nenhum login Market Data ou teste na B3 executado**.
- Workflow CI executa só testes offline. Não existe serviço cloud real ligado à Nelogica ainda.
