/**
 * Les bulles d'actions de l'accueil « ferme » : quand on touche un bouton d'une colonne, ses actions sortent en bulles rondes en arc autour
 * de lui, vers le centre de l'écran. Ici seulement la géométrie, sans rien d'affichage ; les positions sont en points, relatives au centre du
 * bouton (`x` vers la droite, `y` vers le bas).
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Les centres des `n` bulles en arc à `rayon` points du bouton. `centreDeg` est la direction de l'arc (0 : vers la droite, 90 : vers le haut,
 * 180 : vers la gauche) et `ecartDeg` son ouverture totale. Les bulles vont du haut vers le bas pour un arc sur le côté ; une seule se met droit
 * dans la direction.
 */
export function positionsEnArc(n: number, rayon: number, centreDeg: number, ecartDeg: number): Point[] {
  if (n <= 0) return [];
  const versLeCentre = (deg: number): Point => {
    const a = (deg * Math.PI) / 180;
    // `|| 0` : un zéro négatif (-0) devient un vrai zéro.
    return { x: Math.round(rayon * Math.cos(a)) || 0, y: -Math.round(rayon * Math.sin(a)) || 0 };
  };
  if (n === 1) return [versLeCentre(centreDeg)];
  return Array.from({ length: n }, (_, i) => versLeCentre(centreDeg + ecartDeg / 2 - (ecartDeg * i) / (n - 1)));
}

/** Le rayon de l'arc : plus il y a de bulles, plus il s'élargit pour qu'elles ne se touchent pas. */
export const rayonDesBulles = (n: number): number => 120 + Math.max(0, n - 3) * 14;

/** L'ouverture de l'arc : plus il y a de bulles, plus il s'ouvre (140° au plus). */
export const ecartDesBulles = (n: number): number => Math.min(140, 40 + n * 22);

/**
 * De combien décaler le bouton (vers le bas : positif) pour que toutes les bulles restent dans l'écran, de `marge` points du haut et du bas.
 * Zéro quand elles y tiennent déjà.
 */
export function decalageVertical(positions: readonly Point[], ancreY: number, hauteurEcran: number, marge: number): number {
  if (positions.length === 0) return 0;
  const haut = ancreY + Math.min(...positions.map((p) => p.y));
  const bas = ancreY + Math.max(...positions.map((p) => p.y));
  if (haut < marge) return marge - haut;
  if (bas > hauteurEcran - marge) return hauteurEcran - marge - bas;
  return 0;
}
