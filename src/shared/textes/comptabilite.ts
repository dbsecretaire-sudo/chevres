import { produitsVendus, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Textes de l'interface — « comptabilite ». À modifier ici uniquement. */
export const TEXTES_COMPTABILITE = {
  activite: {
    activite: 'Activité',
    activiteDeuxPoints: 'Activité : ',
  },
  rubriques: { tout: 'Tout', gite: 'Gîte', bar: 'Bar', activite: 'Activité' },
  parActivite: {
    parActivite: 'Comptabilité par activité',
    toutes: 'Tout',
    noteDeclaration:
      'Pour votre déclaration, utilisez « Tout » : un cheptel ou « Commun » ne représente qu’une partie de vos recettes.',
  },
  factureLecture: {
    reservationLieeDeuxPoints: 'Réservation liée : ',
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
    cheptelConcerne: 'Cheptel concerné',
    investissement: 'Investissement',
    consommables: 'Consommables',
    equipementValeur: (valeur: number) => `Équipement ${valeur}`,
    alimentValeur: (valeur: number) => `Aliment ${valeur}`,
    materielValeur: (valeur: number) => `Matériel ${valeur}`,
    quantiteKg: 'Quantité (kg)',
    /** Les intitulés courts des colonnes d'une ligne (l'aliment, la quantité et le montant tiennent sur une seule ligne). */
    quantiteKgCourt: 'Q (kg)',
    quantiteCourt: 'Q',
    montantTtcCourt: '€ TTC',
    ex100: 'ex: 100',
    ex120: 'ex: 120',
    nombre: 'Nombre',
    ex3: 'ex: 3',
    choixAliment: 'Choix de l’aliment',
  },
  lignesMarchandisesEditor: {
    detailParMarchandise: 'Détail par marchandise',
    marchandiseValeur: (valeur: number) => `Marchandise ${valeur}`,
    rubrique: 'Activité concernée',
    choixMarchandise: 'Choix de la marchandise',
    quantite: 'Quantité',
    ex10: 'ex: 10',
    aucuneDansLeStock: 'Ajoutez-les dans l’inventaire (crayon).',
  },
  lignesCarburantEditor: {
    detailParCarburant: 'Détail par carburant',
    typeValeur: (valeur: number) => `Type ${valeur}`,
    litrageL: 'Litrage (L)',
    ex40: 'ex:40',
    ex60: 'ex: 60',
  },
  detailComptable: {
    dontSansFacture: 'dont sans facture',
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
    declaree: (declaree: boolean) => `Le client souhaite déclarer la vente : ${declaree ? 'oui' : 'non'}`,
    typeVenteDeProduction: 'Type : Vente de production',
    produitDeuxPoints: 'Produit : ',
    quantiteDeuxPoints: 'Quantité : ',
    poidsDeuxPoints: 'Poids : ',
    oeufs: 'œufs',
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
      return `Ventes de production (${produitsVendus()})`;
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
      return `Ce total additionne, pour l’année sélectionnée : vos ventes de production enregistrées (${produitsVendus()}), vos factures émises hors aides, et les aides que vous avez marquées « imposable » (voir le détail par type ci-dessus — chaque type d’aide PAC peut avoir un traitement fiscal différent, c’est pour ça que la ventilation est faite type par type plutôt qu’un seul total générique).`;
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
      return `Chaque ligne mensuelle additionne : vos ventes de production encaissées ce mois-là (${produitsVendus()}) et vos factures émises (ventes et aides) datées de ce mois. C’est un montant de chiffre d’affaires / recettes encaissées, mois par mois.`;
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
    toutesLesAnnees: 'toutes les années',
    sansFacture: 'sans facture',
    details: 'Détails',
    rentrees: 'Rentrées',
    rentreesAvecFactures: 'Rentrées avec factures',
    rentreesSansFactures: 'Rentrées sans factures',
    rechercherPoints: 'Rechercher…',
    effacer: 'Effacer',
    aucuneEcriture: 'Aucune écriture',
    ventesEtFacturesDeL: "Ventes et factures de l'année apparaîtront ici.",
    filtre: '(filtré)',
    filtresActifs: 'Filtres actifs',
  },
  fiscalite: {
    titre: 'Fiscalité',
    declarations: 'Déclarations',
    aideImpots: 'Le calcul de l’impôt à partir des recettes de l’année.',
    aideChiffreAffaires: 'Les recettes de l’année, pour la déclaration.',
    aideUrssaf: 'Les cotisations à déclarer, mois par mois.',
    aideTva: 'La TVA collectée et déductible, par mois et par taux.',
  },
  nouvelleEcriture: {
    /** Les notes sous les champs d'une écriture : ce qu'on y met. */
    aideMontant: 'Le total payé, taxes comprises (TTC).',
    aideLitrage: 'Les litres vendus : le prix se calcule avec le prix du lait de l’inventaire.',
    enregistrerEtAjouter: 'Enregistrer et en ajouter une autre',
    enchainees: (n: number) =>
      `${n} ${n > 1 ? 'écritures enregistrées' : 'écriture enregistrée'} — la date, la catégorie et le client sont gardés pour la suivante.`,
    groupeInventaire: 'Inventaire',
    groupeAutresComptes: 'Service',
    stockProduction: {
      article: 'Article du stock',
      aucun: 'Aucun (hors stock)',
      quantite: 'Quantité achetée',
      aide: 'Facultatif : la quantité achetée est ajoutée au stock de l’article choisi (sel, emballages, boucles…).',
      articleInventaire: 'Article de l’inventaire',
      listeVide:
        'Cette liste de l’inventaire n’a pas encore d’article : ajoutez-en un pour suivre la quantité.',
      quantiteRequise: 'Quantité requise pour le stock',
      /** Un achat de boucles : chaque boucle a son numéro, de la première à la dernière. */
      premiereBoucle: 'N° de la première boucle',
      premiereBoucleAide: 'Les boucles achetées sont numérotées à la suite, selon la quantité.',
      derniereBoucle: (numero: string) => `Dernière boucle : ${numero}`,
      premiereBoucleRequise: 'Indiquez le n° de la première boucle (il se termine par un chiffre).',
      tropDeBoucles: (max: number) => `Un achat ne peut pas dépasser ${max} boucles.`,
      dejaEnStock: (numero: string) => `La boucle ${numero} est déjà dans l’inventaire.`,
    },
    /** Une dépense vétérinaire : le motif, et l'inscription de la visite dans les visites vétérinaires. */
    visite: {
      motif: 'Motif de la visite',
      exemple: 'ex : Prophylaxie',
      ajouter: 'Ajouter aux visites vétérinaires',
      motifRequis: 'Motif de la visite requis pour l’ajouter aux visites vétérinaires',
    },
    nDeFacture: 'N° de facture',
    nDeFactureOuObjet: 'N° de facture / objet',
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
    prixTotalTtc: 'Total TTC (€)',
    typeDeFromage: 'Type de fromage',
    detailDeLaVente: 'Détail de la vente',
    declarerLaVente: 'Le client souhaite déclarer la vente',
    natureUrssaf: 'Nature de la recette (URSSAF)',
    natureUrssafAuto: 'Selon la catégorie',
    prixLibreRecolteur: 'Client récolteur : le prix est libre, saisissez le total.',
    reajustement: 'Réajustement',
    numeroFactureRequis: 'Numéro de facture requis',
    numeroFactureNumerique:
      'Le numéro de facture ne contient que des chiffres (seul un récolteur peut y mettre des lettres)',
    typeFromageRequis: 'Type de fromage requis',
    choixDuDetail: 'Cabris, saucisson… (liste de l’inventaire)',
    /** Le titre de la liste des animaux de la vente (animal sur pied, animal vivant). */
    animalVendu: (detail: string) => `${detail} : quel animal ?`,
    /** Une ligne de la liste : le n° de boucle (ou le nom), M ou F, et la date de naissance. */
    animalOption: (libelle: string, sexe: string, naissance: string) =>
      `${libelle} · ${sexe} · né(e) le ${naissance}`,
    animauxVendus: 'Animaux vendus',
    dateAbattoir: 'Date d’abattoir',
    /** Les fromages et la charcuterie d'une vente, désignés par leur numéro de lot. */
    lotsVendus: 'Produits vendus (n° de lot)',
    ajouterUnLot: 'Ajouter un produit',
    retirerLot: 'Retirer ce produit',
    lotVendu: 'Produit vendu',
    lotsRequis: 'Produits vendus requis (choisissez leurs n° de lot)',
    animauxRequis: 'Animaux vendus requis',
    modifierLePrixOeuf: 'Modifier le prix de l’œuf (inventaire)',
    detailRequis: 'Détail de la vente requis',
    prixAFixerTitre: 'Prix à définir dans l’inventaire',
    prixAFixerMessage:
      'Le prix total d’une vente vient du prix de vente défini dans l’inventaire : définissez-le (crayon à côté du détail) avant d’enregistrer.',
    aucunPrixInventaire: 'Aucun prix défini à l’inventaire : le prix total ne peut pas se calculer.',
    prixLitreInventaire: (prix: string) => `Prix défini à l’inventaire : ${prix} le litre.`,
    prixOeufInventaire: (prix: string) => `Prix défini à l’inventaire : ${prix} l’œuf.`,
    poidsRequis: 'Poids requis',
    animauxRequisMessage:
      'Choisissez dans le cheptel au moins un animal vendu (le + à droite de « Animaux vendus »).',
    ajouterUnAnimal: 'Ajouter un animal',
    animauxNote:
      'Chaque animal sort du cheptel : à l’abattoir si la vente est déclarée, mort sinon, et l’inventaire des animaux baisse d’autant. Les animaux d’une même vente sont tous des petits, ou tous des adultes.',
    retirerAnimal: 'Retirer cet animal',
    sansBoucle: 'Sans boucle',
    sansBoucleNom: (nom: string) => `${nom} (sans boucle)`,
    sexeM: 'M',
    sexeF: 'F',
    nombreDAnimaux: 'Nombre d’animaux',
    prixUnitaireKg: 'PU (€/kg)',
    prixDuStock: (prix: string) => `Prix défini à l’inventaire : ${prix} l’unité.`,
    aucuneViandeAuStock:
      'Aucune viande dans l’inventaire pour cet animal : touchez le crayon pour en ajouter, ou précisez-la ci-dessous.',
    preciserLeType: 'Préciser le type',
    ex2: 'ex: 2',
    nombreDeTetes: 'Nombre de têtes',
    nombreDOeufs: 'Nombre d’œufs',
    precision: 'Précision',
    get nombreDeCabris() {
      return `Nombre de ${V().petit.pluriel}`;
    },
  },
  transactions: {
    venteDeProduction: 'Vente de production',
    typeVente: 'Type : ',
    laitQuantiteL: (quantite: number) => `Lait — ${quantite} L`,
    cabrisQuantiteTeteValeur: (libelle: string, quantite: number, valeur: string) =>
      `${libelle} — ${quantite} tête${valeur}`,
    fromageQuantiteUnite: (quantite: number, unite: unknown) => `Fromage — ${quantite} ${unite}`,
  },
} as const;
