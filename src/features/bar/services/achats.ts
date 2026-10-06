import { ajusterStock, lireArchiveBar } from '@/features/bar/repository';
import type { LigneMarchandise } from '@/features/comptabilite/types';

/** Les quantités achetées par marchandise (son nom), toutes lignes confondues. */
const quantitesParNom = (lignes: LigneMarchandise[] = []): Map<string, number> => {
  const quantites = new Map<string, number>();
  for (const l of lignes) {
    if (l.marchandise && l.quantite)
      quantites.set(l.marchandise, (quantites.get(l.marchandise) ?? 0) + l.quantite);
  }
  return quantites;
};

/**
 * Met le stock du gîte à jour d'après un achat de marchandises : la quantité de chaque ligne s'ajoute au stock de l'article du
 * même nom (une boisson, un aliment, du matériel, du conditionnement ou de l'entretien). Pour une facture modifiée ou
 * supprimée, on passe ses lignes d'avant et d'après : seul l'écart est appliqué (rien n'est compté deux fois, et supprimer
 * l'achat retire ce qu'il avait ajouté).
 */
export async function synchroniserStockAchat(
  avant: LigneMarchandise[] | undefined,
  apres: LigneMarchandise[] | undefined,
): Promise<void> {
  const anciennes = quantitesParNom(avant);
  const nouvelles = quantitesParNom(apres);
  const noms = new Set([...anciennes.keys(), ...nouvelles.keys()]);
  if (noms.size === 0) return;
  const bar = await lireArchiveBar();
  for (const nom of noms) {
    const ecart = (nouvelles.get(nom) ?? 0) - (anciennes.get(nom) ?? 0);
    if (ecart === 0) continue;
    const boisson = bar.boissons.find((b) => b.nom === nom);
    const aliment = bar.aliments.find((a) => a.nom === nom);
    const article = bar.articles.find((a) => a.nom === nom);
    if (boisson) await ajusterStock('boisson', boisson.id, ecart);
    else if (aliment) await ajusterStock('aliment', aliment.id, ecart);
    else if (article) await ajusterStock('article', article.id, ecart);
  }
}
