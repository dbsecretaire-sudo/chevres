import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « comptabilite ». À modifier ici uniquement. */
export const TEXTES_COMPTABILITE = {
  activite: {
    activite: 'Activité',
    activiteDeuxPoints: 'Activité : ',
  },
  parActivite: {
    parActivite: 'Comptabilité par activité',
    toutes: 'Toutes',
  },
  comptabiliteHeaderMenu: {
    genererUnPlanComptable: 'Générer un plan comptable',
  },
  factureLecture: {
    typeDeuxPoints: 'Type : ',
    tiersDeuxPoints: 'Tiers : ',
    tvaDeuxPoints: 'TVA : ',
    nDeFactureDeuxPoints: 'N° de facture : ',
    categorieDeDepenseDeuxPoints: 'Catégorie de dépense : ',
    categorieDeRecetteDeuxPoints: 'Catégorie de recette : ',
    detailsDeuxPoints: 'Détails :',
    typeDeCarburantDeuxPoints: 'Type de carburant : ',
    litrageDeuxPoints: 'Litrage : ',
    typeDAideDeuxPoints: "Type d'aide : ",
    precisionDeuxPoints: 'Précision : ',
  },
  filtreTransactionsModal: {
    periode: 'Période',
    du: 'Du',
    au: 'Au',
    montant: 'Montant (€)',
    min: 'Min',
    max: 'Max',
    ex500: 'ex: 500',
    reinitialiser: 'Réinitialiser',
    appliquer: 'Appliquer',
  },
  lignesAlimentationEditor: {
    detailParAliment: 'Détail par aliment',
    alimentValeur: (valeur: number) => `Aliment ${valeur}`,
    quantiteKg: 'Quantité (kg)',
    ex100: 'ex: 100',
    ex120: 'ex: 120',
    nombre: 'Nombre',
    ex3: 'ex: 3',
    preciserExFraisDeLivraisonPoints: 'Préciser — ex: Frais de livraison, compléments…',
  },
  lignesCarburantEditor: {
    detailParCarburant: 'Détail par carburant',
    typeValeur: (valeur: number) => `Type ${valeur}`,
    litrageL: 'Litrage (L)',
    ex40: 'ex:40',
    ex60: 'ex: 60',
  },
  detailComptable: {
    recettes: 'Recettes',
  },
  ficheFacture: {
    impossibleDeSupprimerLaFacture: 'Impossible de supprimer la facture.',
    factureIntrouvable: 'Facture introuvable.',
    nonModifiableLaCategorieLe:
      'Non modifiable : la catégorie, le compte comptable et les rapports sont liés au type choisi à la création. Supprimez la facture et recréez-la si le type est erroné.',
    nFacture: 'N° Facture',
    montant: 'Montant',
    cetteActionSupprimeraDefinitivementLa: (tiers: string) =>
      `Cette action supprimera définitivement la facture de ${tiers}.`,
    emise: 'Émise',
    recue: 'Reçue',
  },
  ficheVente: {
    impossibleDeSupprimerLaVente: 'Impossible de supprimer la vente.',
    venteIntrouvable: 'Vente introuvable.',
    modifierLaVente: 'Modifier la vente',
    typeVenteDeProduction: 'Type : Vente de production',
    produitDeuxPoints: 'Produit : ',
    quantiteDeuxPoints: 'Quantité : ',
    poidsDeuxPoints: 'Poids : ',
    clientDeuxPoints: 'Client : ',
    produit: 'Produit',
    lait: 'Lait',
    fromage: 'Fromage',
    prixTotal: 'Prix total (€)',
    cetteActionSupprimeraDefinitivementCette: (valeur: string) =>
      `Cette action supprimera définitivement cette vente de ${valeur}.`,
    tetes: 'têtes',
    tete: 'tête',
  },
  fiscaliteImpots: {
    recettesBrutesEspace: 'Recettes brutes — ',
    get ventesDeProductionLaitFromage() {
      return `Ventes de production (lait, fromage, ${V().petit.pluriel})`;
    },
    aidesImposables: 'Aides imposables',
    autresFacturesEmises: 'Autres factures émises',
    totalRecettesImposables: 'Total recettes imposables',
    detailDesAidesParTypeEspace: 'Détail des aides par type — ',
    leCaractereImposableEstCelui:
      'Le caractère imposable est celui que vous avez indiqué à la saisie de chaque aide — vérifiez-le type par type, il peut différer d’une aide à l’autre (voir notice ci-dessous).',
    imposable: 'Imposable',
    nonImposable: 'Non imposable',
    get ceTotalAdditionnePourL() {
      return `Ce total additionne, pour l’année sélectionnée : vos ventes de production enregistrées (lait, fromage, ${V().petit.pluriel}), vos factures émises hors aides, et les aides que vous avez marquées « imposable » (voir le détail par type ci-dessus — chaque type d’aide PAC peut avoir un traitement fiscal différent, c’est pour ça que la ventilation est faite type par type plutôt qu’un seul total générique).`;
    },
    celaCorrespondALaNotion:
      'Cela correspond à la notion de « recettes brutes encaissées » du régime micro-BA (Code général des impôts, art. 64 bis). Ce régime s’applique si vos recettes moyennes sur 3 ans ne dépassent pas le seuil en vigueur.',
    ceQueLAppNe:
      'Ce que l’app NE calcule PAS volontairement : l’abattement forfaitaire pour frais (son taux et son plancher minimum changent selon les années fiscales) et le montant net imposable qui en résulte. Reportez le total ci-dessus sur votre déclaration 2042-C-PRO (rubrique Bénéfices agricoles, régime micro-BA), et laissez l’administration ou votre comptable appliquer l’abattement en vigueur — ou vérifiez son taux exact sur impots.gouv.fr avant de le faire vous-même.',
    leTauxDImpositionSaisi:
      'Le « taux d’imposition » saisi pour chaque aide (dans le détail ci-dessus) ne fixe que la part du montant incluse dans ce total de recettes brutes — pas votre taux d’impôt réel. L’app pré-remplit 100 % par défaut, mais ce n’est qu’un point de départ modifiable pour chaque aide, y compris les types PAC répertoriés : certaines aides (notamment à l’investissement) peuvent être étalées sur plusieurs années ou traitées différemment — vérifiez le taux adapté à chaque aide avec votre comptable/CGA plutôt que de vous fier à la valeur pré-remplie. Ensuite, sur le total de vos recettes, s’appliquent l’abattement forfaitaire évoqué ci-dessus puis le barème progressif de l’impôt sur le revenu de votre foyer (par tranches, de 0 à 45 %), qui dépend de vos autres revenus et de votre quotient familial — l’app ne peut pas l’estimer à partir des seules données de l’exploitation.',
    verifiezAussiLeCaractereImposable:
      'Vérifiez aussi le caractère imposable ou non de chaque aide perçue (ex : la plupart des aides PAC sont imposables, certaines subventions d’investissement peuvent ne pas l’être) — c’est vous qui le renseignez lors de la saisie, l’app ne le détermine pas automatiquement.',
    sourcesAConsulterEnCas:
      'Sources à consulter en cas de doute : impots.gouv.fr (Bénéfices agricoles), votre centre de gestion agréé (CGA) ou votre comptable.',
  },
  fiscaliteRsa: {
    recettesParMoisEspace: 'Recettes par mois — ',
    get chaqueLigneMensuelleAdditionneVos() {
      return `Chaque ligne mensuelle additionne : vos ventes de production encaissées ce mois-là (lait, fromage, ${V().petit.pluriel}) et vos factures émises (ventes et aides) datées de ce mois. C’est un montant de chiffre d’affaires / recettes encaissées, mois par mois.`;
    },
    laDeclarationTrimestrielleDeRessources:
      'La déclaration trimestrielle de ressources (DTR) pour le RSA, pour un exploitant agricole non-salarié, demande généralement le montant du chiffre d’affaires (ou des recettes) de chacun des 3 derniers mois — c’est ce que ces lignes visent à vous donner rapidement.',
    ceQueLAppNe:
      'Ce que l’app NE calcule PAS volontairement : le montant de « ressources » retenu par la CAF/MSA après abattement forfaitaire pour charges professionnelles. Ce taux d’abattement dépend de votre statut exact et peut changer — vérifiez-le sur le formulaire de déclaration lui-même, auprès de votre CAF ou de votre MSA avant de reporter un montant.',
    sourcesAConsulterEnCas:
      'Sources à consulter en cas de doute : votre espace personnel caf.fr, le formulaire de déclaration trimestrielle reçu par courrier/email, ou votre conseiller MSA.',
  },
  listeTransactions: {
    soldeEspace: 'Solde ',
    horsAlimentationAutre: '(hors Alimentation, Autre)',
    rentrees: 'Rentrées',
    soldeToutesCategoriesInclusesDeuxPoints: 'Solde toutes catégories incluses : ',
    rechercherPoints: 'Rechercher…',
    effacer: 'Effacer',
    aucuneEcriture: 'Aucune écriture',
    ventesEtFacturesDeL: "Ventes et factures de l'année apparaîtront ici.",
    filtre: '(filtré)',
    filtresActifs: 'Filtres actifs',
  },
  nouvelleEcriture: {
    nDeFacture: 'N° de facture',
    precisions: 'Précisions',
    categorieDeDepense: 'Catégorie de dépense',
    categorieDeRecette: 'Catégorie de recette',
    comptePcgIndicatifDeuxPoints: 'Compte PCG indicatif : ',
    clientOrganisme: 'Client / organisme',
    montantTtc: 'Montant TTC (€)',
    typeDAide: 'Type d’aide',
    preciserLeTypeDAide: 'Préciser le type d’aide',
    exAideGnrGuerreUkrainePoints: 'ex: Aide GNR (guerre Ukraine), Aide gros rouleurs…',
    tauxDImposition: 'Taux d’imposition (%)',
    partDuMontantIncluseDans:
      'Part du montant incluse dans les recettes brutes imposables. Pré-rempli à titre indicatif — à confirmer aide par aide avec votre comptable/CGA (certaines aides d’investissement peuvent être étalées sur plusieurs années, voir notice de l’écran Impôts).',
    litrage: 'Litrage',
    ex125: 'ex: 12.5',
    prixTotalTtc: 'Prix total TTC (€)',
    typeDeFromage: 'Type de fromage',
    preciserLeType: 'Préciser le type',
    ex2: 'ex: 2',
    get nombreDeCabris() {
      return `Nombre de ${V().petit.pluriel}`;
    },
  },
  transactions: {
    venteDeProduction: 'Vente de production',
    laitQuantiteL: (quantite: number) => `Lait — ${quantite} L`,
    cabrisQuantiteTeteValeur: (libelle: string, quantite: number, valeur: string) =>
      `${libelle} — ${quantite} tête${valeur}`,
    fromageQuantiteUnite: (quantite: number, unite: unknown) => `Fromage — ${quantite} ${unite}`,
  },
} as const;
