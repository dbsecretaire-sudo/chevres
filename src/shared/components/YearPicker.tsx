interface Props {
  annees: number[];
  value: number;
  onChange: (annee: number) => void;
  /** Vrai quand « Tout » est choisi (toutes les années regroupées). */
  tout?: boolean;
  /** Quand elle est donnée, le menu propose « Tout » en plus des années (pour les listes qui regroupent les années). */
  onChoisirTout?: () => void;
}

/**
 * Le choix de l'année d'une page : il n'y est plus. La capsule du haut de chaque page (téléphone comme Windows) a déjà l'année (et « Tout ») : il ne se
 * répète pas dans la page. Les écrans qui le posent gardent leur appel, qui ne montre rien.
 */
export const YearPicker: (props: Props) => null = () => null;
