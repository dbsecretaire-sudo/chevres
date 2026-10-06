/** Textes de l'interface — stock de la fromagerie. À modifier ici uniquement. */
export const TEXTES_STOCK = {
  titre: 'Stock',
  onglets: {
    fromage: 'Fromage',
    emballages: 'Emballages',
    materiel: 'Matériel',
    conditionnement: 'Conditionnement',
  },
  unites: (nombre: number) => `${nombre}`,
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
    materiel: 'Ajouter du matériel',
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
  mouvements: 'Derniers mouvements',
  aucunMouvement: 'Aucun mouvement pour le moment.',
  vente: 'vente',
  manuel: 'saisie',
  ligneMouvement: (date: string, article: string, delta: string, origine: string) =>
    `${date} · ${article} · ${delta} (${origine})`,
  modal: {
    titre: (article: string) => `Stock : ${article}`,
    ajout: 'Ajout',
    retrait: 'Retrait',
    quantite: 'Quantité',
    litres: 'Litres de lait utilisés (facultatif)',
    litresBrocciu: 'Litres de lait versés dans le lactosérum (facultatif)',
    quantiteInvalide: 'Indiquez une quantité d’au moins 1.',
    aide: 'Ajout : fabriqué ou acheté. Retrait : casse, perte, don.',
    supprimer: 'Supprimer cet article',
  },
} as const;
