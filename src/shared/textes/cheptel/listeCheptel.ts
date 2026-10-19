import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

export const listeCheptelTextes = {
  /** Le titre de l'écran (ouvert depuis la ligne « Cheptel » de l'onglet). */
  titre: 'Cheptel actif',
  vivantes: 'Vivantes',
  autoConsommees: 'Auto-consommées',
  mortNees: 'Mort-nées',
  toutesSorties: 'Toutes sorties',
  toutes: 'Toutes',
  sansBoucle: 'Sans boucle',
  tous: 'Tous',
  derniereMiseBas: 'Dernière mise bas',
  morte: 'Morte',
  anneePresentSurLExploitation: 'Année (présent sur l’exploitation)',
  categorie: 'Catégorie',
  trierFiltrePar: 'Filtrer par',
  aucunFiltre: 'Aucun filtre',
  dansTousLesChampsPoints: 'Dans tous les champs…',
  dateDeNaissanceDu: 'Date de naissance — du',
  dateDeNaissanceAu: 'Date de naissance — au',
  dateDAbattageDu: 'Date d’abattage — du',
  dateDAbattageAu: 'Date d’abattage — au',
  annee: 'Année',
  aaaa: 'AAAA',
  nombreDAnimauxMortsSur: 'Nombre d’animaux morts sur l’exploitation cette année-là.',
  chevresNeesAvantPendantCette:
    'Animaux nés avant/pendant cette année et encore présents (vivants ou sortis pendant/après) — le filtre Statut est ignoré ici.',
  effacerLaDateDeNaissance: 'Effacer la date de naissance',
  effacerLaDateDAbattage: 'Effacer la date d’abattage',
  effacerLAnnee: 'Effacer l’année',
  effacerLAnneeDeRenouvellement: 'Effacer l’année de renouvellement',
  resultatDeuxPoints: 'Résultat : ',
  aucunAnimalNeCorrespondAux: 'Aucun animal ne correspond aux filtres sélectionnés.',
  ajouterAuCheptel: 'Ajouter au cheptel',
  envoyeALAbattoir: 'envoyé à l’abattoir',
  autoConsomme: 'auto-consommé',
  mortNe: 'mort-né',
  get chevre() {
    return V().femelle.singulier;
  },
  animalSansBoucle: 'animal sans boucle',
  male: 'mâle',
  renouvellementValeur: (valeur: unknown) => `renouvellement ${valeur}`,
  aucunAnimalSuffixestatut: (suffixeStatut: string) => `Aucun animal${suffixeStatut}`,
  aucunValeurSuffixestatut: (valeur: string, suffixeStatut: string) => `Aucun ${valeur}${suffixeStatut}`,
  mereMerenumeroboucle: (mereNumeroBoucle: string) => ` · Mère : ${mereNumeroBoucle}`,
} as const;
