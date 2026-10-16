import { useEffect, useState } from 'react';
import { SelectField } from '@/shared/components/SelectField';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { elementsDeFormule } from '@/features/commercial/services/agritourisme';
import type { ElementFormule } from '@/features/commercial/types';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commercial.agritourisme.elementFacture;

interface Props {
  /** L'identifiant de l'élément choisi (vide : une charge commune à toutes les visites). */
  value: string;
  onChange: (element: string) => void;
}

/**
 * L'élément de l'agritourisme qu'une charge concerne (le 4x4, le repas, la dégustation…) : la Rentabilité en tire le coût de chaque
 * formule. Facultatif : sans élément, la charge se partage entre toutes les visites.
 */
export function ChampElementAgritourisme({ value, onChange }: Props) {
  const [elements, setElements] = useState<ElementFormule[]>([]);
  useEffect(() => {
    lireArchiveCommercial().then((archive) => setElements(elementsDeFormule(archive)));
  }, []);
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[{ value: '', label: T.commun }, ...elements.map((e) => ({ value: e.id, label: e.nom }))]}
      aide={T.aide}
    />
  );
}
