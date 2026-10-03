import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { CarteEtablissement } from '@/features/settings/components/CarteEtablissement';
import { CarteExport, CarteSauvegarde } from '@/features/settings/components/CartesDonnees';
import { CarteGoogleDrive } from '@/features/settings/components/CarteGoogleDrive';
import { useExportEtSauvegarde } from '@/features/settings/hooks/useExportEtSauvegarde';
import { useGoogleDrive } from '@/features/settings/hooks/useGoogleDrive';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { TEXTES } from '@/shared/textes';

export default function Reglages() {
  const donnees = useExportEtSauvegarde();
  const drive = useGoogleDrive();

  return (
    <Screen>
      <CarteEtablissement />
      <CarteExport d={donnees} />
      <CarteSauvegarde d={donnees} />
      <CarteGoogleDrive drive={drive} />

      <Text style={styles.footer}>{TEXTES.settings.reglages.troupeauChevresToutesLesDonnees}</Text>
    </Screen>
  );
}
