/** Les analyses des produits finis (fromage, charcuterie) : les autocontrôles de la ferme, à garder pour les contrôles sanitaires. */
export const TEXTES_ANALYSES_PRODUITS = {
  produits: {
    fromage: { titre: 'Analyses du fromage', nom: 'fromage', echantillonExemple: 'ex : Tomme au lait cru' },
    charcuterie: { titre: 'Analyses de la charcuterie', nom: 'charcuterie', echantillonExemple: 'ex : Saucisson sec' },
    plat: { titre: 'Analyses des plats préparés', nom: 'plat préparé', echantillonExemple: 'ex : Civet de sanglier' },
    savon: { titre: 'Analyses des savons', nom: 'savon', echantillonExemple: 'ex : Savon au lait de chèvre et miel' },
  },
  /** Le repère de lecture propre à chaque produit : un savon est un cosmétique, ses critères ne sont pas ceux d'une denrée. */
  reperes: {
    fromage:
      'Les repères de lecture (absence dans 25 g, seuils en UFC/g) suivent le règlement (CE) n° 2073/2005 tel qu’on le retient d’ordinaire : ils aident à lire un résultat. Le laboratoire, votre plan de maîtrise sanitaire et la DDPP font foi.',
    charcuterie:
      'Les repères de lecture (absence dans 25 g, seuils en UFC/g) suivent le règlement (CE) n° 2073/2005 tel qu’on le retient d’ordinaire : ils aident à lire un résultat. Le laboratoire, votre plan de maîtrise sanitaire et la DDPP font foi.',
    plat:
      'Pour une conserve, le test de stabilité à l’étuve (37 °C d’ordinaire) dit si le produit est stable ; les autres repères sont ceux d’un produit prêt à consommer (règlement (CE) n° 2073/2005). Le laboratoire, votre plan de maîtrise sanitaire et la DDPP font foi.',
    savon:
      'Les repères d’un cosmétique (norme ISO 17516, catégorie 2 : germes aérobies jusqu’à 1 000 UFC/g, levures et moisissures jusqu’à 100 UFC/g, absence de Pseudomonas aeruginosa, Staphylococcus aureus et Candida albicans) aident à lire un résultat. L’évaluateur de la sécurité fixe les analyses à faire : il fait foi, avec la DGCCRF.',
  },
  /** Le registre des analyses de l'atelier : les fabrications et leurs analyses. */
  registre: {
    titre: 'Registre des analyses',
    intro: 'Chaque fabrication (les lots nés ensemble) avec ses analyses : celle qui a été faite et son jugement, ou « À analyser ». Un appui ouvre l’analyse, ou en note une nouvelle rattachée à la fabrication.',
    aucuneFabrication: 'Aucune fabrication pour le moment.',
    lots: (numeros: string) => `lots ${numeros}`,
    analyses: (n: number) => `${n} analyse${n > 1 ? 's' : ''}`,
    aAnalyser: 'À analyser',
    horsLots: (n: number) => `${n} analyse${n > 1 ? 's' : ''} hors fabrication`,
    toutes: (produit: string) => `Toutes les analyses (${produit})`,
    laitTitre: 'Lait',
    laitLien: 'Analyses du lait (qualité du lait)',
  },
  /** Le repère de lecture, sous le titre de chaque liste : ni avis officiel ni conseil réglementaire. */
  repere:
    'Les repères de lecture (absence dans 25 g, seuils en UFC/g) suivent le règlement (CE) n° 2073/2005 tel qu’on le retient d’ordinaire : ils aident à lire un résultat. Le laboratoire, votre plan de maîtrise sanitaire et la DDPP font foi.',
  frequenceAide: 'La fréquence des analyses se fixe dans votre plan de maîtrise sanitaire, avec votre laboratoire : gardez ici chaque rapport.',
  derniere: (date: string, jours: number) =>
    `Dernière analyse : ${date} (${jours === 0 ? 'aujourd’hui' : `il y a ${jours} jour${jours > 1 ? 's' : ''}`})`,
  aucuneAnalyse: 'Aucune analyse enregistrée.',
  nouvelle: 'Nouvelle analyse',
  modifier: 'Analyse',
  verdicts: {
    conforme: 'Conforme',
    surveiller: 'À surveiller',
    non_conforme: 'Non conforme',
  },
  sansVerdict: 'Résultats à lire',
  parametres: {
    listeria: { nom: 'Listeria monocytogenes', critere: 'absence dans 25 g' },
    salmonelle: { nom: 'Salmonella', critere: 'absence dans 25 g' },
    enterotoxines: { nom: 'Entérotoxines staphylococciques', critere: 'absence dans 25 g' },
    staphylocoques: { nom: 'Staphylocoques à coagulase positive', critere: '' },
    ecoli: { nom: 'Escherichia coli', critere: '' },
    stabilite: { nom: 'Test de stabilité (étuve)', critere: 'absence de développement microbien et de bombage' },
    clostridies: { nom: 'Clostridies sulfito-réductrices', critere: '' },
    bacillus: { nom: 'Bacillus cereus', critere: '' },
    flore_totale: { nom: 'Flore aérobie mésophile totale', critere: '' },
    levures_moisissures: { nom: 'Levures et moisissures', critere: '' },
    pseudomonas: { nom: 'Pseudomonas aeruginosa', critere: 'absence dans 1 g' },
    staphylocoque_dore: { nom: 'Staphylococcus aureus', critere: 'absence dans 1 g' },
    candida: { nom: 'Candida albicans', critere: 'absence dans 1 g' },
  } as Record<string, { nom: string; critere: string }>,
  /** Les seuils d'un dénombrement : satisfaisant jusqu'à m, à surveiller jusqu'à M. */
  seuils: (m: number, M: number) => `repère : satisfaisant jusqu’à ${m.toLocaleString('fr-FR')}, limite ${M.toLocaleString('fr-FR')} UFC/g`,
  sansSeuil: 'à noter, sans seuil de repère ici',
  absence: 'Absence',
  presence: 'Présence',
  nonAnalyse: 'Non analysé',
  ufc: 'UFC/g',
  champs: {
    date: 'Date du prélèvement',
    laboratoire: 'Laboratoire',
    laboratoireAucun: 'Non précisé',
    laboratoireChoisir: 'Choisir un laboratoire',
    laboratoireAide: 'Les laboratoires sont des contacts de catégorie « Laboratoire » ; le crayon mène aux contacts.',
    rapport: 'N° du rapport d’analyse',
    echantillon: 'Produit analysé',
    fabrication: 'Fabrication analysée',
    fabricationAucune: 'Aucune (prélèvement hors suivi des lots)',
    lot: 'N° de lot',
    lotExemple: 'facultatif',
    resultats: 'Résultats',
    notes: 'Notes',
    fichiers: 'Rapport du laboratoire',
  },
  enregistrer: 'Enregistrer',
  supprimer: 'Supprimer cette analyse',
  supprimerQuestion: 'Supprimer cette analyse ?',
  supprimerMessage: 'Son rapport joint est effacé de cet appareil.',
  aideFichiers: 'Le rapport du laboratoire (PDF, photo ou scan) : à garder pour un contrôle.',
  parametresRetenus: 'Les paramètres suivent le produit : fromage (Listeria, Salmonella, staphylocoques, E. coli, entérotoxines), charcuterie (Listeria, Salmonella, E. coli, staphylocoques), plat préparé (stabilité, Listeria, Salmonella, clostridies, Bacillus cereus, E. coli, staphylocoques), savon (flore totale, levures et moisissures, Pseudomonas, Staphylococcus aureus, Candida).',
};
