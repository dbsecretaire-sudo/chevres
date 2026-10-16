/** Textes de l'interface — « contacts » : une personne ou une organisation qui est client, fournisseur, ou les deux. À modifier ici uniquement. */
export const TEXTES_CONTACTS = {
  titre: 'Contacts',
  aide: 'Un contact est un client (il vous paie : recettes), un fournisseur (vous le payez : dépenses), ou les deux. Une fiche par côté, chacune avec sa catégorie ; les coordonnées sont partagées.',
  aideRubrique: 'Clients et fournisseurs réunis : chaque contact une fois, avec ses recettes et ses dépenses.',
  recherche: 'Nom, téléphone, e-mail…',
  aucun: 'Aucun contact.',
  aucunSousTitre: 'Ajoutez un client ou un fournisseur avec le bouton +.',
  recettes: 'Recettes',
  depenses: 'Dépenses',
  nouveauClient: 'Nouveau client',
  nouveauFournisseur: 'Nouveau fournisseur',
  fiche: {
    titre: 'Contact',
    estClient: 'Client (reçoit des recettes)',
    estFournisseur: 'Fournisseur (fait des dépenses)',
    ouvrirClient: 'Ouvrir sa fiche client',
    ouvrirFournisseur: 'Ouvrir sa fiche fournisseur',
    ajouterClient: 'Ajouter aussi comme client',
    ajouterFournisseur: 'Ajouter aussi comme fournisseur',
    categorieDeuxPoints: 'Catégorie : ',
    aideAjout: 'Crée l’autre fiche avec les mêmes coordonnées, sans toucher à celle-ci.',
  },
} as const;
