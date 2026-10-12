/** Textes de l'interface — entreprise (hors élevage). À modifier ici uniquement. */
export const TEXTES_ENTREPRISE = {
  informations: {
    cesInformations: 'Ces informations apparaissent en en-tête des documents exportés.',
    titreIdentite: 'Entreprise',
    nomEntreprise: 'Nom de l’entreprise ou de l’association',
    dirigeant: 'Nom et prénom du dirigeant',
    adresse: 'Adresse',
    siret: 'N° SIRET',
    codeApe: 'Code APE / NAF',
    numeroTva: 'N° de TVA intracommunautaire',
    titreStatut: 'Statut et impôts',
    aideStatut: 'Vous pouvez les modifier si votre situation change.',
    statut: 'Statut juridique',
    regimeFiscal: 'Régime fiscal',
    titreTauxUrssaf: 'Taux de cotisations URSSAF (%)',
    aideTauxUrssaf:
      'Un taux par nature de recette, pour le calcul des déclarations URSSAF. Laissez vide pour le taux indicatif (12,3 % vente de marchandises, 21,2 % prestations commerciales ou artisanales, 25,6 % prestations libérales).',
    tauxIndicatif: 'indicatif',
    titreTva: 'TVA',
    assujettiTva: 'Assujetti à la TVA',
    aideTva: 'Décochez si vous facturez sans TVA (franchise en base).',
    regimeTva: 'Régime de TVA',
    titreTarifs: 'Tarifs',
    aideTarifs:
      'Ces tarifs servent à calculer le prix de chaque réservation du gîte : chambres × nuits × prix d’une chambre, repas × prix d’un repas, et le montant de la taxe de séjour ajouté à chaque réservation.',
    tarifNuit: 'Prix d’une chambre par nuit (€)',
    tarifRepas: 'Prix d’un repas (€)',
    suivreTaxeSejour: 'Suivre la taxe de séjour',
    aideTaxeSejour: 'Décochez si vous n’êtes pas concerné.',
    montantTaxeSejour: 'Montant de la taxe de séjour (€)',
    exempleMontant: 'ex : 0,80',
    ouiValeur: 'Oui',
    nonValeur: 'Non',
    choisir: 'Choisir…',
  },
  menu: {
    impots: 'Impôts',
    chiffreAffaires: 'Chiffre d’affaires',
    urssaf: 'URSSAF',
  },
  urssaf: {
    titreMois: (annee: number) => `Déclarations URSSAF par mois — ${annee}`,
    horsTaxes: 'Chiffre d’affaires hors taxes, par nature de recette. Touchez un mois pour voir son détail.',
    nature: 'Nature de la recette',
    chiffreAffaires: 'À déclarer',
    cotisations: 'Cotisations',
    totalAnnee: (annee: number) => `Total de l’année ${annee}`,
    total: 'Total',
    taux: (taux: string) => `taux ${taux} %`,
    noticeTitre: 'À savoir',
    notice:
      'Chaque mois, déclarez à l’URSSAF le chiffre d’affaires hors taxes encaissé ce mois-là, séparé par nature de recette ; les cotisations sont chaque montant multiplié par son taux. Une prestation prend la nature de son régime (libérale en BNC, commerciale ou artisanale en BIC services) ; le choix se fait sur chaque recette. Les ventes que le client ne souhaite pas déclarer (sans facture) n’y figurent pas.',
    noticeVerifier:
      'Taux indicatifs (modifiables dans les informations de l’entreprise), qui changent selon les années et les options (versement libératoire, ACRE, formation professionnelle) : vérifiez sur autoentrepreneur.urssaf.fr ou auprès de votre comptable.',
  },
  chiffreAffaires: {
    titreMois: (annee: number) => `Chiffre d’affaires par mois — ${annee}`,
    total: 'Total de l’année',
    horsTaxes: 'hors taxes',
    aides: 'Aides et subventions (hors chiffre d’affaires)',
    noticeTitre: 'À savoir',
    notice:
      'Le chiffre d’affaires est calculé hors taxes à partir de vos recettes saisies, sans les aides et subventions. Pour déclarer à l’URSSAF (chaque mois ou chaque trimestre selon votre choix), reportez le total de la période concernée.',
    noticeVerifier: 'À vérifier auprès de votre URSSAF ou de votre comptable avant toute déclaration.',
  },
  impots: {
    recettesTitre: (annee: number) => `Recettes — ${annee}`,
    chiffreAffairesHt: 'Chiffre d’affaires hors taxes',
    regime: 'Régime fiscal',
    nonRenseigne: 'Non renseigné : choisissez-le dans les informations de l’entreprise.',
    plafond: 'Plafond du régime',
    partDuPlafond: 'Part du plafond utilisée',
    abattement: (taux: number) => `Abattement forfaitaire (${taux} %)`,
    beneficeEstime: 'Bénéfice imposable estimé',
    noticeTitre: 'Notice explicative — à vérifier avant usage officiel',
    notice:
      'Pour un régime « micro », le bénéfice imposable est le chiffre d’affaires diminué d’un abattement forfaitaire. Le plafond et l’abattement affichés sont indicatifs : ils changent selon les années fiscales. Pour les autres régimes (réel, société), le résultat dépend de vos charges réelles : ce calcul ne s’applique pas.',
    noticeAvertissement:
      'Ce que l’application NE calcule PAS : l’impôt à payer, les cotisations sociales, ni le barème de votre foyer. Vérifiez chaque chiffre sur impots.gouv.fr ou avec votre comptable.',
  },
  tva: {
    nonAssujetti:
      'Votre entreprise n’est pas assujettie à la TVA. Cochez « Assujetti à la TVA » dans les informations de l’entreprise pour suivre la TVA.',
  },
  accueil: {
    tuiles: {
      solde: 'Solde factures (hors Autre)',
      reservations: (annee: string) => `Réservations en ${annee}`,
      taches: (annee: string) => `Tâches en ${annee}`,
      resultatTrading: (annee: string) => `Résultat des trades en ${annee}`,
    },
    taches: {
      titre: 'Tâches à faire',
      aucune: 'Aucune tâche à faire',
      aucuneDetail:
        'Les contenus à faire ou en cours, avec ou sans échéance, apparaissent ici tant qu’ils ne sont pas terminés.',
    },
    calendrier: {
      legendeGite:
        'Chambres occupées cette nuit-là (! : paiement en attente) — appuyez sur un jour pour ouvrir le gîte.',
    },
    balance: {
      solde: (annee: number) => `Solde ${annee}`,
      recettes: 'Recettes',
      depenses: 'Dépenses',
      parMois: 'Solde mois par mois',
    },
  },
} as const;
