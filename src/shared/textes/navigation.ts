import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « navigation ». À modifier ici uniquement. */
export const TEXTES_NAVIGATION = {
  layout: {
    accueil: 'Accueil',
    reglages: 'Organisation',
    get ficheChevre() {
      return `Fiche ${V().femelle.singulier}`;
    },
    get nouvelleChevre() {
      return `Nouvelle ${V().femelle.singulier}`;
    },
    declarerUneNaissance: 'Déclarer une naissance',
    ajoutRapide: 'Ajout rapide',
    naissances: 'Naissances',
    historiqueMortesAbattoirVendues: 'Historique (mortes, abattoir, vendues)',
    nouvelleEcriture: 'Nouvelle écriture',
    nouveauControle: 'Nouveau contrôle',
    nouveauGroupement: 'Nouveau groupement',
    nouveauTerrain: 'Nouveau terrain',
    modificationControle: 'Modification',
  },
} as const;
