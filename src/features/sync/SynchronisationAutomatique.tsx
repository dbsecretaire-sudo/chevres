import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { attendreChangement, lireConnexion } from '@/features/sync/synchronisation';
import { useSynchronisation } from '@/features/sync/useSynchronisation';
import { lireCurseur, surAttente } from '@/shared/storage/depot';

/** Le délai entre la dernière saisie et l'envoi : une fiche saisie en plusieurs fois part une fois, complète. */
export const DELAI_ENVOI_MS = 3000;

/** Un compte utilisateur qui n'est pas encore prêt, ou une attente qui a échoué : on réessaie après ce délai (ce n'est pas une vérification des données). */
export const DELAI_NOUVEL_ESSAI_MS = 20000;
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
    // L'attente des modifications n'existe qu'au premier plan : en arrière-plan, la requête en cours est annulée et rien ne tourne.
    let auPremierPlan = AppState.currentState === 'active';
    let annulationAttente: AbortController | undefined;
    let reveilAttente: (() => void) | undefined;

    /** Connecté : seulement alors la synchronisation automatique agit. */
    const connecte = async () => (await lireConnexion()) !== null;
    /** Synchronisé au moins une fois : l'envoi automatique n'agit qu'alors (la première synchronisation d'un modérateur reste à la main). */
    const pret = async () => (await connecte()) && (await lireCurseur()) !== undefined;

    const recevoirSiPret = async () => {
      if (enCours || !(await connecte())) return;
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
      auPremierPlan = etat === 'active';
      if (auPremierPlan) {
        recevoirSiPret();
        reveilAttente?.();
      } else {
        annulationAttente?.abort();
      }
    });
    // Les écritures faites par l'envoi lui-même ne relancent pas un envoi : seules les saisies, hors d'un envoi, le font.
    const arretFile = surAttente((nombre) => {
      if (enCours || nombre === 0) return;
      clearTimeout(minuterie);
      minuterie = setTimeout(envoyerSiPret, DELAI_ENVOI_MS);
    });

    // Un compte utilisateur reste connecté à l'exploitation : le serveur répond dès qu'une modification est validée, et la réception part
    // aussitôt. Sans modification, l'attente finit toute seule au bout de quelques secondes, et une nouvelle commence.
    let arret = false;
    const pause = (ms: number) => new Promise((resoudre) => setTimeout(resoudre, ms));
    const attendreLesChangements = async () => {
      while (!arret) {
        // En arrière-plan (ou application éteinte), rien ne tourne : on attend le retour au premier plan.
        if (!auPremierPlan) {
          await new Promise<void>((resoudre) => {
            reveilAttente = resoudre;
          });
          reveilAttente = undefined;
          continue;
        }
        try {
          const connexion = await lireConnexion();
          const curseur = await lireCurseur();
          if (connexion?.role !== 'utilisateur' || curseur === undefined) {
            await pause(DELAI_NOUVEL_ESSAI_MS);
            continue;
          }
          annulationAttente = new AbortController();
          const { changement } = await attendreChangement(curseur, annulationAttente.signal);
          annulationAttente = undefined;
          if (arret) return;
          if (changement) await recevoirSiPret();
        } catch {
          annulationAttente = undefined;
          // Interrompue par le passage en arrière-plan : la boucle attend le retour au premier plan, sans délai.
          if (!arret && auPremierPlan) await pause(DELAI_NOUVEL_ESSAI_MS);
        }
      }
    };
    void attendreLesChangements();

    return () => {
      arret = true;
      annulationAttente?.abort();
      reveilAttente?.();
      clearTimeout(minuterie);
      premierPlan.remove();
      arretFile();
    };
  }, []);

  return null;
}
