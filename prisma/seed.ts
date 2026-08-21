import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

const SENHA_PADRAO = "senha123";

async function hash(senha: string) {
  return bcrypt.hash(senha, 10);
}

async function main() {
  console.log("Seed: limpando dados existentes...");
  // Ordem respeita as dependências de chave estrangeira.
  await prisma.dispute.deleteMany();
  await prisma.strike.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.address.deleteMany();
  await prisma.subService.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.agendaDia.deleteMany();
  await prisma.session.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();

  const senhaHash = await hash(SENHA_PADRAO);

  // -------------------------------------------------------------------------
  // Taxonomia — categoria "Reforma de banheiro" (Seção 3.2)
  // -------------------------------------------------------------------------
  const categoriaBanheiro = await prisma.serviceCategory.create({
    data: {
      nome: "Reforma de banheiro",
      subServicos: {
        create: [
          { nome: "Hidráulica", ordem: 1 },
          { nome: "Elétrica", ordem: 2 },
          { nome: "Impermeabilização", ordem: 3 },
          { nome: "Revestimento", ordem: 4 },
          { nome: "Marcenaria", ordem: 5 },
          { nome: "Pintura", ordem: 6 },
        ],
      },
    },
  });
  console.log(`Categoria criada: ${categoriaBanheiro.nome}`);

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  await prisma.user.create({
    data: {
      nome: "Admin Feito Aqui",
      email: "admin@feitoaqui.com",
      senhaHash,
      tipo: "ADMIN",
    },
  });

  // -------------------------------------------------------------------------
  // Clientes
  // -------------------------------------------------------------------------
  const cliente1 = await prisma.user.create({
    data: {
      nome: "Fernanda Souza",
      email: "cliente1@feitoaqui.com",
      senhaHash,
      tipo: "CLIENTE",
      clientProfile: {
        create: {
          enderecos: {
            create: {
              rotulo: "Casa",
              logradouro: "Rua das Flores",
              numero: "120",
              bairro: "Jardim Paulista",
              cidade: "São Paulo",
              estado: "SP",
              cep: "01415-000",
              latitude: -23.5629,
              longitude: -46.6544,
            },
          },
        },
      },
    },
    include: { clientProfile: { include: { enderecos: true } } },
  });

  const cliente2 = await prisma.user.create({
    data: {
      nome: "Carlos Menezes",
      email: "cliente2@feitoaqui.com",
      senhaHash,
      tipo: "CLIENTE",
      clientProfile: {
        create: {
          enderecos: {
            create: {
              rotulo: "Apartamento",
              logradouro: "Av. Rebouças",
              numero: "980",
              bairro: "Pinheiros",
              cidade: "São Paulo",
              estado: "SP",
              cep: "05402-100",
              latitude: -23.5670,
              longitude: -46.6810,
            },
          },
        },
      },
    },
    include: { clientProfile: { include: { enderecos: true } } },
  });

  console.log(`Clientes criados: ${cliente1.nome}, ${cliente2.nome}`);

  // -------------------------------------------------------------------------
  // Workers — 5 no total, variando nota, verificação, destaque e histórico
  // -------------------------------------------------------------------------
  const workersData = [
    {
      nome: "Roberto Alves",
      email: "worker1@feitoaqui.com",
      bio: "20 anos de experiência em reformas de banheiro e hidráulica.",
      regiaoAtendimento: "São Paulo - Zona Sul",
      statusVerificacao: "VERIFICADO" as const,
      notaMediaRecente: 4.8,
      taxaConclusaoPrazo: 0.95,
      taxaComparecimento: 0.98,
      tempoMedioRespostaMin: 15,
      volumeConcluidos: 40,
      destaquePago: false,
      comPortfolio: true,
    },
    {
      nome: "Marcos Lima",
      email: "worker2@feitoaqui.com",
      bio: "Especialista em revestimentos e acabamento fino.",
      regiaoAtendimento: "São Paulo - Zona Oeste",
      statusVerificacao: "VERIFICADO" as const,
      notaMediaRecente: 4.5,
      taxaConclusaoPrazo: 0.9,
      taxaComparecimento: 0.95,
      tempoMedioRespostaMin: 30,
      volumeConcluidos: 25,
      destaquePago: true, // nota >= 4.0, elegível para destaque (Seção 3.1)
      comPortfolio: true,
    },
    {
      nome: "Juliana Freitas",
      email: "worker3@feitoaqui.com",
      bio: "Marcenaria e pintura, atendimento pontual e organizado.",
      regiaoAtendimento: "São Paulo - Centro",
      statusVerificacao: "VERIFICADO" as const,
      notaMediaRecente: 4.0,
      taxaConclusaoPrazo: 0.8,
      taxaComparecimento: 0.85,
      tempoMedioRespostaMin: 60,
      volumeConcluidos: 12,
      destaquePago: false,
      comPortfolio: true,
    },
    {
      nome: "Paulo Ricardo",
      email: "worker4@feitoaqui.com",
      bio: "Elétrica residencial e predial.",
      regiaoAtendimento: "São Paulo - Zona Norte",
      statusVerificacao: "PENDENTE" as const, // ainda não passou pela verificação do admin
      notaMediaRecente: 4.9,
      taxaConclusaoPrazo: 0.97,
      taxaComparecimento: 0.99,
      tempoMedioRespostaMin: 10,
      volumeConcluidos: 55,
      destaquePago: false,
      comPortfolio: true,
    },
    {
      nome: "Bianca Nogueira",
      email: "worker5@feitoaqui.com",
      bio: "Recém-chegada à plataforma, especialista em impermeabilização.",
      regiaoAtendimento: "São Paulo - Zona Sul",
      statusVerificacao: "VERIFICADO" as const,
      notaMediaRecente: 0,
      taxaConclusaoPrazo: 0,
      taxaComparecimento: 0,
      tempoMedioRespostaMin: 60,
      volumeConcluidos: 0,
      destaquePago: false,
      comPortfolio: false, // cold start — sem histórico (Seção 3.3)
    },
  ];

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const workersCriados: { email: string; workerProfileId: string }[] = [];

  for (const w of workersData) {
    const user = await prisma.user.create({
      data: {
        nome: w.nome,
        email: w.email,
        senhaHash,
        tipo: "WORKER",
        workerProfile: {
          create: {
            bio: w.bio,
            regiaoAtendimento: w.regiaoAtendimento,
            statusVerificacao: w.statusVerificacao,
            notaMediaRecente: w.notaMediaRecente,
            taxaConclusaoPrazo: w.taxaConclusaoPrazo,
            taxaComparecimento: w.taxaComparecimento,
            tempoMedioRespostaMin: w.tempoMedioRespostaMin,
            volumeConcluidos: w.volumeConcluidos,
            destaquePago: w.destaquePago,
            destaquePagoValidoAte: w.destaquePago
              ? new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
              : null,
            categorias: { connect: [{ id: categoriaBanheiro.id }] },
            agenda: {
              create: Array.from({ length: 14 }).map((_, i) => ({
                data: new Date(hoje.getTime() + i * 24 * 60 * 60 * 1000),
                disponivel: i % 3 !== 0,
              })),
            },
            ...(w.comPortfolio
              ? {
                  portfolioItens: {
                    create: [
                      {
                        fotoAntesUrl: "/mock/portfolio/antes-1.svg",
                        fotoDepoisUrl: "/mock/portfolio/depois-1.svg",
                        descricao: "Reforma completa de banheiro social",
                      },
                    ],
                  },
                }
              : {}),
          },
        },
      },
      include: { workerProfile: true },
    });
    console.log(
      `Worker criado: ${user.nome} (verificação: ${w.statusVerificacao}, nota: ${w.notaMediaRecente})`,
    );
    workersCriados.push({ email: w.email, workerProfileId: user.workerProfile!.id });
  }

  // -------------------------------------------------------------------------
  // Pedido de teste com 2 orçamentos pendentes de aceite (Prompt 3)
  // -------------------------------------------------------------------------
  const enderecoCliente1 = cliente1.clientProfile!.enderecos[0];
  const workerRoberto = workersCriados.find((w) => w.email === "worker1@feitoaqui.com")!;
  const workerMarcos = workersCriados.find((w) => w.email === "worker2@feitoaqui.com")!;

  const subServicosBanheiro = await prisma.subService.findMany({
    where: { categoryId: categoriaBanheiro.id },
    orderBy: { ordem: "asc" },
  });

  const pedidoTeste = await prisma.serviceRequest.create({
    data: {
      clientProfileId: cliente1.clientProfile!.id,
      categoryId: categoriaBanheiro.id,
      addressId: enderecoCliente1.id,
      descricaoLivre:
        "Banheiro de 4m², preciso trocar o piso, revestimento e a caixa de descarga que está vazando.",
      subServicosJson: JSON.stringify(
        subServicosBanheiro.map((s) => ({ id: s.id, nome: s.nome, ordem: s.ordem })),
      ),
      janelaDataInicio: new Date(hoje.getTime() + 10 * 24 * 60 * 60 * 1000),
      janelaDataFim: new Date(hoje.getTime() + 24 * 24 * 60 * 60 * 1000),
      status: "ORCADO",
    },
  });

  await prisma.budget.createMany({
    data: [
      {
        serviceRequestId: pedidoTeste.id,
        workerId: workerRoberto.workerProfileId,
        valor: 3200,
        prazoEntrega: new Date(hoje.getTime() + 20 * 24 * 60 * 60 * 1000),
        status: "PENDENTE",
      },
      {
        serviceRequestId: pedidoTeste.id,
        workerId: workerMarcos.workerProfileId,
        valor: 2900,
        prazoEntrega: new Date(hoje.getTime() + 22 * 24 * 60 * 60 * 1000),
        status: "PENDENTE",
      },
    ],
  });
  console.log(
    `Pedido de teste criado para ${cliente1.nome} com 2 orçamentos pendentes (Roberto Alves, Marcos Lima).`,
  );

  console.log("\nSeed concluído.");
  console.log(`Senha padrão para todos os usuários de teste: ${SENHA_PADRAO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
