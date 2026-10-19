/** Cheptel › Réglages : les coefficients UGB et les primes. */
export const ugbPrimesTextes = {
  ugbTitre: 'UGB',
  ugbAide:
    'L’UGB (unité de gros bétail) convertit vos animaux en une unité commune. Les coefficients proposés sont indicatifs : adaptez-les à votre notice PAC.',
  coefAdulte: 'Coefficient par animal sevré',
  coefPetit: 'Coefficient par petit non sevré',
  primesTitre: 'Primes',
  primesAide:
    'Cochez les aides que vous touchez et saisissez leur montant : le bilan en déduit une prime prévisionnelle. Les montants et les plafonds changent chaque année (prenez ceux de votre notification) ; les plafonds proposés sont indicatifs et modifiables.',
  parAnnee:
    'Les aides sont enregistrées pour l’année et l’espèce choisies : leurs montants changent chaque année. Une aide non modifiée est reprise de l’année précédente.',
  associes: 'Nombre d’associés (GAEC)',
  associesAide:
    'En GAEC, les plafonds du paiement redistributif et de l’ICHN se multiplient par le nombre d’associés. Laissez 1 hors GAEC.',
  stabilisateur: 'Stabilisateur de l’année (%)',
  stabilisateurAide: [
    {
      texte: [
        'Appliqué au paiement de base (DPB) de fin de campagne : vous percevez ce pourcentage du montant calculé (97,0805 % en 2025, d’après la lettre de la DDT du 14/01/2026). Il ne change pas la valeur des DPB, seulement le montant payé. Vide ou 100 : aucun. Il figure dans la lettre de la DDT sur votre portefeuille de DPB :',
      ],
    },
    { image: 'lettreDdt' },
  ],
  reductionBudgetaire: 'Réduction pour plafonnement budgétaire (%)',
  calculeSurStabilisateur: 'Réduction du stabilisateur (calculée)',
  calculeSurPlafonnement: 'Réduction du plafonnement budgétaire (calculée)',
  reductionRetenue: 'Réduction retenue (la plus élevée des deux)',
  reductionBudgetaireAide: [
    {
      texte: [
        'Le taux de réduction pour plafonnement budgétaire du paiement de base (article D. 614-67 du code rural et de la pêche maritime) est fixé chaque année par arrêté : au titre de la campagne 2025, 3,8774 % (arrêté du 5 juin 2026, article 3). C’est le pourcentage de la ligne « Réduction pour plafonnement budgétaire » de votre relevé de situation (386,65 € sur 9 971,88 € avant réduction). Il est distinct du stabilisateur : les deux s’enregistrent, et c’est le plus élevé des deux pourcentages de réduction qui s’applique (le stabilisateur de 97,0805 % réduit de 2,9195 %) ; l’autre reste enregistré, sans effet. Vide ou 0 : aucune réduction pour plafonnement cette année. Texte de référence : ',
        { libelle: 'Légifrance', lien: 'plafonnementBudgetaire' },
      ],
    },
  ],
  tauxDeLaZone: (zone: string) => `Montant de la zone « ${zone} » (€) par hectare`,
  majoration: 'Majoration petits ruminants (%)',
  sansMajoration: 'Vide : aucune',
  majorationAide:
    'L’ODARC majore le montant de l’ICHN pour un cheptel de petits ruminants : +10 % en zone de montagne et +30 % en zones soumises à des contraintes (colonne « Majoration petits ruminants » de son tableau de valorisation ; la fiche de la zone 71.05 précise qu’il faut plus de la moitié d’ovins ou de caprins). Saisissez ici 10 pour la montagne : le montant de la zone est multiplié par (1 + majoration).',
  zonesAide:
    'En Corse, la note de cadrage de l’ODARC donne un montant par zone pour les 25 premiers hectares de surfaces animales : haute montagne sèche 334 €, montagne sèche 274 €, zones à contraintes naturelles (ZSCN) et spécifiques (ZSCS) 192 €. Le montant du dessus est celui de la montagne sèche ; saisissez ici ceux des autres zones (vide : celui de la note). Les hectares de chaque zone sont ceux des parcelles : choisissez la zone de chacune dans Cheptel › Suivi des terrains. Le calcul pondère les montants par la surface de chaque zone, comme le fait l’ODARC, puis applique 100 % aux 25 premiers hectares et les deux tiers de 25 à 50 ha.',
  plafond: 'Plafond',
  minimum: 'Seuil minimum',
  plafondTaux: 'Montant unitaire maximum (€)',
  sansPlafond: 'Vide : sans plafond',
  tranchesTitre: 'Montant de la zone : dégressivité par tranches',
  partFixe: 'Part fixe (€ par hectare)',
  tauxZone: 'Montant de la zone (€)',
  jusqua: 'Jusqu’à (ha)',
  partPayee: 'Part payée (%)',
  compter: 'Compter dans la prime prévisionnelle',
  ajouter: '+ Ajouter une aide',
  nomAide: 'Nom de l’aide',
  exempleNom: 'ex : Aide à l’installation',
  renommer: 'Modifier le nom de l’aide',
  supprimer: 'Supprimer cette aide',
  supprimerQuestion: 'Supprimer cette aide ?',
  supprimerMessage: 'Elle ne comptera plus dans la prime prévisionnelle.',
  personnalisee: 'Aide ajoutée par vous : son montant se calcule comme les autres.',
  taux: 'Montant (€)',
  calculeSur: 'Calculé sur',
  bases: { ugb: 'l’UGB', tete: 'l’animal sevré', hectare: 'l’hectare admissible' },
  /** L'unité du montant (« par … ») et celle de la quantité dans le détail du calcul. */
  unites: { ugb: 'UGB', tete: 'animal', hectare: 'hectare' },
  unitesQuantite: { ugb: 'UGB', tete: 'animaux', hectare: 'ha' },
  primes: {
    dpb: {
      court: 'DPB',
      titre: 'Aides découplées — Paiement de base (DPB)',
      aide: 'PAC : paiement de base, à l’hectare admissible.',
      ouTrouver: [
        {
          texte: [
            'Où trouver ce montant : dans Télépac › Données et documents › Campagne › onglet « DPB » (Portefeuille DPB), qui donne la valeur unitaire de vos DPB pour l’année :',
          ],
        },
        { image: 'dpbTelepac' },
        {
          texte: [
            'Cette valeur (144,52 € pour les DPB finaux au 15 mai 2025) est d’avant le coefficient de réduction de la réserve (1,70 %). La lettre de la DDT « portefeuille de droits à paiement de base (DPB) » donne la valeur après ce coefficient (142,18 € en 2025) : c’est celle à saisir ici, avec le stabilisateur, pour retrouver ce qui est payé.',
          ],
        },
      ],
      plafondAide:
        'Plafond : le nombre de droits (DPB) de votre portefeuille Telepac ; au-delà, les hectares ne touchent plus l’aide. La valeur d’un DPB est aussi limitée (144,52 € en Corse en 2026).',
    },
    redistributif: {
      court: 'Paiement redistributif',
      titre: 'Aides découplées — Paiement redistributif',
      aide: 'PAC : majoration sur les premiers hectares.',
      ouTrouver: [
        {
          texte: [
            'Où trouver ce montant : dans votre relevé de situation. Télépac › Mes données et documents › Paiements par date, puis la loupe de la colonne « Relevé de situation » ouvre le relevé (sa première page ressemble à ceci) :',
          ],
        },
        { image: 'relevePage1' },
        {
          texte: [
            'L’annexe « Valorisation du montant de vos aides » est en page 4 du relevé. Le montant unitaire est dans la colonne « Montant unitaire (€/ha) » de la rubrique « Aide redistributive au revenu » : 50,20 € en 2025.',
          ],
        },
        { image: 'releveAnnexe' },
        {
          texte: [
            'Avant le solde, c’est le montant de l’arrêté ministériel de l’année (48,58 € en novembre 2025), publié au Journal officiel (',
            { libelle: 'Légifrance', lien: 'legifrance' },
            ') et sur ',
            { libelle: 'agriculture.gouv.fr', lien: 'agriculture' },
            ' ; il peut être réajusté au solde.',
          ],
        },
      ],
      plafondAide:
        'Versé sur les 52 premiers hectares admissibles ; ce plafond se multiplie par le nombre d’associés d’un GAEC.',
    },
    ecoregime: {
      court: 'Écorégime',
      titre: 'Aides découplées — Écorégime',
      aide: 'PAC : paiement pour les pratiques favorables à l’environnement.',
      ouTrouver: [
        {
          texte: [
            'Où trouver ce montant : dans l’annexe de votre relevé de situation : Télépac › Mes données et documents › Paiements par date, puis la loupe de la colonne « Relevé de situation ». L’annexe « Valorisation du montant de vos aides » est en page 4 du relevé. Le montant unitaire est dans la colonne « Montant unitaire (€/ha) » du tableau « Aide écorégime », pour le niveau retenu (voie des pratiques, niveau supérieur : 63,39 € en 2025).',
          ],
        },
        { image: 'releveAnnexe' },
        {
          texte: [
            'Avant le paiement, ce sont les montants de l’arrêté ministériel de l’année (base, supérieur, bio), publiés au Journal officiel (',
            { libelle: 'Légifrance', lien: 'legifrance' },
            ') et sur ',
            { libelle: 'agriculture.gouv.fr', lien: 'agriculture' },
            '.',
          ],
        },
      ],
      plafondAide:
        'Sans plafond : tous les hectares admissibles. Montants 2026 : 45,46 € (base), 62,05 € (supérieur), 110 € (bio), +20 € (haies).',
    },
    couplee_petits_ruminants: {
      court: 'Aide couplée petits ruminants',
      titre: 'Aide couplée aux petits ruminants',
      aide: 'PAC : par brebis ou chèvre éligible.',
      ouTrouver: [
        {
          texte: [
            'Où trouver ce montant : dans l’annexe de votre relevé de situation : Télépac › Mes données et documents › Paiements par date, puis la loupe de la colonne « Relevé de situation ». L’annexe « Valorisation du montant de vos aides » est en page 4 du relevé. Le montant unitaire est dans la colonne « Montant unitaire (€/animal) » de la rubrique « Aides couplées animales › Aide aux petits ruminants (APR) », sur la ligne « APR supérieur caprin » (ou « ovin ») :',
          ],
        },
        { image: 'releveApr' },
        {
          texte: [
            'Ce montant se réajuste d’un relevé à l’autre : 32,51 € sur le relevé du 14/01/2026 (150 caprins : 4 876,50 €), puis 34,72 € sur celui du 17/06/2026 (5 208,00 €). Saisissez celui du dernier relevé.',
          ],
        },
        {
          texte: [
            'Il dépend du nombre d’animaux éligibles : il n’est connu qu’au paiement ; avant, voyez les notes de la DRAAF Corse et les arrêtés de l’année, publiés au Journal officiel (',
            { libelle: 'Légifrance', lien: 'legifrance' },
            ') et sur ',
            { libelle: 'agriculture.gouv.fr', lien: 'agriculture' },
            '.',
          ],
        },
      ],
      plafondAide:
        'Au moins 10 femelles éligibles (seuil modifiable). Montants 2026 en Corse : chèvre 15,43 € (30,87 € majoré), brebis 22,23 € (44,46 € majoré). Pas de plafond de têtes en Corse.',
    },
    ichn: {
      court: 'ICHN',
      titre: 'ICHN — Indemnité compensatoire de handicaps naturels',
      aide: 'Zones défavorisées : à l’hectare, selon le chargement en UGB.',
      ouTrouver: [
        {
          texte: [
            'Où trouver ce montant : en Corse, l’ICHN est payée par l’ODARC (Office du développement agricole et rural de la Corse). La note de cadrage et les décisions sont sur la page ',
            { libelle: 'Interventions ICHN (71.04, 71.05, 71.06) du PSN', lien: 'odarcIchn' },
            '.',
          ],
        },
        {
          texte: [
            'Le montant par hectare dépend de la zone de votre commune : montagne (71.04, haute montagne sèche ou montagne sèche), zone à contraintes naturelles (71.05) ou à contraintes spécifiques (71.06). La « Liste des communes classées en zones défavorisées au 1er janvier 2017 » se télécharge sur la page du ministère ',
            { libelle: 'Classement en zone défavorisée', lien: 'zoneDefavorisee' },
            ' : cherchez votre commune dans ce fichier, et regardez dans quelle colonne figure sa zone (Montagne, Zone défavorisée simple, Zone à handicap spécifique). Extrait, avec une commune de montagne repérée par un M :',
          ],
        },
        { image: 'classementCommunes' },
        {
          texte: ['La note de cadrage donne, pour les 25 premiers hectares admissibles :'],
        },
        { image: 'ichnZones' },
        {
          texte: [
            'L’ICHN est versée dans la limite de 50 hectares de surfaces admissibles, plafond global pour 71.04, 71.05 et 71.06 réunies. C’est une aide du second pilier : elle ne figure pas sur le relevé de situation des aides directes de la PAC (ASP).',
          ],
        },
      ],
      plafondAide:
        'Versée dans la limite de 50 hectares de surfaces admissibles (note de cadrage de l’ODARC) : le montant de votre zone, payé à 100 % sur les 25 premiers hectares puis aux 2/3 de 25 à 50 ha, sans part fixe. Les seuils se multiplient par le nombre d’associés d’un GAEC.',
    },
  },
} as const;
