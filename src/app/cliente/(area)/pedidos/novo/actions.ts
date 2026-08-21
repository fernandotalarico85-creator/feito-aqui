"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { sugerirServicos } from "@/lib/triagem";
import { geocodificarMock } from "@/lib/geo";
import { gerarNumeroDocumento } from "@/lib/numeracao";

export async function criarPedidoAction(formData: FormData) {
  const usuario = await exigirUsuario("CLIENTE");
  const clientProfile = await prisma.clientProfile.findUniqueOrThrow({
    where: { userId: usuario.id },
  });

  const categoriaId = String(formData.get("categoriaId") ?? "");
  const descricaoLivre = String(formData.get("descricaoLivre") ?? "").trim();
  const janelaDataInicio = String(formData.get("janelaDataInicio") ?? "");
  const janelaDataFim = String(formData.get("janelaDataFim") ?? "");
  const enderecoModo = String(formData.get("enderecoModo") ?? "existente");

  if (!categoriaId || !descricaoLivre || !janelaDataInicio || !janelaDataFim) {
    redirect("/cliente/pedidos/novo?erro=dados_invalidos");
  }

  const inicio = new Date(janelaDataInicio);
  const fim = new Date(janelaDataFim);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio > fim) {
    redirect("/cliente/pedidos/novo?erro=janela_invalida");
  }

  const sugestao = await sugerirServicos(categoriaId);
  if (!sugestao) {
    redirect("/cliente/pedidos/novo?erro=categoria_invalida");
  }

  let addressId: string;

  if (enderecoModo === "novo") {
    const rotulo = String(formData.get("rotulo") ?? "").trim() || "Endereço do pedido";
    const logradouro = String(formData.get("logradouro") ?? "").trim();
    const numero = String(formData.get("numero") ?? "").trim();
    const bairro = String(formData.get("bairro") ?? "").trim();
    const cidade = String(formData.get("cidade") ?? "").trim();
    const estado = String(formData.get("estado") ?? "").trim();
    const cep = String(formData.get("cep") ?? "").trim();

    if (!logradouro || !numero || !bairro || !cidade || !estado || !cep) {
      redirect("/cliente/pedidos/novo?erro=endereco_invalido");
    }

    const { latitude, longitude } = geocodificarMock(cep);

    const endereco = await prisma.address.create({
      data: {
        clientProfileId: clientProfile.id,
        rotulo,
        logradouro,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        latitude,
        longitude,
      },
    });
    addressId = endereco.id;
  } else {
    const enderecoId = String(formData.get("enderecoId") ?? "");
    const endereco = await prisma.address.findFirst({
      where: { id: enderecoId, clientProfileId: clientProfile.id },
    });
    if (!endereco) {
      redirect("/cliente/pedidos/novo?erro=endereco_invalido");
    }
    addressId = endereco.id;
  }

  const numeroOS = await gerarNumeroDocumento("OS");

  const pedido = await prisma.serviceRequest.create({
    data: {
      numeroOS,
      clientProfileId: clientProfile.id,
      categoryId: categoriaId,
      addressId,
      descricaoLivre,
      subServicosJson: JSON.stringify(sugestao.subServicos),
      janelaDataInicio: inicio,
      janelaDataFim: fim,
      // A "triagem" já foi feita pelo próprio formulário guiado (Seção 3.2) — o pedido
      // nasce pronto para receber orçamentos dos workers compatíveis.
      status: "AGUARDANDO_ORCAMENTO",
    },
  });

  redirect(`/cliente/pedidos/${pedido.id}/profissionais`);
}
