import { enregistrerCommande, lireArchiveCommercial, supprimerCommande } from '@/features/commercial/repository';
import { commandeOuverte, prixDuTarif } from '@/features/commercial/services/commandes';
import type { Commande, LigneCommande } from '@/features/commercial/types';
import { saveChevre } from '@/features/cheptel/repository/chevres';
import { reserver } from '@/features/cheptel/services/reservations';
import type { Chevre } from '@/features/cheptel/types';
import { categorieDuClient } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { reserverLots } from '@/features/stock/services/lots';
import type { LotFromage } from '@/features/stock/types';
import { STATUT_COMMANDE } from '@/shared/constants/commercial';
import { generateId } from '@/shared/utils/id';
import { todayISO } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';

/**
 * Le bon de commande ouvert d'un client : celui qui est déjà à préparer ou à livrer pour lui, sinon un nouveau. Tout ce qu'on réserve
 * pour un client va dans le même bon.
 */
export async function bonDeCommandeOuvert(client: Client): Promise<Commande> {
  const archive = await lireArchiveCommercial();
  const ouvert = archive.commandes.find((c) => c.clientId === client.id && commandeOuverte(c));
  if (ouvert) return ouvert;
  return enregistrerCommande({
    client: nomComplet(client),
    clientId: client.id,
    date: todayISO(),
    statut: STATUT_COMMANDE.A_PREPARER,
    lignes: [],
  });
}

/** Réserve des animaux pour un client : ils rejoignent son bon de commande ouvert. */
export async function reserverAnimauxPourClient(animaux: Chevre[], client: Client): Promise<Commande> {
  const bon = await bonDeCommandeOuvert(client);
  const reservation = { client: nomComplet(client), clientId: client.id, commandeId: bon.id, date: todayISO() };
  for (const animal of animaux) await saveChevre(reserver(animal, reservation));
  return bon;
}

/** Réserve des lots d'un produit pour un client : ils s'ajoutent (en quantité) à la ligne de ce produit de son bon de commande ouvert. */
export async function reserverLotsPourClient(
  lots: LotFromage[],
  article: { cle: string; libelle: string },
  client: Client,
): Promise<Commande> {
  const bon = await bonDeCommandeOuvert(client);
  const nouveaux = lots.map((l) => l.id).filter((id) => !(bon.lignes.find((l) => l.article === article.cle)?.lotIds ?? []).includes(id));
  const faites = new Set(bon.lignesFacturees ?? []);
  const existante = bon.lignes.find((l) => l.article === article.cle && !faites.has(l.id));
  let lignes: LigneCommande[];
  if (existante) {
    lignes = bon.lignes.map((l) =>
      l.id === existante.id
        ? { ...l, quantite: l.quantite + nouveaux.length, lotIds: [...(l.lotIds ?? []), ...nouveaux] }
        : l,
    );
  } else {
    const [commercial, stock] = await Promise.all([lireArchiveCommercial(), lireArchiveStock()]);
    const prix = prixDuTarif(article.cle, categorieDuClient(client), commercial.tarifs, stock.prix) ?? 0;
    lignes = [
      ...bon.lignes,
      { id: generateId(), article: article.cle, libelle: article.libelle, quantite: nouveaux.length, prixUnitaire: prix, lotIds: nouveaux },
    ];
  }
  const maj = await enregistrerCommande({ ...bon, lignes });
  await reserverLots(lots.map((l) => l.id), { client: nomComplet(client), clientId: client.id, date: todayISO() });
  return maj;
}

/** Libère des lots réservés : ils quittent la ligne de leur bon de commande (qui disparaît quand elle est vide, et le bon avec elle s'il est vide). */
export async function libererLotsReserves(identifiants: string[]): Promise<void> {
  const ids = new Set(identifiants);
  const archive = await lireArchiveCommercial();
  for (const bon of archive.commandes.filter((c) => commandeOuverte(c) && c.lignes.some((l) => l.lotIds?.some((id) => ids.has(id))))) {
    const lignes = bon.lignes
      .map((l) => {
        const retires = (l.lotIds ?? []).filter((id) => ids.has(id));
        if (retires.length === 0) return l;
        return { ...l, quantite: l.quantite - retires.length, lotIds: (l.lotIds ?? []).filter((id) => !ids.has(id)) };
      })
      .filter((l) => l.quantite > 0);
    await enregistrerCommande({ ...bon, lignes });
  }
  await reserverLots([...ids]);
}

/** Supprime un bon de commande resté vide (aucune ligne, aucun animal réservé) : il n'a plus de raison d'être. */
export async function retirerLeBonVide(bon: Commande, animauxReserves: number): Promise<void> {
  if (bon.lignes.length === 0 && animauxReserves === 0) await supprimerCommande(bon.id);
}
