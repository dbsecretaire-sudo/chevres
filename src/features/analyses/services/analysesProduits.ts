import type { AnalyseProduit, ProduitAnalyse, ResultatParametre } from '@/features/settings/settings';

/**
 * Les analyses des produits finis (fromage, charcuterie) : les autocontrôles microbiologiques d'un produit de la ferme. Les critères sont ceux du
 * règlement (CE) n° 2073/2005 tels qu'on les retient d'ordinaire pour ces produits : de simples repères pour lire un résultat, jamais un avis
 * officiel — c'est le laboratoire et le plan de maîtrise sanitaire de la ferme qui font foi.
 */

/** Comment un paramètre se lit : une recherche dans 25 g (absence ou présence), ou un dénombrement en UFC par gramme. */
export type TypeParametre = 'absence' | 'ufc';

export interface ParametreAnalyse {
  id: string;
  type: TypeParametre;
  /** Pour un dénombrement : le seuil de satisfaction (m) et le seuil limite (M), en UFC/g. Sans eux, le résultat se note sans être jugé. */
  m?: number;
  M?: number;
}

/** Les paramètres de chaque produit, dans l'ordre où on les saisit. */
export const PARAMETRES: Record<ProduitAnalyse, readonly ParametreAnalyse[]> = {
  fromage: [
    { id: 'listeria', type: 'absence' },
    { id: 'salmonelle', type: 'absence' },
    { id: 'staphylocoques', type: 'ufc', m: 10_000, M: 100_000 },
    { id: 'ecoli', type: 'ufc', m: 10_000, M: 100_000 },
    { id: 'enterotoxines', type: 'absence' },
  ],
  charcuterie: [
    { id: 'listeria', type: 'absence' },
    { id: 'salmonelle', type: 'absence' },
    { id: 'ecoli', type: 'ufc' },
    { id: 'staphylocoques', type: 'ufc' },
  ],
  // Un plat préparé (conserve, bocal) : les germes d'un produit prêt à consommer, et le test de stabilité à l'étuve d'une conserve appertisée.
  plat: [
    { id: 'stabilite', type: 'absence' },
    { id: 'listeria', type: 'absence' },
    { id: 'salmonelle', type: 'absence' },
    { id: 'clostridies', type: 'ufc' },
    { id: 'bacillus', type: 'ufc' },
    { id: 'ecoli', type: 'ufc' },
    { id: 'staphylocoques', type: 'ufc' },
  ],
  // Un savon (cosmétique) : les repères de la norme ISO 17516 (catégorie 2, produits hors contour des yeux et enfants de moins de trois ans).
  savon: [
    { id: 'flore_totale', type: 'ufc', m: 1000, M: 1000 },
    { id: 'levures_moisissures', type: 'ufc', m: 100, M: 100 },
    { id: 'pseudomonas', type: 'absence' },
    { id: 'staphylocoque_dore', type: 'absence' },
    { id: 'candida', type: 'absence' },
  ],
};

/** Le produit d'analyse d'un paramètre d'adresse (`?produit=`) : le fromage quand il est absent ou inconnu. */
export const produitAnalyse = (valeur: string | undefined): ProduitAnalyse =>
  valeur === 'charcuterie' || valeur === 'plat' || valeur === 'savon' ? valeur : 'fromage';

/** Le jugement d'un résultat : conforme, à surveiller (entre les deux seuils), ou non conforme. */
export type Verdict = 'conforme' | 'surveiller' | 'non_conforme';

const GRAVITE: Record<Verdict, number> = { conforme: 0, surveiller: 1, non_conforme: 2 };

/** Le jugement d'un résultat d'après les critères du paramètre ; rien quand il n'est pas saisi ou que le paramètre n'a pas de critère. */
export function evaluer(parametre: ParametreAnalyse, resultat: ResultatParametre | undefined): Verdict | undefined {
  if (resultat === undefined) return undefined;
  if (parametre.type === 'absence') {
    if (resultat === 'absence') return 'conforme';
    return resultat === 'presence' ? 'non_conforme' : undefined;
  }
  if (typeof resultat !== 'number' || parametre.m === undefined || parametre.M === undefined) return undefined;
  if (resultat <= parametre.m) return 'conforme';
  return resultat <= parametre.M ? 'surveiller' : 'non_conforme';
}

/** Le jugement d'une analyse : le pire de ceux de ses paramètres ; rien quand aucun n'est jugé. */
export function verdictDeLAnalyse(analyse: Pick<AnalyseProduit, 'produit' | 'resultats'>): Verdict | undefined {
  let pire: Verdict | undefined;
  for (const parametre of PARAMETRES[analyse.produit]) {
    const verdict = evaluer(parametre, analyse.resultats[parametre.id]);
    if (verdict && (!pire || GRAVITE[verdict] > GRAVITE[pire])) pire = verdict;
  }
  return pire;
}

/** Les analyses d'un produit, de la plus récente à la plus ancienne. */
export const analysesDuProduit = (analyses: readonly AnalyseProduit[] | undefined, produit: ProduitAnalyse): AnalyseProduit[] =>
  (analyses ?? []).filter((a) => a.produit === produit).sort((a, b) => b.date.localeCompare(a.date));

/** Les jours entre une date passée et aujourd'hui (AAAA-MM-JJ). */
export function joursDepuis(date: string, aujourdhui: string): number {
  return Math.round((new Date(`${aujourdhui}T00:00:00Z`).getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 86_400_000);
}

/** Un résultat saisi en texte : un nombre d'UFC/g (la virgule se tape telle quelle), ou rien quand le champ est vide ou invalide. */
export function nombreSaisi(texte: string): number | undefined {
  const t = texte.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
