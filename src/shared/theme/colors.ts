export const colors = {
  blanc: '#FFFFFF',
  noir: '#000000',
  /** Voile sombre derrière les fenêtres modales. */
  voile: 'rgba(0,0,0,0.35)',
  /** Voile plus sombre posé sur la caméra du scanner. */
  voileCamera: 'rgba(0,0,0,0.4)',
  background: '#F6F4EE',
  /** Le fond d'un champ posé sur une carte blanche (une section de formulaire) : il ressort sans cadre épais. */
  champ: '#F5F3EC',
  surface: '#FFFFFF',
  primary: '#3F6B3A',
  primaryDark: '#2C4D29',
  /** Bandeaux (en-tête + barre d'onglets) pendant un ajout, pour le distinguer visuellement de la navigation normale. */
  ajout: '#2D6CA6',
  /** Icônes de la barre d'onglets quand elle est bleue (ajout) : blanc pour les onglets inactifs… */
  ajoutIconInactif: '#FFFFFF',
  /** …et bleu clair pour l'onglet actif. */
  ajoutIconActif: '#A8D1FF',
  /** Fond des boutons secondaires (ex: Annuler) pendant un ajout, teinté bleu au lieu du vert habituel. */
  ajoutBadgeBg: '#DCE8F2',
  accent: '#C97B3D',
  text: '#25291F',
  textMuted: '#6B6F63',
  border: '#E1DDD0',
  danger: '#B3432B',
  /** Fond d'une carte en négatif (un solde déficitaire) : le rouge, très clair. */
  dangerFond: '#F6E2DC',
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
