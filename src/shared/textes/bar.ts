/** Textes de l'interface — restauration, bar et inventaire du gîte. À modifier ici uniquement. */
export const TEXTES_BAR = {
  bar: {
    nouvelleBoisson: 'Nouvelle boisson',
    modifierBoisson: 'Modifier la boisson',
    supprimerBoisson: 'Supprimer cette boisson',
    nomBoisson: 'Nom de la boisson',
    exempleNom: 'ex : Bière pression',
    prix: 'Prix (€)',
    nomRequis: 'Nom requis',
    prixInvalide: 'Le prix doit être supérieur à zéro.',
  },
  stock: {
    boissonsNourriture: 'Boissons et nourriture',
    /** Le menu de l'inventaire du gîte (burger) : l'impression de l'état actuel. */
    menu: 'Menu de l’inventaire',
    exporter: {
      menu: 'Imprimer l’inventaire (PDF)',
      titre: 'Inventaire du gîte — état actuel',
      colonnes: { article: 'Article', activite: 'Activité', quantite: 'Quantité', prix: 'Prix de vente' },
      aucunArticle: 'Aucun article dans cette liste.',
      toutesActivites: 'Toutes',
    },
    onglets: {
      materiel: 'Matériel',
      conditionnement: 'Conditionnement',
      entretien: 'Entretien',
    },
    aucunConsommable: 'Aucun consommable : ajoutez une boisson ou un aliment avec le bouton +.',
    aucunArticle: 'Rien dans cette liste : ajoutez-en avec le bouton +.',
    ajouterArticle: {
      materiel: 'Ajouter du matériel',
      conditionnement: 'Ajouter un conditionnement',
      entretien: 'Ajouter un produit d’entretien',
    },
    exempleArticle: {
      materiel: 'ex : Casserole, tireuse',
      conditionnement: 'ex : Sacs, barquettes',
      entretien: 'ex : Produit vaisselle, éponges',
    },
    renommerArticle: 'Modifier le nom',
    ajouterBoisson: 'Ajouter une boisson',
    modifierBoisson: 'Modifier la boisson',
    ajouterAliment: 'Ajouter un aliment',
    nomAliment: 'ex : Farine, huile, légumes',
    negatif: 'Quantité négative : notez l’achat manquant.',
    tout: 'Tout',
    activite: 'Activité concernée',
    toutesActivites: 'Toutes les activités',
  },
} as const;
