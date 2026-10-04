import { LITS_PAR_CHAMBRE } from '@/shared/constants/gite';

/** Textes de l'interface — gestion du gîte d'étape (calendrier, séjours). À modifier ici uniquement. */
export const TEXTES_GITE = {
  activites: {
    gite: 'Gîte',
    giteDetails: ['+ restauration', '+ ménage (gestion des draps)'],
    bar: 'Bar',
    barDetails: ['+ restauration'],
    annexes: 'Activités annexes',
    annexesDetails: ['produits à emporter'],
    dossiersClients: 'Dossiers clients',
    bientot: 'Bientôt disponible',
    rechercher: 'N’importe quel terme d’un séjour',
    aucunResultat: 'Aucun séjour trouvé',
    modifiezLaRecherche: 'Essayez un autre terme.',
  },
  calendrier: {
    occupation: (occupees: number, total: number) => `${occupees}/${total}`,
    legende: 'Chambres occupées cette nuit-là',
    nouveauSejour: 'Nouveau séjour',
    titre: 'Gîte',
  },
  jour: {
    gauche: 'Gauche',
    droite: 'Droite',
    libre: 'Libre',
    chambre: (numero: number) => `Chambre ${numero}`,
    personnes: (nombre: number) => `${nombre} pers.`,
    dates: (arrivee: string, depart: string) => `${arrivee} → ${depart}`,
    resume: (chambres: number, total: number, personnes: number) =>
      `${chambres}/${total} chambres occupées · ${personnes} personne${personnes > 1 ? 's' : ''}`,
    jourPrecedent: 'Jour précédent',
    jourSuivant: 'Jour suivant',
  },
  sejour: {
    nouveau: 'Nouveau séjour',
    modifier: 'Séjour',
    chambre: 'Chambre',
    chambreNumero: (numero: number) => `Chambre ${numero}`,
    arrivee: 'Arrivée',
    depart: 'Départ',
    nom: 'Nom du locataire ou du groupe',
    exempleNom: 'ex : Famille Martin',
    client: 'Fiche client (facultatif)',
    aucuneFiche: 'Aucune fiche',
    personnes: 'Nombre de personnes',
    prix: 'Prix payé (€)',
    notes: 'Notes',
    nuits: (nombre: number) => `${nombre} nuit${nombre > 1 ? 's' : ''}`,
    nomRequis: 'Nom requis',
    personnesInvalides: `Entre 1 et ${LITS_PAR_CHAMBRE} personnes par chambre (${LITS_PAR_CHAMBRE} lits).`,
    departApresArrivee: 'Le départ doit être après l’arrivée.',
    chambreOccupee: (nom: string) =>
      `Cette chambre est déjà réservée par « ${nom} » sur au moins une de ces nuits.`,
    supprimer: 'Supprimer ce séjour',
    supprimerQuestion: 'Supprimer ce séjour ?',
    supprimerMessage: 'Le séjour et sa facture d’hébergement en comptabilité seront supprimés.',
    introuvable: 'Séjour introuvable',
    comptabilise: 'Ce prix apparaît en comptabilité (recette « Hébergement »).',
    descriptionFacture: (chambre: number, arrivee: string, depart: string) =>
      `Séjour chambre ${chambre} du ${arrivee} au ${depart}`,
  },
} as const;
