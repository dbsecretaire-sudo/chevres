/** Les largeurs de colonnes qu'on a tirées à la souris, gardées d'un démarrage à l'autre (le poste Windows : le stockage du navigateur de l'application). */
const PREFIXE = 'largeursDeColonnes:';

/** La clé d'un tableau : ses colonnes (deux tableaux n'ont pas les mêmes). */
const cleDuTableau = (colonnes: readonly string[]): string => PREFIXE + colonnes.join('|');

/** Les largeurs gardées pour ce tableau ; rien quand il n'y en a pas, ou qu'elles ne couvrent plus toutes ses colonnes (le tableau a changé). */
export function lireLargeursDeColonnes(colonnes: readonly string[]): Record<string, number> {
  try {
    const texte = globalThis.localStorage?.getItem(cleDuTableau(colonnes));
    if (!texte) return {};
    const lues = JSON.parse(texte) as Record<string, unknown>;
    const largeurs: Record<string, number> = {};
    for (const cle of colonnes) {
      const largeur = lues[cle];
      if (typeof largeur !== 'number' || !Number.isFinite(largeur) || largeur <= 0) return {};
      largeurs[cle] = largeur;
    }
    return largeurs;
  } catch {
    return {};
  }
}

/** Garde les largeurs de ce tableau ; un tableau sans largeur tirée n'en garde aucune. */
export function garderLargeursDeColonnes(colonnes: readonly string[], largeurs: Record<string, number>): void {
  try {
    if (Object.keys(largeurs).length === 0) globalThis.localStorage?.removeItem(cleDuTableau(colonnes));
    else globalThis.localStorage?.setItem(cleDuTableau(colonnes), JSON.stringify(largeurs));
  } catch {
    // Stockage indisponible (navigation privée, quota) : les largeurs valent pour cette séance seulement.
  }
}
