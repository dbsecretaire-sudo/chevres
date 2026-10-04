import { LITS_PAR_CHAMBRE } from '@/shared/constants/gite';

const pluriel = (nombre: number, mot: string) => `${nombre} ${mot}${nombre > 1 ? 's' : ''}`;

/** « Chambre 3 » ou « Chambres 1, 2 ». */
const listeDeChambres = (numeros: readonly number[]) =>
  numeros.length > 1 ? `Chambres ${numeros.join(', ')}` : `Chambre ${numeros[0]}`;

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
    chambres: listeDeChambres,
    personnes: (nombre: number) => `${nombre} pers.`,
    /** Sur chaque chambre d'une réservation de plusieurs chambres : combien elle en compte. */
    paye: 'Payé',
    aRegler: 'À régler',
    reservationDe: (chambres: number) => `Réservation de ${chambres} chambres`,
    dates: (arrivee: string, depart: string) => `${arrivee} → ${depart}`,
    resume: (chambres: number, total: number, personnes: number) =>
      `${chambres}/${total} chambres occupées${personnes > 0 ? ` · ${pluriel(personnes, 'personne')}` : ''}`,
    jourPrecedent: 'Jour précédent',
    jourSuivant: 'Jour suivant',
  },
  sejour: {
    nouveau: 'Nouveau séjour',
    modifier: 'Séjour',
    chambres: 'Chambres réservées',
    chambreNumero: (numero: number) => `Chambre ${numero}`,
    chambresListe: listeDeChambres,
    chambresRequises: 'Choisissez au moins une chambre.',
    arrivee: 'Arrivée',
    depart: 'Départ',
    nom: 'Nom du locataire ou du groupe',
    exempleNom: 'ex : Famille Martin',
    client: 'Fiche client (facultatif)',
    aucuneFiche: 'Aucune fiche',
    personnes: 'Nombre de personnes (facultatif, pour les lits)',
    personnesNonPrecisees: 'Non précisé',
    paiement: 'Paiement',
    validerPaiement: 'Valider le paiement',
    annulerPaiement: 'Annuler le paiement',
    datePaiement: 'Date du paiement',
    paiementEnAttente: 'Non payé : rien n’est inscrit en comptabilité tant que le paiement n’est pas validé.',
    paiementValide: 'Payé : le séjour est inscrit en comptabilité quand vous enregistrez.',
    repas: 'Nombre de repas',
    recapitulatif: 'Détail du prix',
    ligneHebergement: (chambres: number, nuits: number, prixNuit: string, montant: string) =>
      `${pluriel(chambres, 'chambre')} × ${pluriel(nuits, 'nuit')} × ${prixNuit} = ${montant}`,
    ligneTaxe: (montant: string) => `Taxe de séjour : ${montant}`,
    ligneRepas: (repas: number, prixRepas: string, montant: string) =>
      `Repas : ${repas} × ${prixRepas} = ${montant}`,
    total: 'Total payé',
    taxeHorsCa:
      'La taxe de séjour est comprise dans le total inscrit en comptabilité ; pensez à la reverser à la commune.',
    tarifsAbsents:
      'Définissez vos tarifs (prix d’une chambre par nuit, prix d’un repas) dans Réglages › Informations de l’entreprise › Tarifs.',
    appliquerTarifs: 'Appliquer les tarifs actuels',
    notes: 'Notes',
    nuits: (nombre: number) => pluriel(nombre, 'nuit'),
    nomRequis: 'Nom requis',
    personnesInvalides: (maximum: number) =>
      `Au maximum ${maximum} personnes pour cette réservation (${LITS_PAR_CHAMBRE} lits par chambre).`,
    departApresArrivee: 'Le départ doit être après l’arrivée.',
    chambreOccupee: (chambres: string, nom: string) =>
      `${chambres} : déjà réservée par « ${nom} » sur au moins une de ces nuits.`,
    supprimer: 'Supprimer ce séjour',
    supprimerQuestion: 'Supprimer ce séjour ?',
    supprimerMessage: 'Le séjour et sa recette en comptabilité seront supprimés.',
    introuvable: 'Séjour introuvable',
    comptabilise:
      'Une fois le paiement validé, le total payé est inscrit en comptabilité (recette « Hébergement »), avec le détail dans sa description.',
    /** La description de la recette en comptabilité : le séjour puis le détail du total (hébergement, taxe, repas). */
    descriptionSejour: (chambres: string, arrivee: string, depart: string, details: string[]) =>
      `Séjour ${chambres.toLowerCase()} du ${arrivee} au ${depart} : ${details.join(' + ')}`,
    detailHebergement: (chambres: number, nuits: number, prixNuit: string) =>
      `${pluriel(chambres, 'chambre')} × ${pluriel(nuits, 'nuit')} × ${prixNuit}`,
    detailHebergementTotal: (montant: string) => `hébergement ${montant}`,
    detailTaxe: (montant: string) => `taxe de séjour ${montant}`,
    detailRepas: (repas: number, prixRepas: string) => `${repas} repas × ${prixRepas}`,
  },
} as const;
