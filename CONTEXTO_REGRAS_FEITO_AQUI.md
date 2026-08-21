# Feito Aqui — Contexto de Regras de Negócio para o Protótipo (v0.1)

> Salve este arquivo na raiz do repositório do protótipo (ex.: `CONTEXTO_REGRAS_FEITO_AQUI.md`).
> Ele resume, em formato técnico, as regras já definidas no Plano de Negócios completo
> ("Plano_de_Negocios_App_Servicos.docx"). Cole os prompts do arquivo
> `Prompts_Prototipo_Claude_Code.md` no Claude Code dentro deste mesmo projeto — ele vai
> ler este contexto sempre que precisar, sem que você tenha que repetir as regras a cada prompt.
>
> Onde uma regra do plano ainda estava "A DEFINIR", este documento assume um valor padrão
> razoável para o protótipo (marcado como `[padrão de protótipo, ajustável]`) — não são decisões
> finais de negócio, só valores para o software funcionar de ponta a ponta.

## 1. Visão geral do produto

Marketplace de serviços sob demanda ("Feito Aqui") que conecta **clientes** a **workers**
(prestadores de serviço autônomos/MEI/PJ). O cliente descreve o que precisa em linguagem
natural, o app decompõe em serviços/sub-serviços, sugere prazo, filtra por agenda e
apresenta os workers mais bem avaliados. O cliente fecha orçamento dentro do app — só aí a
plataforma cobra comissão. Vertical de lançamento do protótipo: **reforma/construção civil**.

## 2. Entidades principais (modelo de dados sugerido)

- **User** — campos base: id, nome, email, senha (hash), tipo (`cliente` | `worker` | `admin`), criadoEm.
- **ClientProfile** — userId, endereço(s) salvos, carteira de créditos (tokens convertidos em R$).
- **WorkerProfile** — userId, categorias de serviço (array), região de atendimento, bio,
  portfólio (fotos antes/depois), status de verificação (`pendente` | `verificado`), nota média
  recente, taxa de conclusão no prazo, taxa de comparecimento, tempo médio de resposta, volume de
  serviços concluídos, elegívelParaTriagem (bool, corte de qualidade), destaquePago (bool + validade).
- **Agenda** — workerId, data, disponível (bool).
- **ServiceRequest** (pedido do cliente) — numeroOS (ver 3.10), clienteId, descrição livre,
  categoria(s) sugeridas pela triagem, sub-serviços, janela de data desejada, status
  (`triagem` | `aguardando_orcamento` | `orcado` | `fechado` | `em_andamento` | `concluido`
  | `cancelado`).
- **Budget** (orçamento) — numeroPO (ver 3.10), serviceRequestId, workerId, valor,
  prazoComprometido (definido pelo worker, não pela IA), status (`pendente` | `aceito` |
  `recusado` | `expirado`), contraproposta { status, valor, prazo, mensagem } (ver 3.9).
- **Booking** (serviço fechado) — budgetId, valorTotal, comissaoValor, comissaoPercentual,
  status, checkIn { horário, geolocalização, dentroDaGeofence }, checkOut { horário,
  geolocalização }, alertaSaidaProlongada (bool).
- **Review** (avaliação) — bookingId, nota (1–5), depoimento, fotos, tokensGerados,
  statusContestacao (`nenhuma` | `em_analise` | `mantida` | `revertida`), replicaWorker
  {texto, fotos, dataEnvio}.
- **WalletTransaction** — clientProfileId, tipo (`credito_avaliacao` | `estorno` | `uso_em_servico`),
  valorTokens, valorReais, liberadoEm (data após janela de carência), status (`carencia` |
  `liberado` | `usado` | `estornado`).
- **Strike** (penalidade) — workerId ou clienteId, tipo de infração, gravidade (`media` |
  `grave` | `gravissima`), dataOcorrencia, expiraEm, statusContestacao.
- **Dispute** (disputa mediada) — bookingId ou reviewId, evidências (texto/fotos/mensagens),
  decisão, decididoPor (operador), dataDecisao.

## 3. Regras de negócio por módulo

### 3.1 Comissão e repasse ao worker (Seção 6) — atualizado no Prompt 9
- Comissão padrão do protótipo continua **10% do valor do serviço**
  `[padrão de protótipo, ajustável — plano define faixa de 8% a 20%, a validar]`, mas agora
  sai inteira do lado do worker — **o cliente nunca vê nem paga uma taxa separada**, paga
  exatamente o valor do orçamento.
- O repasse do worker (90% do valor) é liberado em **3 parcelas** ligadas a eventos do
  booking, em vez de uma liberação única na conclusão:
  1. **2%** — liberado quando o orçamento é aceito pelo cliente e pago.
  2. **30%** — liberado no check-in, se dentro da tolerância de horário (ver 3.4). Fora da
     tolerância, o worker pode enviar uma justificativa; o admin decide se libera na hora,
     agenda pra depois (campo de dias), ou não decide nada — nesse caso ela cai no fallback
     e libera sozinha junto com a parcela de conclusão (o worker nunca perde o valor, só
     pode recebê-lo mais tarde).
  3. **58%** (resto) — liberado quando o serviço é concluído **e** a entrega é confirmada
     pelo cliente (ver 3.8) — marcar conclusão sozinho não basta.
- Cobrança só é gerada quando o `Budget` é aceito pelo cliente (`status = aceito`) — é esse
  evento que cria o `Booking` e as 3 parcelas do repasse. Nunca cobrar antes disso.
- Patrocínio pago (destaque) é **sempre exibido em bloco separado**, nunca altera o ranking
  orgânico nem a nota. Worker com nota abaixo de **4.0** não pode comprar destaque.

### 3.2 Triagem por IA (Seção 10) — versão simplificada para o protótipo
- Não é necessário integrar um LLM real na v0.1: implemente como **formulário guiado** —
  cliente escolhe categoria principal (ex.: "Reforma de banheiro") de uma taxonomia fixa
  cadastrada no banco (categoria → lista de sub-serviços na ordem de execução recomendada, ex.:
  hidráulica → elétrica → impermeabilização → revestimento → marcenaria → pintura).
- Deixe um ponto de extensão claro (ex.: uma função `sugerirServicos(descricaoLivre)`) para que
  uma chamada a um LLM possa ser plugada depois, sem precisar refazer o fluxo.

### 3.3 Ranking orgânico (Seção 11)
Pesos sugeridos para o protótipo (soma 100, ajustável em uma constante de configuração):
| Fator | Peso |
|---|---|
| Nota média recente (últimos 10 serviços) | 30 |
| Taxa de conclusão no prazo | 25 |
| Taxa de comparecimento (sem no-show) | 20 |
| Tempo médio de resposta | 10 |
| Aderência geográfica/categoria | 10 |
| Volume de serviços concluídos | 5 |

- Corte de elegibilidade (não entra no ranking, é filtro binário antes de pontuar): worker
  precisa estar `verificado` para aparecer na triagem.
- Reserva para workers novos sem histórico: **1 em cada 6 posições** do resultado deve ser um
  worker elegível mas ainda sem nota suficiente (cold start) `[padrão de protótipo, ajustável]`.
- Patrocínio nunca entra nessa fórmula — é um bloco à parte, rotulado "Patrocinado".

### 3.4 Geolocalização / check-in-check-out (Seção 9)
- Raio da geofence: **150 metros** `[padrão de protótipo, ajustável]`.
- Janela de tolerância de horário do check-in: **±30 minutos** em volta do horário combinado
  (atualizado no Prompt 9 — antes era só 20min de atraso, agora é simétrica e vale também
  pra liberar a parcela de pontualidade do repasse, ver 3.1).
- Alerta de saída prolongada: worker fora da geofence por mais de **40 minutos** sem check-out.
- Use a Geolocation API do navegador (ou simulação com input de lat/long no protótipo, já que
  não haverá app mobile nativo na v0.1) — não precisa geofencing nativo iOS/Android nesta fase.
- Guardar só: horário + coordenada do check-in e do check-out (não o trajeto contínuo).

### 3.5 Tokens / incentivo a avaliações (Seção 12)
- Ao avaliar um serviço concluído, cliente ganha **500 tokens = R$ 5,00** de crédito
  `[padrão de protótipo, ajustável]`.
- Crédito fica em `status = carencia` por **4 dias** antes de virar `liberado` — dentro desse
  prazo o worker pode enviar `replicaWorker` contestando a nota.
- Se a contestação for aceita (`statusContestacao = revertida`): estornar os tokens
  (`tipo = estorno`) e não contar a nota no ranking do worker.
- Nenhuma avaliação sob disputa ativa libera token até resolução.

### 3.6 Penalidades (Seção 13)
Tabela simplificada de infrações para o protótipo:
| Infração | Gravidade | Ação automática sugerida |
|---|---|---|
| No-show (sem check-in) | Grave | Strike grave + reembolso automático ao cliente |
| Atraso não justificado | Média | Strike + redução temporária no ranking |
| Cancelamento tardio pelo worker | Média/Grave | Strike proporcional à proximidade da data |
| Avaliação fraudulenta comprovada | Gravíssima (cliente) | Suspensão do programa de tokens |
| Fraude/identidade falsa/assédio | Gravíssima | Exclusão imediata, sem strike prévio |

- 3 strikes de gravidade média em 6 meses `[padrão de protótipo, ajustável]` → suspensão para
  revisão manual (não é automática para casos graves/gravíssimos, que já suspendem direto).

#### 3.6.1 Cancelamento pós-fechamento (Prompt 9) `[padrão de protótipo, ajustável]`
- Cancelamento pelo **worker**: gravidade proporcional à proximidade da data combinada —
  menos de 24h antes do serviço = equivalente a no-show (strike grave + reembolso automático
  ao cliente); entre 24h e 72h = strike grave sem reembolso; mais de 72h = strike médio.
- Cancelamento pelo **cliente**: sem strike na primeira vez. Se reincidir em cancelamento
  tardio 2+ vezes numa janela de 90 dias, gera strike médio pra ele também — princípio de
  confiança de mão dupla (o corte de qualidade não é só pro worker).
- Cancelamento **antes** do dia do serviço chegar (qualquer lado) não gera strike nem conta
  contra a taxa de comparecimento de ninguém.

#### 3.6.2 Contestação de strike (Prompt 9) `[padrão de protótipo, ajustável]`
- O alvo do strike (worker ou cliente) pode contestar até **48h** depois do registro.
- Strikes de gravidade **gravíssima** (fraude/identidade falsa/assédio) nunca têm direito a
  contestação — checado no servidor, não só escondido na interface.
- Segue o mesmo padrão de decisão da contestação de avaliação (Seção 3.5): admin vê o strike
  e a réplica lado a lado, decide manter ou revogar.

### 3.7 Papéis de acesso (para o protótipo)
- `cliente`: cria pedidos, aceita orçamentos, faz check-in de confirmação, avalia.
- `worker`: gerencia perfil/agenda, envia orçamentos, faz check-in/check-out.
- `admin` (Operações/Trust & Safety simplificado): vê disputas, decide contestações de
  avaliação, aplica/reverte strikes — um painel mínimo já cobre isso na v0.1.

### 3.8 Confirmação de conclusão e liberação de repasse (Seções 7 e 8) — implementado
- Ao terminar o serviço (check-out), o worker precisa marcar explicitamente "Concluí o
  serviço" e enviar pelo menos 1 foto do "depois" (resultado) — sem essa foto, o status não
  avança para concluído. Fotos ficam em `ServicePhoto`, ligadas ao `Booking`.
- No mesmo passo, o worker escolhe se publica a foto no portfólio público na hora ou adia a
  decisão; se adiar, pode publicar depois a qualquer momento pelo próprio perfil ("Meu perfil
  {'>'} Portfólio"), sem prazo — vira um `PortfolioItem` com `fotoAntesUrl` vazio.
- Marcar conclusão NÃO libera o repasse sozinho: `Booking.statusConclusao` vira
  `aguardando_confirmacao_cliente` e um badge aparece na tela de pedidos do cliente. O
  repasse final (a parcela ligada à entrega, ver 3.1) só é processado depois que o cliente
  confirma a entrega, ou depois que um prazo de confirmação automática se esgota sem
  contestação.
- Prazo de confirmação automática: **72 horas** `[padrão de protótipo, ajustável]` — se o
  cliente não confirmar nem contestar nesse período, tratar como confirmado. Sem scheduler
  real: um sweep preguiçoso (`confirmarConclusoesVencidas`) roda a cada carregamento das
  telas relevantes (dashboard admin, pedidos/booking do cliente, ganhos/booking do worker).
- Se o cliente contestar em vez de confirmar (`statusConclusao = contestado`), a parcela não
  libera e abre uma fila específica de disputa pro admin em "Conclusões contestadas"
  (mesmo padrão de decisão da Seção 3.6): confirmar entrega libera o repasse, manter a
  contestação deixa retido — resolução fora do fluxo automático (ex.: reembolso manual)
  fica a critério do admin.
- Objetivo: evitar que o worker marque conclusão só para acionar o pagamento, sem o cliente ter
  de fato confirmado que o serviço foi entregue como combinado.

### 3.9 Negociação de orçamento (Prompt 10) `[padrão de protótipo, ajustável]` — implementado
- Além de aceitar, o cliente pode **recusar** um orçamento (`status = recusado`) ou fazer uma
  **contra-proposta** de valor (e opcionalmente prazo) — fica pendente até o worker aceitar ou
  recusar. `Budget.contrapropostaStatus`: `nenhuma` → `pendente_worker` → `aceita` (fecha o
  negócio no valor negociado, ver abaixo) ou `recusada_pelo_worker`.
- Recusar uma contra-proposta **não mata o orçamento original**: ele continua `pendente` no
  valor inicial do worker — o cliente pode aceitar como estava ou tentar outra contra-proposta.
  Só o próprio orçamento (não a negociação) tem um botão de recusa definitiva.
- O worker aceitando a contra-proposta fecha o negócio direto (mesmo fluxo de aceite do
  cliente — cria `Booking`, comissão e as 3 parcelas do repasse, ver 3.1), mas usando o
  valor/prazo **negociados**, não o valor original do orçamento.
- Se o cliente não decidir (aceitar, recusar, ou contra-propor) dentro de **5 dias**
  `[padrão de protótipo, ajustável]` a partir do envio do orçamento, ele expira sozinho
  (`status = expirado`) — sem scheduler real, um sweep preguiçoso roda a cada carregamento
  das telas de orçamentos do cliente e do worker.
- Um orçamento com contra-proposta pendente de resposta do worker **não expira**: nesse caso
  o cliente já agiu, quem está devendo resposta é o worker — não faz sentido punir o cliente
  por uma inatividade que não é dele.

### 3.10 Numeração de documentos — OS e PO (Prompt 11) `[padrão de protótipo, ajustável]` — implementado
- Todo pedido (`ServiceRequest`) ganha um identificador legível **OS-AAMMDD-NNNNN** no
  momento da criação, ex.: `OS-260820-00001`. Todo orçamento (`Budget`) ganha
  **PO-AAMMDD-NNNNN**, ex.: `PO-260820-00001`.
- O sequencial reinicia em `00001` a cada dia, por tipo de documento — não é um contador
  global. Gerado em `src/lib/numeracao.ts` (`gerarNumeroDocumento`), via upsert atômico
  numa tabela de contadores (`SequenciaDiaria`), seguro mesmo com criações simultâneas.
- Visível pro cliente, worker e admin em toda tela que lista ou detalha um pedido/orçamento
  (facilita busca e referência em disputas/suporte) — não é só um campo interno.

## 4. Fora de escopo da v0.1 (não implementar ainda)

- Split de pagamento real / gateway de pagamento — simular com um status de pagamento mockado.
- Verificação de antecedentes / KYC completo — só um campo de status `verificado` manual (admin
  aprova).
- IA generativa real de triagem — usar o formulário guiado descrito em 3.2.
- Geofencing nativo mobile — usar navegador/web app responsivo.
- Multi-idioma, notificações push, app nativo iOS/Android.
