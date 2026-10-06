/** Textes de l'interface — stock de la fromagerie. À modifier ici uniquement. */
export const TEXTES_STOCK = {
  titre: 'Stock',
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
    vente: 'Vente',
    consommables: 'Consommables',
    investissements: 'Investissements',
  },
  /** Les lignes de viande tenues d'office : l'animal sur pied et l'animal vivant (leurs petits ont le nom de l'espèce). */
  viande: { surPied: 'Animal sur pied', vivant: 'Animal vivant' },
  /** La fenêtre de modification d'un article. */
  articleModal: {
    nom: 'Nom',
    prix: 'Prix de vente (€)',
    prixKg: 'Prix de vente (€ le kg)',
    nomRequis: 'Nom requis',
    prixInvalide: 'Le prix doit être supérieur à zéro.',
    supprimer: 'Supprimer cet article',
  },
  /** La confirmation avant de supprimer un article du stock. */
  suppression: {
    titre: 'Supprimer cet article ?',
    message: (nom: string) => `« ${nom} » disparaît de la liste, avec ses mouvements de stock.`,
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
    restant: 'Lait restant',
    produit: 'Produit',
    utilise: 'Utilisé en fromagerie',
    vendu: 'Vendu',
  },
  /** L'historique du stock : les mouvements, mois par mois. */
  historique: {
    titre: 'Historique',
    aucun: 'Aucun mouvement de stock.',
    comparaison: (annee: number, precedente: number) =>
      `Comparaison ${annee} (précédente année entre parenthèses : ${precedente})`,
    details: 'Détails',
    masquer: 'Masquer',
    natures: {
      vente: 'Vente',
      consommable: 'Consommables',
      investissement: 'Investissements',
    },
    bilanVendu: (vendu: string) => `Vendu ${vendu}`,
    bilanConsommable: (achete: string, consomme: string) => `Acheté ${achete} · Consommé ${consomme}`,
    bilanInvestissement: (achete: string) => `Acheté ${achete}`,
    mouvements: (nombre: number) => `${nombre} mouvement${nombre > 1 ? 's' : ''}`,
  },
  /** Le menu en haut du stock, à droite du titre. */
  statistiques: { menu: 'Menu du stock', titre: 'Statistiques', fermer: 'Fermer' },
  sections: {
    fromages: 'Fromages',
    emballages: 'Emballages',
    materiel: 'Équipement',
    conditionnement: 'Conditionnement',
  },
  unites: (nombre: number) => `${nombre}`,
  /** Le prix d'une ligne d'animaux : il se compte au kilo. */
  parKg: (montant: string) => `${montant} le kg`,
  /** Le niveau d'un aliment : il se compte en kilos. */
  kilos: (nombre: number) => `${nombre} kg`,
  negatif: 'Stock négatif : notez la production ou l’achat manquant.',
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
    aide: 'À chaque vente d’un fromage, le fromage et ses emballages baissent tout seul. Les sacs en plastique se saisissent à la vente.',
    aucun: 'Aucun emballage',
    modifier: 'Modifier le conditionnement',
    choisirLesEmballages: 'Emballages consommés par fromage vendu :',
  },
  vente: 'vente',
  manuel: 'saisie',
  naissance: 'naissance',
  achat: 'achat',
  consommation: 'consommation',
  ligneMouvement: (date: string, article: string, delta: string, origine: string) =>
    `${date} · ${article} · ${delta} (${origine})`,
  modal: {
    titre: (article: string) => `Stock : ${article}`,
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
