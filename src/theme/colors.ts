export const colors = {
  background: '#F6F4EE',
  surface: '#FFFFFF',
  primary: '#3F6B3A',
  primaryDark: '#2C4D29',
  /** Bandeaux (en-tête + barre d'onglets) pendant un ajout, pour le distinguer visuellement de la navigation normale. */
  ajout: '#2D6CA6',
  /** Icônes de la barre d'onglets quand elle est bleue (ajout) : blanc pour les onglets inactifs… */
  ajoutIconInactif: '#FFFFFF',
  /** …et blanc-gris pour l'onglet actif. */
  ajoutIconActif: '#D6DEE6',
  /** Fond des boutons secondaires (ex: Annuler) pendant un ajout, teinté bleu au lieu du vert habituel. */
  ajoutBadgeBg: '#DCE8F2',
  accent: '#C97B3D',
  text: '#25291F',
  textMuted: '#6B6F63',
  border: '#E1DDD0',
  danger: '#B3432B',
  success: '#3F6B3A',
  warning: '#C97B3D',
  badgeBg: '#EAF0E4',
};

export const statutColors: Record<string, string> = {
  vivante: '#3F6B3A',
  morte: '#6B6F63',
  abattoir: '#B3432B',
  vendue: '#C97B3D',
  autoconsommee: '#8A5A44',
  mortne: '#9B8F7A',
};
