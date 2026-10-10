# Copiloto WIN 2.0 — painel móvel hospedado na nuvem

**PROTÓTIPO FUNCIONAL COM DADOS FICTÍCIOS. NÃO OPERAR COM ESTE PAINEL.**

Interface mobile em HTML/CSS/JS (sem dependências), com cálculo de análise no servidor Vercel (API serverless). O navegador do celular reproduz o cenário sintético; a API independente reconstrói e analisa esse mesmo cenário na nuvem e devolve decisão operacional sempre **SEM TRADE**.

Funcionalidades:

- Gráfico responsivo de preço e VWAP sintéticos; delta e estimativa fictícia de book.
- Quatro cenários reproduzíveis (alta, baixa, lateral, volatilidade elevada) e controles Iniciar/Pausar/Reiniciar.
- API `/api/status` informa claramente que B3 e roteamento estão desligados.
- API `/api/analyze` analisa cenário na nuvem, com política fail-closed. Sem licença e sem dados reais.
- Aba de análise com justificativas, vetos e relatório copiável.
- Diário de observações e exportação CSV. **Anotações são armazenadas no navegador local**, não têm sincronização cloud; isso deve mudar somente após autenticação privada.
- Manifest para adicionar atalho à tela inicial do celular; precisa de rede para análise na nuvem.
- **Não existe** login, dados da corretora, feed real, ordens, robôs ou alertas push em tempo real. Não é produto pronto para uso comercial com dados licenciados.

## Testar

Em `copiloto_v2/web`: `npm test` (Node 20+, sem dependências adicionais).

Em Vercel, usar `rootDirectory=copiloto_v2/web`; criar **projeto separado do simulador Wix**, sem alterar a branch `main`. A implantação de preview deve ser protegida, se houver dados futuros, mas esta versão contém somente informações fictícias sem dados pessoais.

## Próxima etapa

Verificar licença da Nelogica e direitos de hospedagem em nuvem; definir orçamento e ambiente Windows x64 privado para ProfitDLL, usando somente `DLLInitializeMarketLogin`; implementar autenticação da camada web **antes** de qualquer feed/licença/segredo. O Vercel serverless não carrega DLL Windows nem mantém stream de ticks em processo persistente.

A execução de ordens pertence exclusivamente ao usuário no Profit Mobile, nunca ao Copiloto.
