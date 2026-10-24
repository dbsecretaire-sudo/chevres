/**
 * Ce que la carte « Transformation » de l'accueil compte : les fromages en stock, les plats préparés et les savons, la boucherie et la charcuterie (les produits de viande ajoutés
 * au stock), et la viande : les animaux abattus qui restent à facturer à un client (pas ceux du cheptel). Les niveaux négatifs (plus vendu que fabriqué) ne comptent pas.
 */
export interface CompteTransformation {
  fromages: number;
  charcuterie: number;
  viande: number;
  plats: number;
  savons: number;
}

interface Article {
  cle: string;
}

/**
 * Les comptes de la Transformation d'après les articles du stock et leur niveau ; `role` dit si une ligne de viande suit le cheptel (jeunes, sur pied, vivant) : elle n'est pas un produit
 * en stock. `animauxAbattusAFacturer` : les animaux abattus pas encore facturés (la viande de la carte).
 */
export function compterTransformation(entree: {
  fromages: readonly Article[];
  viande: readonly Article[];
  plats?: readonly Article[];
  savons?: readonly Article[];
  niveau: (cle: string) => number;
  role: (cle: string) => string | undefined;
  animauxAbattusAFacturer?: number;
}): CompteTransformation {
  const somme = (articles: readonly Article[]) =>
    articles.reduce((total, a) => total + Math.max(0, entree.niveau(a.cle)), 0);
  return {
    fromages: somme(entree.fromages),
    charcuterie: somme(entree.viande.filter((a) => entree.role(a.cle) === undefined)),
    viande: entree.animauxAbattusAFacturer ?? 0,
    plats: somme(entree.plats ?? []),
    savons: somme(entree.savons ?? []),
  };
}
