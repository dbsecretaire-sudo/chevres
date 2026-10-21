import { SelectField } from '@/shared/components/SelectField';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { libelleVehicule, vehiculesProposes } from '@/features/exploitation/services/flotte';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: string;
  onChange: (id: string) => void;
}

/**
 * Le véhicule de la flotte qu'une écriture concerne (une réparation, une prime ou une indemnité d'assurance) : un menu déroulant des plaques. Seuls les véhicules
 * actifs sont proposés ; celui déjà lié à l'écriture reste proposé, même devenu inactif.
 */
export function ChampVehicule({ value, onChange }: Props) {
  const T = TEXTES.flotte.champ;
  const { settings } = useAppSettings();
  const proposes = vehiculesProposes(settings.exploitation?.flotte, value);
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[{ value: '', label: T.aucun }, ...proposes.map((v) => ({ value: v.id, label: libelleVehicule(v) }))]}
      aide={T.aide}
    />
  );
}
