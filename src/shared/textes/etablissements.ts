/** Textes de l'interface — « etablissements ». À modifier ici uniquement. */
export const TEXTES_ETABLISSEMENTS = {
  selecteurEtablissement: {
    choisirUnEtablissement: 'Mes établissements',
    nomDeLEtablissement: 'Nom de l’établissement',
    nouvelEtablissement: 'Nouvel établissement',
    creationImpossible: 'Impossible de créer l’établissement',
    modifierLEtablissement: 'Modifier l’établissement',
    nomExElevageDesHauts: 'Nom — ex: Élevage des Hauts',
    creerEtOuvrir: 'Créer et ouvrir',
    supprimerCetEtablissement: 'Supprimer cet établissement',
    auMoinsUnEtablissement: 'Il faut garder au moins un établissement.',
    supprimerCetEtablissementQuestion: 'Supprimer cet établissement ?',
    toutesLesDonneesLocalesDe: (valeur: string) =>
      `Toutes les données locales de « ${valeur} » (cheptel, comptabilité, fournisseurs, clients…) seront supprimées définitivement de cet appareil.`,
    typeNonRenseigne: 'Type non renseigné',
    modifier: 'Modifier',
    ajouterUnEtablissement: 'Ajouter un établissement',
    changerDEtablissement: 'Changer d’établissement',
  },
  typeEtablissement: {
    typeDEtablissement: 'Type d’établissement',
    plusieursChoixPossibles: 'Plusieurs choix possibles.',
    animaux: 'Animaux',
    especesElevees: 'Espèces élevées',
    choisirUnType: 'Choisir un type',
  },
  etablissementContext: {
    useetablissementDoitEtreUtiliseDans: 'useEtablissement doit être utilisé dans EtablissementProvider',
  },
  repository: {
    monExploitation: 'Mon exploitation',
  },
} as const;
