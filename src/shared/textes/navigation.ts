import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « navigation ». À modifier ici uniquement. */
export const TEXTES_NAVIGATION = {
  layout: {
    accueil: 'Accueil',
    reglages: 'Réglages',
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
    nouvelleVisite: 'Nouvelle visite',
    nouveauControle: 'Nouveau contrôle',
  },
} as const;
