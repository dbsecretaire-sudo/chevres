/** Les traitements donnés aux animaux et leurs délais d'attente (lait, viande). */
export const traitementsTextes = {
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
} as const;
