import { Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Établissement actif et accès au sélecteur d'établissements. */
export function CarteEtablissement() {
  const { actif, etablissements, ouvrirSelecteur } = useEtablissement();

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{TEXTES.settings.reglages.etablissement}</Text>
      <Text style={commonStyles.line}>
        {TEXTES.settings.reglages.actuelDeuxPoints}
        {actif.nom}
      </Text>
      <Text style={commonStyles.muted}>
        {etablissements.length > 1
          ? TEXTES.settings.reglages.lengthEtablissementsChacunASes(etablissements.length)
          : TEXTES.settings.reglages.creezUnAutreEtablissementPour}
      </Text>
      <Button
        label={TEXTES.settings.reglages.changerCreerUnEtablissement}
        variant="secondary"
        onPress={ouvrirSelecteur}
      />
    </Card>
  );
}
