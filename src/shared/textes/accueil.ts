import { accorder, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « accueil ». À modifier ici uniquement. */
export const TEXTES_ACCUEIL = {
  accueil: {
    animauxVivants: 'Animaux vivants',
    dAlimentAnimalJour: 'd’aliment / animal / jour',
    soldeFactures: 'Solde factures',
    repartitionAnimaux: (femelles: number, males: number, petits: number) =>
      `${femelles} ${accorder(V().femelle, femelles)} · ${males} ${accorder(V().male, males)} · ${petits} ${accorder(V().petit, petits)}`,
  },
  /** L'accueil « ferme » : le bandeau, l'enclos, les boutons des lieux de la ferme, leurs bulles d'actions et la barre du bas. */
  ferme: {
    bandeau: {
      portrait: 'Informations de l’exploitation',
      balance: 'Balance de l’année : recettes moins dépenses',
      animaux: (n: number) => `${n} animaux vivants`,
      aliments: 'Aliment en stock',
      rappels: 'Rappels à valider',
      reglages: 'Réglages',
    },
    /** La carte « Transformation » : ce qu'on fabrique et garde chez soi (fromages, boucherie et charcuterie, viande). */
    transformation: {
      titre: 'Transformation',
      fromages: (n: number) => `${n} ${n === 1 ? 'fromage' : 'fromages'}`,
      charcuterie: (n: number) => `${n} boucherie/charcuterie`,
      viande: (n: number) => `${n} viande`,
      entrer: 'Entrer dans la transformation',
    },
    chevrerie: {
      sortir: 'Sortir',
      titre: 'Intérieur de l’exploitation',
      entrer: 'Entrer dans la chèvrerie',
    },
    /** Les boutons des deux colonnes de l'accueil : les lieux de la ferme. */
    colonnes: {
      alimentation: 'Alimentation',
      lots: 'Lots d’animaux',
      traitements: 'Traitements',
      boucles: 'Boucles',
      suivi: 'Suivi des mouvements',
      circulation: 'Document de circulation',
      bordereau: 'Bordereau de perte',
      recensement: 'Recensement annuel',
      generes: 'Documents générés',
      fromagerie: 'Fromagerie',
      viande: 'Viande',
      charcuterie: 'Charcuterie / Boucherie',
      laiterie: 'Laiterie',
      abattoir: 'Abattoir',
      fournisseurs: 'Fournisseurs',
      estive: 'Estive',
      veterinaire: 'Vétérinaire',
      equarrissage: 'Équarrissage',
      organismes: 'Organismes',
      stock: 'Stock',
      contacts: 'Contacts',
    },
    /** La barre du bas. */
    barre: { annee: 'Année', espece: 'Animal', didacticiel: 'Didacticiel', reglages: 'Réglages' },
    bulles: {
      contactsEtEcritures: 'Contacts et écritures',
      naissance: 'Ajouter une naissance',
      ajouterAnimal: 'Ajouter chèvre ou bouc',
      abattoir: 'Amener à l’abattoir',
      reserver: 'Réserver pour client',
      perte: 'Déclarer une perte',
      vendreViande: 'Vendre de la viande',
      clients: 'Clients et ventes',
      lait: 'Lait par animal',
      qualite: 'Qualité du lait',
      recolteur: 'Récolteur et factures',
      factureLait: 'Facture de lait',
      fromages: 'Fromages',
      fabriquer: 'Fabriquer',
      rappeler: 'Rappeler un lot',
      vendreFromage: 'Vendre du fromage',
      contacts: 'Contacts',
      nouveauContact: 'Nouveau contact',
    },
    zones: {
      enclos: 'Exploitation',
      estive: (zone?: string) => (zone?.trim() ? `À l’estive : ${zone.trim()}` : 'À l’estive'),
      descenteLe: (date: string) => `Descente le ${date}`,
      aucunAnimal: 'Aucun animal',
      nes: (n: number) => `${n} nés cette année`,
    },
    jour: {
      titre: 'Rappels du jour',
      intro: 'Voici ce qui attend aujourd’hui :',
      compris: 'Compris',
      plusTard: 'Plus tard',
    },
    reglage: {
      classique: 'Accueil classique (sans la ferme)',
      aide: 'La ferme est l’accueil en images : l’enclos et ses chèvres, les lieux de la ferme en boutons ronds. Cochez pour revenir à l’accueil simple, en liste.',
    },
  },
} as const;
