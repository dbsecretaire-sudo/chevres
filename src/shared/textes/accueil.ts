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
      portrait: 'Retour à l’accueil',
      balance: 'Balance de l’année : recettes moins dépenses',
      animaux: (n: number) => `${n} animaux vivants`,
      aliments: 'Aliment en stock',
      boucles: 'Boucles posées sur les animaux vivants (le badge : les tiptag)',
      rappels: 'Rappels à valider',
    },
    /** Le titre du panneau des personnes et entreprises (les intervenants) sur le côté des cartes. */
    intervenants: 'Intervenants',
    /** La carte « Travail du produit » (la transformation) : ce qu'on fabrique et garde chez soi (fromages, boucherie et charcuterie, viande). */
    transformation: {
      titre: 'Travail du produit',
      fromages: (n: number) => `${n} ${n === 1 ? 'fromage' : 'fromages'}`,
      charcuterie: (n: number) => `${n} boucherie/charcuterie`,
      viande: (n: number) => `${n} viande`,
      entrer: 'Entrer dans le travail du produit',
    },
    chevrerie: {
      sortir: 'Sortir',
      titre: 'Intérieur de l’exploitation',
      entrer: 'Entrer dans l’exploitation',
    },
    /** Les boutons des deux colonnes de l'accueil : les lieux de la ferme. */
    colonnes: {
      alimentation: 'Aliments',
      clients: 'Commerce',
      sante: 'Santé',
      grange: 'Grange',
      nouveau: 'Nouveau',
      lots: 'Lots d’animaux',
      boucles: 'Boucles',
      bilanAnnuel: 'Bilan annuel',
      carnetNaissance: 'Carnet de naissance',
      fabriquerFromage: 'Fabriquer un fromage',
      fabriquerCharcuterie: 'Fabriquer de la charcuterie',
      lotsFromages: 'Lots de fromages',
      rappelsLots: 'Rappels de lots',
      qualiteLait: 'Qualité du lait',
      reserver: 'Réserver',
      laiterie: 'Laiterie',
      abattoir: 'Abattoir',
      carburant: 'Pompe à essence',
      garage: 'Garage',
      assurance: 'Assurance',
      banque: 'Banque',
      groupement: 'Groupement',
      groupementSanitaire: 'Groupement sanitaire',
      emballages: 'Emballages',
      estive: 'Estive',
      veterinaire: 'Vétérinaire',
      equarrissage: 'Équarrissage',
      organismes: 'Organismes',
      stock: 'Stock',
      contacts: 'Contacts',
    },
    /** La barre du bas. */
    barre: { annee: 'Année', espece: 'Animal', didacticiel: 'Didacticiel', reglages: 'Organisation' },
    bulles: {
      contactsEtEcritures: 'Contacts et écritures',
      naissance: 'Ajouter une naissance',
      alimentation: 'Alimentation',
      acheterNourriture: 'Acheter de la nourriture',
      stockNourriture: 'Stock de nourriture',
      traitements: 'Traitements',
      carnetSanitaire: 'Carnet sanitaire',
      abattoir: 'Amener à l’abattoir',
      perte: 'Déclarer une perte',
      clients: 'Clients et ventes',
      lait: 'Lait par animal',
      qualite: 'Qualité du lait',
      recolteur: 'Récolteur et factures',
      factureLait: 'Facture de lait',
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
