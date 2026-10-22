/** Les analyses des produits finis (fromage, charcuterie) : les autocontrôles de la ferme, à garder pour les contrôles sanitaires. */
export const TEXTES_ANALYSES_PRODUITS = {
  produits: {
    fromage: { titre: 'Analyses du fromage', nom: 'fromage', echantillonExemple: 'ex : Tomme au lait cru' },
    charcuterie: { titre: 'Analyses de la charcuterie', nom: 'charcuterie', echantillonExemple: 'ex : Saucisson sec' },
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
  parametresRetenus: 'Les paramètres suivent le produit : fromage (Listeria, Salmonella, staphylocoques, E. coli, entérotoxines), charcuterie (Listeria, Salmonella, E. coli, staphylocoques).',
};
