import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

export const ajoutRapideChevreTextes = {
  deQuiSAgitIlQuestion: 'De qui s’agit-il ?',
  laMere: 'La mère',
  get declarerUneNaissancePourCette() {
    return `Déclarer une naissance pour cette ${V().femelle.singulier}`;
  },
  get uneChevre() {
    return `Une ${V().femelle.singulier}`;
  },
  ajouterCetteFemelleAuCheptel: 'Ajouter cette femelle au cheptel',
  get unBouc() {
    return `Un ${V().male.singulier}`;
  },
  ajouterCeMaleAuCheptel: 'Ajouter ce mâle au cheptel',
  combienDePetitsQuestion: 'Combien de petits ?',
  sexeDeChaquePetit: 'Sexe de chaque petit',
  petitEspace: 'Petit ',
  continuer: 'Continuer',
} as const;
