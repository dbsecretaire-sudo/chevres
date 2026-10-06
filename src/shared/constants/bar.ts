/** Valeurs de la restauration, du bar et du stock du gîte — à modifier ici uniquement. */

/** Les parties de l'écran, dans l'ordre : la restauration d'abord, puis le bar, puis le stock. */
export const ONGLET_BAR = {
  RESTAURATION: 'restauration',
  BAR: 'bar',
  STOCK: 'stock',
} as const;

/** Le nombre maximum d'une même boisson sur un ticket du bar (la quantité se choisit de 1 à ce nombre). */
export const NOMBRE_MAX_BOISSONS_TICKET = 50;
