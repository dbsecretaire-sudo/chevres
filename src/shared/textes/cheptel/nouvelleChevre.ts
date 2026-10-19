import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

export const nouvelleChevreTextes = {
  mereInconnue: 'Aucune / inconnue',
  nDeBoucleRequis: 'N° de boucle requis',
  get pourEnregistrerSesCabrisIl() {
    return `Pour enregistrer ses ${V().petit.pluriel}, il faut le n° de boucle de la mère.`;
  },
  leNValeurEstUtilise: (valeur: string) => `Le n° ${valeur} est utilisé plusieurs fois dans ce formulaire.`,
  get cetteChevreADesCabris() {
    return `Cette ${V().femelle.singulier} a des ${V().petit.pluriel} à enregistrer`;
  },
} as const;
