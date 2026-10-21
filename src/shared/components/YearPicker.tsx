import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

/** La valeur de l'option « Tout » du menu des années. */
const VALEUR_TOUT = 'tout';

interface Props {
  annees: number[];
  value: number;
  onChange: (annee: number) => void;
  /** Vrai quand « Tout » est choisi (toutes les années regroupées). */
  tout?: boolean;
  /** Quand elle est donnée, le menu propose « Tout » en plus des années (pour les listes qui regroupent les années). */
  onChoisirTout?: () => void;
}

/** L'année active : une puce, et la liste des années (de la plus récente à la plus ancienne) au clic. */
export function YearPicker({ annees, value, onChange, tout, onChoisirTout }: Props) {
  // Sur le téléphone, la capsule du haut de chaque page a déjà le choix de l'année (et « Tout ») : il ne se répète pas dans la page.
  if (!estBureau()) return null;
  const options = [
    ...(onChoisirTout ? [{ value: VALEUR_TOUT, label: TEXTES.commun.choix.toutesAnnees }] : []),
    ...[...new Set([...annees, value])]
      .sort((a, b) => b - a)
      .map((annee) => ({ value: String(annee), label: String(annee) })),
  ];
  return (
    <ChoixDeroulant
      titre={TEXTES.commun.choix.annee}
      valeur={tout && onChoisirTout ? VALEUR_TOUT : String(value)}
      options={options}
      onChoisir={(choix) => (choix === VALEUR_TOUT ? onChoisirTout?.() : onChange(Number(choix)))}
    />
  );
}
