import { enregistrerCommande, lireArchiveCommercial, supprimerCommande } from '@/features/commercial/repository';
import { commandeOuverte, prixDuTarif } from '@/features/commercial/services/commandes';
import type { Commande, LigneCommande } from '@/features/commercial/types';
import { listTousLesAnimauxDeLEspece, saveChevre } from '@/features/cheptel/repository/chevres';
import { estReserve, reserver } from '@/features/cheptel/services/reservations';
import type { Chevre } from '@/features/cheptel/types';
import { categorieDuClient } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { reserverLots } from '@/features/stock/services/lots';
import type { LotFromage } from '@/features/stock/types';
import { CIRCUIT_VENTE, JOURS_AVANT_LIVRAISON, STATUT_COMMANDE } from '@/shared/constants/commercial';
import { ajouterJours } from '@/shared/utils/calendrier';
import { libelleArticle } from '@/features/stock/services/stock';
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
    livraisonPrevue: ajouterJours(todayISO(), JOURS_AVANT_LIVRAISON),
    circuit: CIRCUIT_VENTE.FERME,
    statut: STATUT_COMMANDE.A_PREPARER,
    lignes: [],
  });
}

/** Réserve des animaux pour un client : ils rejoignent son bon de commande ouvert. */
export async function reserverAnimauxPourClient(
  animaux: Chevre[],
  client: Client,
  /** Les cabris seront remis vivants ou morts (absent : pas encore décidé). */
  etat?: 'vivants' | 'morts',
): Promise<Commande> {
  let bon = await bonDeCommandeOuvert(client);
  // Des animaux sans boucle réservés depuis Production › Viande : la vente se fait à la ferme.
  if (bon.circuit !== CIRCUIT_VENTE.FERME) bon = await enregistrerCommande({ ...bon, circuit: CIRCUIT_VENTE.FERME });
  const reservation = { client: nomComplet(client), clientId: client.id, commandeId: bon.id, etat, date: todayISO() };
  for (const animal of animaux) await saveChevre(reserver(animal, reservation));
  return bon;
}

/** Le prix à la pièce d'un produit pour un client (son tarif, sinon l'inventaire) ; rien quand aucun n'est défini : il faut alors le demander. */
export async function prixDuProduitPourClient(article: string, client: Client): Promise<number | undefined> {
  const [commercial, stock, bon] = await Promise.all([
    lireArchiveCommercial(),
    lireArchiveStock(),
    bonOuvertDuClient(client),
  ]);
  const dejaLa = bon?.lignes.find((l) => l.article === article && l.prixUnitaire > 0)?.prixUnitaire;
  return dejaLa ?? prixDuTarif(article, categorieDuClient(client), commercial.tarifs, stock.prix);
}

/** Le bon ouvert d'un client, sans le créer. */
async function bonOuvertDuClient(client: Client): Promise<Commande | undefined> {
  return (await lireArchiveCommercial()).commandes.find((c) => c.clientId === client.id && commandeOuverte(c));
}

/** Réserve des lots d'un produit pour un client : ils s'ajoutent (en quantité) à la ligne de ce produit de son bon de commande ouvert. */
export async function reserverLotsPourClient(
  lots: LotFromage[],
  article: { cle: string; libelle: string },
  client: Client,
  /** Le prix à la pièce demandé quand ni le tarif ni l'inventaire n'en ont. */
  prixSaisi?: number,
): Promise<Commande> {
  const bon = await bonDeCommandeOuvert(client);
  const nouveaux = lots.map((l) => l.id).filter((id) => !(bon.lignes.find((l) => l.article === article.cle)?.lotIds ?? []).includes(id));
  const faites = new Set(bon.lignesFacturees ?? []);
  const existante = bon.lignes.find((l) => l.article === article.cle && !faites.has(l.id));
  let lignes: LigneCommande[];
  if (existante) {
    lignes = bon.lignes.map((l) =>
      l.id === existante.id
        ? {
            ...l,
            quantite: l.quantite + nouveaux.length,
            lotIds: [...(l.lotIds ?? []), ...nouveaux],
            prixUnitaire: l.prixUnitaire > 0 ? l.prixUnitaire : (prixSaisi ?? 0),
          }
        : l,
    );
  } else {
    const [commercial, stock] = await Promise.all([lireArchiveCommercial(), lireArchiveStock()]);
    const prix = prixSaisi ?? prixDuTarif(article.cle, categorieDuClient(client), commercial.tarifs, stock.prix) ?? 0;
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

/**
 * Range dans leur bon de commande ouvert les réservations qui n'y sont pas encore (celles faites avant que chaque client ait son bon) :
 * les animaux réservés sans bon, et les lots réservés qu'aucune ligne n'a. Sans effet quand tout est déjà rangé.
 */
export async function rattacherLesReservations(clients: Client[]): Promise<void> {
  const parId = new Map(clients.map((c) => [c.id, c]));
  const parNom = new Map(clients.map((c) => [nomComplet(c), c]));
  const trouver = (r: { client: string; clientId?: string }) => (r.clientId ? parId.get(r.clientId) : undefined) ?? parNom.get(r.client);

  for (const animal of await listTousLesAnimauxDeLEspece()) {
    const r = animal.reservation;
    if (!r || r.commandeId || !estReserve(animal)) continue;
    const client = trouver(r);
    if (!client) continue;
    const bon = await bonDeCommandeOuvert(client);
    await saveChevre({ ...animal, reservation: { ...r, clientId: client.id, commandeId: bon.id } });
  }

  const stock = await lireArchiveStock();
  const archive = await lireArchiveCommercial();
  const dejaRanges = new Set(archive.commandes.flatMap((c) => c.lignes.flatMap((l) => l.lotIds ?? [])));
  const aRanger = (stock.lots ?? []).filter((l) => l.reservation && !l.dateVente && !dejaRanges.has(l.id));
  const groupes = new Map<string, { client: Client; article: string; lots: LotFromage[] }>();
  for (const lot of aRanger) {
    const client = trouver(lot.reservation!);
    if (!client) continue;
    const cle = client.id + '|' + lot.article;
    groupes.set(cle, { client, article: lot.article, lots: [...(groupes.get(cle)?.lots ?? []), lot] });
  }
  for (const { client, article, lots } of groupes.values()) {
    await reserverLotsPourClient(lots, { cle: article, libelle: libelleArticle(article, stock) }, client);
  }
}

/** L'état (vivants ou morts) que disent toutes les réservations d'un groupe d'animaux ; rien quand elles diffèrent ou ne le disent pas. */
export function etatCommunDesReservations(animaux: Chevre[]): 'vivants' | 'morts' | undefined {
  const etats = new Set(animaux.map((a) => a.reservation?.etat));
  const [seul] = [...etats];
  return etats.size === 1 ? seul : undefined;
}
