import type { Commande, LigneCommande } from '@/features/commercial/types';
import { enregistrerCommande } from '@/features/commercial/repository';
import { enregistrerVente, supprimerVente } from '@/features/comptabilite/repository/ventes';
import type { ActiviteComptable, Vente } from '@/features/comptabilite/types';
import {
  CATEGORIE_VENTE,
  SEPARATEUR_ANIMAUX,
  TYPE_CHOIX_FACTURE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import { STATUT_COMMANDE, STATUTS_COMMANDE_OUVERTE } from '@/shared/constants/commercial';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';

const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;

/**
 * Le prix à la pièce d'un fromage pour une catégorie de client : celui du tarif de cette catégorie, à défaut le prix de l'inventaire.
 * Rien quand ni l'un ni l'autre n'est défini.
 */
export function prixDuTarif(
  article: string,
  categorieClient: string | undefined,
  tarifs: Record<string, Record<string, number>>,
  prixInventaire: Record<string, number>,
): number | undefined {
  return (categorieClient ? tarifs[article]?.[categorieClient] : undefined) ?? prixInventaire[article];
}

/** Le montant d'une ligne de commande. */
export const totalLigne = (ligne: Pick<LigneCommande, 'quantite' | 'prixUnitaire'>): number =>
  arrondi(ligne.quantite * ligne.prixUnitaire);

/** Le montant d'une commande : la somme de ses lignes. */
export const totalCommande = (commande: Pick<Commande, 'lignes'>): number =>
  arrondi(commande.lignes.reduce((t, l) => t + totalLigne(l), 0));

/** Ce qu'une commande peut facturer d'un coup : une ligne (fromage, viande, charcuterie), ou les animaux réservés pour le contact. */
export type ElementACommande = { type: 'ligne'; ligne: LigneCommande } | { type: 'animaux'; ids: string[] };

/** Les éléments d'une commande qui restent à facturer : ses lignes pas encore facturées, et ses animaux réservés (pas encore vendus). */
export function elementsAFacturer(commande: Commande, idsAnimauxReserves: string[]): ElementACommande[] {
  const faites = new Set(commande.lignesFacturees ?? []);
  return [
    ...commande.lignes
      .filter((l) => l.quantite > 0 && !faites.has(l.id))
      .map((ligne): ElementACommande => ({ type: 'ligne', ligne })),
    ...(idsAnimauxReserves.length > 0 ? [{ type: 'animaux', ids: idsAnimauxReserves } as ElementACommande] : []),
  ];
}

/** Vrai tant que la commande reste à préparer ou à livrer. */
export const commandeOuverte = (commande: Pick<Commande, 'statut'>): boolean =>
  STATUTS_COMMANDE_OUVERTE.includes(commande.statut);

/** Les pièces à préparer pour un ensemble de commandes : chaque fromage avec la quantité totale à sortir. */
export function totalAPreparer(
  commandes: Commande[],
): { article: string; libelle: string; quantite: number }[] {
  const parArticle = new Map<string, { article: string; libelle: string; quantite: number }>();
  for (const c of commandes.filter(commandeOuverte)) {
    for (const l of c.lignes) {
      const ligne = parArticle.get(l.article) ?? { article: l.article, libelle: l.libelle, quantite: 0 };
      ligne.quantite += l.quantite;
      parArticle.set(l.article, ligne);
    }
  }
  return [...parArticle.values()].sort((a, b) => a.libelle.localeCompare(b.libelle));
}

/** Vrai pour une ligne de viande ou de charcuterie (une ligne de l'inventaire « viande »), sinon c'est un fromage. */
export const estLigneDeViande = (article: string): boolean => article.startsWith(`${GENRE_ARTICLE.VIANDE}:`);

/** La vente que la livraison d'une ligne de commande enregistre : des fromages, de la viande ou de la charcuterie à la pièce, au prix de la commande. */
export function venteDeLaLigne(
  commande: Commande,
  ligne: LigneCommande,
  dateLivraison: string,
  activite: ActiviteComptable,
  avecFacture: boolean,
  numeroFacture?: string,
): Omit<Vente, 'id'> {
  if (estLigneDeViande(ligne.article)) {
    return {
      activite,
      date: dateLivraison,
      categorie: CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
      // Le détail de la vente est la ligne de l'inventaire : c'est elle qui baisse au stock.
      precision: ligne.libelle,
      quantite: ligne.quantite,
      unite: UNITE_VENTE.PIECE,
      prix: totalLigne(ligne),
      tauxTva: tauxTvaDeLaVente(CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE),
      client: commande.client,
      choixFacture: avecFacture ? TYPE_CHOIX_FACTURE.AVEC_FACTURE : TYPE_CHOIX_FACTURE.SANS_FACTURE,
      numeroFacture: avecFacture ? numeroFacture?.trim() || undefined : undefined,
      payee: commande.enAttente ? false : undefined,
      echeance: commande.enAttente && commande.echeance ? commande.echeance : undefined,
      circuit: commande.circuit,
      commandeId: commande.id,
      fromages: ligne.lotIds?.length ? ligne.lotIds.join(SEPARATEUR_ANIMAUX) : undefined,
    };
  }
  const code = ligne.article.split(':')[1];
  const type = (Object.values(TYPE_FROMAGE) as string[]).includes(code)
    ? (code as (typeof TYPE_FROMAGE)[keyof typeof TYPE_FROMAGE])
    : TYPE_FROMAGE.AUTRE;
  return {
    activite,
    date: dateLivraison,
    categorie: CATEGORIE_VENTE.FROMAGE,
    typeFromage: type,
    typeFromageLibre: type === TYPE_FROMAGE.AUTRE ? ligne.libelle : undefined,
    quantite: ligne.quantite,
    unite: UNITE_VENTE.PIECE,
    prix: totalLigne(ligne),
    tauxTva: tauxTvaDeLaVente(CATEGORIE_VENTE.FROMAGE),
    client: commande.client,
    choixFacture: avecFacture ? TYPE_CHOIX_FACTURE.AVEC_FACTURE : TYPE_CHOIX_FACTURE.SANS_FACTURE,
    numeroFacture: avecFacture ? numeroFacture?.trim() || undefined : undefined,
    payee: commande.enAttente ? false : undefined,
    echeance: commande.enAttente && commande.echeance ? commande.echeance : undefined,
    circuit: commande.circuit,
    commandeId: commande.id,
    fromages: ligne.lotIds?.length ? ligne.lotIds.join(SEPARATEUR_ANIMAUX) : undefined,
  };
}

/**
 * Livre une commande : chaque ligne devient une vente de fromages (le stock et la comptabilité suivent), la commande passe à
 * « livrée » et garde ses ventes pour pouvoir être défaite.
 */
export async function livrerCommande(
  commande: Commande,
  dateLivraison: string,
  activite: ActiviteComptable,
  avecFacture: boolean,
  numeroFacture?: string,
): Promise<Commande> {
  const venteIds: string[] = [...(commande.venteIds ?? [])];
  const faites = new Set(commande.lignesFacturees ?? []);
  // Les lignes déjà facturées (par parties) ne sont pas refaites.
  for (const ligne of commande.lignes.filter((l) => l.quantite > 0 && !faites.has(l.id))) {
    const vente = await enregistrerVente(
      venteDeLaLigne(commande, ligne, dateLivraison, activite, avecFacture, numeroFacture),
    );
    venteIds.push(vente.id);
  }
  return enregistrerCommande({
    ...commande,
    statut: STATUT_COMMANDE.LIVREE,
    dateLivraison,
    venteIds,
    lignesFacturees: commande.lignes.map((l) => l.id),
  });
}

/** Défait une livraison : ses ventes sont supprimées (le stock revient) et la commande redevient « préparée ». */
export async function annulerLivraison(commande: Commande): Promise<Commande> {
  for (const id of commande.venteIds ?? []) await supprimerVente(id);
  return enregistrerCommande({
    ...commande,
    statut: STATUT_COMMANDE.PREPAREE,
    dateLivraison: undefined,
    venteIds: undefined,
    lignesFacturees: undefined,
  });
}
