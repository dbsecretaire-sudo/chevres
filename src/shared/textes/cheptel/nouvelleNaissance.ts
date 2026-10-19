import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

export const nouvelleNaissanceTextes = {
  /** Le titre de l'écran quand la mère est connue (on arrive de sa fiche). */
  titrePour: (boucle: string) => `Déclarer une naissance pour ${boucle}`,
  mereRequise: 'Mère requise',
  merciDeRenseignerLeN: 'Merci de renseigner le n° de boucle de la mère.',
  leNDoublonlocalEstUtilise: (doublonLocal: string) =>
    `Le n° ${doublonLocal} est utilisé plusieurs fois dans ce formulaire.`,
  choisirLaMere: 'Choisir la mère',
  get cabris() {
    return `${Cap(V().petit.pluriel)} (`;
  },
  enregistrerLaNaissance: 'Enregistrer la naissance',
} as const;
