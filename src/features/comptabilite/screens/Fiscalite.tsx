import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/comptabilite/Fiscalite.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.fiscalite;

/**
 * La fiscalité : chaque déclaration — les impôts (micro-BA) et la déclaration RSA.
 */
export default function Fiscalite() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.titreSection}>{T.declarations}</Text>
      <BlocLignes>
        <ListRow
          title={TEXTES.commun.general.impotsMicroBa}
          subtitle={T.aideImpots}
          icone="receipt"
          onPress={() => router.push(ROUTES.FISCALITE_IMPOTS)}
        />
        <ListRow
          title={TEXTES.commun.general.declarationRsa}
          subtitle={T.aideChiffreAffaires}
          icone="calendar"
          onPress={() => router.push(ROUTES.FISCALITE_RSA)}
        />
      </BlocLignes>
    </Screen>
  );
}
