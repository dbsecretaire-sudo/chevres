import type { LigneVenteBar } from '@/features/bar/services/ventes';
import type { Boisson, LigneTicket, TicketBar } from '@/features/bar/types';
import { NOMBRE_MAX_BOISSONS_TICKET } from '@/shared/constants/bar';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';

/** Un ticket vide, nommé d'office « Ticket n » : le plus petit numéro que les tickets en cours n'utilisent pas encore. */
export function nouveauTicket(tickets: TicketBar[]): TicketBar {
  const noms = new Set(tickets.map((t) => t.nom));
  let numero = 1;
  while (noms.has(TEXTES.bar.bar.ticket.nomAuto(numero))) numero += 1;
  return { id: generateId(), nom: TEXTES.bar.bar.ticket.nomAuto(numero), lignes: [] };
}

/** Ajoute des boissons à un ticket : une boisson déjà présente voit sa quantité augmenter (jusqu'au maximum). */
export function ajouterAuTicket(lignes: LigneTicket[], boissonId: string, quantite: number): LigneTicket[] {
  const presente = lignes.some((l) => l.boissonId === boissonId);
  if (!presente) return [...lignes, { boissonId, quantite }];
  return lignes.map((l) =>
    l.boissonId === boissonId
      ? { ...l, quantite: Math.min(NOMBRE_MAX_BOISSONS_TICKET, l.quantite + quantite) }
      : l,
  );
}

/** Les lignes d'un ticket avec leur boisson (une boisson supprimée du stock depuis n'y figure plus). */
export function lignesDuTicket(ticket: TicketBar, boissons: Boisson[]): LigneVenteBar[] {
  return ticket.lignes.flatMap((l) => {
    const boisson = boissons.find((b) => b.id === l.boissonId);
    return boisson ? [{ boisson, quantite: l.quantite }] : [];
  });
}
