/**
 * Ce que la carte « Transformation » de l'accueil compte : les fromages en stock, la boucherie et la charcuterie (les produits de viande ajoutés
 * au stock), et la viande (tous les animaux du stock : les cabris, les animaux vivants et ceux sur pied, additionnés). Les niveaux négatifs (plus vendu que fabriqué) ne comptent pas.
 */
export interface CompteTransformation {
  fromages: number;
  charcuterie: number;
  viande: number;
}

interface Article {
  cle: string;
}

/** Les comptes de la Transformation d'après les articles du stock et leur niveau ; `role` dit si une ligne de viande suit le cheptel (jeunes, sur pied, vivant). */
export function compterTransformation(entree: {
  fromages: readonly Article[];
  viande: readonly Article[];
  niveau: (cle: string) => number;
  role: (cle: string) => string | undefined;
}): CompteTransformation {
  const somme = (articles: readonly Article[]) =>
    articles.reduce((total, a) => total + Math.max(0, entree.niveau(a.cle)), 0);
  return {
    fromages: somme(entree.fromages),
    charcuterie: somme(entree.viande.filter((a) => entree.role(a.cle) === undefined)),
    // Toute ligne qui suit le cheptel (jeunes, sur pied, vivant) : la viande de la carte additionne tous les animaux.
    viande: somme(entree.viande.filter((a) => entree.role(a.cle) !== undefined)),
  };
}
