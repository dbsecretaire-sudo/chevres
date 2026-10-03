import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { TuilesAccueil } from '@/features/accueil/components/TuilesAccueil';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function Accueil() {
  const router = useRouter();
  const { annee, stats } = useAccueil();

  return (
    <Screen>
      <Text style={commonStyles.heading}>
        {TEXTES.accueil.accueil.troupeauEspace}
        {annee}
      </Text>

      <TuilesAccueil stats={stats} annee={annee} />

      <Pressable
        style={({ pressed }) => pressed && commonStyles.pressed}
        onPress={() => router.push(ROUTES.EXPLOITATION_VETERINAIRE)}
      >
        <Card>
          <Text style={commonStyles.lineBold}>{TEXTES.accueil.accueil.derniereVisiteVeterinaire}</Text>
          <Text style={styles.cardBody}>
            {stats?.derniereVisite
              ? new Date(stats.derniereVisite).toLocaleDateString(LOCALE)
              : TEXTES.accueil.accueil.aucuneVisiteEnregistreeCetteAnnee}
          </Text>
        </Card>
      </Pressable>

      <Text style={styles.sectionTitle}>{TEXTES.accueil.accueil.actionsRapides}</Text>
      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          label={TEXTES.accueil.accueil.cheptel}
          onPress={() => router.push(ROUTES.CHEPTEL_AJOUT_RAPIDE)}
        />
        <Button
          style={commonStyles.flex1}
          label={TEXTES.accueil.accueil.comptabilite}
          onPress={() => router.push(ROUTES.COMPTABILITE_NOUVELLE)}
          variant="secondary"
        />
      </View>

      <Button
        label={TEXTES.commun.general.informationsDeLExploitation}
        variant="secondary"
        onPress={() => router.push(ROUTES.INFORMATIONS_EXPLOITATION)}
      />
    </Screen>
  );
}
