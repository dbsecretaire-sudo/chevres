/** Vrai dans la version Windows (l'application dans une fenêtre de bureau, voir bureau/main.js) : l'ordinateur y offre un pont. */
export const estBureau = (): boolean =>
  typeof window !== 'undefined' && !!(window as { bureau?: unknown }).bureau;
