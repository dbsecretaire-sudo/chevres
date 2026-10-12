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
  /** Le pilotage de la TVA : par période et par taux, avec le contrôle de cohérence. */
  pilotageTva: {
    regime: 'Régime',
    periodicite: 'Périodicité',
    modifierLeRegime: 'Modifier le régime et la périodicité',
    parPeriode: (annee: number) => `TVA par période — ${annee}`,
    periodeMois: (mois: string) => mois,
    periodeTrimestre: (numero: number) => `${numero}${numero === 1 ? 'er' : 'e'} trimestre`,
    periodeAnnee: (annee: number) => `Année ${annee}`,
    collectee: 'TVA collectée',
    deductible: 'TVA déductible',
    aPayer: 'À reverser',
    credit: 'Crédit de TVA',
    total: 'Total de l’année',
    parTaux: {
      titre: (annee: number) => `TVA par taux — ${annee}`,
      taux: (taux: number) => `${String(taux).replace('.', ',')} %`,
      ligne: (base: string, collectee: string, deductible: string) =>
        `Recettes HT ${base} · collectée ${collectee} · déductible ${deductible}`,
      aucun: 'Aucune TVA indiquée cette année : saisissez le taux sur les ventes et les factures.',
    },
    franchise:
      'En franchise en base, vous ne facturez pas de TVA et n’en récupérez pas : il n’y a rien à déclarer. Changez de régime dans les réglages si ce n’est pas votre cas.',
    rfa: {
      titre: 'Remboursement forfaitaire agricole (RFA)',
      base: 'Recettes déclarées, hors taxes',
      taux: (taux: number) => `Taux : ${String(taux).replace('.', ',')} %`,
      montant: 'Remboursement estimé',
      sansTaux: 'Saisissez le taux du RFA dans les réglages pour estimer le remboursement.',
      note: 'Au RFA, vous ne déclarez pas de TVA : vos acheteurs assujettis vous versent un remboursement forfaitaire en plus du prix. Estimation d’après vos ventes déclarées.',
    },
    controle: {
      titre: 'Contrôle de cohérence',
      aucune: 'Aucune anomalie repérée.',
      nombre: (n: number) => `${n} anomalie${n > 1 ? 's' : ''} à vérifier`,
      venteSansTaux: 'Vente sans taux de TVA',
      venteTauxInhabituel: (taux: number, attendu: number) =>
        `Taux de ${String(taux).replace('.', ',')} % (usuel : ${String(attendu).replace('.', ',')} %)`,
      recetteSansTaux: 'Facture émise sans taux de TVA',
      achatSansTva: 'Facture sans TVA : la TVA n’est pas récupérée',
      sansNom: 'Sans nom',
    },
    notice:
      'La TVA est calculée à partir du taux saisi sur chaque vente et chaque facture : collectée sur les recettes, déductible sur les achats. Les dates de déclaration et de paiement dépendent de votre régime. Une aide à la déclaration, à vérifier avec votre comptable.',
    reglages: {
      titre: 'TVA',
      regime: 'Régime de TVA',
      periodicite: 'Périodicité du suivi',
      tauxRfa: 'Taux du RFA (%)',
      aideTauxRfa: 'Le taux en vigueur, à prendre sur impots.gouv.fr ou auprès de votre comptable.',
      aide: 'Le régime et la périodicité règlent le pilotage de la TVA.',
    },
  },
  /** La trésorerie : courbe mensuelle, échéancier, emprunts, alertes. */
  tresorerie: {
    courbeTitre: (annee: number) => `Trésorerie — ${annee}`,
    soldeActuel: 'Solde actuel',
    pointBas: (mois: string) => `Point bas en ${mois}`,
    legende: 'Trait plein : réalisé · trait clair : prévision (échéances et emprunts à venir).',
    sansSolde:
      'Saisissez le solde de votre compte pour que la courbe parte de la bonne valeur ; sans lui, elle part de zéro.',
    saisirLeSolde: 'Saisir le solde de départ',
    reglages: 'Régler la trésorerie (solde, seuil, emprunts)',
    alertes: {
      titre: 'Alertes',
      aucune: 'Le solde reste au-dessus du seuil toute l’année.',
      souslesSeuil: (seuil: string) => `Solde sous ${seuil} en :`,
      ligne: (mois: string, solde: string) => `${mois} : ${solde}`,
    },
    echeancier: {
      titre: 'Échéancier',
      aucune:
        'Aucune échéance à venir : marquez une vente ou une facture « pas encore payée » pour la suivre ici.',
      aEncaisser: 'À encaisser',
      aPayer: 'À payer',
      emprunts: 'Emprunts',
      enRetard: 'En retard',
      sansNom: 'Sans nom',
      mensualite: 'Mensualité',
    },
    flux: {
      titre: 'Flux par mois',
      encaisse: 'Encaissé',
      paye: 'Payé',
      aucun: '—',
      ligne: (encaisse: string, paye: string) => `+${encaisse} · −${paye}`,
    },
    notice:
      'La trésorerie est calculée d’après les dates de paiement saisies : une vente ou une facture est payée à sa date, sauf si vous indiquez une autre date ou qu’elle n’est pas encore payée. Les mensualités d’emprunt déjà passées sont supposées saisies comme des dépenses. Une aide de gestion, pas un relevé de banque.',
    paiement: {
      pasEncaissee: 'Pas encore encaissée',
      pasPayee: 'Pas encore payée',
      echeance: 'Date d’échéance',
      enAttente: (date: string) => `En attente de paiement · échéance ${date}`,
      enAttenteSansDate: 'En attente de paiement',
    },
    reglagesEcran: {
      soldeTitre: 'Solde du compte',
      soldeAide:
        'Le solde de votre compte à une date : c’est le départ des courbes. Les paiements saisis depuis cette date s’y ajoutent.',
      soldeDepart: 'Solde (€)',
      dateSolde: 'Date du solde',
      seuil: 'Seuil d’alerte (€)',
      seuilAide:
        'Une alerte s’affiche quand le solde passe sous ce seuil (0 : quand le compte est à découvert).',
      empruntsTitre: 'Emprunts',
      empruntsAide:
        'La mensualité de chaque emprunt entre dans l’échéancier et dans la prévision, une par mois.',
      aucunEmprunt: 'Aucun emprunt.',
      ajouter: '+ Ajouter un emprunt',
      nomEmprunt: 'Nom de l’emprunt',
      exempleNom: 'ex : Tracteur',
      mensualite: 'Mensualité (€)',
      premiereEcheance: 'Première échéance',
      nombreEcheances: 'Nombre d’échéances',
      supprimer: 'Supprimer cet emprunt',
      supprimerQuestion: 'Supprimer cet emprunt ?',
      supprimerMessage: 'Ses mensualités ne figureront plus dans l’échéancier.',
    },
  },
  /** La rentabilité : marge par atelier, coûts de production, poids des charges, résultat sans les aides. */
  rentabilite: {
    resultatTitre: (annee: number) => `Résultat — ${annee}`,
    horsTaxes: 'Montants hors taxes (régime de TVA réel).',
    toutesTaxes: 'Montants toutes taxes comprises.',
    recettes: 'Recettes',
    charges: 'Charges',
    aides: 'Aides',
    resultat: 'Résultat',
    resultatSansAides: 'Résultat sans les aides',
    ateliers: {
      titre: 'Marge par atelier',
      aucun: 'Aucune recette cette année.',
      recettesCharges: (recettes: string, charges: string) => `Recettes ${recettes} · charges ${charges}`,
      dontCommunes: (montant: string) => `dont ${montant} de charges communes réparties`,
      marge: (taux: number) => `${Math.round(taux * 100)} %`,
      aide: 'Une charge se rattache à un atelier dans la facture ; les charges sans atelier se répartissent entre les ateliers, au prorata de leurs recettes.',
    },
    couts: {
      titre: 'Coûts de production',
      parLitre: 'Coût du litre de lait',
      parLitreAide: (litres: string, charges: string) =>
        `${charges} de charges (toutes) pour ${litres} L de lait produit`,
      parLitreSansLait: (annee: number) =>
        `Aucun lait produit en ${annee} : ni vendu, ni utilisé pour des fromages, ni noté dans l’inventaire.`,
      parLitreSansCharges: (litres: string) =>
        `${litres} L de lait produit, mais aucune charge enregistrée cette année.`,
      parAnimal: (nom: string) => `Coût par ${nom}`,
      parAnimalAide: (effectif: string, charges: string) =>
        `${charges} de charges pour ${effectif} ${V().femelle.pluriel} vivantes au 31/12`,
      get parAnimalAbsent() {
        return `Le coût par ${V().femelle.singulier} se calcule sur le cheptel de l’espèce active : choisissez-la ou « Tout ».`;
      },
    },
    postes: {
      titre: 'Poids des charges',
      aucun: 'Aucune charge cette année.',
      part: (part: number) => `${Math.round(part * 100)} %`,
      parAnimal: (montant: string) => `${montant} par ${V().femelle.singulier}`,
      parLitre: (montant: string) => `${montant} par litre`,
    },
    notice:
      'Calculé d’après vos ventes et vos factures : une indication de gestion, pas une comptabilité analytique. Les coûts par litre et par animal dépendent du lait produit et de l’effectif renseignés.',
  },
  /** La page d'accueil de l'onglet Comptabilité. */
  accueil: {
    groupes: {
      ecritures: 'Écritures et inventaire',
      pilotage: 'Pilotage',
      declarations: 'Déclarations et comptes',
      technique: 'Technique',
    },
    ecritures: 'Écritures',
    tresorerie: {
      titre: 'Trésorerie',
      aide: 'Solde mois par mois, échéancier, emprunts, alertes.',
    },
    inventaire: {
      titre: 'Inventaire',
      aide: 'Les stocks et le conditionnement des fromages.',
      stocks: 'Stocks',
      stocksAide: 'Les listes de l’inventaire et leurs quantités.',
    },
    rentabilite: {
      titre: 'Rentabilité',
      aide: 'Marge par atelier, coût du litre, poids des charges, résultat sans les aides.',
    },
    tva: {
      titre: 'Pilotage de la TVA',
      aide: 'La TVA collectée et déductible, par période et par taux.',
    },
    declarationsAide: 'Impôts, chiffre d’affaires, URSSAF : les déclarations à faire.',
    reglages: {
      titre: 'Réglages',
      aide: 'TVA (régime, périodicité), boucles du cheptel, trésorerie, rappels de déclarations.',
    },
  },
  /** Comptabilité › Réglages › Taux par produit. */
  tauxParProduit: {
    titre: 'Taux par produit',
    aide: 'La TVA des ventes et l’imposition des aides.',
    tva: 'TVA des ventes',
    aideTva: 'Le taux de TVA proposé quand vous saisissez la vente de chaque produit.',
    imposition: 'Imposition des aides',
    aideImposition:
      'La part de chaque aide incluse dans les recettes imposables (à confirmer avec votre comptable/CGA). Le crayon modifie la liste des taux proposés.',
    note: 'Ces taux sont ceux d’une nouvelle écriture ; chaque écriture peut encore avoir le sien.',
    retablir: 'Rétablir les taux d’office',
  },
  fiscalite: {
    titre: 'Fiscalité',
    declarations: 'Déclarations',
    aideImpots: 'Le calcul de l’impôt à partir des recettes de l’année.',
    aideChiffreAffaires: 'Les recettes de l’année, pour la déclaration.',
    aideUrssaf: 'Les cotisations à déclarer, mois par mois.',
  },
  nouvelleEcriture: {
    /** L'atelier d'une charge, pour la marge par atelier. */
    atelier: {
      label: 'Atelier concerné',
      commun: 'Charge commune (répartie entre les ateliers)',
      aide: 'Facultatif : sert à la marge par atelier (Comptabilité › Rentabilité).',
    },
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
    titreTauxImposition: 'Taux d’imposition proposés',
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
    /** Le poids d'une vente d'animal ou de viande, après son libellé : « Viande · 25 kg ». */
    poidsKg: (poids: number) => `${String(poids).replace('.', ',')} kg`,
    laitQuantiteL: (quantite: number) => `Lait · ${quantite} L`,
    cabrisQuantiteTeteValeur: (libelle: string, quantite: number, valeur: string) =>
      `${libelle} · ${quantite} tête${valeur}`,
    fromageQuantiteUnite: (quantite: number, unite: unknown) => `Fromage · ${quantite} ${unite}`,
  },
} as const;
