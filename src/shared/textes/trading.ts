/** Textes de l'interface — journal de trading (activité financière). À modifier ici uniquement. */
export const TEXTES_TRADING = {
  journal: {
    titre: 'Journal de trading',
    rechercher: 'Instrument, stratégie, note, étiquette…',
    nouveauTrade: 'Nouveau trade',
    aucunTrade: 'Aucun trade pour cette année',
    aucunTradeDetail:
      'Notez vos trades : le journal calcule vos résultats et repère ce qui marche et ce qui coûte.',
    aucunResultat: 'Aucun trade trouvé',
    modifiezLaRecherche: 'Essayez un autre terme ou un autre filtre.',
    ouvert: 'Ouvert',
    horsPlan: 'hors plan',
    avertissement:
      'Ces chiffres sont calculés à partir de vos propres saisies. Ce sont des constats sur le passé, pas un conseil en investissement.',
  },
  accueil: {
    derniersTrades: 'Derniers trades',
    ouvrirLeJournal: 'Ouvrir le journal',
    tradesClos: 'Trades clos',
  },
  statistiques: {
    titre: 'Vos résultats',
    resultatNet: 'Résultat net',
    tauxReussite: 'Taux de réussite',
    profitFactor: 'Facteur de profit',
    esperance: 'Résultat moyen par trade',
    gainMoyen: 'Gain moyen',
    perteMoyenne: 'Perte moyenne',
    drawdownMax: 'Plus forte baisse',
    rMoyen: 'Résultat moyen en R',
    pire: 'Pire trade',
    nombres: (clos: number, ouverts: number) =>
      `${clos} trade${clos > 1 ? 's' : ''} clos${ouverts > 0 ? ` · ${ouverts} ouvert${ouverts > 1 ? 's' : ''}` : ''}`,
    aideProfitFactor: 'gains totaux ÷ pertes totales',
    aideDrawdown: 'depuis le sommet du cumul',
    aideR: 'en multiples du risque pris (stop)',
    nonDisponible: '—',
  },
  courbe: {
    titre: 'Courbe du cumul',
    aucune: 'Il faut au moins deux trades clos pour tracer la courbe.',
    cumulFinal: (montant: string) => `Cumul : ${montant}`,
    aide: (haut: string, bas: string) =>
      `Chaque point est un trade clos. Plus haut : ${haut} · plus bas : ${bas}.`,
  },
  observations: {
    titre: 'Observations',
    pasAssezDeTrades: (minimum: number) =>
      `Les observations apparaissent à partir de ${minimum} trades clos : il en faut assez pour que les chiffres veuillent dire quelque chose.`,
    aucune: 'Rien de particulier à signaler pour le moment.',
    seriePertes: (nombre: number) =>
      `Vous venez d’enchaîner ${nombre} pertes d’affilée. Relisez ces trades avant le suivant.`,
    esperancePositive: (montant: string) =>
      `Sur l’ensemble de vos trades clos, vous gagnez en moyenne ${montant} par trade.`,
    esperanceNegative: (montant: string) =>
      `Sur l’ensemble de vos trades clos, vous perdez en moyenne ${montant} par trade.`,
    gainsPetitsPertesGrosses: (taux: number, gain: string, perte: string) =>
      `Vous gagnez ${taux} % du temps, mais vos pertes (${perte} en moyenne) sont plus grosses que vos gains (${gain}).`,
    horsPlan: (moyenneHors: string, nombreHors: number, moyenneDans: string, nombreDans: number) =>
      `Hors plan (${nombreHors} trades) : ${moyenneHors} par trade, contre ${moyenneDans} quand le plan est respecté (${nombreDans} trades).`,
    meilleureStrategie: (nom: string, resultat: string, nombre: number, taux: number) =>
      `Votre meilleure stratégie : « ${nom} », ${resultat} sur ${nombre} trades (${taux} % de réussite).`,
    strategieCouteuse: (nom: string, resultat: string, nombre: number, taux: number) =>
      `La stratégie qui vous coûte le plus : « ${nom} », ${resultat} sur ${nombre} trades (${taux} % de réussite).`,
    etatEsprit: (etat: string, moyenne: string, nombre: number) =>
      `Quand vous tradez « ${etat} », vous faites ${moyenne} par trade (${nombre} trades) : c’est votre état d’esprit le plus coûteux.`,
    jourFaible: (jour: string, moyenne: string, nombre: number) =>
      `Le ${jour} est votre jour le plus faible : ${moyenne} par trade (${nombre} trades).`,
    sansStop: (part: number) =>
      `${part} % de vos trades n’ont pas de stop noté : on ne peut pas mesurer le risque pris ni le résultat en R.`,
    perteExceptionnelle: (instrument: string, perte: string, moyenne: string) =>
      `Votre pire trade (${instrument}, ${perte}) pèse plus de trois fois votre perte moyenne (${moyenne}) : à relire.`,
  },
  repartition: {
    titre: 'Répartition des résultats',
    aucune: 'Pas encore de trade clos à répartir.',
    ligne: (nombre: number, taux: number) =>
      `${nombre} trade${nombre > 1 ? 's' : ''} · ${taux} % de réussite`,
    parTrade: (moyenne: string) => `${moyenne} par trade`,
  },
  trade: {
    nouveau: 'Nouveau trade',
    modifier: 'Trade',
    instrument: 'Instrument',
    exempleInstrument: 'ex : AAPL, EUR/USD',
    typeInstrument: 'Type d’instrument',
    sens: 'Sens',
    dateEntree: 'Date d’entrée',
    prixEntree: 'Prix d’entrée',
    quantite: 'Quantité',
    stop: 'Stop (prix)',
    objectif: 'Objectif (prix)',
    frais: 'Frais (€)',
    cloturer: 'Clôturer le trade',
    rouvrir: 'Rouvrir le trade',
    dateSortie: 'Date de sortie',
    prixSortie: 'Prix de sortie',
    strategie: 'Stratégie',
    exempleStrategie: 'ex : cassure, retour à la moyenne',
    planRespecte: 'Plan respecté ?',
    etatEsprit: 'État d’esprit',
    nonRenseigne: 'Non renseigné',
    notes: 'Notes (pourquoi ce trade, ce que vous en retenez)',
    etiquettes: 'Étiquettes (séparées par des virgules)',
    exempleEtiquettes: 'ex : actualité, erreur',
    resume: 'Résultat du trade',
    resultat: (montant: string) => `Résultat net : ${montant}`,
    risque: (montant: string) => `Risque pris : ${montant}`,
    multiple: (r: string) => `Résultat : ${r} R`,
    duree: (jours: number) => `Durée : ${jours} jour${jours > 1 ? 's' : ''}`,
    encoreOuvert: 'Trade ouvert : le résultat s’affichera à la clôture.',
    instrumentRequis: 'Instrument requis',
    prixEntreeInvalide: 'Le prix d’entrée doit être supérieur à zéro.',
    quantiteInvalide: 'La quantité doit être supérieure à zéro.',
    prixSortieRequis: 'Indiquez le prix de sortie pour clôturer le trade.',
    sortieAvantEntree: 'La sortie ne peut pas précéder l’entrée.',
    supprimer: 'Supprimer ce trade',
    supprimerQuestion: 'Supprimer ce trade ?',
    supprimerMessage: 'Il sera supprimé définitivement du journal.',
    introuvable: 'Trade introuvable',
  },
  compte: {
    depot: 'Dépôt (+)',
    retrait: 'Retrait (−)',
    nouveauDepot: 'Nouveau dépôt',
    nouveauRetrait: 'Nouveau retrait',
    montant: 'Montant (€)',
    date: 'Date',
    compteParDefaut: 'Compte de trading',
    montantInvalide: 'Le montant doit être supérieur à zéro.',
    descriptionDepot: 'Dépôt sur le compte',
    descriptionRetrait: 'Retrait du compte',
    aide: 'Les dépôts et retraits ajustent le solde sans compter dans le chiffre d’affaires. Les gains et les pertes des trades clos s’inscrivent tout seuls.',
    descriptionTrade: (sens: string, instrument: string, du: string, au: string) =>
      `Trade ${sens.toLowerCase()} ${instrument} du ${du} au ${au}`,
  },
  export: {
    section: 'Trades',
    aucun: 'Aucun trade pour cette année',
  },
} as const;
