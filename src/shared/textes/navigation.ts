import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « navigation ». À modifier ici uniquement. */
export const TEXTES_NAVIGATION = {
  /** La pastille de la capsule du haut qui déroule les rubriques : Cheptel, Production, Commercial, Comptabilité, Organisation. */
  menus: 'Menus',
  /** Les affichages de la version Windows, proposés au bas du menu « Menus » (voir src/shared/utils/affichage.ts). */
  affichage: {
    titre: 'Affichage',
    bureau: 'Version bureau (menus de la fenêtre)',
    mobile: 'Version mobile pour PC',
    sobre: 'Version sobre (sans couleur ni dessin)',
  },
  /** Les menus de la version Windows (barre du haut). */
  menuBureau: {
    historiqueDesStocks: 'Historique des stocks',
    statistiquesDesStocks: 'Statistiques des stocks',
  },
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
