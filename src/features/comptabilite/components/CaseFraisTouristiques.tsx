import { Text } from 'react-native';
import { atelierDeLaCase, estFraisTouristique } from '@/features/comptabilite/services/fraisTouristiques';
import { Checkbox } from '@/shared/components/Checkbox';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.fraisTouristiques;

/**
 * La case « Inclure dans les frais touristiques » d'une dépense (une assurance de véhicule ou d'accueil du public, les factures de l'office de tourisme, des flyers…) :
 * cochée, la charge est rangée dans l'atelier Agritourisme, donc dans le coût de chaque visite ; décochée, c'est une charge commune. C'est un raccourci du choix de
 * l'atelier, juste dessous.
 */
export function CaseFraisTouristiques({
  atelier,
  onChange,
}: {
  atelier: string | undefined;
  /** L'atelier choisi par la case (l'agritourisme, ou vide). */
  onChange: (atelier: string) => void;
}) {
  return (
    <>
      <Checkbox label={T.label} value={estFraisTouristique(atelier)} onChange={(cochee) => onChange(atelierDeLaCase(cochee))} />
      <Text style={commonStyles.note}>{T.aide}</Text>
    </>
  );
}
