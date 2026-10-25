import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { lireConnexion } from '@/features/sync/synchronisation';
import { useSynchronisation } from '@/features/sync/useSynchronisation';
import { lireCurseur, surAttente } from '@/shared/storage/depot';

/** Le délai entre la dernière saisie et l'envoi : une fiche saisie en plusieurs fois part une fois, complète. */
export const DELAI_ENVOI_MS = 3000;

/**
 * La synchronisation sans bouton. À l'ouverture de l'application, et chaque fois qu'elle revient au premier plan, elle reçoit ce que les autres ont envoyé.
 * Après une saisie, elle envoie ce qui attend, quelques secondes plus tard. Sans connexion, ou avant la première synchronisation (qui se fait à la main, avec
 * le bouton Recevoir), rien ne se passe. Elle ne montre rien : ce qui n'est pas parti reste en attente, et le compteur l'indique.
 */
export function SynchronisationAutomatique() {
  const sync = useSynchronisation();
  // Les écouteurs ci-dessous restent abonnés une seule fois : ils lisent la synchronisation la plus récente par cette référence.
  const reference = useRef(sync);
  useEffect(() => {
    reference.current = sync;
  });

  useEffect(() => {
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    let enCours = false;

    /** Synchronisé au moins une fois, et connecté : seulement alors la synchronisation automatique agit. */
    const pret = async () => (await lireConnexion()) !== null && (await lireCurseur()) !== undefined;

    const recevoirSiPret = async () => {
      if (enCours || !(await pret())) return;
      enCours = true;
      try {
        await reference.current.recevoir({ silencieux: true });
      } finally {
        enCours = false;
      }
    };

    const envoyerSiPret = async () => {
      if (enCours || !(await pret())) return;
      enCours = true;
      try {
        await reference.current.envoyer({ silencieux: true });
      } finally {
        enCours = false;
      }
    };

    recevoirSiPret();
    const premierPlan = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') recevoirSiPret();
    });
    // Les écritures faites par l'envoi lui-même ne relancent pas un envoi : seules les saisies, hors d'un envoi, le font.
    const arretFile = surAttente((nombre) => {
      if (enCours || nombre === 0) return;
      clearTimeout(minuterie);
      minuterie = setTimeout(envoyerSiPret, DELAI_ENVOI_MS);
    });

    return () => {
      clearTimeout(minuterie);
      premierPlan.remove();
      arretFile();
    };
  }, []);

  return null;
}
