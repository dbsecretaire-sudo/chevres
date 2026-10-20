import { listFournisseurs } from '@/features/fournisseurs/repository';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

/** Vrai quand le contact est de catégorie Abattoir. */
export const estUnAbattoir = (f: { categorie?: string }): boolean =>
  f.categorie === CATEGORIE_FOURNISSEUR.ABATTOIR ||
  categorieFournisseurDe(f.categorie).id === CATEGORIE_FOURNISSEUR.ABATTOIR;

/** Les noms (en minuscules) des contacts de catégorie Abattoir : de quoi reconnaître le tiers d'une dépense. */
export async function nomsDesAbattoirs(): Promise<Set<string>> {
  const fournisseurs = await listFournisseurs();
  return new Set(fournisseurs.filter(estUnAbattoir).map((f) => (f.nomEntreprise || f.nom).trim().toLowerCase()));
}

/** Vrai quand le tiers est un contact de catégorie Abattoir. */
export const tiersEstUnAbattoir = (tiers: string, abattoirs: ReadonlySet<string>): boolean =>
  abattoirs.has(tiers.trim().toLowerCase());
