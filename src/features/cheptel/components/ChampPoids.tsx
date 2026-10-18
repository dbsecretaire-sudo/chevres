import { useState } from 'react';
import { FormField } from '@/shared/components/FormField';
import { lirePoids } from '@/features/cheptel/utils/poids';
import { TEXTES } from '@/shared/textes';

interface Props {
  value?: number;
  onChange: (poidsKg: number | undefined) => void;
  /** Un libellé propre à l'endroit (la sortie à l'abattoir parle du poids de carcasse) ; à défaut, « Poids (kg) ». */
  label?: string;
  /** Sans la phrase d'aide sous le champ (quand il est à côté d'un autre). */
  sansAide?: boolean;
}

/**
 * Le poids d'un animal en kilos, avec une virgule ou un point : le texte tapé est gardé tel quel (on peut écrire « 9, » avant « 9,5 »),
 * seul le nombre lu remonte.
 */
export function ChampPoids({ value, onChange, label, sansAide }: Props) {
  const [texte, setTexte] = useState(value !== undefined ? String(value).replace('.', ',') : '');
  return (
    <FormField
      label={label ?? TEXTES.cheptel.ficheChevre.poids}
      aide={sansAide ? undefined : TEXTES.cheptel.ficheChevre.poidsAide}
      value={texte}
      onChangeText={(t) => {
        setTexte(t);
        onChange(lirePoids(t));
      }}
      keyboardType="decimal-pad"
      placeholder="kg"
    />
  );
}
