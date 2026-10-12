import { agePetitMax } from '@/shared/constants/cheptel';
import { libelleDuree } from '@/shared/utils/age';
import { ce, capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

/** Textes de l'interface — « cheptel ». À modifier ici uniquement. */
export const TEXTES_CHEPTEL = {
  scannerBoucleCore: {
    aucunNumeroDetecte: 'Aucun numéro détecté',
    reprenezLaPhotoEnCadrant:
      'Reprenez la photo en cadrant bien le numéro, ou saisissez-le à la main ci-dessous.',
    erreurDeLecture: 'Erreur de lecture',
    lAccesALAppareil: 'L’accès à l’appareil photo est nécessaire pour scanner un numéro de boucle.',
    autoriserLAppareilPhoto: 'Autoriser l’appareil photo',
    lectureDuNumeroPoints: 'Lecture du numéro…',
    numeroDetecteVerifiezAvantDe: 'Numéro détecté (vérifiez avant de valider)',
    reprendreLaPhoto: 'Reprendre la photo',
    utiliserCeNumero: 'Utiliser ce numéro',
    cadrezLeNumeroDeBoucle: 'Cadrez le numéro de boucle',
  },
  googleVision: {
    cleApiGoogleVisionNon:
      "Clé API Google Vision non configurée. Voir src/ocr/googleVisionApiKey.ts pour l'obtenir dans Google Cloud Console.",
    erreurGoogleVisionStatusStatustext: (status: number, statusText: string, body: string) =>
      `Erreur Google Vision : ${status} ${statusText} — ${body}`,
    erreurGoogleVisionMessage: (message: unknown) => `Erreur Google Vision : ${message}`,
  },
  ajoutRapideChevre: {
    deQuiSAgitIlQuestion: 'De qui s’agit-il ?',
    laMere: 'La mère',
    get declarerUneNaissancePourCette() {
      return `Déclarer une naissance pour cette ${V().femelle.singulier}`;
    },
    get uneChevre() {
      return `Une ${V().femelle.singulier}`;
    },
    ajouterCetteFemelleAuCheptel: 'Ajouter cette femelle au cheptel',
    get unBouc() {
      return `Un ${V().male.singulier}`;
    },
    ajouterCeMaleAuCheptel: 'Ajouter ce mâle au cheptel',
    combienDePetitsQuestion: 'Combien de petits ?',
    sexeDeChaquePetit: 'Sexe de chaque petit',
    petitEspace: 'Petit ',
    continuer: 'Continuer',
  },
  bilanAnnuel: {
    comparaisonEspace: 'Comparaison ',
    precedenteAnneeEntreParenthesesDeuxPoints: '(précédente année entre parenthèses : ',
    nesEntreLe0101: 'Nés entre le 01/01 et le 31/12/',
    vendusAbattoirAutoConsommationComptent: '. Vendus/Abattoir/Auto-consommation comptent les sorties de',
    get pourToutCabriEncoreAge() {
      return `pour tout ${V().petit.singulier} encore âgé de moins de ${libelleDuree(agePetitMax())} à ce moment-là, même né l’année précédente.`;
    },
    t1erSemestreTardifsValeur: (valeur: number) => `1er semestre (tardifs ${valeur})`,
    t2eSemestreCabrisAnnee: (annee: number) => `2e semestre (${V().petit.pluriel} ${annee})`,
    /** Les ventes déclarées dans la comptabilité : la fiche de l'animal passe en vendu. */
    vendusStock: 'Vendus (inventaire)',
    venduesStock: 'Vendues (inventaire)',
    /** La déclaration à la Chambre d'agriculture, jointe au bilan de l'année (fichier rangé avec la sauvegarde et sur Drive). */
    declaration: {
      titre: (annee: number) => `Déclaration à la Chambre d’agriculture ${annee}`,
      aucune: 'Aucune déclaration jointe pour cette année.',
      joindre: 'Joindre un fichier',
      remplacer: 'Remplacer le fichier',
    },
    autoConsommation: 'Auto-consommation',
    mortNes: 'Mort-nés',
    get totalCabris() {
      return `Total ${V().petit.pluriel}`;
    },
    get chevresFemelles6MoisEt() {
      return `${Cap(V().femelle.pluriel)} (${libelleDuree(agePetitMax())} et plus) vivantes au 31/12/`;
    },
    reconstitueAPartirDesStatuts: ', reconstitué à partir des statuts actuels.',
    renouvellementDesigneesCetteAnnee: 'Renouvellement (désignées cette année)',
    plusAnciennes: 'Plus anciennes',
    misesBasPortees: 'Mises bas (portées)',
    get boucsMales6MoisEt() {
      return `${Cap(V().male.pluriel)} (${libelleDuree(agePetitMax())} et plus) vivants au 31/12/`;
    },
    renouvellementDesignesCetteAnnee: 'Renouvellement (désignés cette année)',
    plusAnciens: 'Plus anciens',
    morts: 'Morts',
    /** La carte de l'effectif : l'effectif de fin d'année, l'UGB et la prime prévisionnelle. */
    effectifEtUgb: {
      titre: 'Effectif et UGB prévisionnel',
      effectifActuel: 'Effectif actuel',
      effectifDeclare: 'Effectif déclaré',
      primeDifferente: (debut: string, fin: string) =>
        `La prime ne correspond pas au montant perçu entre le ${debut} et le ${fin}`,
      percu: (montant: string, debut: string, fin: string) => `Perçu du ${debut} au ${fin} : ${montant}`,
      effectifDeclarePlaceholder: 'à saisir',
      ugbPrevisionnel: 'UGB prévisionnel',
      primePrevisionnelle: 'Prime prévisionnelle',
      formule: '(UGB × taux €)',
      detail: {
        titre: 'Calcul de l’UGB et des primes',
        sevres: (nombre: number, coefficient: string) => `Animaux sevrés : ${nombre} × ${coefficient}`,
        declare: (nombre: number, coefficient: string) => `Effectif déclaré : ${nombre} × ${coefficient}`,
        petits: (nombre: number, coefficient: string) => `Petits non sevrés : ${nombre} × ${coefficient}`,
        ugb: (valeur: string) => `UGB prévisionnel : ${valeur}`,
        hectares: (valeur: string) => `Hectares admissibles : ${valeur} ha`,
        ligne: (nom: string, quantite: string, unite: string, taux: string, montant: string) =>
          `${nom} : ${quantite} ${unite} × ${taux} = ${montant}`,
        total: (montant: string) => `Total : ${montant}`,
        aucunePrime:
          'Aucune prime renseignée : cochez-les et saisissez leur montant dans Organisation › Cheptel.',
        note: 'Une indication d’après vos coefficients, vos montants et vos plafonds (réglables dans Organisation › Cheptel) : les autres conditions d’éligibilité ne sont pas calculées.',
        plafonne: (compte: string, brut: string, unite: string) =>
          `Plafonné : ${compte} ${unite} comptés sur ${brut}`,
        sousMinimum: (minimum: string, unite: string) =>
          `Seuil non atteint (${minimum} ${unite} au moins) : aucune aide`,
        degressif: 'Zone dégressive par tranches',
        partFixe: (quantite: string, unite: string, taux: string, montant: string) =>
          `Part fixe : ${quantite} ${unite} × ${taux} = ${montant}`,
        partZone: (quantite: string, unite: string, taux: string, montant: string) =>
          `Zone : ${quantite} ${unite} pleins × ${taux} = ${montant}`,
        ligneTotale: (nom: string, montant: string) => `${nom} : ${montant}`,
        zones: (detail: string) => `Zones de l’ICHN : ${detail}`,
        /** Les deux réductions du paiement de base : la plus élevée est retenue, l'autre reste enregistrée et ne change rien. */
        reductionBudgetaireRetenue: (pourcentage: string, avant: string, reduction: string) =>
          `Réduction pour plafonnement budgétaire : ${pourcentage} % de ${avant} = − ${reduction} (le taux le plus élevé est retenu)`,
        reductionBudgetaireNonRetenue: (pourcentage: string, reduction: string) =>
          `Réduction pour plafonnement budgétaire de ${pourcentage} % (− ${reduction}) : moins élevée que celle du stabilisateur, sans effet`,
        stabilisateurRetenu: (stabilisateur: string, pourcentage: string, avant: string, reduction: string) =>
          `Stabilisateur de ${stabilisateur} % : réduction de ${pourcentage} % de ${avant} = − ${reduction} (le taux le plus élevé est retenu)`,
        stabilisateurNonRetenu: (stabilisateur: string, pourcentage: string, reduction: string) =>
          `Stabilisateur de ${stabilisateur} % (réduction de ${pourcentage} %, − ${reduction}) : moins élevé que la réduction pour plafonnement budgétaire, sans effet`,
        tauxLimite: (taux: string, unite: string) => `Montant limité à ${taux} par ${unite}`,
        parametrer: 'Paramétrer l’UGB et les primes',
        fermer: 'Fermer',
      },
    },
  },
  /** La page d'accueil du Cheptel : la ligne des réglages (UGB, primes, effectif déclaré). */
  /** Les groupes de l'accueil du Cheptel. */
  accueil: {
    groupes: {
      troupeau: 'Gestion du troupeau',
      terrains: 'Terrains et identification',
      statistiques: 'Statistiques',
      technique: 'Technique',
    },
  },
  reglages: {
    titre: 'Réglages',
    aide: 'Paramétrage UGB, primes, etc.',
  },
  /** Cheptel › Réglages : les coefficients UGB et les primes. */
  ugbPrimes: {
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
      'En Corse, la note de cadrage de l’ODARC donne un montant par zone pour les 25 premiers hectares de surfaces animales : haute montagne sèche 334 €, montagne sèche 274 €, zones à contraintes naturelles (ZSCN) et spécifiques (ZSCS) 192 €. Le montant du dessus est celui de la montagne sèche ; saisissez ici ceux des autres zones (vide : celui de la note). Les hectares de chaque zone sont ceux des parcelles : choisissez la zone de chacune dans Cheptel › Contrôles de surface. Le calcul pondère les montants par la surface de chaque zone, comme le fait l’ODARC, puis applique 100 % aux 25 premiers hectares et les deux tiers de 25 à 50 ha.',
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
  },
  ficheChevre: {
    menu: 'Menu de la fiche',
    get chevreIntrouvable() {
      return `${Cap(V().femelle.singulier)} introuvable.`;
    },
    le: 'le',
    visitesVeterinairesLength: (length: number) => `Visites vétérinaires (${length})`,
    controlesLength: (length: number) => `Contrôles (${length})`,
    get ajouterUnCabriNouvelleNaissance() {
      return `Ajouter un ${V().petit.singulier} (nouvelle naissance)`;
    },
    nDeBoucleDeuxPoints: 'N° de boucle : ',
    dateDeBouclageDeuxPoints: 'Date de bouclage : ',
    nDeBoucleRougeDeuxPoints: 'N° de boucle rouge : ',
    dateDeBoucleRougeDeuxPoints: 'Date de la boucle rouge : ',
    sexeDeuxPoints: 'Sexe : ',
    dateDeNaissanceDeuxPoints: 'Date de naissance : ',
    nDeBoucleDeLaDeuxPoints: 'N° de boucle de la mère :',
    notesDeuxPoints: 'Notes : ',
    leEspace: 'le ',
    declarerDeuxPoints: 'Déclarer : ',
    remettreDansLeCheptelActif: 'Remettre dans le cheptel actif',
    descendance: 'Descendance (',
    visitesVeterinaires: 'Visites vétérinaires (',
    aucuneVisiteEnregistreePourEspace: 'Aucune visite enregistrée pour ',
    controles: 'Contrôles (',
    aucunControleEnregistrePourEspace: 'Aucun contrôle enregistré pour ',
    contrairementAValeurAbattoirValeur2: (
      valeur: string,
      valeur2: string,
      valeur3: string,
      valeur4: string,
      valeur5: string,
    ) =>
      `Contrairement à « ${valeur} / Abattoir / ${valeur2} », cette action efface complètement la fiche de ${valeur3} — elle ne sera plus enregistrée du tout. Utilisez plutôt « Déclarer ${valeur4} / abattoir / ${valeur5} » si vous voulez garder une trace. Cette suppression est irréversible.`,
    leNBoucleEstDeja: (boucle: string) => `Le n° ${boucle} est déjà attribué à une autre chèvre.`,
    renouvellementRenouvellementannee: (renouvellementAnnee: number) =>
      `Renouvellement ${renouvellementAnnee}`,
    nee: 'Née',
    ne: 'Né',
    envoyeALAbattoir: 'Envoyé à l’abattoir',
    envoyeeALAbattoir: 'Envoyée à l’abattoir',
  },
  historique: {
    dateDeSortie: 'Date de sortie',
    trierPar: 'Trier par',
    aucunHistorique: 'Aucun historique',
    lesChevresMortesEnvoyeesA:
      "Les animaux morts, envoyés à l'abattoir ou vendus apparaîtront ici, tout en restant enregistrés.",
  },
  listeCheptel: {
    /** Le titre de l'écran (ouvert depuis la ligne « Cheptel » de l'onglet). */
    titre: 'Cheptel actif',
    vivantes: 'Vivantes',
    autoConsommees: 'Auto-consommées',
    mortNees: 'Mort-nées',
    toutesSorties: 'Toutes sorties',
    toutes: 'Toutes',
    sansBoucle: 'Sans boucle',
    tous: 'Tous',
    derniereMiseBas: 'Dernière mise bas',
    morte: 'Morte',
    anneePresentSurLExploitation: 'Année (présent sur l’exploitation)',
    categorie: 'Catégorie',
    trierFiltrePar: 'Filtrer par',
    aucunFiltre: 'Aucun filtre',
    dansTousLesChampsPoints: 'Dans tous les champs…',
    dateDeNaissanceDu: 'Date de naissance — du',
    dateDeNaissanceAu: 'Date de naissance — au',
    dateDAbattageDu: 'Date d’abattage — du',
    dateDAbattageAu: 'Date d’abattage — au',
    annee: 'Année',
    aaaa: 'AAAA',
    nombreDAnimauxMortsSur: 'Nombre d’animaux morts sur l’exploitation cette année-là.',
    chevresNeesAvantPendantCette:
      'Animaux nés avant/pendant cette année et encore présents (vivants ou sortis pendant/après) — le filtre Statut est ignoré ici.',
    effacerLaDateDeNaissance: 'Effacer la date de naissance',
    effacerLaDateDAbattage: 'Effacer la date d’abattage',
    effacerLAnnee: 'Effacer l’année',
    effacerLAnneeDeRenouvellement: 'Effacer l’année de renouvellement',
    resultatDeuxPoints: 'Résultat : ',
    aucunAnimalNeCorrespondAux: 'Aucun animal ne correspond aux filtres sélectionnés.',
    ajouterAuCheptel: 'Ajouter au cheptel',
    envoyeALAbattoir: 'envoyé à l’abattoir',
    autoConsomme: 'auto-consommé',
    mortNe: 'mort-né',
    get chevre() {
      return V().femelle.singulier;
    },
    animalSansBoucle: 'animal sans boucle',
    male: 'mâle',
    renouvellementValeur: (valeur: unknown) => `renouvellement ${valeur}`,
    aucunAnimalSuffixestatut: (suffixeStatut: string) => `Aucun animal${suffixeStatut}`,
    aucunValeurSuffixestatut: (valeur: string, suffixeStatut: string) => `Aucun ${valeur}${suffixeStatut}`,
    mereMerenumeroboucle: (mereNumeroBoucle: string) => ` · Mère : ${mereNumeroBoucle}`,
  },
  naissances: {
    aucuneNaissanceEnregistree: 'Aucune naissance enregistrée',
    declarezUneNaissanceDepuisL: "Déclarez une naissance depuis l'onglet Cheptel.",
    mereEspace: 'Mère ',
    get cabri() {
      return V().petit.singulier;
    },
    naissanceNotes: (notes: string) => `Naissance: ${notes}`,
    sansBoucleSexe: (sexe: unknown) => `sans boucle (${sexe})`,
  },
  nouvelleChevre: {
    mereInconnue: 'Aucune / inconnue',
    nDeBoucleRequis: 'N° de boucle requis',
    get pourEnregistrerSesCabrisIl() {
      return `Pour enregistrer ses ${V().petit.pluriel}, il faut le n° de boucle de la mère.`;
    },
    leNValeurEstUtilise: (valeur: string) => `Le n° ${valeur} est utilisé plusieurs fois dans ce formulaire.`,
    get cetteChevreADesCabris() {
      return `Cette ${V().femelle.singulier} a des ${V().petit.pluriel} à enregistrer`;
    },
  },
  nouvelleNaissance: {
    mereRequise: 'Mère requise',
    merciDeRenseignerLeN: 'Merci de renseigner le n° de boucle de la mère.',
    leNDoublonlocalEstUtilise: (doublonLocal: string) =>
      `Le n° ${doublonLocal} est utilisé plusieurs fois dans ce formulaire.`,
    choisirLaMere: 'Choisir la mère',
    get cabris() {
      return `${Cap(V().petit.pluriel)} (`;
    },
    enregistrerLaNaissance: 'Enregistrer la naissance',
  },
  chevreLabel: {
    nomSansBoucle: (nom: string) => `${nom} (sans boucle)`,
    get chevrette() {
      return V().petitFemelle;
    },
    get chevreau() {
      return V().petitMale;
    },
    /** L'adulte sans boucle, une fois l'âge de petit dépassé (chèvre, bouc, truie, verrat, poule, coq…). */
    get femelleAdulte() {
      return Cap(V().femelle.singulier);
    },
    get maleAdulte() {
      return Cap(V().male.singulier);
    },
    typeSansBoucleNeE: (type: string, valeur: string) => `${type} sans boucle — né(e) le ${valeur}`,
    nee: 'née',
    ne: 'né',
    get ceBouc() {
      return ce(V().male.singulier);
    },
    get ceCabri() {
      return ce(V().petit.singulier);
    },
    get cetteChevre() {
      return `cette ${V().femelle.singulier}`;
    },
  },
} as const;
