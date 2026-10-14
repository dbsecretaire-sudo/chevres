import type { Facture } from '@/features/comptabilite/types';
import { lignesProductionDe } from '@/features/comptabilite/utils/lignesProduction';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { GENRE_ARTICLE, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';
import type { MouvementStock } from '@/features/stock/types';

/** Un fromage de l'inventaire dans le tableau de répartition : son prix, ses litres de lait et ce que coûtent ses emballages. */
export interface FromageRepartition {
  cle: string;
  libelle: string;
  prix: number;
  litresParFromage: number;
  /** Ce que coûtent les emballages d'un fromage vendu (€) : ceux de son conditionnement, au prix moyen des achats. */
  coutEmballage: number;
}

export interface LigneRepartition {
  cle: string;
  libelle: string;
  /** La part du lait de l'année (0 à 1). */
  part: number;
  litres: number;
  /** Le nombre de fromages que ce lait donne (litres / litres par fromage). */
  nombre: number;
  /** Ce que ces fromages rapportent (nombre × prix). */
  recette: number;
  /** Ce que coûtent leurs emballages. */
  emballages: number;
  /** La recette moins les emballages. */
  net: number;
}

export interface Repartition {
  lignes: LigneRepartition[];
  /** Le lait vendu tel quel : le reste du lait, au prix du litre. */
  vendu: { part: number; litres: number; recette: number };
  total: { part: number; litres: number; nombre: number; recette: number; emballages: number; net: number };
  /** Ce que rapporterait tout le lait vendu tel quel, pour comparer. */
  toutVendu: number;
  /** Vrai quand les parts des fromages dépassent 100 % : il ne reste pas de lait à vendre. */
  depasse: boolean;
  /** Le petit-lait et le sel du brocciu, quand le brocciu fait partie de la répartition. */
  brocciu?: DetailBrocciu;
}

const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;

/** La recette du brocciu : les proportions qui servent à calculer ses quantités d'après le petit-lait des autres fromages. */
export interface RecetteBrocciu {
  litresPetitLaitParLot: number;
  /** Les litres de lait caillé dont sortent ces litres de petit-lait. */
  litresLaitCailleParLot: number;
  /** Le lait entier ajouté, en part du volume de petit-lait (0,25 : 25 %). */
  partLaitEntier: number;
  selGParLitrePetitLait: number;
}

/** Ce que demande le brocciu quand il est fabriqué avec le petit-lait des autres fromages. */
export interface DetailBrocciu {
  actif: boolean;
  /** Le petit-lait que donne le lait caillé des autres fromages (litres). */
  petitLaitDisponible: number;
  /** Le petit-lait que les brocciu fabriqués utilisent (litres). */
  petitLaitUtilise: number;
  selGrammes: number;
  /** Ce que coûte ce sel (€), d'après le prix de ses achats. */
  coutSel: number;
}

/**
 * Le tableau de répartition du lait (calcul pur) : chaque fromage reçoit une part du lait de l'année (`parts`, en %, par fromage) ; le
 * reste est vendu tel quel. Pour chaque fromage : les litres, le nombre de fromages qu'ils donnent, la recette, les emballages et le net.
 * Le brocciu (`brocciu`) ne prend pas de part choisie : fabriqué avec le petit-lait des autres fromages (leur lait caillé, selon la
 * recette), ses quantités se calculent d'elles-mêmes — son lait entier est celui des litres par fromage de l'inventaire — et le sel
 * s'ajoute à ses frais.
 */
export function calculerRepartition(entree: {
  litres: number;
  fromages: FromageRepartition[];
  /** Les parts choisies, en pourcentage du lait (par clé de fromage) ; une part absente vaut 0. */
  parts: Record<string, number>;
  /** Le prix du litre de lait vendu tel quel. */
  prixLait?: number;
  brocciu?: {
    cle: string;
    actif: boolean;
    recette: RecetteBrocciu;
    coutSelParGramme: number;
    /** Les seuls fromages dont le petit-lait sert au brocciu (le frais et l'affiné) ; sans liste, tous. */
    petitLaitDe?: readonly string[];
  };
}): Repartition {
  const prixLait = entree.prixLait ?? 0;
  const b = entree.brocciu;
  const ligne = (f: FromageRepartition, litres: number, fraisEnPlus = 0): LigneRepartition => {
    const nombre = litres / f.litresParFromage;
    const recette = nombre * f.prix;
    const emballages = nombre * f.coutEmballage + fraisEnPlus;
    return {
      cle: f.cle,
      libelle: f.libelle,
      part: entree.litres > 0 ? litres / entree.litres : 0,
      litres,
      nombre,
      recette: arrondi(recette),
      emballages: arrondi(emballages),
      net: arrondi(recette - emballages),
    };
  };
  // Les autres fromages d'abord : leur lait caillé donne le petit-lait du brocciu.
  const autres = new Map<string, LigneRepartition>();
  for (const f of entree.fromages) {
    if (f.cle === b?.cle) continue;
    autres.set(f.cle, ligne(f, entree.litres * (Math.max(0, entree.parts[f.cle] ?? 0) / 100)));
  }
  const litresAutres = [...autres.values()].reduce((t, l) => t + l.litres, 0);
  // Le petit-lait du brocciu : celui du fromage frais et de l'affiné seulement (pas celui du crottin).
  const litresPourPetitLait = [...autres.values()]
    .filter((l) => !b?.petitLaitDe || b.petitLaitDe.includes(l.cle))
    .reduce((t, l) => t + l.litres, 0);
  let detailBrocciu: DetailBrocciu | undefined;
  const lignes = entree.fromages.map((f): LigneRepartition => {
    if (!b || f.cle !== b.cle) return autres.get(f.cle) as LigneRepartition;
    const { recette } = b;
    const petitLaitDisponible =
      litresPourPetitLait * (recette.litresPetitLaitParLot / recette.litresLaitCailleParLot);
    // Le lait entier du brocciu vient du lait de l'année qui n'est pas déjà pris par les autres fromages.
    let nombre = 0;
    if (b.actif && f.litresParFromage > 0 && recette.partLaitEntier > 0) {
      nombre = (petitLaitDisponible * recette.partLaitEntier) / f.litresParFromage;
      const restant = Math.max(0, entree.litres - litresAutres);
      if (nombre * f.litresParFromage > restant) nombre = restant / f.litresParFromage;
    }
    const litresLaitEntier = nombre * f.litresParFromage;
    const petitLaitUtilise = recette.partLaitEntier > 0 ? litresLaitEntier / recette.partLaitEntier : 0;
    const selGrammes = petitLaitUtilise * recette.selGParLitrePetitLait;
    const coutSel = selGrammes * b.coutSelParGramme;
    detailBrocciu = {
      actif: b.actif,
      petitLaitDisponible,
      petitLaitUtilise,
      selGrammes,
      coutSel: arrondi(coutSel),
    };
    return ligne(f, litresLaitEntier, coutSel);
  });
  const partFromages = lignes.reduce((t, l) => t + l.part, 0);
  const depasse = partFromages > 1 + 1e-9;
  const partVendu = Math.max(0, 1 - partFromages);
  const litresVendus = entree.litres * partVendu;
  const vendu = { part: partVendu, litres: litresVendus, recette: arrondi(litresVendus * prixLait) };
  const somme = (champ: 'litres' | 'nombre' | 'recette' | 'emballages' | 'net') =>
    lignes.reduce((t, l) => t + l[champ], 0);
  return {
    lignes,
    vendu,
    total: {
      part: partFromages + partVendu,
      litres: somme('litres') + litresVendus,
      nombre: somme('nombre'),
      recette: arrondi(somme('recette') + vendu.recette),
      emballages: arrondi(somme('emballages')),
      net: arrondi(somme('net') + vendu.recette),
    },
    toutVendu: arrondi(entree.litres * prixLait),
    depasse,
    brocciu: detailBrocciu,
  };
}

/**
 * Ce que coûte une unité de chaque fourniture achetée (€), d'après les factures d'achat qui l'ajoutent à l'inventaire : le montant de
 * chaque fourniture, divisé par la quantité achetée, en moyenne sur tous les achats. Hors taxes (d'après le taux de TVA de la facture)
 * quand `horsTaxes` est vrai, sinon TTC. Une fourniture jamais achetée n'y figure pas. `prefixe` limite aux articles d'un genre.
 */
export function coutsUnitairesAchats(
  factures: Facture[],
  horsTaxes = false,
  prefixe?: string,
): Record<string, number> {
  const totaux: Record<string, { montant: number; quantite: number }> = {};
  for (const f of factures) {
    if (f.type !== TYPE_FACTURE.RECUE) continue;
    const coefficient = horsTaxes && f.tauxTva ? 1 / (1 + f.tauxTva / 100) : 1;
    // Chaque fourniture a son montant (une ancienne facture n'a qu'un article : tout son montant).
    for (const ligne of lignesProductionDe(f)) {
      if (!(ligne.quantite && ligne.quantite > 0)) continue;
      if (prefixe && !ligne.article.startsWith(prefixe)) continue;
      const t = (totaux[ligne.article] ??= { montant: 0, quantite: 0 });
      t.montant += ligne.montant * coefficient;
      t.quantite += ligne.quantite;
    }
  }
  return Object.fromEntries(Object.entries(totaux).map(([cle, t]) => [cle, t.montant / t.quantite]));
}

/** Ce que coûte une unité de chaque emballage (voir coutsUnitairesAchats) : le prix des emballages d'un fromage vendu. */
export const coutsUnitairesEmballages = (factures: Facture[], horsTaxes = false): Record<string, number> =>
  coutsUnitairesAchats(factures, horsTaxes, `${GENRE_ARTICLE.EMBALLAGE}:`);

/**
 * La part du lait de l'année que chaque fromage a réellement utilisée (en %), d'après les litres notés à leurs fabrications : le point de
 * départ du tableau, que l'utilisateur modifie pour comparer d'autres répartitions.
 */
export function partsReelles(
  mouvements: MouvementStock[],
  litresProduits: number,
  annee: number,
): Record<string, number> {
  const parts: Record<string, number> = {};
  if (!(litresProduits > 0)) return parts;
  for (const m of mouvements) {
    if (m.origine !== ORIGINE_MOUVEMENT.MANUEL || m.delta <= 0 || !(m.litres && m.litres > 0)) continue;
    if (!m.date.startsWith(String(annee))) continue;
    parts[m.article] = (parts[m.article] ?? 0) + (m.litres / litresProduits) * 100;
  }
  return Object.fromEntries(Object.entries(parts).map(([cle, p]) => [cle, Math.round(p * 10) / 10]));
}
