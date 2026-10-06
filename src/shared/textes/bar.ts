/** Textes de l'interface — restauration, bar et stock du gîte. À modifier ici uniquement. */
export const TEXTES_BAR = {
  titre: 'Restauration, bar et stock',
  onglets: { restauration: 'Restauration', bar: 'Bar', stock: 'Stock' },
  bar: {
    vendre: 'Vendre',
    total: (montant: string) => `Total : ${montant}`,
    enregistrerVente: 'Enregistrer la vente',
    venteEnregistree: (total: string) => `Vente enregistrée : ${total} (en comptabilité, recette « Bar »).`,
    quantiteMoins: 'Une de moins',
    quantitePlus: 'Une de plus',
    aucuneBoisson: 'Aucune boisson : ajoutez-les dans l’onglet Stock (bouton +).',
    nouvelleBoisson: 'Nouvelle boisson',
    modifierBoisson: 'Modifier la boisson',
    supprimerBoisson: 'Supprimer cette boisson',
    nomBoisson: 'Nom de la boisson',
    exempleNom: 'ex : Bière pression',
    prix: 'Prix (€)',
    nomRequis: 'Nom requis',
    prixInvalide: 'Le prix doit être supérieur à zéro.',
    descriptionVente: (lignes: string[]) => lignes.join(', '),
    ligneVente: (quantite: number, nom: string) => `${quantite} × ${nom}`,
    tiers: 'Bar',
  },
  stock: {
    boissons: 'Boissons',
    nourriture: 'Nourriture',
    aucuneBoisson: 'Aucune boisson : ajoutez-en avec le bouton +.',
    ajouterBoisson: 'Ajouter une boisson',
    modifierBoisson: 'Modifier la boisson',
    aucunAliment: 'Aucun aliment : ajoutez-en avec le bouton +.',
    ajouterAliment: 'Ajouter un aliment',
    renommerAliment: 'Modifier le nom de l’aliment',
    nomAliment: 'ex : Farine, huile, légumes',
    negatif: 'Stock négatif : notez l’achat manquant.',
  },
  restauration: {
    repasDuJour: (date: string) => `Repas du ${date}`,
    total: (repas: number) => `${repas} repas`,
    detailServices: (midi: number, soir: number) => `Midi : ${midi} · Soir : ${soir}`,
    repas: (nombre: number) => `${nombre} repas`,
    service: (midi: number, soir: number) => {
      const parties = [midi > 0 ? `midi ${midi}` : '', soir > 0 ? `soir ${soir}` : ''].filter(Boolean);
      return parties.join(' · ');
    },
    sansCoordonnees: 'Pas de coordonnées',
  },
} as const;
