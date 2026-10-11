import { useState } from 'react';

/**
 * Les filtres des colonnes d'un tableau, comme dans Excel : pour chaque colonne, les valeurs qu'on garde (toutes tant qu'on n'a rien
 * décoché). `colonnes` dit comment lire la valeur d'une colonne dans une ligne, telle qu'elle s'affiche.
 */
export function useFiltresColonnes<L, C extends string>(colonnes: Record<C, (ligne: L) => string>) {
  const [gardees, setGardees] = useState<Partial<Record<C, string[]>>>({});

  /** Les lignes dont chaque colonne filtrée a une valeur gardée. */
  const filtrer = (lignes: L[]): L[] =>
    lignes.filter((ligne) =>
      (Object.keys(gardees) as C[]).every((c) => {
        const valeurs = gardees[c];
        return !valeurs || valeurs.includes(colonnes[c](ligne));
      }),
    );

  /** Les valeurs d'une colonne, chacune une fois, dans l'ordre des lignes données. */
  const valeurs = (lignes: L[], colonne: C): string[] => [...new Set(lignes.map(colonnes[colonne]))];

  return {
    filtrer,
    valeurs,
    /** Les valeurs gardées d'une colonne (rien : toutes). */
    gardees: (colonne: C): string[] | undefined => gardees[colonne],
    actif: (colonne: C): boolean => gardees[colonne] !== undefined,
    /** Garde ces valeurs pour la colonne ; sans liste, le filtre est effacé. */
    appliquer: (colonne: C, valeursGardees: string[] | undefined) =>
      setGardees((actuelles) => ({ ...actuelles, [colonne]: valeursGardees })),
  };
}
