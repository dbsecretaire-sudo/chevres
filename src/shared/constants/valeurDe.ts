/** Type union des valeurs d'un objet de constantes déclaré `as const` (ex : `ValeurDe<typeof SEXE>` = 'M' | 'F'). */
export type ValeurDe<T> = T[keyof T];
