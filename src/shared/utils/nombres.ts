/** Lit un nombre saisi au clavier (virgule ou point décimal) ; 0 si vide ou invalide. */
export function parseDecimal(texte: string): number {
  return Number(texte.replace(',', '.')) || 0;
}

/**
 * Lit un montant saisi ou affiché en monnaie (« 2,5 », « 2,50 € », « 1 000,00 € ») : tout ce qui n'est pas un chiffre,
 * une virgule, un point ou un signe moins est ignoré ; 0 si vide ou invalide.
 */
export function parseMontant(texte: string): number {
  return parseDecimal(texte.replace(/[^\d,.-]/g, ''));
}

/** Somme des montants saisis (en texte) d'une liste de lignes de formulaire. */
export function totalMontants(lignes: { montant: string }[]): number {
  return lignes.reduce((total, ligne) => total + parseDecimal(ligne.montant), 0);
}

/** Formate un total en euros pour l'affichage dans un formulaire (ex : « 12,50 € »). */
export function formatTotalEuros(total: number): string {
  return `${total.toFixed(2).replace('.', ',')} €`;
}
