/** Textes de l'interface — « espèces » (celles d'office, modifiables, et celles que l'utilisateur ajoute). À modifier ici uniquement. */
export const TEXTES_ESPECES = {
  titre: 'Espèces',
  aide: 'Une espèce à la fois : ouvrez-en une pour modifier ses noms et ses âges. Le + du formulaire ajoute une espèce.',
  nouvelle: 'Nouvelle espèce',
  fermer: 'Fermer',
  champs: {
    nom: 'Nom de l’espèce',
    nomPlaceholder: 'ex: Lapins',
    sevrage: 'Âge de sevrage',
    maturite: 'Âge de la maturité sexuelle',
    maturiteAide: 'En dessous de cet âge, l’animal est un petit.',
    portee: 'Nombre maximal de petits par portée',
    femelle: 'Nom de la femelle adulte',
    femellePlaceholder: 'ex: Lapine',
    male: 'Nom du mâle adulte',
    malePlaceholder: 'ex: Lapin',
    petit: 'Nom du petit',
    petitPlaceholder: 'ex: Lapereau',
    valeur: 'Durée',
    unite: 'Unité',
  },
  unites: { jours: 'Jours', mois: 'Mois' },
  tousObligatoires: 'Tous les champs sont obligatoires, avec des nombres supérieurs à zéro.',
  ajouter: 'Ajouter l’espèce',
  enregistrer: 'Enregistrer',
  supprimer: 'Supprimer l’espèce',
  supprimerQuestion: 'Supprimer cette espèce ?',
  supprimerMessage: (nom: string) =>
    `« ${nom} » disparaît de la liste des espèces. Les établissements qui l'élèvent doivent d'abord la décocher.`,
  utilisee: (nom: string) =>
    `« ${nom} » est élevée dans un établissement : décochez-la d'abord dans ses espèces élevées.`,
  parDefaut: 'Espèce d’office',
} as const;
