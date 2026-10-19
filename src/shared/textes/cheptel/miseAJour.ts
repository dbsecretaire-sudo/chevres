/** Cheptel › Réglages › Mettre à jour le cheptel. */
export const miseAJourTextes = {
  titre: 'Mettre à jour le cheptel',
  aide: 'Remet dans le cheptel des animaux « vendus » ou « à l’abattoir » que plus aucune vente ne porte (une facture supprimée, par exemple). Vous choisissez ceux à remettre vivants.',
  bouton: 'Mettre à jour les animaux présents',
  choisir: 'Animaux à remettre dans le cheptel',
  remettre: (n: number) => `Remettre ${n} animal${n > 1 ? 'aux' : ''}`.replace('animalaux', 'animaux'),
  aucun: 'Rien à mettre à jour : tous les animaux vendus ou à l’abattoir ont leur vente.',
  remis: (n: number) => `${n} animal${n > 1 ? 'aux' : ''} remis vivant${n > 1 ? 's' : ''} dans le cheptel.`.replace('animalaux', 'animaux'),
} as const;
