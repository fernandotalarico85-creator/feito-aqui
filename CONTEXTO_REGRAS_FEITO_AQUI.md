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

- **User** — campos base: id (chave interna), idCadastro (formato `C00000001` para cliente /
  `W00000001` para worker — prefixo + sequencial de 8 dígitos, ver Seção 3.9), nome, sobrenome,
  email, senha (hash), cpf, endereço completo (rua, número, complemento, bairro, cidade, estado
  — UF —, cep), fotoPerfil (opcional), tipo (`cliente` | `worker` | `admin`), criadoEm.
- **ClientProfile** — userId, carteira de créditos (tokens convertidos em R$). Endereço já vive
  no User (Seção 3.9) — não duplicar aqui.
- **WorkerProfile** — userId, categorias de serviço (array), região de atendimento, bio,
  portfólio (fotos antes/depois), status de verificação (`pendente` | `verificado`), documento de
  identidade para KYC (tipo + arquivo(s), Seção 3.9), nota média recente, taxa de conclusão no
  prazo, taxa de comparecimento, tempo médio de resposta, volume de serviços concluídos,
  elegívelParaTriagem (bool, corte de qualidade), destaquePago (bool + validade).
- **Agenda** — workerId, data, disponível (bool).
- **Project** (Seção 3.14) — pedido "guarda-chuva" só quando a categoria tem mais de 1
  sub-serviço; clienteId, categoryId, descrição livre. Agrupa os `ServiceRequest` filhos, um por
  sub-serviço, cada um com seu próprio ciclo de orçamento/aceite/booking.
- **ServiceRequest** (pedido do cliente, ou sub-serviço de um Project — Seção 3.14) —
  clienteId, projectId (opcional), descrição livre, categoria(s) sugeridas pela triagem,
  sub-serviços, janela de data desejada, status (`triagem` | `aguardando_orcamento`
  | `orcado` | `fechado` | `em_andamento` | `concluido` | `cancelado`).
- **Budget** (orçamento) — serviceRequestId, workerId, valor, prazoComprometido (definido pelo
  worker, não pela IA), status (`pendente` | `aceito` | `recusado`).
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

### 3.1 Comissão (Seção 6)
- Comissão padrão do protótipo: **10% do valor do serviço**, dividida 5% cliente + 5% worker
  `[padrão de protótipo, ajustável — plano define faixa de 8% a 20%, a validar]`.
- Cobrança só é gerada quando o `Budget` é aceito pelo cliente (`status = aceito`) — é esse
  evento que cria o `Booking` e a comissão. Nunca cobrar antes disso.
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
- Janela de tolerância de atraso antes de sinalizar: **20 minutos** após o horário combinado.
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

### 3.7 Papéis de acesso (para o protótipo)
- `cliente`: cria pedidos, aceita orçamentos, faz check-in de confirmação, avalia.
- `worker`: gerencia perfil/agenda, envia orçamentos, faz check-in/check-out.
- `admin` (Operações/Trust & Safety simplificado): vê disputas, decide contestações de
  avaliação, aplica/reverte strikes — um painel mínimo já cobre isso na v0.1.

### 3.8 Confirmação de conclusão e liberação de repasse (Seções 7 e 8)
- Ao terminar o serviço (check-out), o worker precisa marcar explicitamente "Concluí o
  serviço" e enviar pelo menos 1 foto do "depois" (resultado) — sem essa foto, o status não
  avança para concluído.
- No mesmo passo, o worker escolhe se publica a foto no portfólio público na hora ou adia a
  decisão; se adiar, pode publicar depois a qualquer momento pelo próprio perfil, sem prazo.
- Marcar conclusão NÃO libera o repasse sozinho: dispara uma notificação de confirmação para o
  cliente. O repasse final (a parcela ligada à entrega) só é processado depois que o cliente
  confirma a entrega, ou depois que um prazo de confirmação automática se esgota sem
  contestação.
- Prazo de confirmação automática: **72 horas** `[padrão de protótipo, ajustável]` — se o
  cliente não confirmar nem contestar nesse período, tratar como confirmado.
- Se o cliente contestar em vez de confirmar, não liberar essa parcela e abrir o fluxo de
  disputa (Seção 3.6).
- Objetivo: evitar que o worker marque conclusão só para acionar o pagamento, sem o cliente ter
  de fato confirmado que o serviço foi entregue como combinado.

### 3.9 Cadastro, ID e verificação de identidade (Seções 7 e 8 — ajuste de 22/08/2026)
- Cadastro (cliente e worker) exige: e-mail, senha, nome, sobrenome, CPF, endereço completo
  (rua, número, complemento, bairro, cidade, estado — dropdown com as 27 UFs do Brasil —, CEP) e
  foto de perfil. Todos os campos são obrigatórios para concluir o cadastro, exceto a foto de
  perfil (opcional).
- Ao digitar o CEP, buscar o endereço automaticamente (ex.: API pública ViaCEP —
  `https://viacep.com.br/ws/{cep}/json/`) e pré-preencher rua, bairro, cidade e estado; número e
  complemento continuam manuais.
- Campos editáveis depois de criado (correção de 22/08/2026): NOME, SOBRENOME, E-MAIL, ENDEREÇO
  e FOTO DE PERFIL podem ser editados a qualquer momento pelo próprio usuário (cliente ou
  worker). Só CPF e ID DE CADASTRO ficam permanentemente bloqueados — sem nenhuma forma de
  edição pelo usuário no protótipo.
- ID de cadastro: gerado automaticamente na criação, formato `C` + 8 dígitos sequenciais para
  cliente (ex.: `C00000001`) e `W` + 8 dígitos sequenciais para worker (ex.: `W00000001`) — dois
  contadores independentes, um por tipo de usuário. Esse ID é diferente da chave primária interna
  do banco e deve ficar visível no perfil do usuário.
- Verificação de documento (somente worker, obrigatório para concluir o cadastro): upload de um
  dos conjuntos — CNH; ou RG que já mostra o CPF; ou RG e CPF como dois documentos separados.
  Status de verificação de documento (`pendente` | `aprovado` | `rejeitado`) é distinto do
  status geral de verificação do worker (Seção 3.7) — sem OCR/validação automática no protótipo,
  a aprovação é manual pelo admin.
- Navegação (correção de 22/08/2026 — a versão anterior deste documento pedia para renomear
  "Meu perfil" para "Meu Portfólio", o que fundiu as duas telas por engano): o menu do worker,
  dentro do dropdown do nome do usuário logado (canto superior direito), deve ter TRÊS itens
  separados — "Meu Perfil", "Portfólio" e "Sair". "Meu Perfil" é a tela de cadastro (bloco
  "Dados de cadastro" somente leitura, exceto Nome/Sobrenome/E-mail que são editáveis conforme
  Prompt 13, + bloco de Endereço e Foto de perfil editável). "Portfólio" é uma tela DIFERENTE e
  com uma ROTA/PÁGINA própria: a galeria pública de fotos antes/depois do worker (Seções 7 e 8),
  incluindo as fotos do "depois" que o worker optar por publicar na conclusão do serviço (Seção
  3.8) — NÃO é o mesmo formulário de endereço reaproveitado com um título trocado.
- Visibilidade do menu (correção de 22/08/2026): o item "Portfólio" só aparece para usuários do
  tipo `worker` — cliente não tem portfólio de fotos de trabalho, então não deve ver esse item
  no seu próprio menu.
- Menu do cliente (correção de 22/08/2026): segue o MESMO padrão do worker — dropdown no nome
  do usuário logado (canto superior direito) com "Meu Perfil" e "Sair" (sem "Portfólio", que é
  exclusivo do worker). "Meu Perfil" do cliente reúne os mesmos blocos do worker (Dados de
  cadastro com Nome/Sobrenome/E-mail editáveis e CPF/ID travados + Endereço e Foto de perfil
  editável), só sem o campo "Documento de verificação" (isso é exigido só do worker). "Meu
  Perfil" e "Sair" existem SOMENTE dentro do dropdown — não devem aparecer soltos na barra de
  navegação horizontal.

### 3.10 Menu do admin (correção de 22/08/2026)
Assim como cliente e worker, o admin passa a ter todos os itens hoje soltos na barra horizontal
reorganizados dentro de um dropdown no nome do usuário logado, com dois grupos e um item solto:

- **Clientes** (grupo)
  - Perfil — placeholder por enquanto; a área completa de clientes cadastrados (listagem, busca
    por nome/CPF, detalhe de cada cliente) é escopo de um prompt futuro, não deste.
  - Strikes — fila de strikes/contestação referente a clientes (reaproveitar a fila de
    strikes/disputas do admin já existente — Seção 3.6 —, filtrando por `clienteId` se possível;
    se não for possível filtrar ainda, apontar para a fila geral por enquanto).
- **Workers** (grupo)
  - Perfil — placeholder por enquanto; visão analítica/sintética de todos os workers cadastrados
    é escopo de um prompt futuro.
  - Aprovar Perfil — link para a página de aprovação/verificação de documento do worker que JÁ
    EXISTE e já funciona (onde o admin muda `documentoStatus` para `aprovado`/`rejeitado` —
    Seção 3.9). O título exibido NA PÁGINA passa a ser "Aprovar Workers" (não "Workers").
  - Portfólio — placeholder por enquanto (visão do admin sobre os portfólios dos workers).
  - Strikes — fila de strikes/contestação referente a workers (mesma fila existente da Seção
    3.6, filtrando por `workerId` se possível).
  - Repasses — placeholder por enquanto (visão do admin sobre os repasses/pagamentos aos
    workers — Seção 3.8).
  - Disputas — fila de disputas mediadas que já existe (Seção 3.6/Dispute).
- **Sair** — item solto, fora dos dois grupos.

Itens marcados "placeholder por enquanto" devem existir como link funcional (sem 404), mostrando
uma tela simples de "Em construção" — a funcionalidade real desses itens é escopo de prompts
futuros, não deste ajuste de menu.

### 3.11 Menu do worker e do cliente completos (Prompts 17 e 18)
Expandindo 3.9: TODOS os itens de navegação de cliente e worker (não só "Meu Perfil"/
"Portfólio"/"Sair") ficam dentro do dropdown do nome, como lista única (sem grupos — isso é
só do admin, Seção 3.10):
- **Worker**: Pedidos Recebidos, Meus Orçamentos, Strikes, Agenda, Meus Ganhos, Destaque,
  Portfólio, Meu Perfil, Sair — nessa ordem. A barra horizontal fica só com o nome/dropdown.
- **Cliente**: Meus Pedidos, Minha Carteira, Perfil, Sair — nessa ordem. "+ Novo Pedido"
  continua fora do dropdown, na barra horizontal — é uma ação/CTA principal, não item de
  navegação.
- Nenhuma rota muda: é só reorganização de navegação/UI.

### 3.12 "Meu Perfil" como cartão de contato (Prompt 19)
Redesenho visual de "Meu Perfil" (cliente e worker) — as regras de quem pode editar o quê
(Seção 3.9: Nome/Sobrenome/E-mail/Endereço/Foto editáveis; CPF e ID de cadastro travados) não
mudam, só a organização visual e como a edição é acionada. Layout em 2 colunas
(`src/components/PerfilCard.tsx`, reaproveitado por cliente e worker):
- **Cartão de identidade** (coluna esquerda, fixo): avatar, nome completo, etiqueta de papel
  ("Cliente"/"Worker"), tags de categoria (só worker), ID de cadastro com ícone de cadeado,
  botão "Enviar mensagem" (decorativo, sem funcionalidade — chat é escopo futuro), navegação
  vertical com "Informações" (ativo) e "Minha Carteira" (linka para a carteira/ganhos que já
  existe — `/cliente/carteira` ou `/worker/ganhos` — só o rótulo do item do menu muda).
- **Painel "Informações"** (coluna direita): Identificação (ID + CPF, sempre com cadeado),
  Dados pessoais (Nome/Sobrenome/E-mail), Endereço, Foto de perfil, e — só worker — status do
  Documento de verificação. Estado padrão é somente leitura (texto estático, sem botão
  "Salvar" visível).
- **Menu "⋮"** no cartão de identidade, com exatamente duas opções: "Editar Perfil" (alterna o
  painel para modo de edição — CPF/ID continuam travados mesmo editando — com botões
  "Cancelar"/"Salvar alterações") e "Excluir conta" (abre confirmação; como essa
  funcionalidade não existe no protótipo, a confirmação termina num aviso de que exclusão de
  conta ainda não está disponível, sem apagar nada de verdade).
- A seção "Dados do perfil" do worker (bio, região de atendimento, categorias atendidas) não
  fazia parte do escopo deste redesenho — continua como uma seção própria, abaixo do cartão,
  com seu próprio formulário sempre editável (inalterada).

### 3.13 Identidade visual exclusiva de "Meu Perfil" (Prompt 20) `[exceção pontual]`
Só a tela "Meu Perfil" (cliente e worker) usa uma paleta/tipografia própria — todo o resto do
protótipo (barra superior, outras páginas dos dropdowns, admin) continua com o estilo padrão
(stone/Geist). Definida em `src/lib/fontsPerfil.ts` (fontes) e aplicada diretamente via classes
Tailwind arbitrárias em `src/components/PerfilCard.tsx` e nas páginas
`/cliente/perfil`/`/worker/perfil` (incluindo a seção "Dados do perfil" do worker, pra não
ficar visualmente inconsistente com o resto da tela):
- Cores: `#1F4E5F` (primária — títulos, botão "Salvar alterações", pill "Cliente"), `#3F7C8A`
  (secundária — tags de categoria do worker, item ativo "Informações" no menu vertical),
  `#C0592C` (pill "Worker"), `#E7EEF0` (fundo suave de badges/botão "Enviar mensagem"),
  `#243138` (texto principal), `#667680` (texto secundário/labels de seção em maiúsculas).
- Tipografia: Manrope (700–800) via Google Fonts em títulos, labels de seção e nome do
  usuário; Inter no texto corrido e nos valores dos campos.
- Cards com cantos arredondados (~16px) e sombra suave; avatar com gradiente
  primária→secundária quando não há foto; badges de ID/CPF com ícone de cadeado.
- Confirmado por teste manual (clique real, não só programático) que o menu "⋮ > Editar"
  funciona ponta a ponta nas duas telas depois da mudança visual.

### 3.14 Projeto multi-worker (Prompt 22)
Categoria com mais de 1 sub-serviço (ex.: "Reforma de banheiro" → hidráulica, elétrica,
impermeabilização, revestimento, marcenaria, pintura) vira um `Project` "guarda-chuva" com um
`ServiceRequest` FILHO por sub-serviço, em vez de um único pedido cobrindo tudo:
- Cada filho tem seu próprio `numeroOS`, orçamentos, aceite, `Booking` e comissão — igual a um
  pedido avulso, sem nenhuma mudança na lógica de fechamento/comissão em si (Seção 3.1). Aceitar
  o orçamento de um sub-serviço não afeta os demais; cancelamento/atraso/disputa/avaliação em um
  também são isolados (cada `ServiceRequest` já seguia essas regras individualmente).
- Categoria com 0 ou 1 sub-serviço continua exatamente como antes — sem `Project`, um único
  `ServiceRequest`.
- Cliente vê os sub-serviços de um mesmo Project agrupados em "Meus Pedidos" sob um cabeçalho
  único com contagem agregada ("X de Y serviços fechados" — conta como fechado
  `FECHADO`/`EM_ANDAMENTO`/`CONCLUIDO`); abrir o grupo (`/cliente/projetos/[id]`) mostra cada
  sub-serviço com seu próprio card, reaproveitando as telas de pedido avulso (orçamentos,
  acompanhamento) sem modificação.
- Worker não precisa saber que um pedido faz parte de um Project maior — cada sub-serviço chega
  pra ele como um `ServiceRequest` normal da categoria, com o nome do sub-serviço no
  `descricaoLivre`/`subServicosJson`.

## 4. Fora de escopo da v0.1 (não implementar ainda)

- Split de pagamento real / gateway de pagamento — simular com um status de pagamento mockado.
- Verificação de antecedentes / KYC completo — só um campo de status `verificado` manual (admin
  aprova).
- IA generativa real de triagem — usar o formulário guiado descrito em 3.2.
- Geofencing nativo mobile — usar navegador/web app responsivo.
- Multi-idioma, notificações push, app nativo iOS/Android.
