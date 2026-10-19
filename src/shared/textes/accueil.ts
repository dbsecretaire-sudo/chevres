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
  /** L'accueil « ferme » : le bandeau, les papiers à jour, les minuteurs, les boutons flottants, l'enclos et les actions. */
  ferme: {
    bandeau: {
      portrait: 'Informations de l’exploitation',
      balance: 'Balance de l’année : recettes moins dépenses',
      animaux: (n: number) => `${n} animaux vivants`,
      boucles: 'Boucles posées sur les animaux vivants (le badge : les tiptag)',
      aliments: 'Aliment en stock',
      reglages: 'Réglages',
    },
    papiers: (faits: number, total: number) => `Papiers à jour ${faits}/${total}`,
    menus: {
      estive: 'Estive',
      production: 'Production',
      commercial: 'Commerce',
      stock: 'Stock',
      contacts: 'Contacts',
      reglages: 'Réglages',
    },
    outils: { annee: 'Année', espece: 'Animal' },
    cloche: { libelle: 'Rappels', titre: 'Rappels' },
    carte: { aide: 'Faites glisser la carte pour explorer la ferme', recentrer: 'Recentrer la carte' },
    zones: {
      enclos: (femelles: string) => `Enclos des ${femelles}`,
      foin: 'Foin et maïs',
      organismes: 'Organismes',
      equarrissage: 'Équarrissage',
      pompe: 'Pompe à essence',
      entrepot: 'Entrepôt (stock)',
      commercial: 'Commerce',
      morts: (n: number) => (n === 1 ? '1 mort cette année' : `${n} morts cette année`),
      veterinaire: 'Vétérinaire',
      laiterie: 'Laiterie',
      fromagerie: 'Fromagerie',
      charcuterie: 'Boucherie / charcuterie',
      abattoir: 'Abattoir',
      contacts: 'Clients et fournisseurs',
      lotsAFacturer: (n: number) => `${n} à facturer`,
      lotsARappeler: (n: number) => `${n} à rappeler`,
      estive: (zone?: string) => (zone?.trim() ? `À l’estive : ${zone.trim()}` : 'À l’estive'),
      descenteLe: (date: string) => `Descente le ${date}`,
      aucunAnimal: 'Aucun animal',
      nes: (n: number) => `${n} nés cette année`,
    },
    actions: {
      ecriture: 'Écriture',
      naissance: 'Naissance',
      traitement: 'Traitement',
      vente: 'Vendre',
    },
    jour: {
      titre: 'Rappels du jour',
      intro: 'Voici ce qui attend aujourd’hui :',
      compris: 'Compris',
      plusTard: 'Plus tard',
    },
    reglage: {
      classique: 'Accueil classique (sans la ferme)',
      aide: 'La ferme est l’accueil en images : enclos, boutons flottants, minuteurs. Cochez pour revenir à l’accueil simple, en liste.',
    },
  },
} as const;
