/** La page d'accueil du Cheptel : la ligne des réglages (UGB, primes, effectif déclaré). */
/** Les groupes de l'accueil du Cheptel. */
export const accueilTextes = {
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
} as const;
