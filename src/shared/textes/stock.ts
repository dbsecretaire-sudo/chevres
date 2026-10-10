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
      `« ${nom} » disparaît avec toutes ses listes, leurs articles et leurs mouvements.`,
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
    supprimerMessage: (nom: string) => `« ${nom} » disparaît avec tous ses articles et leurs mouvements.`,
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
    nomRequis: 'Nom requis',
    prixInvalide: 'Le prix doit être supérieur à zéro.',
    supprimer: 'Supprimer cet article',
  },
  /** La confirmation avant de supprimer un article de l'inventaire. */
  suppression: {
    titre: 'Supprimer cet article ?',
    message: (nom: string) => `« ${nom} » disparaît de la liste, avec ses mouvements.`,
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
    titreSorte: 'Sorte de boucles',
    sorte: { tout: 'Tout', boucles: 'Boucles', rouges: 'Boucles rouges' },
    imprimer: 'Imprimer les boucles',
    etat: { tout: 'Tout', posee: 'Posée', non_posee: 'Non posée' },
    aucuneBoucle: 'Aucune boucle.',
    colonnes: { numero: 'N°', pose: 'Date de pose', achat: 'Date d’achat' },
    /** La colonne cochée quand l'animal qui porte la boucle est mort. */
    morte: 'Morte',
    aucuneNonPosee: 'Aucune boucle à poser.',
    aucunePosee: 'Aucune boucle posée.',
    /** Rappel : l'inventaire des boucles ne se modifie pas à la main. */
    rappel:
      'Les ajouts et les suppressions des boucles se font dans Comptabilité (ajout par dépenses), et dans Cheptel (suppression par pose).',
    ok: 'OK',
    triPar: (colonne: string) => `Trier par ${colonne.toLowerCase()}`,
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
    /** La reprise unique des boucles déjà posées au cheptel (à retirer une fois faite). */
    reprise: {
      titre: 'Boucles du cheptel à reprendre',
      message: (nombre: number) =>
        `${nombre} boucle${nombre > 1 ? 's' : ''} posée${nombre > 1 ? 's' : ''} sur vos animaux ${nombre > 1 ? 'ne sont' : 'n’est'} pas encore dans l’inventaire. Elles y seront ajoutées comme boucles posées (avec leur date de pose quand l’animal en a une). Cette reprise ne se fait qu’une fois.`,
      bouton: 'Ajouter ces boucles à l’inventaire',
      fait: (nombre: number) =>
        `${nombre} boucle${nombre > 1 ? 's' : ''} ajoutée${nombre > 1 ? 's' : ''} à l’inventaire.`,
    },
  },
  /** Les fromages identifiés par lot : une ligne par fromage, fabriqué, vendu ou rappelé. */
  lots: {
    titre: (nom: string) => `Inventaire : Fromage ${nom}`,
    etat: { tout: 'Tout', en_stock: 'En stock', vendu: 'Vendu', rappele: 'Rappelé' },
    colonnes: { numero: 'N° lot', fabrication: 'Date fabrication', vente: 'Date vente' },
    controle: 'Contrôle ok ?',
    nombre: (nombre: number) => `${nombre} lot${nombre > 1 ? 's' : ''}`,
    titreEtat: 'État des lots',
    triPar: (colonne: string) => `Trier par ${colonne.toLowerCase()}`,
    aucun: 'Aucun lot.',
    rappele: 'Rappelé',
    /** Rappel : l'inventaire des fromages ne se modifie pas à la main. */
    rappel:
      'Les ajouts et les suppressions des fromages se font dans Comptabilité (suppression par vente), et dans Production › Fromages (ajout par fabrication, rappels).',
    ok: 'OK',
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
  sections: {
    fromages: 'Fromages',
    oeufs: 'Œufs',
    emballages: 'Emballages',
    boucles: 'Boucles d’identification',
    materiel: 'Équipement',
    viande: 'Viande et charcuterie',
    animaux: 'Animaux',
  },
  unites: (nombre: number) => `${nombre}`,
  /** Le prix d'une ligne d'animaux : il se compte au kilo. */
  parKg: (montant: string) => `${montant} le kg`,
  /** Le niveau d'un aliment : il se compte en kilos. */
  kilos: (nombre: number) => `${nombre} kg`,
  negatif: 'Quantité négative',
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
    materiel: 'Ajouter un équipement',
    equipementConsommable: 'Ajouter un équipement',
    exempleEquipementConsommable: 'ex : Gants, filtres',
    batiment: 'Ajouter du matériel',
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
    aide: 'À chaque vente d’un fromage, le fromage et ses emballages baissent tout seul.',
    aucun: 'Aucun emballage',
    modifier: 'Modifier le conditionnement',
    choisirLesEmballages: 'Emballages consommés par fromage vendu :',
  },
  vente: 'vente',
  manuel: 'saisie',
  naissance: 'naissance',
  achat: 'achat',
  consommation: 'consommation',
  pose: 'pose',
  rappel: 'rappel',
  entreeBoucle: 'ajout depuis le cheptel',
  ligneMouvement: (date: string, article: string, delta: string, origine: string) =>
    `${date} · ${article} · ${delta} (${origine})`,
  modal: {
    titre: (article: string) => `Inventaire : ${article}`,
    quantite: 'Quantité',
    litres: 'Litres de lait utilisés (facultatif)',
    litresBrocciu: 'Litres de lait versés dans le lactosérum (facultatif)',
    quantiteInvalide: 'Indiquez une quantité : +1 pour un ajout, −1 pour un retrait.',
    aide: '+1 pour un ajout, −1 pour un retrait.',
    aideConsommable: '+1 pour un achat, −1 pour ce qui a été consommé.',
    toutConsomme: 'Tout consommé (remise à zéro)',
    supprimer: 'Supprimer cet article',
  },
} as const;
