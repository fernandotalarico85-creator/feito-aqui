# Feito Aqui — Protótipo v0.1

Protótipo funcional de um marketplace de serviços sob demanda que conecta **clientes** a
**workers** (prestadores autônomos), começando pela vertical de reforma/construção civil.

A fonte de verdade das regras de negócio é [`CONTEXTO_REGRAS_FEITO_AQUI.md`](./CONTEXTO_REGRAS_FEITO_AQUI.md).
Este README explica como rodar o projeto, o que está implementado de verdade vs. simulado, e
onde ajustar as constantes de negócio sem mexer na lógica. Pra publicar o protótipo num link
compartilhável (Vercel + Postgres + Blob), veja [`DEPLOY.md`](./DEPLOY.md).

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Prisma 7 + PostgreSQL (via
`@prisma/adapter-pg`), upload de fotos no Vercel Blob, autenticação por sessão (cookie +
tabela `Session`, sem OAuth).

## Como rodar localmente

Precisa de um Postgres acessível (local ou na nuvem — ver [`DEPLOY.md`](./DEPLOY.md) para
deploy e para instruções de banco gerenciado gratuito):

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e BLOB_READ_WRITE_TOKEN
npm run db:migrate     # aplica as migrações no Postgres
npm run db:seed        # popula usuários, categorias e pedidos de teste
npm run dev
```

Acesse `http://localhost:3000`. A tela inicial linka para os três tipos de login (cliente,
worker, admin); a própria tela de **Entrar** tem uma seção "Credenciais de teste" com todos os
e-mails/senha do seed.

Outros comandos úteis:

```bash
npm run db:studio    # interface visual do banco (Prisma Studio)
npm run build        # build de produção — usado como checagem final do protótipo
```

## Estrutura do projeto

```
prisma/schema.prisma        modelo de dados (11 entidades da Seção 2 do contexto)
prisma/seed.ts              dados de teste
src/lib/                    regras de negócio e constantes configuráveis (ver abaixo)
src/app/(público)/entrar    login compartilhado
src/app/cliente/            fluxo do cliente (rotas protegidas em `(area)/`, cadastro é pública)
src/app/worker/             fluxo do worker (mesmo padrão)
src/app/admin/              painel administrativo
src/components/             componentes compartilhados (ex.: feed de portfólio)
```

## Regras de negócio: o que é real vs. simulado

Implementado de verdade, com efeito real no banco de dados:

- **Comissão** (10%, sempre do lado do worker — o cliente nunca vê nem paga uma taxa
  separada, paga exatamente o valor do orçamento) calculada e persistida no `Booking` ao
  aceitar um orçamento.
- **Repasse ao worker em 3 parcelas** ligadas a eventos do booking (2% no aceite, 30% no
  check-in dentro da tolerância, 58% na conclusão), com fluxo de justificativa de atraso e
  decisão do admin (liberar na hora / agendar em X dias / cair no fallback da conclusão) —
  ver `src/lib/repasses.ts` e `/worker/ganhos` / `/admin/repasses`.
- **Ranking orgânico** com os 6 fatores da Seção 3.3, incluindo a reserva de posição para
  workers em cold start e o bloco "Patrocinado" separado do ranking. `taxaConclusaoPrazo` e
  `taxaComparecimento` são recalculadas a partir do histórico real de `Booking`s sempre que
  um serviço é concluído ou cancelado (`src/lib/estatisticasWorker.ts`) — não são mais
  valores fixos do seed.
- **Geofence de check-in** (150m, fórmula de Haversine) e tolerância de horário simétrica
  (±30min, também usada para liberar a parcela de pontualidade do repasse) e alerta de saída
  prolongada (40min) — com flags persistidas no `Booking`.
- **Cancelamento pós-fechamento** (Seção 3.6.1): gravidade proporcional à proximidade da data
  para o worker (strike grave + reembolso automático / strike grave / strike médio); sem
  strike na primeira vez para o cliente, strike médio a partir da 2ª reincidência em 90 dias.
- **Reembolso automático ao cliente** em caso de no-show (manual pelo admin ou automático ao
  reportar) — gera uma `WalletTransaction` real e aparece em "Minha carteira"
  (`src/lib/reembolso.ts`).
- **Contestação de strike** pelo alvo (worker ou cliente), até 48h do registro, com fila de
  decisão do admin — bloqueada no servidor para strikes gravíssimos (fraude/assédio).
- **Compra de destaque pago** pelo worker (mockado), com checagem de elegibilidade
  (`notaMediaRecente >= 4.0`) e explicação quando inelegível, em vez de só esconder o botão.
- **Confirmação de conclusão** (Seção 3.8): check-out exige pelo menos 1 foto do resultado
  (`ServicePhoto`), com opção de publicar no portfólio na hora ou depois. A parcela final do
  repasse só libera depois que o cliente confirma a entrega, contesta (fila própria no admin),
  ou o prazo de confirmação automática (72h) se esgota — nunca só por o worker marcar
  conclusão sozinho.
- **Negociação de orçamento** (Seção 3.9): cliente pode recusar um orçamento ou fazer uma
  contra-proposta de valor/prazo — o worker aceita (fecha o negócio no valor negociado) ou
  recusa (o orçamento original continua valendo). Orçamento sem decisão do cliente em 5 dias
  expira sozinho, exceto com contra-proposta pendente de resposta do worker.
- **Tokens de avaliação** (500 tokens = R$5) com carência de 4 dias, liberação automática, e
  bloqueio de liberação enquanto há disputa ativa.
- **Réplica do worker** e **resolução de disputa pelo admin** (manter/reverter nota), com
  estorno real dos tokens e recálculo da nota média do worker.
- **Strikes** manuais com gravidade/ação sugerida pré-preenchidas pela Seção 3.6, e contador
  de workers com 3+ strikes médios em 6 meses.
- **Verificação manual de worker pelo admin** (Seção 4 do contexto — sem KYC real, só o
  campo de status).
- **Upload de fotos** (portfólio, avaliações, evidências, conclusão de serviço) vai pro
  Vercel Blob de verdade (`src/lib/upload.ts`) — não é mock nem storage local.
- **Numeração de pedidos e orçamentos** (Seção 3.10): todo `ServiceRequest` ganha um
  `numeroOS` (`OS-AAMMDD-NNNNN`) e todo `Budget` um `numeroPO` (`PO-AAMMDD-NNNNN`) na
  criação — sequencial reinicia por dia, gerado atomicamente em `src/lib/numeracao.ts`.
  Visível em toda tela de cliente/worker/admin que lista ou detalha um pedido/orçamento.
- **Cadastro completo com ID sequencial** (Seção 3.9): nome, sobrenome, CPF, endereço
  completo (com dropdown de UF e autopreenchimento por CEP via ViaCEP) e foto de perfil
  opcional, para cliente e worker. Cada cadastro ganha um `idCadastro` sequencial e único
  (`C00000001...` / `W00000001...`, gerado em `src/lib/numeracao.ts`), visível no próprio
  perfil e no painel admin. Depois de criado, nome/sobrenome/e-mail/endereço/foto de perfil
  podem ser editados a qualquer momento em `/cliente/perfil` e `/worker/perfil` — só CPF e
  ID de cadastro ficam permanentemente bloqueados.
- **Documento de verificação de identidade do worker** (Seção 3.9): upload obrigatório no
  cadastro (CNH, RG com CPF, ou RG + CPF separados), com `documentoStatus` que o admin
  aprova/rejeita manualmente em `/admin/workers` — sem OCR, revisão separada da verificação
  geral do worker (Seção 3.7).
- **"Meu Perfil" e "Portfólio" são telas separadas** (Seção 3.9): "Meu Perfil" (cadastro/
  endereço/foto) e "Portfólio" (galeria de fotos antes/depois, em `/worker/portfolio`) são
  telas e rotas próprias, sem compartilhar formulário. O item "Portfólio" só aparece pra
  worker.
- **Dropdown do usuário em cliente/worker/admin, com TODA a navegação dentro dele** (Seções
  3.9, 3.10 e 3.11): mesmo componente reaproveitado (`src/components/UserMenuDropdown.tsx`)
  nas três áreas — nenhum link de navegação solto na barra horizontal (cliente mantém só o
  CTA "+ Novo pedido" fora do dropdown). Cliente: Meus Pedidos, Minha Carteira, Perfil, Sair.
  Worker: Pedidos Recebidos, Meus Orçamentos, Strikes, Agenda, Meus Ganhos, Destaque,
  Portfólio, Meu Perfil, Sair. Admin tem os grupos expansíveis "Clientes" e "Workers" (cada
  um com seus subitens — Aprovar Perfil, Strikes,
  Repasses e Disputas apontam para páginas reais; Perfil de cliente/worker e Portfólio de
  worker no admin ainda são placeholders "em construção") + "Sair" solto.
- **"Meu Perfil" como cartão de contato** (Seção 3.12): layout em 2 colunas
  (`src/components/PerfilCard.tsx`, reaproveitado por cliente e worker) — cartão de
  identidade fixo à esquerda (avatar, nome, papel, categorias — só worker —, ID de cadastro,
  navegação "Informações"/"Minha Carteira") e painel "Informações" à direita, que abre em
  somente leitura e só vira formulário editável pelo menu "⋮ > Editar" (CPF e ID de cadastro
  continuam travados mesmo editando). "⋮ > Excluir conta" abre uma confirmação, mas não
  apaga nada de verdade — funcionalidade fora de escopo da v0.1.
- **Identidade visual exclusiva de "Meu Perfil"** (Seção 3.13, `src/lib/fontsPerfil.ts`):
  só essa tela usa a paleta `#1F4E5F`/`#3F7C8A`/`#C0592C`/`#E7EEF0` e as fontes Manrope/Inter
  — exceção pontual, o resto do protótipo continua no estilo padrão (stone/Geist).

Simulado/mockado (documentado como fora de escopo pelo próprio contexto, Seção 4):

- **Pagamento**: `Booking.pagamentoStatus` é sempre `"simulado_aprovado"` — não há gateway
  real nem split de pagamento de fato.
- **Verificação de antecedentes/KYC**: só o campo `statusVerificacao`, aprovado manualmente
  pelo admin em `/admin/workers`.
- **Triagem por IA**: formulário guiado (`src/lib/triagem.ts`) — `sugerirServicos()` já está
  isolado como ponto de extensão para um LLM futuro.
- **Geolocalização**: Geolocation API do navegador + campo manual de lat/long (sem GPS real
  necessário para testar), e geocodificação de endereço novo é só uma aproximação
  determinística do centro de São Paulo (`src/lib/geo.ts`).

## Constantes configuráveis

Todas em [`src/lib/config.ts`](./src/lib/config.ts) — ajuste os valores ali, a lógica que os
usa não precisa mudar:

| Constante | Seção do contexto | Valor atual |
|---|---|---|
| `COMISSAO_PERCENTUAL_TOTAL` | 3.1 | 10% (sai do lado do worker) |
| `WORKER_PERCENTUAL_ACEITE` / `WORKER_PERCENTUAL_PONTUALIDADE` | 3.1 | 2% no aceite + 30% no check-in (resto, 58%, na conclusão) |
| `JUSTIFICATIVA_ATRASO_PRAZO_HORAS` | 3.1 | 48h para o worker justificar atraso no check-in |
| `NOTA_MINIMA_PARA_DESTAQUE` / `VALOR_DESTAQUE_REAIS` / `DESTAQUE_DURACAO_DIAS` | 3.1 | 4.0 / R$49,90 / 7 dias |
| `PESOS_RANKING` | 3.3 | ver tabela no contexto |
| `RANKING_COLD_START_A_CADA_N_POSICOES` | 3.3 | 6 |
| `GEOFENCE_RAIO_METROS` | 3.4 | 150m |
| `TOLERANCIA_CHECKIN_MINUTOS` | 3.4 | ±30min (simétrica; vale para check-in e para a parcela de pontualidade do repasse) |
| `ALERTA_SAIDA_PROLONGADA_MINUTOS` | 3.4 | 40min |
| `TOKENS_POR_AVALIACAO` / `VALOR_REAIS_POR_AVALIACAO` | 3.5 | 500 tokens = R$5 |
| `JANELA_CARENCIA_TOKENS_DIAS` | 3.5 | 4 dias |
| `STRIKES_MEDIA_LIMITE_SUSPENSAO` / `STRIKES_MEDIA_JANELA_MESES` | 3.6 | 3 strikes / 6 meses |
| `CANCELAMENTO_WORKER_JANELA_GRAVE_HORAS` / `CANCELAMENTO_WORKER_JANELA_MEDIA_HORAS` | 3.6.1 | 24h / 72h |
| `CANCELAMENTO_CLIENTE_JANELA_DIAS` / `CANCELAMENTO_CLIENTE_LIMITE_REINCIDENCIA` | 3.6.1 | 90 dias / 2ª reincidência |
| `STRIKE_JANELA_CONTESTACAO_HORAS` | 3.6.2 | 48h |
| `CONFIRMACAO_CONCLUSAO_PRAZO_HORAS` | 3.8 | 72h |
| `ORCAMENTO_PRAZO_EXPIRACAO_DIAS` | 3.9 | 5 dias |

A tabela de infrações (tipo → gravidade → ação sugerida, Seção 3.6) fica em
[`src/lib/infracoes.ts`](./src/lib/infracoes.ts).

## Limitações conhecidas da v0.1

- **"Horário combinado" simplificado**: como o protótipo não tem agenda por hora, o check-in
  usa `janelaDataInicio` do pedido como referência de horário — funciona, mas é uma
  simplificação documentada em `src/app/worker/(area)/bookings/[id]/actions.ts`.
- **Ranking não é recalculado na confirmação/contestação de entrega**: `taxaConclusaoPrazo`/
  `taxaComparecimento` são recalculados no check-out (conclusão física), não voltam a mudar se
  o cliente depois contestar a entrega — uma obra contestada ainda conta como concluída no
  prazo para o worker.
- **Contra-proposta é rodada única por vez**: não há histórico de múltiplas rodadas de
  negociação — cada nova contra-proposta sobrescreve os campos da anterior (a decisão anterior
  já foi resolvida antes de uma nova poder ser enviada).
- Sem multi-idioma, notificações push ou app nativo — web responsivo apenas, como previsto no
  escopo da v0.1.
- **"Excluir conta" é só um placeholder**: o menu "⋮" em "Meu Perfil" tem a opção, mas
  confirmar só mostra um aviso — nenhuma conta é apagada de verdade.
- **"Enviar mensagem" é decorativo**: botão desabilitado no cartão de "Meu Perfil" — não há
  chat entre cliente e worker no protótipo.

Checagem mais recente: `npm run build` (produção), `tsc --noEmit` e `eslint` passam limpos, e
os fluxos de negociação de orçamento (aceitar/recusar/contra-proposta/expiração) e confirmação
de conclusão (confirmar/contestar/auto-confirmação) foram testados manualmente ponta a ponta
no navegador.
