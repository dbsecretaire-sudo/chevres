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
    /** Le titre de la colonne des personnes et entreprises (les intervenants), à gauche de la scène. */
    intervenants: 'Intervenants',
    /** Le titre de la colonne des rubriques de l'application, à droite de la scène. */
    gestion: 'Gestion',
    /** La scène « Travail du produit » (la transformation) : ce qu'on fabrique et garde chez soi (fromages, boucherie et charcuterie, viande). */
    transformation: {
      titre: 'Travail du produit',
      /** Le nom de l'atelier, sur son toit (le bâtiment de la gestion, de notre côté de la rue). */
      fromagerie: 'Atelier',
      fromages: (n: number) => `${n} ${n === 1 ? 'fromage' : 'fromages'}`,
      charcuterie: (n: number) => `${n} boucherie/charcuterie`,
      viande: (n: number) => `${n} viande`,
      plats: (n: number) => `${n} ${n === 1 ? 'plat préparé' : 'plats préparés'}`,
      savons: (n: number) => `${n} ${n === 1 ? 'savon' : 'savons'}`,
      entrer: 'Ouvrir le stock de l’atelier',
      /** Le nom de la pastille de la bascule du bas (le titre de la scène reste « Travail du produit »). */
      pastille: 'Atelier',
    },
    /** Le côté « Agritourisme » : les visiteurs de la ferme (visites, formules, repas). */
    agritourisme: {
      titre: 'Agritourisme',
      /** Le nom du bâtiment de la gestion, de notre côté de la rue. */
      batiment: 'Accueil',
      visitesAVenir: (n: number) => `${n} ${n === 1 ? 'visite à venir' : 'visites à venir'}`,
      visiteurs: (n: number) => `${n} ${n === 1 ? 'visiteur' : 'visiteurs'}`,
      recettes: (montant: string) => `${montant} de recettes`,
      entrer: 'Ouvrir les visites de la ferme',
    },
    /** Les boutons des deux colonnes de l'accueil : les lieux de la ferme. */
    colonnes: {
      alimentation: 'Aliments',
      particuliers: 'Particuliers',
      surfacesCommerciales: 'Surfaces commerciales',
      entreprises: 'Entreprises',
      visiteurs: 'Visiteurs',
      groupesVisiteurs: 'Groupes',
      tourisme: 'Office de tourisme',
      repas: 'Repas',
      nouvelleVisite: 'Nouvelle visite',
      visites: 'Visites',
      formules: 'Formules',
      tarifs: 'Tarifs',
      ventesAgritourisme: 'Ventes',
      ventesAtelier: 'Ventes',
      rentabilite: 'Rentabilité',
      sante: 'Santé',
      partenaires: 'Partenaires',
      grange: 'Grange',
      nouveau: 'Nouveau',
      lots: 'Lots d’animaux',
      boucles: 'Boucles',
      bilanAnnuel: 'Bilan annuel',
      venteVivant: 'Vente (vivant)',
      carnetNaissance: 'Carnet de naissance',
      fabriquer: 'Fabriquer',
      cheptel: 'Cheptel',
      documents: 'Documents',
      lotsAtelier: 'Lots',
      qualiteLait: 'Qualité du lait',
      analyses: 'Analyses',
      registreAnalyses: 'Registre des analyses',
      reserver: 'Réserver',
      laiterie: 'Laiterie',
      abattoir: 'Abattoir',
      carburant: 'Pompe à essence',
      garage: 'Garage',
      assurance: 'Assurance',
      banque: 'Banque et comptabilité',
      groupement: 'Association et coopérative',
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
      fabriquerFromage: 'Fromage',
      fabriquerCharcuterie: 'Charcuterie',
      fabriquerPlat: 'Plat préparé',
      fabriquerSavon: 'Savon',
      lotsAtelier: 'Lots',
      rappelsLots: 'Rappels de lots',
      naissance: 'Ajouter une naissance',
      alimentation: 'Statistiques',
      stockNourriture: 'Stock de nourriture',
      traitements: 'Traitements',
      carnetSanitaire: 'Visites du vétérinaire',
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
