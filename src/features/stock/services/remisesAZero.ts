import type { MouvementStock } from '@/features/stock/types';
import { GENRE_ARTICLE, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';

/** Vrai pour un mouvement qu'on déduit (et qu'on ne stocke pas) : la remise à zéro d'un aliment à l'arrivée d'un nouvel achat. */
export const estRemiseAZero = (m: MouvementStock): boolean =>
  !!m.automatique && m.origine === ORIGINE_MOUVEMENT.CONSOMMATION;

/**
 * Ajoute aux mouvements la remise à zéro des aliments : à chaque achat d'un aliment, ce qui restait de ce même aliment (ses
 * achats précédents, moins ce qui a été consommé à la main) est considéré comme consommé. Ces mouvements se déduisent à
 * chaque lecture et ne sont jamais enregistrés : le stock d'un aliment est donc toujours celui de son dernier achat, même pour
 * des achats saisis avant cette règle ou dans le désordre. `jusquAu` : la date (AAAA-MM-JJ) où l'utilisateur l'a désactivée ; les achats
 * de ce jour et d'après n'en ont plus, ceux d'avant gardent la leur.
 */
export function avecRemisesAZero(mouvements: MouvementStock[], jusquAu?: string): MouvementStock[] {
  const bases = mouvements.filter((m) => !estRemiseAZero(m));
  const remises: MouvementStock[] = [];
  const achats = bases
    .filter(
      (m) =>
        m.origine === ORIGINE_MOUVEMENT.ACHAT &&
        m.article.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) &&
        (!jusquAu || m.date < jusquAu),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const achat of achats) {
    const reste = [...bases, ...remises]
      .filter(
        (m) =>
          m.article === achat.article &&
          m.id !== achat.id &&
          (m.date < achat.date || (m.date === achat.date && m.origine !== ORIGINE_MOUVEMENT.ACHAT)),
      )
      .reduce((somme, m) => somme + m.delta, 0);
    if (reste > 0) {
      remises.push({
        id: `remise-${achat.id}`,
        article: achat.article,
        date: achat.date,
        delta: -reste,
        origine: ORIGINE_MOUVEMENT.CONSOMMATION,
        factureId: achat.factureId,
        automatique: true,
      });
    }
  }
  return [...bases, ...remises];
}
