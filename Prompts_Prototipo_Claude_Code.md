# Feito Aqui — Prompts para o Claude Code (Protótipo v0.1)

## Como usar este arquivo

1. Crie uma pasta nova vazia no seu computador (ex.: `feito-aqui-prototipo`) e abra o **Claude
   Code** dentro dela (`claude` no terminal, dentro da pasta).
2. Copie o arquivo `CONTEXTO_REGRAS_FEITO_AQUI.md` para dentro dessa mesma pasta antes do
   primeiro prompt — ele é a "fonte da verdade" das regras de negócio que os prompts abaixo
   vão referenciar. Também vale copiar `Plano_de_Negocios_App_Servicos.docx` para lá, caso
   quaisquer dos prompts precisem consultar algum detalhe que não esteja no resumo.
3. Cole os prompts **um de cada vez, em ordem**, e revise o resultado antes de colar o próximo
   (rode o projeto, dê uma olhada no que foi gerado). Não cole todos de uma vez — cada um
   assume que o anterior já foi concluído.
4. Isso é um **protótipo/prova de conceito**, não o produto final — o objetivo é validar o
   fluxo e mostrar a ideia funcionando, não é para produção nem lida com dinheiro real.

---

## Prompt 0 — Contexto e escopo do projeto (cole primeiro, sempre)

```
Você vai me ajudar a construir um protótipo funcional (versão 0.1) do app "Feito Aqui" — um
marketplace de serviços sob demanda que conecta clientes a prestadores de serviço autônomos
("workers"), começando pela vertical de reforma/construção civil.

Antes de escrever qualquer código, leia o arquivo CONTEXTO_REGRAS_FEITO_AQUI.md nesta pasta —
ele documenta as entidades de dados e as regras de negócio (comissão, ranking, geolocalização,
tokens, penalidades) que este protótipo precisa seguir. Trate esse arquivo como a fonte de
verdade do produto ao longo de todo o projeto; sempre que eu pedir uma feature nova, volte a
ele antes de implementar.

Este é um PROTÓTIPO DE DEMONSTRAÇÃO, não produto final: pode usar dados mockados/simulados
onde fizer sentido (pagamento, geolocalização sem GPS real, etc.), mas as REGRAS DE NEGÓCIO
(comissão, ranking, tokens, penalidades, check-in) precisam funcionar de verdade dentro do
banco de dados e da interface — ou seja, é para simular a operação de ponta a ponta, não só a
aparência visual.

Stack sugerida (pode ajustar se tiver uma razão técnica melhor, mas me avise e explique por
quê): Next.js (App Router) + TypeScript + Tailwind CSS para o front-end, Prisma ORM com
SQLite para o banco de dados (simples de rodar localmente, sem precisar instalar servidor de
banco), e autenticação simples baseada em sessão (não precisa OAuth nem provedores externos
nesta fase — login com email/senha já basta).

Antes de começar a codar, me mostre um plano curto: estrutura de pastas proposta, e a ordem em
que você pretende construir as peças (modelo de dados → fluxo do cliente → fluxo do worker →
fechamento/comissão → check-in → ranking → avaliações/tokens → painel admin). Espere minha
confirmação antes de começar a gerar código.
```

## Prompt 1 — Setup do projeto e modelo de dados

```
Pode seguir com o setup. Faça o scaffold do projeto Next.js + TypeScript + Tailwind, configure
o Prisma com SQLite, e crie o schema.prisma implementando as entidades descritas na seção 2 de
CONTEXTO_REGRAS_FEITO_AQUI.md (User, ClientProfile, WorkerProfile, Agenda, ServiceRequest,
Budget, Booking, Review, WalletTransaction, Strike, Dispute).

Rode a migração inicial e crie um script de seed (dados de teste) com pelo menos: 2 clientes,
5 workers (variando categoria, nota, status de verificação e se tem destaque pago ativo — pelo
menos 1 worker novo sem histórico, para testar a regra de cold start da Seção 3.3), e uma
taxonomia inicial de categorias/sub-serviços para "Reforma de banheiro" (hidráulica, elétrica,
impermeabilização, revestimento, marcenaria, pintura — nessa ordem).

No final, me dê o comando para rodar o projeto localmente e confirme que o banco foi criado e
populado com sucesso.
```

## Prompt 2 — Fluxo do cliente: pedido, triagem guiada e ranking

```
Implemente o fluxo do cliente:

1. Tela de login/cadastro simples de cliente.
2. Tela de novo pedido: cliente escolhe a categoria (ex.: "Reforma de banheiro") a partir da
   taxonomia cadastrada, o sistema mostra automaticamente os sub-serviços envolvidos e a ordem
   sugerida de execução (regra da Seção 3.2 do contexto — formulário guiado, não IA real ainda).
   Cliente informa a janela de data desejada.
3. Tela de resultado: lista de workers recomendados, já ordenados pelo algoritmo de ranking
   descrito na Seção 3.3 do contexto (implemente a fórmula de pesos ali definida como uma
   função separada e testável, tipo calcularScoreRanking(worker)). Deixe visualmente clara a
   separação entre resultados orgânicos e um bloco "Patrocinado" à parte, mesmo que hoje só
   tenhamos 1 worker de teste com destaque pago ativo.
4. Cliente consegue abrir o perfil de um worker (portfólio, nota, depoimentos) e solicitar
   orçamento.

Depois de implementar, me explique brevemente onde ficou a função de cálculo do ranking, para
eu conseguir revisar os pesos depois.
```

## Prompt 3 — Fluxo do worker: cadastro, agenda e orçamento

```
Agora implemente o fluxo do worker:

1. Tela de login/cadastro de worker: categorias atendidas, região, bio, upload de fotos de
   portfólio (pode ser upload local/mock, não precisa de storage em nuvem nesta fase).
2. Tela de agenda simples (marcar dias disponíveis/ocupados).
3. Tela de "pedidos recebidos": worker vê pedidos compatíveis com sua categoria e agenda (sem
   dados de contato do cliente ainda — regra do plano é só liberar contato após o fechamento).
4. Worker consegue responder com um orçamento: valor + prazo que ELE define (não é a IA que
   define o prazo final, é o worker — deixe isso explícito na interface, tipo um campo "Meu
   prazo de entrega").

Ao final, popule o seed com pelo menos 2 orçamentos de teste pendentes de aceite.
```

## Prompt 4 — Fechamento do orçamento e comissão

```
Implemente o fechamento do serviço:

1. Cliente vê o(s) orçamento(s) recebidos para o pedido e pode aceitar um.
2. Ao aceitar, crie um registro de Booking, calcule a comissão segundo a regra da Seção 3.1 do
   contexto (10% dividido 5%/5%, como constante configurável em um arquivo de config, não
   hardcoded espalhado pelo código), e SÓ NESSE MOMENTO libere os dados de contato completos
   entre cliente e worker.
3. Simule o "pagamento" como um status mockado (ex.: pagamentoStatus: "simulado_aprovado") —
   não integre gateway de pagamento real nesta fase.
4. Mostre ao cliente e ao worker uma tela de acompanhamento do serviço com o status atual
   (fechado → em andamento → concluído).

Me mostre onde ficou a constante de percentual de comissão, para eu saber onde ajustar depois.
```

## Prompt 5 — Check-in / check-out por geolocalização

```
Implemente o controle de check-in/check-out descrito na Seção 3.4 do contexto:

1. No dia do serviço, o worker tem um botão "Cheguei" que captura a localização (use a
   Geolocation API do navegador; como estamos rodando local, adicione também um campo manual
   de latitude/longitude para eu conseguir testar sem precisar estar fisicamente no endereço).
2. Compare a localização capturada com o endereço do pedido dentro do raio de geofence definido
   no contexto (150m) — se estiver dentro, marque check-in confirmado; se fora, mostre um aviso
   mas permita ao worker confirmar mesmo assim (fica registrado para revisão).
3. Sinalize automaticamente (um campo/flag no Booking) se o check-in aconteceu depois da janela
   de tolerância de atraso (20 min), e se houve saída prolongada sem check-out (40 min) — pode
   simular isso com um botão de "simular passagem de tempo" já que não teremos rastreamento
   contínuo real rodando no protótipo.
4. Botão "Concluí" faz o check-out, registrando horário e localização final.
5. Cliente vê, na tela de acompanhamento, o status por evento ("worker chegou às 09h05",
   "concluído às 17h10") — não um mapa ao vivo, conforme a recomendação de privacidade do
   plano.
```

## Prompt 6 — Avaliação, tokens e réplica do worker

```
Implemente o fluxo de avaliação e o sistema de tokens da Seção 3.5 do contexto:

1. Após o check-out, cliente é convidado a avaliar o serviço (nota 1–5, depoimento, fotos).
2. Ao enviar a avaliação, credite 500 tokens (= R$5, conforme a constante do contexto) na
   carteira do cliente, mas com status "carencia" por 4 dias antes de virar "liberado" — pode
   simular a passagem do tempo com um botão de teste, como no prompt anterior.
3. Implemente a réplica do worker: dentro da janela de carência, o worker pode contestar a
   avaliação (texto + upload de foto), o que muda o status da review para "em_analise".
4. Crie uma regra simples: enquanto "em_analise", a nota não conta no cálculo de ranking do
   worker (ajuste a função de ranking do Prompt 2 para checar isso).
5. Mostre ao cliente uma tela de "Minha carteira" com o saldo de créditos e o status de cada
   crédito (em carência / liberado / usado / estornado).
```

## Prompt 7 — Painel administrativo (disputas e penalidades)

```
Implemente um painel administrativo simples (login separado, tipo "admin") cobrindo a Seção
3.6 e a parte de disputas do contexto:

1. Lista de reviews com status "em_analise" — admin vê a nota, o depoimento e a réplica do
   worker lado a lado, e decide: manter a nota (nada muda) ou reverter (estorna os tokens do
   cliente e a nota não conta no ranking).
2. Lista de strikes/penalidades aplicadas, com filtro por worker e por gravidade.
3. Uma tela simples para registrar manualmente um strike (ex.: no-show reportado), escolhendo
   o tipo de infração da tabela da Seção 3.6 do contexto, que já preenche a gravidade e a ação
   sugerida automaticamente.
4. Um contador visível de "workers com 3+ strikes médios nos últimos 6 meses" — regra de
   suspensão para revisão manual do contexto.
```

## Prompt 8 — Ajustes finais e README

```
Para fechar a v0.1:

1. Revise a navegação geral: crie uma tela inicial simples que explica o protótipo e linka para
   os três logins (cliente, worker, admin) com usuários de teste já criados no seed (mostre as
   credenciais na própria tela de login, já que é só um protótipo local).
2. Escreva um README.md explicando: como rodar o projeto localmente, quais regras de negócio
   foram implementadas de verdade vs. simuladas (liste o que está em CONTEXTO_REGRAS_FEITO_AQUI.md
   na seção "Fora de escopo da v0.1"), e onde ficam as constantes configuráveis (comissão, pesos
   do ranking, raio da geofence, valor dos tokens, janelas de tempo) para eu conseguir ajustar
   sem mexer na lógica.
3. Rode uma checagem geral: existe algum fluxo quebrado (ex.: erro ao aceitar orçamento, ao
   fazer check-in, ao avaliar)? Liste qualquer limitação conhecida no próprio README, numa
   seção "Limitações conhecidas da v0.1".
```

## Prompt 9 — Corrigir pontos de atenção encontrados na revisão da v0.1

```
Depois de revisar o que foi construído até aqui, encontramos 5 lacunas que precisam ser
fechadas antes de considerar a v0.1 completa. Implemente cada uma, consultando
CONTEXTO_REGRAS_FEITO_AQUI.md sempre que precisar confirmar a regra:

1. FLUXO DE CANCELAMENTO — hoje não existe nenhuma forma de cancelar um pedido/booking.
   Implemente dois casos:
   a) Cancelamento ANTES do fechamento (ainda em ServiceRequest/Budget): cliente pode cancelar
      livremente; worker pode recusar/retirar um orçamento enviado. Sem strike nesses casos.
   b) Cancelamento DEPOIS do fechamento (já existe Booking):
      - Se for o WORKER cancelando, aplique a regra da tabela da Seção 3.6 do contexto
        ("Cancelamento tardio pelo worker") — grave um Strike com gravidade proporcional à
        proximidade da data combinada (ex.: menos de 24h = tratar como equivalente a no-show;
        mais de 72h = strike leve/médio). Torne essa janela uma constante configurável.
      - Se for o CLIENTE cancelando, não gere strike na primeira vez, mas registre o evento
        (ex.: um campo cancelamentosCliente no ClientProfile) — se o mesmo cliente já tiver 2+
        cancelamentos tardios nos últimos 90 dias, gere um Strike para ele também, conforme o
        princípio "a relação de confiança é de mão dupla" do contexto/plano.
   Em ambos os casos de cancelamento pós-fechamento, mude o status do Booking para "cancelado"
   e implemente a lógica de reembolso descrita no item 3 abaixo quando fizer sentido.

2. TELA DE "COMPRAR DESTAQUE" — hoje o destaque pago só existe via seed, não há como o worker
   ativá-lo pela interface, mesmo já tendo a constante NOTA_MINIMA_PARA_DESTAQUE definida.
   Implemente uma tela no painel do worker: mostrar se ele está elegível (nota atual >=
   NOTA_MINIMA_PARA_DESTAQUE); se estiver, permitir "comprar" um período de destaque (ex.: 7
   dias, valor mockado, pagamento simulado como no fechamento de serviço) que ativa o campo
   destaquePago + validade no WorkerProfile. Se a nota estiver abaixo do piso, mostre o motivo
   pelo qual o botão está desabilitado (não deixe só sumir sem explicação).

3. REEMBOLSO AUTOMÁTICO EM NO-SHOW — hoje o strike de no-show é registrado, mas nenhum
   reembolso é executado de fato. Ao registrar um strike do tipo "No-show" (seja pelo fluxo
   manual do admin, seja automaticamente quando o check-in nunca acontece dentro da janela),
   crie de fato uma transação de reembolso/crédito para o cliente ligada ao Booking (pode ser
   um novo tipo de WalletTransaction, ex.: "reembolso_no_show", com o valor cheio pago pelo
   cliente naquele booking) e atualize o status de pagamento do Booking para refletir isso
   (ex.: "reembolsado"). Mostre esse crédito na tela "Minha carteira" do cliente.

4. TELA DE CONTESTAÇÃO DE STRIKE — hoje só a contestação de avaliação (Prompt 6) tem fluxo
   completo; o worker não tem como contestar um strike. Implemente, espelhando o padrão já
   usado para contestação de avaliação: tela no painel do worker listando seus strikes, com
   botão "Contestar" (texto + evidências) disponível só dentro de uma janela de 48h a partir do
   registro do strike (regra da Seção 3.6 do contexto). Isso muda o status do strike para
   "em_contestacao". No painel admin, adicione a fila de strikes em contestação ao lado da fila
   de avaliações em contestação (pode reaproveitar o mesmo componente/lógica de decisão:
   manter o strike ou revogá-lo). Strikes de infração "gravíssima" (fraude/segurança) não têm
   direito a essa contestação, conforme o plano — trate isso explicitamente na regra, não só
   na interface.

5. RECALCULAR taxaConclusaoPrazo E taxaComparecimento DE VERDADE — hoje esses dois campos do
   WorkerProfile são estáticos, vêm só do seed, e nunca são recalculados. Troque para cálculo
   dinâmico a partir do histórico real de Bookings do worker toda vez que um Booking muda para
   "concluido" ou "cancelado" (ou, se preferir, calcule sob demanda dentro da própria função de
   ranking em vez de manter como campo salvo — me diga qual abordagem você escolheu e por quê):
   - taxaConclusaoPrazo = % de bookings concluídos em que a conclusão aconteceu até o prazo que
     o worker se comprometeu no orçamento.
   - taxaComparecimento = % de bookings em que houve check-in confirmado dentro da janela de
     tolerância, sobre o total de bookings fechados (não cancelados antes do dia do serviço).
   Depois de implementar, rode novamente o cálculo de ranking (Prompt 2) e confirme que os
   números deixaram de bater exatamente com os valores fixos do seed original, como evidência
   de que o recálculo está funcionando.

Ao final, me dê um resumo curto do que mudou em cada um dos 5 itens e onde ficou cada peça de
lógica nova, para eu conseguir revisar.
```

---

## Prompt 10 — Confirmação de conclusão com foto (antes de liberar o repasse)

```
Nova regra de negócio, já documentada na Seção 3.8 do CONTEXTO_REGRAS_FEITO_AQUI.md (e nas
Seções 7 e 8 do plano de negócios): hoje, na tela "Meus ganhos > [serviço]", o worker vê o
repasse dividido em parcelas ("Aceite do orçamento", "Pontualidade no check-in", "Conclusão do
serviço") e a parcela de conclusão já aparece como "Liberado" assim que o status do booking
muda para concluído — ou seja, o worker recebe só por se autodeclarar concluído, sem o cliente
ter confirmado nada. Isso precisa mudar. Implemente:

1. MARCAR CONCLUSÃO COM FOTO OBRIGATÓRIA — no fluxo de check-out do worker (Prompt 5), ao tocar
   em "Concluí o serviço", exija o upload de pelo menos 1 foto do "depois" (resultado) antes de
   permitir confirmar a ação. Sem foto anexada, não deixe o status avançar para concluído.
   Guarde a(s) foto(s) associada(s) ao Booking (ex.: uma tabela ServicePhoto ou array de URLs).

2. OPÇÃO DE PUBLICAR NO PORTFÓLIO NA HORA OU DEPOIS — no mesmo passo de upload, mostre um
   toggle/checkbox "Publicar esta foto no meu portfólio agora". Se marcado, a foto já entra na
   galeria pública do worker (mesma listagem usada no perfil/portfólio antes-depois). Se não
   marcado, a foto fica salva só no serviço, e o worker precisa poder publicá-la depois, a
   qualquer momento, a partir da tela "Meu perfil > Portfólio" (adicione lá uma ação para
   promover fotos de serviços já concluídos que ainda não foram publicadas).

3. TOKEN DE CONFIRMAÇÃO DO CLIENTE — ao marcar conclusão com a foto, NÃO libere a parcela final
   do repasse nem mude o status de pagamento para "Liberado" automaticamente. Em vez disso:
   - Crie um registro de confirmação pendente (ex.: campo `statusConclusao` no Booking:
     `aguardando_confirmacao_cliente` → `confirmado` ou `contestado`) e notifique o cliente
     (na prática do protótipo, basta um badge/alerta na tela de pedidos do cliente e/ou no
     dashboard, já que não há push real na v0.1).
   - No painel do cliente, adicione uma tela/ação "Confirmar conclusão do serviço" mostrando a
     foto enviada pelo worker, com dois botões: "Confirmar entrega" (libera a parcela final de
     repasse e abre a avaliação, como já acontece hoje) ou "Contestar" (abre o fluxo de disputa
     do Prompt 7, sem liberar a parcela).
   - Implemente a confirmação automática: se o cliente não confirmar nem contestar dentro de
     **72 horas** (constante configurável) a partir da marcação de conclusão, trate como
     confirmado automaticamente e libere a parcela — pode ser um job/checagem simples rodada a
     cada carregamento do dashboard admin, não precisa de scheduler real no protótipo.

4. AJUSTE A TELA "Meus ganhos" — a parcela "Conclusão do serviço (resto)" só deve aparecer como
   "Liberado" depois da confirmação (manual ou automática) do cliente; enquanto isso, mostre um
   status intermediário, tipo "Aguardando confirmação do cliente" (com a data-limite da
   confirmação automática visível), em vez de "Liberado" direto.

Ao final, me mostre onde ficou cada peça (modelo de dados, tela do worker, tela do cliente,
lógica de auto-confirmação) e rode o fluxo ponta a ponta pra confirmar que a parcela final só
libera depois da confirmação (ou do prazo esgotado).
```

---

## Prompt 11 — Cadastro completo (endereço, CEP, documento, ID sequencial) e reorganização do menu

```
Ajustes na tela de cadastro/perfil do protótipo, já documentados na Seção 3.9 do
CONTEXTO_REGRAS_FEITO_AQUI.md. Implemente:

1. CAMPOS DE CADASTRO — para cliente e worker, o cadastro (e o modelo User/ClientProfile/
   WorkerProfile) precisa reunir: e-mail, senha, nome, sobrenome, CPF, endereço completo (rua,
   número, complemento, bairro, cidade, estado, CEP) e foto de perfil. Todos obrigatórios para
   concluir o cadastro, EXCETO a foto de perfil (opcional). Ajuste o formulário de cadastro (e a
   migration/schema do banco) para refletir isso — se já existirem usuários de seed sem esses
   campos, preencha com dados fictícios plausíveis para não quebrar o seed.

2. DROPDOWN DE ESTADO (UF) — o campo Estado deve ser uma lista suspensa com as 27 siglas de
   unidade federativa do Brasil (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR,
   PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO), não um campo de texto livre.

3. AUTOPREENCHIMENTO POR CEP — ao digitar/sair do campo CEP, consulte a API pública do ViaCEP
   (`https://viacep.com.br/ws/{cep}/json/`, gratuita e sem chave) e preencha automaticamente rua,
   bairro, cidade e estado a partir da resposta; número e complemento continuam sendo digitados
   manualmente pelo usuário. Trate o caso de CEP inválido/não encontrado com uma mensagem clara,
   sem travar o formulário.

4. EDIÇÃO RESTRITA APÓS CADASTRO — na tela de edição de perfil (cliente e worker), só os campos
   de ENDEREÇO e FOTO DE PERFIL podem ser alterados depois que o cadastro é criado. Os demais
   campos (nome, sobrenome, CPF, e-mail) devem aparecer como somente leitura — não implemente uma
   tela de alteração desses campos no protótipo.

5. ID DE CADASTRO SEQUENCIAL — ao criar um novo cadastro, gere automaticamente um ID visível
   (diferente da chave primária interna do banco, se preferir manter uma separada) no formato: `C`
   + 8 dígitos sequenciais para cliente (ex.: C00000001, C00000002...) e `W` + 8 dígitos
   sequenciais para worker (ex.: W00000001, W00000002...) — dois contadores independentes, um por
   tipo. Mostre esse ID no perfil do usuário (e no painel admin, se fizer sentido, como referência
   de busca).

6. DOCUMENTO DE VERIFICAÇÃO (SOMENTE WORKER, OBRIGATÓRIO) — no cadastro do worker, exija o upload
   de foto/arquivo de comprovação de identidade antes de considerar o cadastro completo. Aceite um
   dos três formatos: (a) CNH; (b) RG que já mostra o CPF; ou (c) RG e CPF como dois uploads
   separados — implemente como uma escolha do tipo de documento seguida do(s) campo(s) de upload
   correspondente(s). Guarde o(s) arquivo(s) associado(s) ao WorkerProfile com um status de
   verificação (ex.: `documentoStatus`: `pendente` | `aprovado` | `rejeitado`) — não precisa de
   OCR/validação automática no protótipo, só o upload e um status que o admin possa mudar
   manualmente no painel (Prompt 7).

7. RENOMEAR E REPOSICIONAR "MEU PERFIL" → "MEU PORTFÓLIO" — no menu do worker, renomeie o item
   "Meu perfil" para "Meu Portfólio", e mova esse link para ficar junto ao nome do usuário logado
   no canto superior direito (perto de onde hoje aparece o nome, ex. "Roberto Alves"), em vez de
   continuar como um item solto no meio da barra de navegação horizontal — pode virar um
   menu/dropdown ao clicar no nome do usuário, com "Meu Portfólio" e "Sair" dentro dele.

Ao final, me mostre o formulário de cadastro atualizado (print ou descrição das telas), o formato
final do ID gerado, e onde ficou a lógica de autopreenchimento por CEP.
```

---

## Prompts extras (opcionais, use quando fizer sentido)

### Gerar uma versão de demonstração publicável

```
Prepare este protótipo para eu conseguir mostrar para outras pessoas por um link, sem precisar
rodar nada localmente (ex.: deploy no Vercel com o banco SQLite trocado por um Postgres
gerenciado gratuito, ou outra solução simples que você recomende). Me explique o passo a passo
que eu preciso seguir na minha conta (criação de conta no serviço, variáveis de ambiente etc.)
— não tente fazer login em nenhum serviço por mim.
```

### Pedir para o Claude Code atualizar uma regra específica depois de mudar o plano

```
Atualizei a regra de [comissão / ranking / tokens / geofence / penalidades] no
CONTEXTO_REGRAS_FEITO_AQUI.md (seção X). Releia essa seção e ajuste a constante e/ou a lógica
correspondente no código para refletir o novo valor/regra. Me mostre o diff antes de aplicar.
```
