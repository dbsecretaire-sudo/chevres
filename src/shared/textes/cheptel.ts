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
      troupeau: 'Troupeau',
      sante: 'Santé',
      identification: 'Identification et PAC',
      statistiques: 'Statistiques',
      technique: 'Technique',
    },
    /** Les lignes du menu du Cheptel (voir groupesCheptel). */
    lignes: {
      animaux: { titre: 'Animaux', aide: 'Les animaux vivants : fiches, ajout.' },
      naissances: { titre: 'Naissances', aide: 'Les mises bas, portée par portée, et le carnet de mise bas.' },
      sorties: { titre: 'Sorties', aide: 'Les animaux morts, vendus ou envoyés à l’abattoir.' },
      visites: { titre: 'Visites du vétérinaire', aide: 'Le carnet sanitaire : visites, analyses, ordonnances.' },
      boucles: { titre: 'Boucles', aide: 'L’inventaire des boucles, les repères et les boucles rouges.' },
      controles: { titre: 'Contrôles des animaux', aide: 'Les contrôles de l’ASP : identification, registre.' },
      dossierPac: {
        titre: 'Dossier PAC',
        aide: 'Suivi des mouvements, bordereaux de perte, recensement annuel, déclaration d’estive.',
      },
      bilan: { aide: 'Les effectifs, l’UGB et les primes de l’année.' },
      alimentation: { aide: 'Ce que mangent les animaux et ce que ça coûte.' },
    },
  },
  /** Les lots d'animaux : un nom, des boucles, leur suivi sanitaire. */
  lots: {
    titre: 'Lots d’animaux',
    lot: 'Lot',
    aide: 'Groupe d’animaux nommé : utilisation sanitaire ou comptable',
    nouveau: 'Nouveau lot',
    aucun: 'Aucun lot.',
    aucunAide: 'Créez un lot avec le bouton +, ou gardez des animaux comme lot depuis un traitement.',
    nom: 'Nom du lot',
    exemple: 'ex : Chevrettes 2026',
    nomRequis: 'Donnez un nom au lot.',
    nomPris: 'Un lot porte déjà ce nom.',
    aideBoucles: 'Les boucles des animaux du lot. Les animaux sortis du troupeau restent dans la liste mais ne comptent plus.',
    animaux: (vivants: number, total: number) =>
      vivants === total ? `${total} ${total > 1 ? 'animaux' : 'animal'}` : `${vivants} vivant${vivants > 1 ? 's' : ''} sur ${total}`,
    enDelai: (nombre: number) => `${nombre} en délai d’attente`,
    /** Les lots d'abattoir : un par jour d'abattage, créés tout seuls d'après le cheptel. */
    abattoirDu: (date: string) => `Abattoir du ${date}`,
    /** Les catégories de lots : Abattoir et Vétérinaire d'office, puis celles qu'on ajoute (le bouton réglages du titre). */
    categories: {
      abattoir: 'Abattoir',
      veterinaire: 'Vétérinaire',
      reproduction: 'Mises à la reproduction',
      avortement: 'Avortements',
      renouvellement: 'Renouvellement',
      autres: 'Autres lots',
      reglages: 'Gérer les catégories de lots',
      gererTitre: 'Catégories de lots',
      aideGerer: 'Les catégories rangent vos lots : renommez-les, ajoutez les vôtres, supprimez-les et changez leur ordre. Abattoir, Vétérinaire, Mises à la reproduction, Avortements et Renouvellement sont toujours là (leurs lots se créent tout seuls) : on peut les renommer et les ranger, pas les supprimer.',
      ajouter: 'Ajouter une catégorie',
      renommer: 'Renommer la catégorie',
      nomCategorie: 'Nom de la catégorie',
      exempleNom: 'ex : Chevrettes',
      supprimerQuestion: 'Supprimer cette catégorie ?',
      supprimerMessage: 'Les lots de la catégorie ne sont pas supprimés : ils passent dans « Autres lots ».',
      supprimer: 'Supprimer la catégorie',
      protegee: 'Catégorie d’office : elle ne se supprime pas.',
      monter: 'Monter',
      descendre: 'Descendre',
      rangee: 'Rangez les catégories avec les flèches.',
      titreReglages: 'Catégories de lots (Abattoir, Vétérinaire, Mises à la reproduction, Avortements et Renouvellement sont toujours là)',
      categorie: 'Catégorie',
      nombre: (n: number) => (n > 1 ? `${n} lots` : n === 1 ? '1 lot' : 'Aucun lot'),
    },
    /** Un lot de chèvres mises à la reproduction : un par année, créé tout seul ; le carnet de mise bas en compte les animaux. */
    renouvellementAnnee: (annee: number) => `Renouvellement ${annee}`,
    aideRenouvellement: 'Les animaux désignés pour le renouvellement de l’année : un lot se crée tout seul chaque année et son nom ne se modifie pas ; on y ajoute ou retire des animaux en les choisissant dans le cheptel. L’année de renouvellement de leur fiche, du bilan, du registre et des exports suit ce lot.',
    avortementAnnee: (annee: number) => `Avortements ${annee}`,
    aideAvortement: 'Les femelles qui ont avorté cette année-là (des femelles à leur majorité sexuelle, pas de mâles) : on y ajoute des animaux en les choisissant dans le cheptel, ou d’un appui sur leur fiche. Le carnet de mise bas reprend leur nombre.',
    /** Sur la fiche d'un animal : les lots d'une année où il figure, et les boutons pour l'y ajouter. */
    suiviAnnuel: {
      titre: 'Suivi de l’année',
      renouvellement: 'Ajouter au renouvellement',
      reproduction: 'Mettre à la reproduction',
      avorte: (femelle: string) => `Cette ${femelle} a avorté`,
      signalerAvortement: 'Signaler un avortement',
      aide: (annee: number) => `Les boutons ajoutent l’animal au lot de ${annee} (créé s’il manque) ; l’année se change ensuite dans le lot.`,
    },
    anneeDuLot: 'Année du lot',
    anneeDuLotAide: 'Le nom du lot suit son année, que vous pouvez changer ici.',
    anneeDejaPrise: 'Un lot de cette catégorie existe déjà pour cette année.',
    anneeInvalideLot: 'Écrivez une année (quatre chiffres).',
    reproductionAnnee: (annee: number) => `Mises à la reproduction ${annee}`,
    anneeReproduction: 'Année des mises bas',
    anneeMisesBas: (annee: string) => `Mises bas de ${annee}`,
    anneeInvalide: 'Écrivez l’année des mises bas (quatre chiffres).',
    aideReproduction: 'Un lot est créé tout seul chaque année, avec les femelles qui ont mis bas et toutes celles à leur majorité sexuelle (6 mois) et vivantes à la date d’une mise bas de l’année : son nom ne se modifie pas, mais vous pouvez en corriger les femelles en les choisissant dans le cheptel. Le carnet de mise bas compte les animaux du lot de l’année et en calcule les taux de fertilité et de productivité.',
    /** Le lot d'une visite vétérinaire, créé tout seul avec ses animaux. */
    visiteDu: (date: string) => `Visite vétérinaire du ${date}`,
    /** Le titre de la liste des animaux d'un lot d'abattage où des bêtes sont mortes pendant le transport : « 50 animaux, dont 49 abattus ». */
    animauxDuLot: (nombre: number) => `${nombre} ${nombre > 1 ? 'animaux' : 'animal'}`,
    dontAbattus: (nombre: number) => `, dont ${nombre} ${nombre > 1 ? 'abattus' : 'abattu'}`,
    abattus: (nombre: number) => `${nombre} ${nombre > 1 ? 'animaux abattus' : 'animal abattu'}`,
    /** Les onglets de la fiche d'un lot : le lot, les animaux, la visite, la facture, les fichiers, le suivi sanitaire. */
    onglets: {
      lot: 'Lot',
      visite: 'Visite',
      facture: 'Facture',
      /** Le lot d'un jour d'abattage : l'écriture de l'abattoir et celles des clients. */
      ecritures: 'Écritures',
      suivi: 'Suivi sanitaire',
      animaux: (nombre: number) => (nombre > 0 ? `Animaux (${nombre})` : 'Animaux'),
      fichiers: (nombre: number) => (nombre > 0 ? `Fichiers (${nombre})` : 'Fichiers'),
    },
    ecrituresLiees: 'Écritures liées',
    /** Le suivi sanitaire d'un lot d'abattage : les bêtes inconsommables (au lieu des traitements). */
    inconsommables: {
      titre: 'Bêtes inconsommables',
      aide: 'Les bêtes de ce lot qui ne sont pas consommables : un problème sanitaire (saisie à l’abattoir), ou la mort pendant le transport. Elles ne se facturent pas au client.',
      declarer: 'Déclarer des bêtes inconsommables',
      pourquoi: 'Pour quelle raison ?',
      choisir: 'Choisir les bêtes',
      valider: (n: number) => (n > 0 ? `Déclarer (${n})` : 'Déclarer'),
      aucune: 'Aucune bête déclarée inconsommable.',
      retirer: 'Retirer de la liste',
      nBetes: (n: number) => `${n} ${n > 1 ? 'bêtes inconsommables' : 'bête inconsommable'}`,
      motifs: { sanitaire: 'Problème sanitaire (saisie)', transport: 'Morte pendant le transport' },
      /** Le motif écrit à droite d'une ligne de la liste des animaux (accordé au sexe de la bête). */
      motifsListe: { transport: (femelle: boolean) => (femelle ? 'Morte pendant le transport' : 'Mort pendant le transport') },
    },
    poidsDuLot: 'Poids de tout le lot (kg)',
    poidsDuLotAide: 'Le poids total de la viande de ce lot (bon d’abattage). Il remplit le poids de la facture au client, qui ne se modifie plus.',
    poidsDesFiches: (kilos: string) => `Poids des fiches des animaux : ${kilos} kg`,
    aideFichiersAbattage: 'Les poids, le bon d’abattage et les autres documents de cet abattage ou de sa vente (scan, photo, PDF).',
    aideFactureAbattoir: 'La facture de l’abattoir fait le montant des frais d’abattoir refacturés au client quand vous facturez la viande de ce lot. Il n’y a pas de montant sans facture : la facture se modifie dans la comptabilité.',
    /** Les onglets de la fiche d'un lot vétérinaire (une visite). */
    ongletsVisite: {
      visite: 'Visite',
      animaux: (nombre: number) => (nombre > 0 ? `Animaux (${nombre})` : 'Animaux'),
      fichiers: (nombre: number) => (nombre > 0 ? `Fichiers (${nombre})` : 'Fichiers'),
      suivi: 'Suivi sanitaire',
    },
    aideVerrouille: 'Ce lot se crée tout seul (abattoir, visite vétérinaire…) : son nom et sa catégorie ne se modifient pas et il ne se supprime pas. On y change seulement les animaux.',
    rapportNumero: (numero?: string) => (numero ? `rapport d’essais n° ${numero}` : 'rapport d’essais'),
    aFacturer: 'à facturer',
    facture: 'facturé',
    aucunAnimalDansLeLot: 'Aucun animal dans ce lot : choisissez-les dans le cheptel.',
    aideAbattoir: 'Un lot d’abattoir : les animaux (avec boucle) envoyés à l’abattoir ce jour-là. Il se crée et se complète tout seul.',
    lierFacture: 'Lier la facture de l’abattoir',
    factureAbattoir: 'Facture de l’abattoir',
    aucuneFactureAbattoir: 'Aucune dépense d’un contact de la catégorie Abattoir : rangez votre abattoir dans cette catégorie (Contacts), puis saisissez sa facture.',
    cabrisATiptag: (nombre: number) => `${nombre} cabri${nombre > 1 ? 's' : ''} à tiptag pas encore à l’abattoir`,
    cabrisATiptagAide: 'Tout tiptag de cabri est destiné à l’abattoir. Les ajouter à ce lot (puis Enregistrer) les envoie à l’abattoir au jour du lot.',
    ajouterLesCabrisATiptag: 'Les ajouter à ce lot',
    lotVendu: 'Ce lot est vendu : il est figé.',
    lotVenduAide: 'Rien ne s’y modifie (animaux, facture de l’abattoir). Pour le modifier, supprimez la facture du client.',
    facturerCeLot: 'Facturer la viande de ce lot au client',
    voirLaFactureDuClient: 'Voir la facture',
    aucuneFactureAbattoirLiee: 'Aucune facture d’abattoir n’était liée à ce lot.',
    factureDuClient: 'Facture du client',
    aucuneFactureClient: 'Aucune facture du client pour ce lot : il est à facturer.',
    clientInconnu: 'Client',
    choisirLaFactureAbattoir: 'Choisissez la facture de l’abattoir de ce lot :',
    ouvrirLesContacts: 'Ouvrir mes contacts',
    voirLaFacture: 'Voir ou modifier la facture',
    delierFacture: 'Délier cette facture',
    montantAbattoir: 'Ou noter le montant demandé par l’abattoir (€ TTC)',
    montantAbattoirAide: 'Ce que l’abattoir vous demande de payer (une dépense pour vous). Il est proposé en frais refacturés quand vous facturez la viande de ce lot au client.',
    suivi: 'Suivi sanitaire du lot',
    nouveauTraitement: 'Donner un traitement à ce lot',
    traitementsDuLot: (nombre: number) => `Traitements du lot${nombre > 0 ? ` (${nombre})` : ''}`,
    aucunTraitement: 'Aucun traitement donné à ce lot pour l’instant.',
    supprimer: 'Supprimer ce lot',
    supprimerQuestion: 'Supprimer ce lot ?',
    supprimerMessage: 'Le lot disparaît ; les animaux et les traitements déjà enregistrés restent.',
    lotDuTraitement: (nom: string) => `Lot : ${nom}`,
  },
  /** Le tableau de bord du cheptel : effectifs, pyramide des âges, mouvements de l'année, santé. */
  tableauDeBord: {
    titre: 'Tableau de bord',
    aide: 'Effectifs, pyramide des âges, mouvements de l’année et santé du troupeau.',
    effectif: 'Effectif',
    total: 'Animaux vivants',
    femelles: 'Femelles',
    males: 'Mâles',
    pyramide: 'Pyramide des âges',
    vide: 'Aucun animal ni mouvement pour l’instant.',
    legende: 'Vert : femelles. Orangé : mâles.',
    repartition: (femelles: number, males: number) => `${femelles + males} · ${femelles} F · ${males} M`,
    classes: {
      moins6: 'Moins de 6 mois',
      de6a12: '6 à 12 mois',
      de1a2: '1 à 2 ans',
      de2a3: '2 à 3 ans',
      de3a4: '3 à 4 ans',
      de4a5: '4 à 5 ans',
      plus5: '5 ans et plus',
    },
    mouvements: (annee: number) => `Mouvements de ${annee}`,
    mouvementsLibelles: {
      naissances: 'Naissances',
      achats: 'Achats',
      ventes: 'Ventes',
      morts: 'Morts',
      autresSorties: 'Autres sorties (abattoir, pension…)',
    },
  },
  /** Les traitements donnés aux animaux et leurs délais d'attente (lait, viande). */
  traitements: {
    titre: 'Traitements',
    aide: 'Les médicaments donnés aux animaux et leurs délais d’attente : lait, viande.',
    nouveau: 'Nouveau traitement',
    modifier: 'Traitement',
    /** Le titre de l'encart de l'accueil. */
    accueil: 'Santé du troupeau',
    bilan: {
      titre: 'Bilan sanitaire annuel',
      aucun: 'Aucun bilan sanitaire enregistré : il se note dans les visites du vétérinaire (motif « Bilan sanitaire annuel »).',
      valide: (date: string) => `Valide jusqu’au ${date}`,
      bientot: (jours: number, date: string) =>
        jours === 0 ? `Expire aujourd’hui (${date})` : `Expire dans ${jours} ${jours > 1 ? 'jours' : 'jour'} (le ${date}) : pensez à le renouveler`,
      expire: (date: string) => `Expiré depuis le ${date} : à renouveler`,
    },
    enCours: 'Délais d’attente en cours',
    aucunEnCours: 'Aucun délai d’attente en cours.',
    lait: 'Lait',
    viande: 'Viande',
    laitEnDelai: (nombre: number, fin: string) =>
      `Lait : ${nombre} ${nombre > 1 ? 'femelles' : 'femelle'} à ne pas traire pour la livraison jusqu’au ${fin} inclus.`,
    viandeEnDelai: (nombre: number, fin: string) =>
      `Viande : ${nombre} ${nombre > 1 ? 'animaux' : 'animal'} à ne pas vendre ni abattre jusqu’au ${fin} inclus.`,
    historique: 'Historique',
    aucun: 'Aucun traitement enregistré.',
    aucunAide: 'Ajoutez un traitement avec le bouton + : la fin du délai d’attente se calcule toute seule.',
    troupeauEntier: 'Tout le troupeau',
    animaux: (nombre: number) => `${nombre} ${nombre > 1 ? 'animaux' : 'animal'}`,
    delaiLait: (jours: number, fin: string) => `lait ${jours} j → ${fin}`,
    delaiViande: (jours: number, fin: string) => `viande ${jours} j → ${fin}`,
    sansDelai: 'sans délai d’attente',
    enDelai: 'En délai',
    termine: 'Délai terminé',
    form: {
      produit: 'Produit ou médicament',
      produitExemple: 'ex : Amoxicilline, Ivermectine, vaccin…',
      produitRequis: 'Indiquez le produit donné.',
      motif: 'Pourquoi (facultatif)',
      motifExemple: 'ex : mammite, parasites, vaccin',
      date: 'Premier jour',
      plusieursJours: 'Le traitement dure plusieurs jours',
      derniereDate: 'Dernière prise',
      aideDerniere: 'Le délai d’attente se compte à partir de la dernière prise.',
      animaux: 'Animaux traités',
      aideAnimaux: 'Vide : tout le troupeau. Sinon, écrivez ou choisissez les boucles.',
      delaiLait: 'Délai d’attente du lait (jours)',
      delaiViande: 'Délai d’attente de la viande (jours)',
      aideDelais: 'Ceux de l’ordonnance ou de la notice. Laissez vide ou 0 s’il n’y en a pas.',
      resumeLait: (fin: string) => `Lait à ne pas livrer jusqu’au ${fin} inclus ; utilisable à partir du lendemain.`,
      resumeViande: (fin: string) => `Viande à ne pas vendre ni abattre jusqu’au ${fin} inclus ; utilisable à partir du lendemain.`,
      notes: 'Notes',
      fichiers: 'Ordonnance, notice',
      supprimer: 'Supprimer ce traitement',
      supprimerQuestion: 'Supprimer ce traitement ?',
      supprimerMessage: 'Il disparaît, avec ses délais d’attente. Les fichiers joints sont effacés.',
      dateInvalide: 'La dernière prise ne peut pas précéder le premier jour.',
    },
    /** Sur la fiche d'un animal. */
    fiche: {
      titre: 'Traitements',
      aucun: 'Aucun traitement.',
      laitJusquau: (fin: string) => `Lait : en délai d’attente jusqu’au ${fin} inclus`,
      viandeJusquau: (fin: string) => `Viande : en délai d’attente jusqu’au ${fin} inclus`,
      voirTout: 'Tous les traitements',
    },
    /** Les avertissements des ventes. */
    avertissement: {
      titre: 'Délai d’attente',
      lait: (nombre: number, fin: string) =>
        `${nombre} ${nombre > 1 ? 'femelles sont' : 'femelle est'} en délai d’attente pour le lait jusqu’au ${fin} inclus : leur lait ne doit pas être livré.`,
      viande: (boucles: string, fin: string) =>
        `En délai d’attente pour la viande jusqu’au ${fin} inclus : ${boucles}. Ne pas vendre ni abattre avant.`,
      voir: 'Voir les traitements',
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
  },
  ficheChevre: {
    menu: 'Menu de la fiche',
    get chevreIntrouvable() {
      return `${Cap(V().femelle.singulier)} introuvable.`;
    },
    le: 'le',
    /** La section Santé de la fiche : les visites vétérinaires et les contrôles de l'animal. */
    sante: {
      titre: (nombre: number) => `Santé (${nombre})`,
      aucun: (animal: string) => `Aucune visite vétérinaire ni aucun contrôle enregistré pour ${animal}.`,
      visite: 'Visite',
      controle: 'Contrôle',
      rapportEssais: (numero?: string) => (numero ? `Rapport d’essais n° ${numero}` : 'Rapport d’essais'),
    },
    get ajouterUnCabri() {
      return `Ajouter un ${V().petit.singulier}`;
    },
    nDeBoucleDeuxPoints: 'N° de boucle : ',
    dateDeBouclageDeuxPoints: 'Date de bouclage : ',
    /** La boucle rouge et le rebouclage n'ont pas de numéro : seulement la date. */
    dateBouclageRouge: 'Date bouclage (boucle rouge)',
    /** Les libellés courts du formulaire, où les trois dates de pose sont côte à côte. */
    dateBoucleRougeCourt: 'Boucle rouge',
    dateRebouclageCourt: 'Rebouclage',
    dateBouclageRougeDeuxPoints: 'Date bouclage (boucle rouge) : ',
    dateRebouclage: 'Date rebouclage (boucle de rebouclage)',
    dateRebouclageDeuxPoints: 'Date rebouclage (boucle de rebouclage) : ',
    sexeDeuxPoints: 'Sexe : ',
    dateDeSortie: 'Date de sortie',
    enregistrerLaDate: 'Enregistrer la date',
    poids: 'Poids (kg)',
    poidsAbattoir: 'Poids donné par l’abattoir (kg)',
    poidsAide: 'Facultatif : par exemple le poids de carcasse donné par l’abattoir. Il s’écrit dans le carnet de mise bas.',
    poidsDeuxPoints: 'Poids : ',
    poidsKg: (poids: number) => `${String(poids).replace('.', ',')} kg`,
    dateDeNaissanceDeuxPoints: 'Date de naissance : ',
    nDeBoucleDeLaDeuxPoints: 'N° de boucle de la mère :',
    notesDeuxPoints: 'Notes : ',
    leEspace: 'le ',
    /** Règle d'or : tout tiptag de cabri est destiné à l'abattoir. */
    destineAAbattoir: 'Destiné à l’abattoir',
    tiptagAbattoir: 'Tiptag : ce cabri est destiné à l’abattoir.',
    /** Les onglets de la fiche d'un animal. */
    onglets: {
      fiche: 'Fiche',
      sante: 'Santé',
      suivi: 'Reproduction',
    },
    aucuneDescendance: 'Aucune descendance enregistrée.',
    ascendance: 'Ascendance',
    mereHorsCheptel: 'Cette mère n’est pas dans le cheptel.',
    pereHorsCheptel: 'Ce père n’est pas dans le cheptel.',
    parentInconnu: 'Aucune / inconnue',
    choisirLaMere: 'Choisir la mère',
    choisirLePere: 'Choisir le père',
    retirerLeParent: 'Retirer',
    declarerDeuxPoints: 'Déclarer : ',
    remettreDansLeCheptelActif: 'Remettre dans le cheptel actif',
    /** La carte de sortie d'un animal sorti : date et retour au cheptel actif, verrouillés d'office. */
    sortie: {
      titreAvecDate: (statut: string, date: string) => `${statut} le ${date}`,
      voirLaFacture: (facture: string) => `Facture du client : ${facture}`,
      figee: 'Cet animal est dans un lot d’abattoir vendu : sa sortie est figée. Pour la modifier, supprimez d’abord la facture du client.',
      deverrouiller: 'Déverrouiller pour modifier',
      verrouiller: 'Verrouiller',
      aideVerrou: 'Verrouillé pour éviter les erreurs : le cadenas permet de corriger la date de sortie ou de remettre l’animal dans le cheptel actif.',
    },
    reactivationQuestion: 'Remettre cet animal dans le cheptel actif ?',
    reactivationMessage: (statut: string) =>
      `Voulez-vous vraiment remettre cet animal dans le cheptel actif ? Il n’aura plus de date de sortie (statut « ${statut} »). Si vous vouliez seulement corriger la date de sortie ou de décès, annulez et modifiez-la dans « Date de sortie ».`,
    descendance: 'Descendance',
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
  /** Le document de suivi des mouvements des brebis et/ou chèvres du dossier PAC, créé depuis le cheptel. */
  suiviMouvements: {
    bouton: 'Documents du dossier PAC',
    fenetreTitre: 'Documents du dossier PAC',
    fenetreAide:
      'Les documents de la campagne de Corse (aide aux petits ruminants), remplis d’après le cheptel : choisissez l’année, puis le document.',
    titre: 'Document de suivi des mouvements',
    aide: 'Le document du dossier PAC (campagne de Corse) : les naissances, changements de catégorie, ventes et morts de l’année, remplis d’après le cheptel, avec les effectifs au 1er janvier et en fin de page.',
    annee: 'Année',
    toutesLesAnnees: 'Toutes les années',
    generer: 'Générer le PDF',
    genererSuivi: 'Suivi des mouvements (PDF)',
    genererBordereaux: 'Bordereaux de perte (PDF)',
    /** Les lignes du dossier PAC : un appui génère le document. */
    lignes: {
      suivi: { titre: 'Suivi des mouvements', aide: 'Naissances, ventes et morts de la période, avec les effectifs.' },
      bordereaux: { titre: 'Bordereaux de perte', aide: 'Un bordereau par jour où des animaux sont morts.' },
      recensement: { aide: (annee: number) => `Effectifs au 1er janvier ${annee + 1} et naissances de ${annee}.` },
      estive: { aide: 'La déclaration de transhumance, à remplir.' },
      voirDetail: (annee: number) => `Comment le recensement ${annee} est calculé`,
      masquerDetail: 'Masquer le détail',
    },
    aucunePerte: 'Aucune chèvre morte sur cette période : aucun bordereau de perte à remplir.',
    aideBordereaux:
      'Un bordereau de perte par jour où des animaux sont morts (petits et boucs compris) : tous comptent comme perdus (mortalité). Le remplacement et la signature restent à remplir.',
    aucunAnimal: 'Aucun animal enregistré : rien à reporter.',
    pasPourCetteEspece: 'Ce document concerne les brebis et les chèvres.',
    /** Ce qui s'écrit dans la colonne « Nom de l'acheteur ou du vendeur » quand la vente n'en donne pas. */
    abattoir: 'Abattoir',
    autoConsommation: 'Autoconsommation',
    /** Le recensement annuel des ovins et caprins de la Chambre d'agriculture (règlement CE 21/2004). */
    recensement: {
      bouton: 'Recensement annuel (PDF)',
      aide: (annee: number) =>
        `Pour ${annee} : le recensement ${annee + 1}, avec les effectifs au 1er janvier ${annee + 1} (les animaux nés avant ${annee}) et les naissances du 1er janvier au 31 décembre ${annee} (sans les petits sans boucle, sauf les auto-consommés ; morts sur l’exploitation compris), calculés d’après le cheptel.`,
      fichier: 'recensement',
      /** Pourquoi le chiffre diffère du bilan annuel (qui compte tous les petits nés) : ceux sans boucle et ceux morts ne comptent pas au recensement. */
      detailNes: (annee: number, total: number, sansBoucle: number, morts: number, nes: number) =>
        `Nés en ${annee} : ${total} au total, dont ${sansBoucle} sans boucle (hors auto-consommés) qui ne comptent pas : ${nes} au recensement (dont ${morts} mort${morts > 1 ? 's' : ''} sur l’exploitation, comme le demande le formulaire).`,
      titre: (annee: number) => `RECENSEMENT ANNUEL OVINS ET CAPRINS ${annee}`,
      monsieur: 'Mr',
      chambre: ['CHAMBRE D’AGRICULTURE', 'DE RÉGION CORSE'],
      chambreAdresse: ['CHAMBRE D’AGRICULTURE DE RÉGION CORSE', 'Route du Stade, Lieu-dit PETRAOLO', '20215 VESCOVATO'],
      mention: (annee: number) =>
        `Le règlement (CE) n° 21/2004 prévoit le recensement annuel des animaux présents dans les exploitations d’élevage et les centres d’engraissement. Tout détenteur d’ovins ou/et caprins a obligation de transmettre ses données. Ce document est à retourner dès sa réception, au plus tard avant le 31/01/${annee}.`,
      typeDeProduction: 'Veuillez préciser le type de production :',
      lait: 'Lait',
      viande: 'Viande',
      cheptel: 'CHEPTEL :',
      effectifsOvins: 'EFFECTIFS OVINS',
      effectifsCaprins: 'EFFECTIFS CAPRINS',
      ligne1: (annee: number) => `Nombre d’animaux (mâles et femelles) âgés de + de 6 mois au 01/01/${annee}`,
      ligne2: (anneeAvant: number) =>
        `Nombre d’animaux nés (animaux encore présents + animaux vendus + animaux morts sur l’exploitation + animaux autoconsommés) entre le 01/01/${anneeAvant} et le 31/12/${anneeAvant}`,
      ligne3: (anneeAvant: number) =>
        `Nombre d’animaux nés sur une autre exploitation et engraissés sur l’exploitation au cours de l’année ${anneeAvant}`,
      femelles: (nombre: number) => `${nombre} femelle${nombre > 1 ? 's' : ''}`,
      males: (nombre: number, caprins: boolean) =>
        caprins ? `${nombre} bouc${nombre > 1 ? 's' : ''}` : `${nombre} bélier${nombre > 1 ? 's' : ''}`,
      cessation: 'Si vous ne détenez plus d’animaux, merci de prendre contact avec l’ERE pour enregistrer votre cessation d’activité.',
      date: 'DATE :',
      signature: 'SIGNATURE :',
      conserver: 'EXEMPLAIRE À CONSERVER DANS VOTRE REGISTRE D’ÉLEVAGE',
    },
    /** La déclaration de montée et descente d'estive (la transhumance), à renvoyer à la DDT(M). */
    estive: {
      bouton: 'Déclaration d’estive (transhumance)…',
      fenetreTitre: 'Déclaration de montée et descente d’estive',
      fenetreAide:
        'À remplir par le gestionnaire de l’estive. Votre ligne est remplie d’après votre exploitation : vos numéros, et les caprins de plus d’un an ou chèvres ayant mis bas au jour de la montée.',
      annee: 'Campagne',
      dateMontee: 'Date de montée à l’estive',
      dateDescente: 'Date de descente de l’estive',
      aideDates: 'Prévisionnelles si l’estive n’est pas terminée. Laissez la descente vide si elle n’a pas eu lieu.',
      zone: 'Zone d’estive (observations)',
      zoneExemple: 'ex : haute montagne, Cinto',
      gestionnaire: 'Nom du gestionnaire de l’estive',
      communeGestionnaire: 'Commune du siège de l’entité collective',
      effectif: (nombre: number, date: string) =>
        `${nombre} caprin(s) de plus d’un an ou chèvre(s) ayant mis bas au ${date}.`,
      effectifAujourdhui: '(sans date de montée : le cheptel d’aujourd’hui)',
      moiGestionnaire: 'Je suis moi-même le gestionnaire de l’estive',
      aideMoiGestionnaire:
        'Coché, vos numéros (Pacage, SIRET) et la commune de votre exploitation remplissent le cadre de l’entité collective.',
      generer: 'Générer la déclaration (PDF)',
      titre: 'Déclaration d’estive',
      direction: ['Direction départementale des territoires', 'Direction départementale des territoires et de la mer'],
      dossierPac: 'Dossier PAC',
      campagne: (annee: number) => `campagne ${annee}`,
      titreFormulaire: 'Déclaration de montée et descente d’estive',
      aCompleter: 'À compléter par le gestionnaire d’estive',
      aRenvoyer: 'et à renvoyer à la DDT(M) dès que possible',
      auPlusTard: (date: string) => `et ${date}`,
      auPlusTardSansDate: 'avant la date limite fixée par la DDT(M)',
      entiteCollective: 'Identification de l’entité collective',
      nPacage: 'N° Pacage',
      nSiret: 'N° Siret',
      communeSiege: 'Commune du siège de l’entité collective :',
      nomGestionnaire: 'Nom du gestionnaire de l’entité collective :',
      identificationUtilisateurs: 'Identification des utilisateurs',
      bovins: 'Bovins',
      ovins: 'Ovins',
      caprins: 'Caprins',
      equins: 'Équins',
      autres: 'Autres',
      precisez: 'Précisez :',
      dates: 'Dates',
      observations: 'Observations',
      observationsAide: ['Précisez en particulier la zone', 'en cas d’estive multizones :', 'haute montagne, montagne …'],
      nPacageUtilisateur: ['N° Pacage', 'de l’utilisateur'],
      nomRaisonSociale: 'Nom / raison sociale',
      prenom: 'Prénom',
      numeroCheptel: 'Numéro de cheptel',
      siegeExploitation: 'Siège de l’exploitation',
      codePostal: 'Code postal',
      commune: 'Commune',
      bovinsMoins6: ['Bovins', 'de –', 'de', '6 mois', '(MAEC)'],
      bovins6a2: ['Bovins', 'de', '6 mois', 'à', '2 ans'],
      bovinsPlus2: ['Bovins', 'de', '+ de', '2 ans'],
      ovinsColonne: ['Ovins', 'de plus', 'd’1 an', 'ou', 'brebis', 'ayant', 'mis bas'],
      caprinsColonne: ['Caprins', 'de + d’1 an', 'ou', 'chèvre', 'ayant mis', 'bas'],
      equidesColonne: ['Équidés', 'de +', 'de', '6 mois'],
      montee: ['Date de', 'MONTÉE', 'à l’estive', '(JJ/MM)'],
      descente: ['Date de', 'DESCENTE', 'de l’estive*', '(JJ/MM)'],
      notesBasGauche: [
        'Les informations relatives aux mouvements des animaux vers les estives sont',
        'nécessaires pour répartir la surface d’estive entre les différents utilisateurs.',
        'Cette surface est utilisée pour :',
        '– la gestion de la demande MAEC de l’estive ou de ses utilisateurs ;',
        '– la gestion de la demande ICHN des utilisateurs de l’estive ;',
        '– l’activation des DPB des utilisateurs de l’estive ;',
      ],
      notesBasMilieu: [
        '– le calcul du taux de chargement pour l’admissibilité des surfaces pastorales',
        'avec des ressources fourragères ligneuses prédominantes (SPL) et des',
        'surfaces de chênaies et châtaigneraies entretenues par des petits ruminants',
        '(CAE/CEE).',
      ],
      noteDates: '* Date effective ou prévisionnelle.',
      signatureA: 'À :',
      signatureLe: ', le',
      signatureTexte: 'Signature du gestionnaire de l’estive',
    },
    /** Le texte du bordereau de perte de l'aide aux petits ruminants. */
    bordereauPerte: {
      direction: 'Direction départementale des territoires',
      campagne: (annee: number) => `campagne ${annee}`,
      titre: 'Bordereau de perte',
      sousTitre: 'Aide aux petits ruminants (APR) • Corse',
      attention: 'ATTENTION',
      attentionTexte:
        ' : Le remplacement d’un animal ne peut se faire que par une femelle de la même espèce.',
      ministere: ['MINISTÈRE', 'DE L’AGRICULTURE', 'ET DE LA SOUVERAINETÉ', 'ALIMENTAIRE'],
      devise: ['Liberté', 'Égalité', 'Fraternité'],
      financeParLEurope: ['Financé', 'par l’Union européenne'],
      important: 'IMPORTANT',
      importantAvant: ' : les explications pour remplir le ',
      importantBordereau: 'Bordereau de perte',
      importantMilieu:
        ' sont détaillées dans la notice disponible sur telepac ou auprès de la DDT. Les justificatifs de perte doivent être conservés sur l’exploitation. Si vous estimez que la perte peut bénéficier d’une dérogation pour ',
      importantForceMajeure: 'force majeure ou circonstance naturelle',
      importantFin:
        ', vous devez compléter cette déclaration par l’envoi d’un courrier à votre DDT, où vous formulez votre demande de dérogation et apportez les justifications utiles.',
      nPacage: 'N° Pacage',
      nSiret: 'N° Siret',
      nom: 'Nom, prénom ou dénomination sociale :',
      declareAvoirPerdu: 'Je déclare avoir perdu',
      brebisEtOu: 'brebis et/ou',
      chevresEffectif: 'chèvre(s) de mon effectif engagé pour l’aide aux petits ruminants.',
      perteIntervenueLe: 'Cette perte est intervenue le',
      motifSuivant: 'pour le motif suivant :',
      motifs: {
        vente: 'vente',
        abattage: 'abattage sanitaire',
        accident: 'accident',
        mortalite: 'mortalité',
        autre: 'autre (précisez) :',
      },
      parAilleurs: 'Par ailleurs, je déclare :',
      remplacementBrebis: 'avoir remplacé les pertes de brebis par',
      brebisEtOuPar: 'brebis et/ou par',
      agnelles: 'agnelles.',
      remplacementChevres: 'avoir remplacé les pertes de chèvres par',
      chevresEtOuPar: 'chèvre(s) et/ou par',
      chevrettes: 'chevrette(s).',
      remplacementLe: 'Ce remplacement a été réalisé le',
      commentaires: 'Commentaires :',
      a: 'À :',
      le: 'le',
      signature:
        'Signature de l’exploitant, ou du représentant légal en cas de forme sociétaire autre que GAEC, ou de l’associé ayant reçu délégation de signature électronique par les associés en cas de GAEC :',
    },
    /** Le texte du formulaire. */
    formulaire: {
      dossier: 'Dossier PAC',
      campagne: (annee: number) => `campagne ${annee}`,
      titre: 'Corse • Document de suivi des mouvements des brebis et/ou chèvres',
      identification: 'Identification',
      nPacage: 'N° Pacage :',
      nSiret: 'N° Siret :',
      nExploitation: 'N°d’exploitation :',
      nomPrenom: 'Nom et prénom (ou dénomination pour les sociétés) :',
      page: 'Page',
      categories: 'CATÉGORIES',
      effectifsAu: 'EFFECTIFS au',
      premierJanvier: (annee: number) => `1er janvier ${annee}`,
      dateDuMouvement: 'Date du mouvement',
      jeunes: 'JEUNES',
      jeunesPrecision: '(moins de 12 mois)',
      brebis: 'BREBIS éligibles à l’aide',
      chevres: 'CHÈVRES éligibles à l’aide',
      beliersBoucs: 'BÉLIERS ou BOUCS',
      nombreEntrees: 'Nombre d’entrées',
      nombreSorties: 'Nombre de sorties',
      causes: 'CAUSES d’ENTRÉES',
      causesOu: 'ou de',
      causesSorties: 'SORTIES',
      causesLot: 'du lot',
      nExploitationColonne: 'N° D’EXPLOITATION',
      nomAcheteur: 'NOM de l’ACHETEUR',
      nomVendeur: 'ou du VENDEUR',
      sousTotaux: 'Sous totaux',
      effectifsDe: 'EFFECTIFS',
      effectifsAuDate: 'au',
      notes: {
        jeunes:
          'Jeunes : agneaux ou chevreaux de moins de 12 mois et agnelles ou chevrettes de moins de 12 mois ou n’ayant pas mis bas.',
        nombre: 'Nombre d’entrées et nombre de sorties : nombre d’animaux constituant le lot.',
        eligibles: (annee: number) =>
          `Brebis et/ou chèvres éligibles : brebis et/ou chèvres de plus d’un an ou ayant mis bas à la date considérée ou agnelles et/ou chevrettes éligibles (en cas de remplacement des brebis/chèvres éligibles par des agnelles/chevrettes éligibles identifiées au plus tard le 31 décembre ${annee - 1}).`,
        causesEntree:
          'Causes d’entrée : N = naissance • A = achat • C = changement de catégorie • P = prise en pension.',
        causesSortie:
          'Causes de sortie : M = mort • V = vente • P = mise en pension • C = changement de catégorie • AU = autres cas (à préciser).',
        nExploitation: 'N° d’exploitation : N° de l’exploitation de provenance ou de destination.',
        effectif:
          'Effectif = effectif de départ + entrées – sorties. L’effectif est à reporter sur la page suivante.',
      },
    },
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
    /** Où en sont aujourd'hui les petits des naissances montrées : vivants, vendus, à l'abattoir, auto-consommés, morts. */
    repartition: (r: { vivants: number; vendus: number; abattoir: number; autoconsommes: number; morts: number }) =>
      [
        [r.vivants, r.vivants > 1 ? 'vivants' : 'vivant'],
        [r.vendus, r.vendus > 1 ? 'vendus' : 'vendu'],
        [r.abattoir, 'à l’abattoir'],
        [r.autoconsommes, r.autoconsommes > 1 ? 'auto-consommés' : 'auto-consommé'],
        [r.morts, r.morts > 1 ? 'morts' : 'mort'],
      ]
        .filter(([n]) => (n as number) > 0)
        .map(([n, libelle]) => `${n} ${libelle}`)
        .join(' · '),
    bilan: (naissances: number, meres: number) =>
      `${naissances} naissance${naissances > 1 ? 's' : ''} · ${meres} mère${meres > 1 ? 's' : ''}`,
    aucuneNaissanceEnregistree: 'Aucune naissance enregistrée',
    declarezUneNaissanceDepuisL: "Déclarez une naissance depuis l'onglet Cheptel.",
    mereEspace: 'Mère ',
    get cabri() {
      return V().petit.singulier;
    },
    naissanceNotes: (notes: string) => `Naissance: ${notes}`,
    sansBoucleSexe: (sexe: unknown) => `sans boucle (${sexe})`,
    /** Le carnet de mise bas imprimable. */
    carnetBouton: 'Carnet de mise bas (PDF)',
    carnetLivretBouton: 'Carnet à imprimer (livret à plier)',
    carnetLivretAide: 'À imprimer en A4 portrait, recto verso (retourner sur le bord long), puis à couper en deux et à plier : un livret A6, comme le carnet papier.',
    carnet: {
      titre: 'Carnet de mise bas',
      fichier: 'carnet_mise_bas',
      fichierLivret: 'carnet_mise_bas_livret',
      aucune: 'Aucune mise bas enregistrée.',
      inconnue: 'inconnue',
      donnees: 'Mes données personnelles',
      nom: 'NOM',
      prenom: 'PRÉNOM',
      adresse: 'ADRESSE',
      tel: 'Tél',
      exploitation: 'Numéro d’exploitation',
      siret: 'Numéro Siret',
      coordonnees: 'Coordonnées utiles',
      groupement: 'Groupement et Technicien',
      veterinaire: 'Vétérinaire',
      veterinaireSanitaire: 'Vétérinaire sanitaire',
      inseminateur: 'Inséminateur',
      // Les observations s'écrivent en une lettre, comme sur le carnet papier (R, A…) ; la légende est sous le tableau.
      renouvellement: 'R',
      poidsKg: (poids: number) => `${String(poids).replace('.', ',')} kg`,
      jours: (n: number) => `${n} j`,
      mois: (n: number) => `${n} mois`,
      statuts: {
        mortNe: 'MN',
        vendue: 'V',
        abattoir: 'A',
        autoconsommee: 'C',
      },
      legende: 'R : renouvellement · A : abattoir · V : vendu · C : consommé · MN : mort-né',
      colonnes: {
        date: 'Date',
        numero: (petit: string) => `N° ${petit}`,
        mere: 'N° mère',
        pere: 'N° père',
        sexe: 'Sexe',
        observations: 'Observations',
        age: 'Âge départ / mort',
        poids: 'Poids départ',
      },
      resultats: {
        titre: 'Résultats de production',
        taux: 'Calculs des taux',
        misesALaReproduction: (femelles: string) => `Nombre de ${femelles} mises à la reproduction`,
        avorte: (femelles: string) => `Nombre de ${femelles} ayant avorté`,
        misBas: (femelles: string) => `Nombre de ${femelles} ayant mis bas`,
        nes: (petits: string) => `Nombre de ${petits} nés`,
        morts: (petits: string) => `Nombre de ${petits} morts`,
        vivants: (petits: string) => `Nombre de ${petits} vivants`,
        simples: 'Simples',
        doubles: 'Doubles',
        triples: 'Triples et plus',
        naissance: 'Naissance',
        premiereSemaine: '1° semaine',
        avantSevrage: 'Avant sevrage',
        avantDepart: 'Avant départ',
        total: 'Total',
        fertilite: 'Taux de fertilité',
        prolificite: 'Taux de prolificité',
        productivite: 'Taux de productivité',
        mortalite: 'Taux de mortalité',
        formuleFertilite: (femelles: string) => `${Cap(femelles)} ayant mis bas / ${femelles} mises à la reproduction`,
        formuleProlificite: (petits: string, femelles: string) => `${Cap(petits)} nés / ${femelles} ayant mis bas`,
        formuleProductivite: (petits: string, femelles: string) =>
          `${Cap(petits)} vendus + ${petits} gardés reproducteurs / ${femelles} mises à la reproduction`,
        formuleMortalite: (petits: string) => `${Cap(petits)} morts / ${petits} nés`,
        aCompleter: (femelles: string) =>
          `Les ${femelles} mises à la reproduction sont celles du lot de mise à la reproduction de l’année (Lots d’animaux) : les femelles qui ont mis bas et toutes celles à leur majorité sexuelle (6 mois) et vivantes à la date d’une mise bas de l’année. Le nombre de ${femelles} ayant avorté est celui du lot « Avortements » de l’année (Lots d’animaux, ou le bouton de la fiche de l’animal) ; sans lot, à écrire à la main.`,
      },
    },
  },
  /** Le document de circulation des animaux vendus vivants (sur pied, vivants, petits de boucherie), rempli pour exemple d'après la vente. */
  circulation: {
    bouton: 'Générer le document de circulation',
    /** Le nom court du bouton de l'en-tête (la place manque sur téléphone). */
    boutonEntete: 'Document de circulation',
    /** L'écran des documents à déposer (Dossier PAC › Documents de circulation). */
    titreEcran: 'Documents de circulation',
    ligneDossier: 'Documents de circulation',
    aideDossier: 'Obligatoire lors du transport d’animaux vivants : à déposer pour chaque vente ou achat.',
    aideEcran: 'Les ventes et les dépenses d’animaux vivants : déposez le document de circulation rempli (scan ou photo), ou générez le modèle pré-rempli.',
    rechercher: 'Rechercher un contact, une facture, un montant…',
    ecritures: (n: number) => `Écritures (${n})`,
    aucune: 'Aucune vente ni dépense d’animaux vivants pour ces critères.',
    manquant: 'Document manquant',
    ajoute: (date: string, heure: string) => `Document ajouté le ${date} à ${heure}`,
    toutesLesAnnees: 'Toutes',
    deposer: 'Déposer mon document',
    remplacer: 'Remplacer mon document',
    ouvrir: 'Ouvrir mon document',
    retirer: 'Retirer mon document',
    modele: 'Générer le modèle pré-rempli',
    ouvrirEcriture: 'Voir l’écriture',
    fichiersIndisponibles: 'Les fichiers joints ne sont pas disponibles sur le web.',
    fichierIntrouvable: 'Ce fichier n’est plus sur cet appareil : déposez-le de nouveau.',
    nManquants: (n: number) => `${n} ${n > 1 ? 'documents de circulation manquants' : 'document de circulation manquant'}`,
    rappelDetail: 'À déposer : obligatoire lors du transport d’animaux vivants.',
    boutonAbattoir: 'Document de circulation vers l’abattoir',
    aide: 'Pré-rempli d’après la vente, pour exemple : à recopier sur la liasse officielle de la Chambre d’agriculture.',
    fichier: 'document_circulation',
    exemple: 'EXEMPLE',
    bandeauCourt: 'POUR EXEMPLE : à recopier sur la liasse officielle (voir le rappel des feuillets en page 2)',
    suiteNumeros: 'Autres numéros individuels (ils ne tiennent pas dans le tableau du formulaire)',
    bandeau: 'Pour exemple : ce document est pré-rempli d’après la vente. Recopiez-le sur la liasse officielle de 5 feuillets de la Chambre d’agriculture.',
    titre: 'Document de circulation',
    sousTitre: 'Feuillet à conserver par le détenteur de départ',
    folio: 'N° Folio',
    transporteur: 'Nom transporteur',
    numeroTransporteur: 'N° transporteur',
    vehicule: 'N° Véhicule',
    chargement: 'CHARGEMENT (date et heure)',
    dechargement: 'DÉCHARGEMENT (date et heure)',
    depart: 'DÉPART',
    arrivee: 'ARRIVÉE',
    lieux: {
      elevage: 'Élevage',
      operateur: 'Op. commercial',
      centre: 'Centre de rassemblement',
      marche: 'Marché',
      abattoir: 'Abattoir',
      particulier: 'Particulier',
    },
    numeroExploitation: 'N° Exploitation',
    siren: 'N° SIREN',
    detenteur: 'Détenteur, raison sociale ou nom prénom',
    adresse: 'Adresse',
    codePostal: 'Code postal',
    commune: 'Commune',
    boucherie: 'Agneaux / chevreaux de boucherie',
    reproducteurs: 'Reproducteurs et réformes',
    ovins: 'Nombre d’ovins',
    caprins: 'Nombre de caprins',
    aCompleter: 'INFORMATIONS À COMPLÉTER OBLIGATOIREMENT',
    titreBoucherie: 'AGNEAUX / CHEVREAUX DE BOUCHERIE : indicatif(s) de marquage des animaux du lot et nombre d’animaux par indicatif',
    titreReproducteurs: 'REPRODUCTEURS ET RÉFORMES : numéros individuels des animaux (indicatif de marquage + numéro d’ordre)',
    indicatif: 'Indicatif de marquage',
    /** Les informations sanitaires du formulaire : l'engagement sur les délais d'attente, et la mention utile (la chaîne alimentaire). */
    sanitaire: {
      titre: 'INFORMATIONS SANITAIRES (cocher la mention utile)',
      engagement: 'Le détenteur de départ s’engage à ne pas envoyer d’animaux à l’abattoir sous délai d’attente de traitement médicamenteux.',
      aucunRisque: 'Atteste que ces animaux ne présentent aucun risque nécessitant la transmission d’informations sur la chaîne alimentaire.',
      risque: 'Informe que des animaux présentent un risque nécessitant la transmission d’informations sur la chaîne alimentaire (fournir obligatoirement le document dédié à l’information sur la chaîne alimentaire au détenteur d’arrivée).',
      sousDelai: 'Sous délai d’attente pour la viande :',
      jusquau: 'jusqu’au',
    },
    attestation: 'Je soussigné, détenteur de départ, atteste que les informations sont exactes. La signature est obligatoire.',
    detenteurArrivee: 'Détenteur d’arrivée : j’atteste que les informations sont exactes.',
    dateSignature: 'Date et signature :',
    rappelTitre: 'Les feuillets de la liasse : à qui les remettre',
    feuillets: {
      blanc: 'Blanc : à garder (détenteur de départ)',
      vert: 'Vert : au détenteur d’arrivée',
      bleu: 'Bleu : au détenteur d’arrivée (2 feuillets pour lui, vert et bleu)',
      rose: 'Rose : pour la Chambre d’agriculture (EDE)',
      jaune: 'Jaune : pour le transporteur',
    },
    rappelNote: 'Les couleurs sont données de mémoire : vérifiez-les sur votre liasse. Le détenteur d’arrivée reçoit 2 feuillets (vert et bleu), la Chambre 1 (rose), le transporteur 1 (jaune), et vous gardez le blanc.',
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
  /** La réservation d'un animal pour un client (bon de commande ou promesse). */
  reservation: {
    pour: (client: string) => `Réservé pour ${client}`,
    reserver: 'Réserver pour un client',
    ecriture: 'Écriture comptable sans facture pour un client',
    ecriturePour: (client: string) => `Écriture sans facture pour ${client}`,
    liberer: 'Libérer la réservation',
    validerEtVendre: 'Valider la préparation de commande et vendre',
    reservationDe: (client: string) => `Réservation ${client}`,
    vendusDuBon: 'Animaux vendus par cette commande',
    indiquerLePoids: 'Indiquer le poids de l’animal',
    ok: 'OK',
    etatTitre: 'Ces cabris seront remis…',
    etatPlusTard: 'Pas encore décidé',
    remis: { vivants: 'Remis vivants', morts: 'Remis morts' },
    ouvrirLaFiche: 'Ouvrir la fiche',
    choisirClient: 'Pour quel client particulier ?',
    aucunClient: 'Aucun client enregistré : ajoutez-en un d’abord.',
    section: 'Animaux réservés',
    aucun: 'Aucun animal réservé pour cette commande.',
    reserverDesAnimaux: 'Réserver des animaux',
    titreChoix: 'Animaux à réserver',
    valider: (n: number) => `Réserver ${n} animal${n > 1 ? 'aux' : ''}`.replace('animalaux', 'animaux'),
    retirer: 'Retirer',
  },
  nouvelleNaissance: {
    /** Le titre de l'écran quand la mère est connue (on arrive de sa fiche). */
    titrePour: (boucle: string) => `Déclarer une naissance pour ${boucle}`,
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
  /** Cheptel › Réglages › Mettre à jour le cheptel. */
  miseAJour: {
    titre: 'Mettre à jour le cheptel',
    aide: 'Remet dans le cheptel des animaux « vendus » ou « à l’abattoir » que plus aucune vente ne porte (une facture supprimée, par exemple). Vous choisissez ceux à remettre vivants.',
    bouton: 'Mettre à jour les animaux présents',
    choisir: 'Animaux à remettre dans le cheptel',
    remettre: (n: number) => `Remettre ${n} animal${n > 1 ? 'aux' : ''}`.replace('animalaux', 'animaux'),
    aucun: 'Rien à mettre à jour : tous les animaux vendus ou à l’abattoir ont leur vente.',
    remis: (n: number) => `${n} animal${n > 1 ? 'aux' : ''} remis vivant${n > 1 ? 's' : ''} dans le cheptel.`.replace('animalaux', 'animaux'),
  },
  chevreLabel: {
    nomSansBoucle: (nom: string) => `${nom} (sans boucle)`,
    /** Un animal sans boucle ni nom : son type, et rien d'autre (sa naissance et sa sortie sont sur la ligne du dessous). */
    typeSansBoucle: (type: string) => `${type} sans boucle`,
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
