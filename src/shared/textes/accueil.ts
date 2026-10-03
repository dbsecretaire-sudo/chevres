/** Textes de l'interface — « accueil ». À modifier ici uniquement. */
export const TEXTES_ACCUEIL = {
  accueil: {
    troupeauEspace: 'Troupeau — ',
    animauxVivants: 'Animaux vivants',
    dAlimentAnimalJour: 'd’aliment / animal / jour',
    soldeFacturesHorsAutre: 'Solde factures (hors Autre)',
    derniereVisiteVeterinaire: 'Dernière visite vétérinaire',
    actionsRapides: 'Actions rapides',
    cheptel: '+ Cheptel',
    comptabilite: '+ Comptabilité',
    chevresChevreValeurBoucsBouc: (
      chevres: number,
      valeur: string,
      boucs: number,
      valeur2: string,
      cabrits: number,
      valeur3: string,
    ) => `${chevres} chèvre${valeur} · ${boucs} bouc${valeur2} · ${cabrits} cabri${valeur3}`,
    aucuneVisiteEnregistreeCetteAnnee: 'Aucune visite enregistrée cette année',
  },
} as const;
