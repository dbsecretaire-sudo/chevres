import type { ArticleAnnexe, LigneTicketAnnexe, TicketAnnexe } from '@/features/annexes/types';
import { NOMBRE_MAX_ARTICLES_TICKET } from '@/shared/constants/annexes';
import { repasDuJour } from '@/features/gite/services/repas';
import type { Sejour } from '@/features/gite/types';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';

/** Une ligne de vente : un article et le nombre vendu. */
export interface LigneVenteAnnexe {
  article: ArticleAnnexe;
  quantite: number;
}

/** Un ticket vide, nommé d'office « Ticket n » : le plus petit numéro que les tickets en cours de l'activité n'utilisent pas. */
export function nouveauTicket(
  activiteId: string,
  tickets: TicketAnnexe[],
  /** La date du ticket (aujourd'hui quand elle n'est pas donnée) : le jour choisi dans le calendrier des repas. */
  date: string = todayISO(),
): TicketAnnexe {
  const noms = new Set(tickets.map((t) => t.nom));
  let numero = 1;
  while (noms.has(TEXTES.annexes.ticket.nomAuto(numero))) numero += 1;
  return {
    id: generateId(),
    activiteId,
    nom: TEXTES.annexes.ticket.nomAuto(numero),
    date,
    lignes: [],
  };
}

/** Ajoute un article à un ticket : un article déjà présent voit sa quantité augmenter (jusqu'au maximum). */
export function ajouterAuTicket(
  lignes: LigneTicketAnnexe[],
  articleId: string,
  quantite: number,
): LigneTicketAnnexe[] {
  if (!lignes.some((l) => l.articleId === articleId)) return [...lignes, { articleId, quantite }];
  return lignes.map((l) =>
    l.articleId === articleId
      ? { ...l, quantite: Math.min(NOMBRE_MAX_ARTICLES_TICKET, l.quantite + quantite) }
      : l,
  );
}

/** Les lignes d'un ticket avec leur article (un article supprimé du catalogue depuis n'y figure plus). */
export function lignesDuTicket(ticket: TicketAnnexe, articles: ArticleAnnexe[]): LigneVenteAnnexe[] {
  return ticket.lignes.flatMap((l) => {
    const article = articles.find((a) => a.id === l.articleId);
    return article ? [{ article, quantite: l.quantite }] : [];
  });
}

/** Le montant d'un ticket : la somme des prix × quantités, au centime. */
export const totalTicket = (lignes: LigneVenteAnnexe[]): number =>
  Math.round(lignes.reduce((total, l) => total + l.article.prix * l.quantite, 0) * 100) / 100;

/** Les réservations payées qui ont des repas ce jour-là : chacune a son ticket, avec ses repas déjà payés. */
export function reservationsPayeesDuJour(
  sejours: Sejour[],
  jour: string,
): { sejour: Sejour; repas: number }[] {
  return repasDuJour(sejours, jour)
    .filter((r) => r.sejour.paye)
    .map((r) => ({ sejour: r.sejour, repas: r.repas }));
}

/** Le ticket d'une réservation pour un jour, tel qu'il est tant qu'on n'y a rien ajouté (il porte le nom du propriétaire). */
export function ticketDeReservation(activiteId: string, sejour: Sejour, jour: string): TicketAnnexe {
  return {
    id: `reservation-${sejour.id}-${jour}`,
    activiteId,
    nom: sejour.nom,
    date: jour,
    sejourId: sejour.id,
    lignes: [],
  };
}
