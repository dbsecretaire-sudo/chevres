import { useState } from 'react';
import { ModalListeValeurs } from '@/shared/components/ModalListeValeurs';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { TEXTES } from '@/shared/textes';

interface Props {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  /** Les valeurs proposées, et ce qu'en fait le crayon : la liste se modifie dans une fenêtre. */
  valeurs: string[];
  valeursParDefaut: readonly string[];
  onChangerValeurs: (valeurs: string[]) => void;
  /** Le titre de la fenêtre de modification de la liste. */
  titreListe: string;
  placeholder?: string;
  required?: boolean;
  /** Le libellé d'une valeur dans la liste (« 5,5 % » pour 5.5) ; à défaut, la valeur telle quelle. */
  formater?: (valeur: string) => string;
}

/**
 * Une liste déroulante dont l'utilisateur tient les valeurs : le crayon ouvre la fenêtre qui les modifie. Une valeur déjà choisie
 * qui n'est plus dans la liste reste proposée, sous son nom.
 */
export function ChampListeModifiable({
  label,
  value,
  onChange,
  valeurs,
  valeursParDefaut,
  onChangerValeurs,
  titreListe,
  placeholder,
  required,
  formater,
}: Props) {
  const [ouverte, setOuverte] = useState(false);
  const options = [...valeurs, ...(value && !valeurs.includes(value) ? [value] : [])].map((v) => ({
    value: v,
    label: formater ? formater(v) : v,
  }));
  return (
    <>
      <SelectFieldEditable<string>
        label={label}
        required={required}
        placeholder={placeholder ?? TEXTES.commun.selectField.selectionnerPoints}
        value={value}
        onChange={onChange}
        options={options}
        onEdit={() => setOuverte(true)}
      />
      <ModalListeValeurs
        visible={ouverte}
        titre={titreListe}
        valeurs={valeurs}
        valeursParDefaut={valeursParDefaut}
        onValider={(nouvelles) => {
          onChangerValeurs(nouvelles);
          setOuverte(false);
        }}
        onAnnuler={() => setOuverte(false)}
      />
    </>
  );
}
