import "server-only";
import { prisma } from "./db";

/** Feed do portfólio de um worker, com os dados da obra (quando vinculado a um
 * Booking da plataforma) já carregados para exibição. */
export async function listarPortfolioFeed(workerProfileId: string) {
  return prisma.portfolioItem.findMany({
    where: { workerProfileId },
    include: {
      booking: {
        include: {
          budget: {
            include: { serviceRequest: { include: { category: true, address: true } } },
          },
          review: true,
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });
}

export type PortfolioFeedItem = Awaited<ReturnType<typeof listarPortfolioFeed>>[number];

/** Bookings concluídos do worker que ainda não viraram um post no portfólio —
 * usados no seletor "vincular a uma obra da plataforma". */
export async function listarBookingsElegiveisParaPortfolio(workerProfileId: string) {
  return prisma.booking.findMany({
    where: {
      status: "CONCLUIDO",
      budget: { workerId: workerProfileId },
      portfolioItem: null,
    },
    include: {
      budget: { include: { serviceRequest: { include: { category: true, address: true } } } },
    },
    orderBy: { criadoEm: "desc" },
  });
}

export type BookingElegivel = Awaited<
  ReturnType<typeof listarBookingsElegiveisParaPortfolio>
>[number];

/** Fotos do "depois" enviadas no check-out (Seção 3.8) que o worker ainda não
 * publicou no portfólio — cada uma vira 1 clique em "Publicar no portfólio" (uma
 * publicação por booking; assim que uma foto é promovida, as demais do mesmo booking
 * saem dessa lista, já que o booking passa a ter um PortfolioItem). */
export async function listarFotosServicoNaoPublicadas(workerProfileId: string) {
  return prisma.servicePhoto.findMany({
    where: {
      booking: {
        status: "CONCLUIDO",
        budget: { workerId: workerProfileId },
        portfolioItem: null,
      },
    },
    include: {
      booking: {
        include: {
          budget: { include: { serviceRequest: { include: { category: true, address: true } } } },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });
}

export type FotoServicoNaoPublicada = Awaited<
  ReturnType<typeof listarFotosServicoNaoPublicadas>
>[number];
