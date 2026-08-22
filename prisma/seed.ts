import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { gerarNumeroDocumento, gerarIdCadastro } from "../src/lib/numeracao";

const SENHA_PADRAO = "senha123";

async function hash(senha: string) {
  return bcrypt.hash(senha, 10);
}

async function main() {
  console.log("Seed: limpando dados existentes...");
  // Ordem respeita as dependências de chave estrangeira.
  await prisma.sequenciaDiaria.deleteMany();
  await prisma.sequenciaCadastro.deleteMany();
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
  // Admin não tem fluxo de cadastro público (Prompt 11 só cobre cliente/worker),
  // então idCadastro/cpf abaixo são valores fixos de placeholder, não gerados
  // pelo contador C/W.
  await prisma.user.create({
    data: {
      idCadastro: "ADMIN0001",
      nome: "Admin Feito Aqui",
      sobrenome: "Feito Aqui",
      cpf: "00000000000",
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
      idCadastro: await gerarIdCadastro("C"),
      nome: "Fernanda Souza",
      sobrenome: "Souza",
      cpf: "11122233344",
      email: "cliente1@feitoaqui.com",
      senhaHash,
      tipo: "CLIENTE",
      clientProfile: {
        create: {
          enderecoLogradouro: "Rua das Flores",
          enderecoNumero: "120",
          enderecoBairro: "Jardim Paulista",
          enderecoCidade: "São Paulo",
          enderecoEstado: "SP",
          enderecoCep: "01415-000",
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
      idCadastro: await gerarIdCadastro("C"),
      nome: "Carlos Menezes",
      sobrenome: "Menezes",
      cpf: "22233344455",
      email: "cliente2@feitoaqui.com",
      senhaHash,
      tipo: "CLIENTE",
      clientProfile: {
        create: {
          enderecoLogradouro: "Av. Rebouças",
          enderecoNumero: "980",
          enderecoBairro: "Pinheiros",
          enderecoCidade: "São Paulo",
          enderecoEstado: "SP",
          enderecoCep: "05402-100",
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
      sobrenome: "Alves",
      cpf: "33344455566",
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
      enderecoLogradouro: "Rua Vergueiro",
      enderecoNumero: "500",
      enderecoBairro: "Vila Mariana",
      enderecoCidade: "São Paulo",
      enderecoEstado: "SP",
      enderecoCep: "04101-000",
      tipoDocumento: "CNH" as const,
      documentoStatus: "APROVADO" as const,
    },
    {
      nome: "Marcos Lima",
      sobrenome: "Lima",
      cpf: "44455566677",
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
      enderecoLogradouro: "Rua Teodoro Sampaio",
      enderecoNumero: "800",
      enderecoBairro: "Pinheiros",
      enderecoCidade: "São Paulo",
      enderecoEstado: "SP",
      enderecoCep: "05406-000",
      tipoDocumento: "RG_COM_CPF" as const,
      documentoStatus: "APROVADO" as const,
    },
    {
      nome: "Juliana Freitas",
      sobrenome: "Freitas",
      cpf: "55566677788",
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
      enderecoLogradouro: "Rua Augusta",
      enderecoNumero: "1200",
      enderecoBairro: "Consolação",
      enderecoCidade: "São Paulo",
      enderecoEstado: "SP",
      enderecoCep: "01304-001",
      tipoDocumento: "CNH" as const,
      documentoStatus: "APROVADO" as const,
    },
    {
      nome: "Paulo Ricardo",
      sobrenome: "Ricardo",
      cpf: "66677788899",
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
      enderecoLogradouro: "Rua Voluntários da Pátria",
      enderecoNumero: "300",
      enderecoBairro: "Santana",
      enderecoCidade: "São Paulo",
      enderecoEstado: "SP",
      enderecoCep: "02010-000",
      tipoDocumento: "RG_E_CPF_SEPARADOS" as const, // exercita o 2º upload (documentoUrl2)
      documentoStatus: "PENDENTE" as const, // ainda em análise, junto com a verificação
    },
    {
      nome: "Bianca Nogueira",
      sobrenome: "Nogueira",
      cpf: "77788899900",
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
      enderecoLogradouro: "Rua Cardeal Arcoverde",
      enderecoNumero: "400",
      enderecoBairro: "Pinheiros",
      enderecoCidade: "São Paulo",
      enderecoEstado: "SP",
      enderecoCep: "05407-000",
      tipoDocumento: "CNH" as const,
      documentoStatus: "APROVADO" as const,
    },
  ];

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const workersCriados: { email: string; workerProfileId: string }[] = [];

  for (const w of workersData) {
    const user = await prisma.user.create({
      data: {
        idCadastro: await gerarIdCadastro("W"),
        nome: w.nome,
        sobrenome: w.sobrenome,
        cpf: w.cpf,
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
            enderecoLogradouro: w.enderecoLogradouro,
            enderecoNumero: w.enderecoNumero,
            enderecoBairro: w.enderecoBairro,
            enderecoCidade: w.enderecoCidade,
            enderecoEstado: w.enderecoEstado,
            enderecoCep: w.enderecoCep,
            tipoDocumento: w.tipoDocumento,
            documentoUrl1: "/mock/portfolio/antes-1.svg",
            documentoUrl2:
              w.tipoDocumento === "RG_E_CPF_SEPARADOS" ? "/mock/portfolio/depois-1.svg" : null,
            documentoStatus: w.documentoStatus,
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
      numeroOS: await gerarNumeroDocumento("OS"),
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
        numeroPO: await gerarNumeroDocumento("PO"),
        serviceRequestId: pedidoTeste.id,
        workerId: workerRoberto.workerProfileId,
        valor: 3200,
        prazoEntrega: new Date(hoje.getTime() + 20 * 24 * 60 * 60 * 1000),
        status: "PENDENTE",
      },
      {
        numeroPO: await gerarNumeroDocumento("PO"),
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
