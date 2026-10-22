/** Textes de l'interface — inventaire (stock) de l'exploitation. À modifier ici uniquement. */
export const TEXTES_STOCK = {
  titre: 'Inventaire',
  /** Les catégories de l'inventaire, comme l'organisation comptable. */
  categories: {
    titre: 'Catégorie',
    produitsFinis: 'Produits finis',
    produitsAnimaux: 'Produits animaux',
    matieresPremieres: 'Matières premières',
    autresApprovisionnements: 'Autres approvisionnements',
    marchandises: 'Marchandises',
    immobilisations: 'Immobilisations',
  },
  /** La structure des listes : ajouter des listes aux catégories, chacune avec un compte du plan comptable. */
  structure: {
    titre: 'Structure des listes',
    aide: 'Ajoutez une liste à une catégorie. Elle correspond impérativement à un compte du plan comptable : seuls les comptes autorisés par la catégorie sont proposés.',
    comptesAutorises: (prefixes: string) => `Comptes de 6 chiffres commençant par ${prefixes}`,
    ajouterListe: 'Ajouter une liste',
    ajouterCategorie: 'Ajouter une catégorie',
    modifierCategorie: 'Modifier la catégorie',
    supprimerCategorie: 'Supprimer cette catégorie',
    supprimerCategorieTitre: 'Supprimer cette catégorie ?',
    supprimerCategorieMessage: (nom: string) =>
      `« ${nom} » disparaît avec toutes ses listes et leurs articles (aucun mouvement n’y est enregistré), et leurs comptes du plan comptable quand aucune autre liste ne les utilise.`,
    /** Dans le stock : une catégorie ajoutée qui n'a encore aucune liste. */
    categorieVide: 'Aucune liste : ajoutez-en une depuis « Structure des listes ».',
    categorie: {
      nom: 'Nom de la catégorie',
      exempleNom: 'ex : Produits transformés',
      classe: 'Numéro de classe (2 chiffres)',
      exempleClasse: 'ex : 36',
      comptes: 'Comptes autorisés (débuts de compte)',
      exempleComptes: 'ex : 701, 706',
      aideComptes:
        'Les listes de cette catégorie ne pourront avoir qu’un compte de 6 chiffres commençant par l’un de ces nombres (de 2 à 6 chiffres, séparés par des virgules).',
      erreurs: {
        nom: 'Donnez un nom à la catégorie.',
        classe: 'Le numéro de classe a 2 chiffres.',
        classeUtilisee: 'Cette classe est déjà prise par une autre catégorie.',
        comptes: 'Indiquez au moins un début de compte de 2 à 6 chiffres (ex : 701).',
      },
    },
    exempleNomListe: 'ex : Laine brute',
    compte: 'Compte du plan comptable',
    aucunCompte:
      'Aucun compte autorisé pour cette catégorie dans votre plan comptable : ajoutez-en un (Comptes PCG).',
    ajouterUnCompte: 'Ajouter un compte',
    listesDOffice: 'Listes d’office',
    supprimerListe: 'Supprimer cette liste',
    supprimerTitre: 'Supprimer cette liste ?',
    supprimerMessage: (nom: string) =>
      `« ${nom} » disparaît avec ses articles (aucun mouvement n’y est enregistré), et son compte du plan comptable avec elle quand aucune autre liste ne l’utilise.`,
    suppressionImpossible: 'Suppression impossible',
    listeAvecMouvements: (nom: string) =>
      `« ${nom} » ne peut pas être supprimée : des mouvements de stock sont enregistrés sur ses articles.`,
    categorieAvecMouvements: (nom: string) =>
      `« ${nom} » ne peut pas être supprimée : des mouvements de stock sont enregistrés sur les articles de ses listes.`,
    supprimerMessageEspece: (nom: string, espece: string) =>
      `« ${nom} » disparaît pour ${espece}, avec ses articles propres (aucun mouvement n’y est enregistré), et son compte du plan comptable avec elle quand aucune autre liste ne l’utilise. Les autres espèces la gardent.`,
    renommer: 'Renommer la liste',
  },
  /** L'impression des mouvements de l'inventaire (PDF) depuis le menu. */
  exporter: {
    titre: 'Inventaire',
    colonnes: {
      date: 'Date',
      article: 'Article',
      mouvement: 'Mouvement',
      origine: 'Origine',
      litres: 'Litres',
    },
    aucunMouvement: 'Aucun mouvement dans cette catégorie.',
    lait: 'Lait (production, fabrications et ventes)',
    aucunLait: 'Aucun litrage ni vente de lait.',
    production: 'production',
    fabrication: 'fabrication de fromage',
    remiseAZero: 'consommation (remise à zéro)',
  },
  /** L'en-tête d'une catégorie : sa classe du plan comptable, puis son nom (« 35. Produits finis »). */
  enteteCategorie: (classe: string, nom: string) => `${classe}. ${nom}`,
  /** « Compte 701200 · Ventes… » : le compte du plan comptable d'une section. */
  compte: (numero: string, libelle: string) => `${numero} · ${libelle}`,
  onglets: {
    fromage: 'Fromage',
    emballages: 'Emballages',
    materiel: 'Matériel',
    conditionnement: 'Conditionnement',
    aliments: 'Aliments',
    fromagerie: 'Fromagerie',
    entretien: 'Entretien',
    lait: 'Lait',
    viande: 'Viande',
  },
  /** La fenêtre de modification d'un article. */
  articleModal: {
    nom: 'Nom',
    prix: 'Prix de vente (€)',
    prixKg: 'Prix de vente (€ le kg)',
    prixLitre: 'Prix de vente (€ le litre)',
    tarifsParCategorie: 'Prix selon la catégorie de contact',
    tarifsAide: 'Un particulier et un professionnel ne paient pas le même prix. Laissé vide : le prix de vente ci-dessus.',
    /** Les litres de lait qu'il faut pour un fromage : sous le prix de vente, dans la fenêtre du fromage. */
    litresFromage: 'Litres de lait par fromage',
    litresBrocciu: 'Litres de lait versés dans le lactosérum par fromage',
    litresInvalide: 'Indiquez un nombre de litres supérieur à 0, ou laissez le champ vide.',
    nomRequis: 'Nom requis',
    prixInvalide: 'Le prix doit être supérieur à zéro.',
    supprimer: 'Supprimer cet article',
    /** Le prix en une ligne : la catégorie (le prix de vente, ou une catégorie de contact) et son prix. */
    categorie: 'Catégorie',
    prixDeVente: 'Prix de vente',
    prixCourt: 'Prix',
    prixParKg: 'Prix (€/kg)',
    /** L'image de la carte : une image de l'appareil à la place du dessin d'origine. */
    image: {
      titre: 'Image',
      choisir: 'Choisir une image',
      changer: 'Changer l’image',
      retirer: 'Revenir au dessin d’origine',
      aide: 'Une photo ou un dessin de votre appareil remplace le dessin de la carte.',
      modifier: 'Modifier l’image',
    },
  },
  /** La confirmation avant de supprimer un article de l'inventaire. */
  /** L'historique d'un article, ouvert d'un appui sur sa carte dans la grange. */
  historiqueArticle: {
    titre: 'Historique',
    aucun: 'Aucun mouvement pour cet article.',
    ouvrirLeStock: 'Ouvrir dans l’inventaire',
    ajuster: 'Quantité',
  },
  suppression: {
    titre: 'Supprimer cet article ?',
    message: (nom: string) => `« ${nom} » disparaît de la liste, avec ses mouvements.`,
    /** Un fromage qui a déjà des mouvements de stock ou des lots ne se supprime pas : son historique en dépend. */
    fromageUtilise: (nom: string) =>
      `« ${nom} » a déjà des mouvements ou des lots dans l’inventaire : il ne peut pas être supprimé.`,
  },
  /** Le lait produit : un litrage par jour (chèvres et brebis). */
  laitJour: {
    ajouter: 'Ajouter du lait',
    modifier: 'Modifier le lait du jour',
    litres: 'Litres de lait',
    date: 'Date',
    litresInvalides: 'Indiquez un nombre de litres supérieur à zéro.',
    aucun: 'Aucun litrage noté : ajoutez celui du jour avec le bouton +.',
    totalDuMois: (mois: string, litres: string) => `${mois} : ${litres} L`,
    ligne: (litres: string) => `${litres} L`,
    supprimer: 'Supprimer ce litrage',
    /** Le nom de la carte du lait. */
    carte: 'Lait',
    prixDuLitre: 'Prix de vente du lait',
    prixLitre: (prix: string) => `${prix} € le litre`,
    prixAFixer: 'À définir',
    modifierLePrix: 'Modifier le prix du lait',
    restant: 'Lait restant',
    produit: 'Produit',
    utilise: 'Utilisé en fromagerie',
    vendu: 'Vendu',
  },
  /** Les boucles d'identification : une ligne par numéro, achetées par plages et posées sur les animaux. */
  boucles: {
    titre: (nom: string) => `Inventaire : ${nom}`,
    titreEtat: 'Boucles',
    /** La première liste de la page Boucles (Cheptel › Boucles) : le stock de boucles, dont l'appui montre le tableau (n°, dates de pose et d'achat, morte). */
    stockDeBoucles: 'Stock de boucles',
    sorte: {
      boucles: 'Boucles',
      rouges: 'Boucles rouges',
      rebouclage: 'Boucles de rebouclage',
      tiptag: 'Tiptag',
    },
    imprimer: 'Imprimer les boucles',
    agrandir: 'Afficher la liste en pleine page',
    reduire: 'Fermer la pleine page',
    etat: { tout: 'Tout', posee: 'Posée', non_posee: 'Non posée' },
    aucuneBoucle: 'Aucune boucle.',
    /** Les titres des colonnes : les dates sur deux lignes, pour tenir dans la largeur. */
    colonnes: { numero: 'N°', pose: 'Date de\npose', achat: 'Date d’\nachat', remarque: 'Remarque' },
    /** Une boucle à remarque non posée : un signe d'interdiction remplace la date de pose (son texte, pour le filtre, le PDF et la lecture vocale). */
    nePasPoser: 'Ne pas poser',
    /** Les premières remarques d'une boucle étaient deux choix fixes, enregistrés sous ces codes : elles s'affichent encore en clair. */
    remarqueAncienne: { en_trop: 'Commandée en trop', jamais_posee: 'Jamais posée' } as Record<string, string>,
    /** Le réglage, par plage de numéros, d'une remarque libre sur des boucles de l'inventaire (une exception). */
    marquer: {
      bouton: 'Marquer des boucles',
      aide: 'Note une remarque libre sur une plage de boucles de l’inventaire (commandées en trop, jamais posées…). Elle s’affiche sous le numéro, dans les listes et à l’impression.',
      titre: 'Marquer des boucles',
      sorte: 'Sorte de boucles',
      remarque: 'Remarque',
      remarqueAide: 'Texte libre. Laissez vide pour retirer la remarque de ces boucles.',
      remarquePlaceholder: 'Ex. : commandées en trop, jamais posées…',
      du: 'Du n°',
      au: 'Au n°',
      valider: 'Marquer',
      fermer: 'Fermer',
      numeroRequis: 'Indiquez le premier et le dernier numéro.',
      aucuneTrouvee: 'Aucune boucle de cette sorte entre ces deux numéros.',
      fait: (nombre: number) => `${nombre} boucle${nombre > 1 ? 's' : ''} mise${nombre > 1 ? 's' : ''} à jour.`,
    },
    /** Les listes des boucles rouges et de rebouclage : le numéro de la boucle remplacée (celui de l'animal) et la date de la pose. */
    numeroRemplacement: 'N° de\nremplac.',
    poseRouge: 'Date de\nbouclage',
    poseRebouclage: 'Date de\nrebouclage',
    /** La colonne cochée quand l'animal qui porte la boucle est mort. */
    morte: 'Morte',
    /** Les deux valeurs de la colonne « Morte » dans son filtre. */
    morteOui: 'oui',
    morteNon: 'non',
    aucuneNonPosee: 'Aucune boucle à poser.',
    aucunePosee: 'Aucune boucle posée.',
    /** Rappel : l'inventaire des boucles ne se modifie pas à la main. */
    rappel:
      'Les ajouts et les suppressions des boucles se font dans Comptabilité (ajout par dépenses), et dans Cheptel (suppression par pose).',
    ok: 'OK',
    triPar: (colonne: string) => `Trier par ${colonne.replace(/\n/g, ' ').toLowerCase()}`,
    nombre: (nombre: number) => `${nombre} boucle${nombre > 1 ? 's' : ''}`,
    /** Le choix d'une boucle de l'inventaire pour un animal. */
    /** Le choix du numéro de boucle d'un animal : une boucle de l'inventaire, ou un autre numéro qu'on tape. */
    choisir: 'N° de boucle à poser',
    rechercher: 'Rechercher par n°',
    aucune: 'Aucune',
    utiliser: (numero: string) => `Utiliser le n° ${numero}`,
    rouge: 'rouge',
    /** Le mot qui suit le libellé du champ d'une boucle rouge. */
    rougeEtiquette: 'Rouge',
    /** Une boucle posée dont l'animal n'a pas de date de bouclage : on le dit à la place de la date. */
    posee: 'Posée',
    /** Le détail d'une sorte de boucles sur sa ligne de l'inventaire : le total, les posées, celles à poser. */
    resume: (total: number, posees: number) =>
      `${total} au total · ${posees} posée${posees > 1 ? 's' : ''} · ${total - posees} à poser`,
    /** Le détail d'une boucle de remplacement (rouge, rebouclage) : la quantité en stock et les poses notées sur les fiches. */
    resumeRemplacement: (enStock: number, posees: number) =>
      `${enStock} en stock · ${posees} pose${posees > 1 ? 's' : ''} notée${posees > 1 ? 's' : ''}`,
    /** La synchronisation avec le cheptel : le réglage (Comptabilité › Réglages) et la fenêtre où l'on choisit les tiptag. */
    synchro: {
      option: 'Synchroniser les boucles avec le cheptel',
      optionAide:
        'Les boucles posées sur les animaux sortent du stock et les numéros du cheptel entrent dans l’inventaire. Désactivée, l’inventaire des boucles et le cheptel ne se parlent plus.',
      titre: 'Synchronisation avec le cheptel',
      message: (nombre: number) =>
        `${nombre} numéro${nombre > 1 ? 's' : ''} de boucle porté${nombre > 1 ? 's' : ''} par vos animaux. Vous choisissez lesquels sont des tiptag : les autres entrent dans les boucles.`,
      bouton: 'Synchroniser les boucles',
      revoir: 'Revoir les tiptag du cheptel',
      titreModal: 'Boucles du cheptel',
      consigne:
        'Voici les numéros de boucle portés par vos animaux. Cochez les tiptag : les boucles non cochées sont intégrées dans les boucles.',
      suppression:
        'Les boucles déjà reprises du cheptel sont supprimées de l’inventaire, puis reprises selon ce choix. Les boucles achetées (par une dépense) ne changent pas.',
      valider: 'Synchroniser',
      fait: (nombre: number) => `${nombre} boucle${nombre > 1 ? 's' : ''} du cheptel dans l’inventaire.`,
    },
  },
  /** Les fromages identifiés par lot : une ligne par fromage, fabriqué, vendu ou rappelé. */
  lots: {
    titre: (nom: string) => `Inventaire : ${nom}`,
    titreFromage: (nom: string) => `Inventaire : Fromage ${nom}`,
    etat: { tout: 'Tout', en_stock: 'En stock', vendu: 'Vendu', rappele: 'Rappelé' },
    colonnes: { numero: 'N° lot', fabrication: 'Date de\nfabrication', vente: 'Date de\nvente' },
    /** Les deux valeurs de la colonne du contrôle dans son filtre. */
    controleOui: 'ok',
    controleNon: 'non',
    controle: 'Contrôle\nok ?',
    nombre: (nombre: number) => `${nombre} lot${nombre > 1 ? 's' : ''}`,
    titreEtat: 'État des lots',
    triPar: (colonne: string) => `Trier par ${colonne.replace(/\n/g, ' ').toLowerCase()}`,
    aucun: 'Aucun lot.',
    rappele: 'Rappelé',
    reserverFacturer: 'Réserver / Facturer',
    selectionnerFromages: 'Sélectionner des fromages',
    selectionnerProduits: 'Sélectionner des produits',
    nChoisis: (n: number) => `${n} lot${n > 1 ? 's' : ''} choisi${n > 1 ? 's' : ''}`,
    reserver: 'Réserver',
    facturer: 'Facturer',
    facturerA: (client: string) => `Facturer à ${client}`,
    liberer: 'Libérer la réservation',
    pourQuelClient: 'Pour quel client particulier ?',
    questionPrix: (produit: string) => `Quel prix à la pièce pour « ${produit} » (€ TTC) ?`,
    reserve: 'Réservé',
    /** Rappel : l'inventaire des fromages ne se modifie pas à la main. */
    rappel:
      'Les ajouts et les suppressions se font dans Comptabilité (suppression par vente), et dans Production (ajout par fabrication, rappels).',
    ok: 'OK',
    /** Cocher le contrôle de tous les lots montrés (selon les filtres), ou le retirer. */
    toutControler: (nombre: number) => `Tout cocher (${nombre})`,
    toutDecontroler: 'Tout décocher',
    /** La date de fabrication d'un lot : elle se modifie d'un appui, pour toute sa fabrication. */
    modifierDate: {
      titre: (numero: string) => `Date de fabrication du lot ${numero}`,
      date: 'Date de fabrication',
      note: (nombre: number) =>
        nombre > 1
          ? `La date change pour les ${nombre} lots de cette fabrication, et le mouvement de stock du lait suit.`
          : 'Le mouvement de stock du lait de cette fabrication suit la nouvelle date.',
    },
    /** Les fromages en stock saisis avant le suivi par lot : ils n'ont pas de numéro. */
    sansLot: (nombre: number) =>
      `${nombre} fromage${nombre > 1 ? 's' : ''} sans n° de lot (saisi${nombre > 1 ? 's' : ''} avant le suivi par lot).`,
    resume: (total: number, enStock: number) => `${total} lot${total > 1 ? 's' : ''} · ${enStock} en stock`,
  },
  /** L'historique de l'inventaire : les mouvements, mois par mois. */
  historique: {
    titre: 'Historique',
    aucun: 'Aucun mouvement dans l’inventaire.',
    comparaison: (annee: number, precedente: number) =>
      `Comparaison ${annee} (précédente année entre parenthèses : ${precedente})`,
    details: 'Détails',
    masquer: 'Masquer',
    bilanVendu: (vendu: string) => `Vendu ${vendu}`,
    bilanFromage: (fabrique: string, vendu: string) => `Fabriqué ${fabrique} · Vendu ${vendu}`,
    bilanLait: (produit: string, utilise: string, vendu: string) =>
      `Produit ${produit} · Utilisé en fabrication ${utilise} · Vendu ${vendu}`,
    noteLait:
      'Le lait utilisé ou vendu a forcément été produit : à chaque sortie que le journal de lait ne couvre pas, une balance automatique ajoute la même quantité en production, à la même date.',
    bilanConsommable: (achete: string, consomme: string) => `Acheté ${achete} · Consommé ${consomme}`,
    bilanInvestissement: (achete: string) => `Acheté ${achete}`,
    mouvements: (nombre: number) => `${nombre} mouvement${nombre > 1 ? 's' : ''}`,
  },
  /** Le menu en haut de l'inventaire, à droite du titre. */
  statistiques: { titre: 'Statistiques', fermer: 'Fermer' },
  /** La liste des œufs (poules) : leur prix de vente. */
  oeufs: {
    prixDeLOeuf: 'Prix de vente de l’œuf',
    prixOeuf: (prix: string) => `${prix} € l’œuf`,
    modifierLePrix: 'Modifier le prix de l’œuf',
    prixLabel: 'Prix de vente (€ l’œuf)',
    note: 'Une vente d’œufs en comptabilité est liée à cette liste : son prix total est le nombre d’œufs × ce prix.',
  },
  /**
   * Les titres des listes d'office de l'inventaire : « Ventes — … » pour ce qui se vend (produits finis et produits animaux), « Achat — … »
   * pour ce qui s'achète. Une liste ajoutée à partir d'un compte reçoit le même préfixe.
   */
  titresListes: {
    prefixeVentes: 'Ventes — ',
    prefixeAchat: 'Achat — ',
    fromages: 'Ventes — Fromages',
    lait: 'Ventes — Lait',
    oeufs: 'Ventes — Œufs',
    viande: 'Ventes — Boucherie et charcuterie',
    animaux: 'Ventes — Animaux',
    aliments: 'Achat — Aliment',
    boucles: 'Achat — Boucles',
    emballages: 'Achat — Emballages',
    entretien: 'Achat — Entretien',
    equipement: 'Achat — Équipement',
    materiel: 'Achat — Matériel',
  },
  sections: {
    fromages: 'Fromages',
    oeufs: 'Œufs',
    emballages: 'Emballages',
    boucles: 'Boucles d’identification',
    materiel: 'Équipement',
    viande: 'Boucherie et charcuterie',
    animaux: 'Animaux',
  },
  unites: (nombre: number) => `${nombre}`,
  /** Le prix d'une ligne d'animaux : il se compte au kilo. */
  parKg: (montant: string) => `${montant} le kg`,
  /** Le niveau d'un aliment : il se compte en kilos. */
  kilos: (nombre: number) => `${nombre} kg`,
  negatif: 'Quantité négative',
  /** Un article pris par un appui long : on touche la carte où le mettre. */
  deplacer: (nom: string) => `« ${nom} » est pris : touchez la place où le mettre (touchez-le de nouveau pour le reposer).`,
  /** Le prix moyen d'une unité d'une fourniture, d'après ses achats : sous son nom dans l'inventaire. */
  prixAchat: (prix: string, horsTaxes: boolean) =>
    `${prix} l’unité · prix moyen des achats ${horsTaxes ? 'HT' : 'TTC'}`,
  lait: {
    titre: 'Lait par fromage',
    aucune:
      'Notez les litres de lait en ajoutant des fromages fabriqués : les statistiques apparaissent ici.',
    mois: 'M*',
    litres: 'L*',
    legende: '* M = Mois, L = Litres',
    detailAfficher: 'Détail',
    detailMasquer: 'Masquer',
    /** Une phrase par type ; le brocciu se fait avec le lactosérum du fromage frais, d'où les litres versés dedans. */
    ligne: (code: string, libelle: string, litres: string) =>
      code === 'brocciu'
        ? `${litres} L de lait versé dans le lactosérum pour 1 brocciu (500 g)`
        : `${litres} L de lait pour 1 fromage ${libelle.toLowerCase()}`,
    detail: (litres: string, fromages: number) =>
      `${litres} L au total pour ${fromages} fabriqué${fromages > 1 ? 's' : ''} cette année`,
  },
  ajouter: {
    fromage: 'Ajouter un fromage',
    emballages: 'Ajouter un emballage',
    materiel: 'Ajouter un équipement de fromagerie',
    equipementConsommable: 'Ajouter un petit équipement',
    exempleEquipementConsommable: 'ex : Gants, filtres',
    batiment: 'Ajouter du matériel de bâtiment',
    exempleBatiment: 'ex : Grillage, poteaux',
    aliment: 'Ajouter un aliment',
    article: 'Ajouter un article',
    exempleArticle: 'ex : Nom de l’article',
    dansLaListe: (liste: string) => `Ajouter à « ${liste} »`,
    listeVide: 'Aucun article : ajoutez-en avec le bouton +.',
    exempleAliment: 'ex : Granulés, orge',
    viande: 'Ajouter un type de viande',
    exempleViande: 'ex : Saucisson, jambon, côtes',
    entretien: 'Ajouter un produit d’entretien',
    exempleEntretien: 'ex : Désinfectant, chaux, gants',
    activite: 'Activité concernée',
    toutesActivites: 'Toutes les activités',
    nom: 'Nom',
    exempleFromage: 'ex : Tomme',
    exempleEmballage: 'ex : Étiquette 8 cm',
    exempleMateriel: 'ex : Casserole 20 L',
  },
  renommer: { titre: 'Modifier le nom', modifier: 'Modifier le nom de l’article' },
  conditionnement: {
    titre: 'Conditionnement',
    aide: 'À chaque vente d’un fromage ou d’un produit, le produit et ses emballages baissent tout seul.',
    aucun: 'Aucun emballage',
    modifier: 'Modifier le conditionnement',
    choisirLesEmballages: 'Emballages consommés par produit vendu :',
    /** L'ajout du conditionnement d'un autre élément de l'inventaire (produits finis, produits animaux). */
    ajouter: 'Ajouter un conditionnement',
    element: 'Élément de l’inventaire',
    tousAjoutes: 'Tous les éléments de l’inventaire ont déjà leur conditionnement.',
    retirer: 'Retirer ce conditionnement',
    /** Le conditionnement par année : celui qu'on choisit vaut pour l'année et les suivantes. */
    aideAnnee:
      'Le conditionnement que vous choisissez vaut pour l’année affichée et les suivantes, jusqu’à une nouvelle personnalisation. Les années d’avant gardent le leur.',
    personnalise: (annee: number) => `Personnalisé pour ${annee}`,
    herite: (annee: number) => `Défini en ${annee}`,
    revenir: 'Revenir au conditionnement d’avant',
  },
  vente: 'vente',
  manuel: 'saisie',
  naissance: 'naissance',
  achat: 'achat',
  consommation: 'consommation',
  pose: 'pose',
  rappel: 'rappel',
  productionLait: 'lait produit',
  balanceLait: 'lait produit',
  fabrication: 'fabrication',
  entreeBoucle: 'ajout depuis le cheptel',
  ligneMouvement: (date: string, article: string, delta: string, origine: string) =>
    `${date} · ${article} · ${delta} (${origine})`,
  modal: {
    titre: (article: string) => `Inventaire : ${article}`,
    quantite: 'Quantité',
    litres: 'Litres de lait utilisés',
    litresBrocciu: 'Litres de lait versés dans le lactosérum',
    laitUtilise: (nombre: number, par: string, total: string) =>
      `Lait utilisé : ${nombre} × ${par} L = ${total} L`,
    litresRequis: 'Indiquez les litres de lait utilisés : ils entrent dans l’inventaire avec les fromages.',
    quantiteInvalide: 'Indiquez une quantité : +1 pour un ajout, −1 pour un retrait.',
    aide: '+1 pour un ajout, −1 pour un retrait.',
    aideConsommable: '+1 pour un achat, −1 pour ce qui a été consommé.',
    toutConsomme: 'Tout consommé (remise à zéro)',
    supprimer: 'Supprimer cet article',
  },
} as const;
