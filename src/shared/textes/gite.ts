import { LITS_PAR_CHAMBRE } from '@/shared/constants/gite';

const pluriel = (nombre: number, mot: string, motPluriel = `${mot}s`) =>
  `${nombre} ${nombre > 1 ? motPluriel : mot}`;

/** « Chambre 3 » ou « Chambres 1, 2 ». */
const listeDeChambres = (numeros: readonly number[]) =>
  numeros.length > 1 ? `Chambres ${numeros.join(', ')}` : `Chambre ${numeros[0]}`;

/** Textes de l'interface — gestion du gîte d'étape (calendrier, séjours). À modifier ici uniquement. */
export const TEXTES_GITE = {
  /** « Modifier l'activité » du gîte : le compte et la TVA de l'hébergement. */
  activite: {
    menu: 'Menu',
    modifier: 'Modifier l’activité',
    historique: 'Historique des réservations',
    compte: 'Compte du plan comptable (hébergement)',
    choixDuCompte: 'Choisir un compte',
    tva: 'Taux de TVA (hébergement)',
    compteRequis: 'Compte requis',
    parDefaut: 'Compte d’office',
  },
  activites: {
    gite: 'Gîte',
    dossiersClients: 'Dossiers clients',
    bientot: 'Bientôt disponible',
    rechercher: 'N’importe quel terme',
    aucunResultat: 'Aucun séjour trouvé',
    modifiezLaRecherche: 'Essayez un autre terme.',
  },
  calendrier: {
    occupation: (occupees: number, total: number) => `${occupees}/${total}`,
    legende: 'Chambres occupées cette nuit-là — ! : paiement en attente',
    nouveauSejour: 'Nouveau séjour',
    titre: 'Gîte',
  },
  historique: {
    titre: 'Historique des réservations',
    rechercher: 'Un client ou une date (ex : 07/10/2026)',
    aucune: (annee: number) => `Aucune réservation en ${annee}.`,
    aucuneRecherche: 'Aucune réservation ne correspond à cette recherche.',
  },
  reservationsClient: {
    titre: 'Réservations',
    aucune: 'Aucune réservation pour ce client pour l’instant.',
    abandonnee: 'Réservation abandonnée',
    abandonneeRestaurantMaintenu: 'Réservation abandonnée — restaurant maintenu',
  },
  chambre: {
    ajouter: (numero: number) => `Ajouter la chambre ${numero}`,
    cote: 'Côté du couloir',
    gauche: 'Gauche',
    droite: 'Droite',
    ajouterUneChambre: 'Ajouter une chambre',
    supprimer: 'Supprimer la chambre',
    supprimerQuestion: 'Supprimer cette chambre ?',
    supprimerMessage: (numero: number) =>
      `Voulez-vous vraiment supprimer la chambre ${numero} ? Les réservations déjà faites ne sont pas touchées.`,
    suppressionImpossible: 'Suppression impossible',
    suppressionImpossibleMessage: (numero: number) =>
      `La chambre ${numero} fait partie d’au moins une réservation : modifiez ou supprimez d’abord ces réservations.`,
  },
  jour: {
    gauche: 'Gauche',
    droite: 'Droite',
    libre: 'Libre',
    chambre: (numero: number) => `Chambre ${numero}`,
    chambres: listeDeChambres,
    personnes: (nombre: number) => `${nombre} pers.`,
    /** Le nombre de personnes à droite du nom d'une réservation : « (8 pers.) ». */
    personnesEntreParentheses: (nombre: number) => `(${nombre} pers.)`,
    /** « 2 chambres », puis « 28 repas » sur sa propre ligne (rien quand il n'y en a pas). */
    nombreChambres: (chambres: number) => pluriel(chambres, 'chambre'),
    nombreRepas: (repas: number) => pluriel(repas, 'repas', 'repas'),
    /** « 142,00 € — » : le montant, suivi de l'état du paiement. */
    montantEtTiret: (montant: string) => `${montant} — `,
    /** Sur chaque chambre d'une réservation de plusieurs chambres : combien elle en compte. */
    paye: 'Payé',
    aRegler: 'À régler',
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
    client: 'Fiche client',
    aucuneFiche: 'Choisir une fiche',
    clientRequis: 'Choisissez une fiche client.',
    coordonneesRequises:
      'Cette fiche n’a ni téléphone ni e-mail : complétez-la pour pouvoir joindre le locataire.',
    personnes: 'Nombre de personnes',
    personnesNonPrecisees: '0',
    paiement: 'Paiement',
    validerPaiement: 'Valider le paiement',
    datePaiement: 'Date du paiement',
    paiementEnAttente: 'Non payé : rien n’est inscrit en comptabilité tant que le paiement n’est pas validé.',
    abandonneeInfo:
      'Réservation abandonnée : la chambre est libérée, la réservation reste dans l’historique du client.',
    restaurantMaintenuInfo: 'Le client garde ses repas : ils restent prévus au restaurant.',
    sansRestaurantInfo: 'Le client a renoncé à ses repas : ils ne sont plus prévus au restaurant.',
    lignesPaiement: {
      paiementDu: (date: string) => `Paiement du ${date} :`,
      acompteDu: (date: string) => `Acompte du ${date} :`,
      autre: 'Autre :',
      remboursement: 'Remboursement du client :',
      prestation: 'Prestation supplémentaire :',
      maintenue: 'réservation maintenue',
      restaurantMaintenu: 'restaurant maintenu',
      restaurantAnnule: 'restaurant annulé',
    },
    repas: 'Nombre de repas',
    service: 'Service des repas',
    repasCalcules:
      'Repas calculés automatiquement : personnes × nuits (× 2 midi et soir). Vous pouvez modifier le nombre si les repas ne sont pas pris tous les jours.',
    recapitulatif: 'Détail du prix',
    ligneHebergement: (chambres: number, nuits: number, prixNuit: string, montant: string) =>
      `${pluriel(chambres, 'chambre')} × ${pluriel(nuits, 'nuit')} × ${prixNuit} = ${montant}`,
    ligneTaxe: (montant: string) => `Taxe de séjour : ${montant}`,
    /** Repas par nuit × nuits × prix ; si le nombre de repas ne se répartit pas sur les nuits (saisi à la main), le total des repas. */
    ligneRepas: (repas: number, nuits: number, prixRepas: string, montant: string) =>
      nuits > 0 && repas % nuits === 0
        ? `Repas : ${repas / nuits} × ${pluriel(nuits, 'nuit')} × ${prixRepas} = ${montant}`
        : `Repas : ${repas} × ${prixRepas} = ${montant}`,
    total: 'Total',
    taxeHorsCa:
      'La taxe de séjour est comprise dans le total inscrit en comptabilité ; pensez à la reverser à la commune.',
    tarifsAbsents:
      'Aucun tarif défini : touchez le crayon pour renseigner le prix d’une chambre par nuit et d’un repas.',
    reprendreTarifs: 'Modifier les tarifs',
    dupliquer: 'Dupliquer la réservation',
    tarifs: { nuits: 'Nombre de nuits', repas: 'Nombre de repas' },
    notes: 'Notes',
    nuits: (nombre: number) => pluriel(nombre, 'nuit'),
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
    sejourDu: (chambres: string, arrivee: string, depart: string) =>
      `séjour ${chambres.toLowerCase()} du ${arrivee} au ${depart}`,
    descriptionRemboursement: (sejourDu: string, maintenue: boolean) =>
      `Remboursement du client — ${sejourDu} (${maintenue ? 'réservation maintenue, geste commercial' : 'réservation abandonnée'})`,
    descriptionPrestation: (sejourDu: string) => `Prestation supplémentaire — ${sejourDu}`,
    descriptionAcompte: (sejourDu: string) => `Acompte — ${sejourDu}`,
    detailSolde: (acompte: string) => `solde après un acompte de ${acompte}`,
    validation: {
      message:
        'Attention : la validation du paiement rendra toute modification du séjour impossible. Voulez-vous vraiment valider le paiement ?',
      oui: 'Oui',
      acompte: 'Enregistrer un acompte',
    },
    acompte: {
      titre: 'Acompte',
      montant: 'Montant de l’acompte (€)',
      date: 'Date',
      montantInvalide: 'Le montant doit être supérieur à zéro.',
      depasse: 'L’acompte ne peut pas dépasser le total du séjour.',
      ligne: (montant: string, date: string) => `Acompte : ${montant} le ${date}`,
    },
    ajustement: {
      modifierPaiement: 'Remboursement ou prestation',
      remboursement: 'Remboursement du client',
      prestation: 'Prestation supplémentaire',
      montant: 'Montant (€)',
      date: 'Date',
      maintenue: 'Le client maintient sa réservation',
      restaurantMaintenu: 'Le client maintient le restaurant',
      montantInvalide: 'Le montant doit être supérieur à zéro.',
      ligne: (libelle: string, montant: string, date: string) => `${libelle} : ${montant} (${date})`,
    },
  },
} as const;
