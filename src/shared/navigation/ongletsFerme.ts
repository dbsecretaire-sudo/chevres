import { ROUTES } from '@/shared/constants/routes';

/**
 * Les quatre pages de la ferme qui se parcourent par le titre à onglets : la Ferme, l'Atelier, le Commerce et les Documents. Le titre de la page
 * courante est une de ces pages ; les autres s'ouvrent d'un appui. L'en-tête les affiche à la place du titre sur ces quatre pages.
 */
export const ONGLETS_FERME: readonly { libelle: string; adresse: string }[] = [
  { libelle: 'Ferme', adresse: ROUTES.CHEPTEL },
  { libelle: 'Atelier', adresse: ROUTES.PRODUCTION },
  { libelle: 'Commerce', adresse: ROUTES.rubrique('commerce') },
  { libelle: 'Documents', adresse: ROUTES.rubrique('documents') },
];
