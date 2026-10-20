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
      boucles: 'Boucles posées sur les animaux vivants (le badge : les tiptag)',
      aliments: 'Aliment en stock',
      reglages: 'Réglages',
    },
    chevrerie: {
      sortir: 'Sortir',
      titre: 'Intérieur de l’exploitation',
      foin: 'Foin et maïs',
      lait: 'Lait',
      fromage: 'Fromage',
      jours: (n: number) => `${n} j`,
      voirPlus: (n: number) => (n === 1 ? 'Voir 1 animal de plus' : `Voir ${n} animaux de plus`),
      donner: 'Donner à manger',
      entrer: 'Entrer dans la chèvrerie',
    },
    /** Les boutons des deux colonnes de l'accueil : les lieux de la ferme. */
    colonnes: {
      rappels: 'Rappels',
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
      animaux: 'Animaux',
      naissance: 'Naissance',
      lots: 'Lots d’animaux',
      traitement: 'Traitement',
      vendre: 'Vendre',
      vendreViande: 'Vendre de la viande',
      ecriture: 'Écriture',
      clients: 'Clients et ventes',
      menuCheptel: 'Tout le cheptel',
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
