import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ROUTES } from '@/shared/constants/routes';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { Screen } from '@/shared/components/Screen';
import { CarteExport, CarteSauvegarde } from '@/features/settings/components/CartesDonnees';
import { CarteGoogleDrive } from '@/features/settings/components/CarteGoogleDrive';
import { useExportEtSauvegarde } from '@/features/settings/hooks/useExportEtSauvegarde';
import { useGoogleDrive } from '@/features/settings/hooks/useGoogleDrive';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { TEXTES } from '@/shared/textes';

export default function Reglages() {
  const router = useRouter();
  // La structure type des dossiers ne sert qu'aux entreprises qui suivent des dossiers clients (pas à une association seule).
  const avecDossiersClients = activitesEtablissement().some((a) => a !== ACTIVITE_SOCIETE.ASSOCIATION);
  const donnees = useExportEtSauvegarde();
  const drive = useGoogleDrive();

  return (
    <Screen>
      {modeEntreprise() ? (
        <Button
          variant="secondary"
          label={TEXTES.commun.general.informationsDeLEntreprise}
          onPress={() => router.push(ROUTES.INFORMATIONS_EXPLOITATION)}
        />
      ) : null}
      {avecDossiersClients ? (
        <Button
          variant="secondary"
          label={TEXTES.dossiers.structure.titre}
          onPress={() => router.push(ROUTES.STRUCTURE_DOSSIERS)}
        />
      ) : null}
      <CarteExport d={donnees} />
      <CarteSauvegarde d={donnees} />
      <CarteGoogleDrive drive={drive} />

      <Text style={styles.footer}>{TEXTES.settings.reglages.troupeauChevresToutesLesDonnees}</Text>
    </Screen>
  );
}
