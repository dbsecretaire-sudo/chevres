import { pageDAvant, reculer } from '@/shared/navigation/historiqueDesPages';

/** Ce qu'il faut du routeur pour revenir en arrière. */
interface RouteurPourRevenir {
  back: () => void;
  navigate: (href: never) => void;
}

/**
 * Revenir à la page vue juste avant, d'après l'historique du téléphone : la fin d'un formulaire (enregistrer, annuler, supprimer) ramène à la page d'où on l'a ouvert (une facture
 * créée depuis Assurance revient dans Assurance), pas à ce que la pile de la rubrique gardait. Sans historique (la version Windows, ou la première page), le retour habituel.
 */
export function retournerALaPageDAvant(routeur: RouteurPourRevenir): void {
  const avant = pageDAvant();
  if (avant) {
    reculer();
    routeur.navigate(avant as never);
  } else routeur.back();
}
