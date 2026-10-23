/**
 * La pile des pages vues : chaque rubrique (Cheptel, Production, Commercial, Comptabilité…) garde les pages qu'on y a ouvertes, et l'application garde l'ordre des
 * rubriques visitées pour la flèche de retour. Un retour à l'accueil les oublie toutes : on repart de zéro, la flèche d'une page n'y ramène plus à de vieilles pages.
 */
interface NavigationDesOnglets {
  getState: () => { index: number; routes: { key: string; name: string; params?: object }[] };
  dispatch: (action: { type: string; payload?: object }) => void;
}

let navigation: NavigationDesOnglets | null = null;

/** La barre du bas, qui reçoit la navigation des onglets, la garde ici pour que la maison du bandeau puisse vider la pile. */
export function memoriserNavigationDesOnglets(courante: NavigationDesOnglets): void {
  navigation = courante;
}

/**
 * Efface la pile : chaque rubrique redevient sur sa première page, l'historique des rubriques repart de l'accueil. À appeler avant d'ouvrir l'accueil. Ne fait rien tant
 * que la navigation n'est pas connue (une page d'erreur, un test).
 */
export function viderLaPile(): void {
  if (!navigation) return;
  const etat = navigation.getState();
  const accueil = etat.routes.findIndex((r) => r.name === 'index');
  if (accueil < 0) return;
  navigation.dispatch({
    type: 'RESET',
    payload: {
      index: accueil,
      // Les pages ouvertes (l'état de chaque rubrique) sont retirées ; les rubriques et leurs identifiants restent.
      routes: etat.routes.map(({ key, name, params }) => ({ key, name, params })),
    },
  });
}
