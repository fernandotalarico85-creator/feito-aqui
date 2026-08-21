# Deploy do protótipo — Vercel + Postgres + Blob

Este guia assume que você (não eu) vai criar as contas e clicar nos botões — eu já preparei o
código pra funcionar assim que as variáveis de ambiente estiverem certas. Nada aqui exige cartão
de crédito: Vercel, Neon e o Blob store têm plano gratuito suficiente pra um protótipo de
demonstração.

## O que mudou no código pra isso funcionar

- **Banco**: trocado de SQLite (arquivo local) para PostgreSQL (`@prisma/adapter-pg`) — Vercel
  não tem disco persistente entre deploys, então um arquivo `.db` local não sobreviveria.
- **Upload de fotos**: trocado de `public/uploads/` (disco local) para
  [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — pelo mesmo motivo: o filesystem
  do deploy é somente leitura em produção.
- Migrations do Prisma foram regeneradas para o dialeto Postgres (as antigas eram SQLite, não
  compatíveis).

## Passo 1 — Criar o banco Postgres (Neon)

1. Crie uma conta em **[neon.tech](https://neon.tech)** (dá pra entrar direto com GitHub/Google)
   — ou, se preferir manter tudo dentro da Vercel, crie o projeto na Vercel primeiro (Passo 2) e
   adicione o Postgres pela aba **Storage** do projeto (é o Neon por baixo, mesma coisa, um
   clique a mais de integração automática de variável de ambiente).
2. Crie um projeto/banco novo (qualquer nome, ex.: `feito-aqui`).
3. No painel do Neon, copie a **connection string**. Use a versão **"Pooled connection"** (não
   a direta) — o nome do host tem `-pooler` nele. Isso importa porque a Vercel roda cada
   requisição numa função serverless separada, e sem o pooler o banco fica sem conexões
   disponíveis rápido.
4. Guarde essa string — você vai colar como `DATABASE_URL` no Passo 3.

## Passo 2 — Subir o código pra Vercel

A Vercel pode publicar direto de um repositório Git (GitHub/GitLab/Bitbucket) — é o jeito
recomendado, porque cada push depois vira um novo deploy automático.

1. Crie uma conta em **[vercel.com](https://vercel.com)**.
2. Se ainda não tiver, crie um repositório no GitHub e suba este projeto pra lá (posso te ajudar
   com os comandos `git init` / `git add` / `git commit` / `git push` assim que você tiver
   criado o repositório vazio no GitHub e me passar a URL — só não crio a conta nem autentico
   por você).
3. No painel da Vercel, clique em **Add New → Project**, escolha o repositório.
4. **Não clique em "Deploy" ainda** — antes, configure as variáveis de ambiente e o build
   command nos passos 3 e 4 abaixo (dá pra editar depois em Settings também, mas evita um
   primeiro deploy quebrado).

## Passo 3 — Variáveis de ambiente

Na tela de configuração do projeto (ou em **Settings → Environment Variables** depois), adicione:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | a connection string **pooled** do Neon (Passo 1) |
| `BLOB_READ_WRITE_TOKEN` | ver Passo 4 — só dá pra pegar depois de criar o Blob store |

Se você criou o Postgres pela aba **Storage** da própria Vercel (integração Neon), o
`DATABASE_URL` já é preenchido automaticamente — não precisa colar na mão.

## Passo 4 — Criar o Blob store (upload de fotos)

1. No projeto na Vercel, vá em **Storage → Create Database → Blob**.
2. Dê um nome (ex.: `feito-aqui-uploads`) e crie.
3. A Vercel já linka automaticamente ao projeto e preenche `BLOB_READ_WRITE_TOKEN` nas
   variáveis de ambiente — confirme em **Settings → Environment Variables** que ela apareceu.

## Passo 5 — Ajustar o build command (migrations)

Por padrão a Vercel só roda `next build`, que **não aplica migrations**. Sem isso o banco fica
vazio (sem tabelas) e o app quebra em produção.

Em **Settings → Build & Development Settings → Build Command**, sobrescreva para:

```
prisma migrate deploy && next build
```

> Isso aplica as migrations existentes a cada deploy — seguro de rodar repetido, não apaga
> dados. **Não** use `prisma migrate dev` aqui (esse é só pra ambiente de desenvolvimento local,
> ele pode pedir confirmação interativa e travar o build).

## Passo 6 — Deploy

Clique em **Deploy**. Acompanhe o log de build — se `DATABASE_URL` estiver certo, você deve ver
a etapa `prisma migrate deploy` aplicando a migration `init` antes do `next build` rodar.

## Passo 7 — Popular dados de teste (uma vez só)

O banco recém-criado está vazio (sem usuários, categorias, pedidos de teste). Populá-lo é uma
ação local que se conecta direto ao banco de produção — **não configure isso pra rodar
automático a cada deploy**, porque o script de seed apaga tudo antes de recriar (ótimo pra
começar do zero, péssimo se alguém estiver testando o link nesse momento).

Na sua máquina, depois do primeiro deploy:

```bash
# troque temporariamente o DATABASE_URL local pelo do Neon (produção)
DATABASE_URL="<connection-string-pooled-do-neon>" npx prisma db seed
```

Isso cria os usuários de teste (`cliente1@feitoaqui.com`, `worker1@feitoaqui.com`,
`admin@feitoaqui.com` etc., senha `senha123` pra todos — lista completa na própria tela de
login do app).

## Passo 8 — Testar o link

Abra a URL que a Vercel te deu (algo como `https://feito-aqui-xxxx.vercel.app`) e faça login com
uma das contas de teste. Se aparecer erro 500, o mais provável é `DATABASE_URL` errado ou
migrations não aplicadas — volte ao log de build do Passo 6.

## Rodando localmente depois disso

O `.env` deste projeto já está apontando pra um Postgres local que instalei nesta sessão (via
Homebrew, `postgresql@16`) — `npm run dev` deve funcionar direto. Se preferir usar o mesmo
banco Neon também localmente (mais simples, um banco só pra tudo), troque `DATABASE_URL` no
`.env` pela mesma connection string do Passo 1. Pra upload de fotos funcionar localmente,
copie o valor de `BLOB_READ_WRITE_TOKEN` do painel da Vercel (Settings → Environment
Variables) pro seu `.env` — ou rode `vercel link` seguido de `vercel env pull .env.local` no
projeto, que puxa todas as variáveis automaticamente.

Se não quiser manter o Postgres local instalado nesta máquina, me avise que eu removo
(`brew uninstall postgresql@16`).

## Sobre custo

- **Vercel** (plano Hobby): grátis, suficiente pra um protótipo de demonstração com poucos
  acessos simultâneos.
- **Neon** (plano free): grátis, ~0.5GB de armazenamento — mais que suficiente aqui.
- **Vercel Blob** (plano free): alguns GB grátis de armazenamento e banda — as fotos de teste
  são pequenas, não deve chegar perto do limite.

Nenhum desses passos pede cartão de crédito nos planos gratuitos.
