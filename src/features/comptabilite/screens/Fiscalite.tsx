import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { ROUTES } from '@/shared/constants/routes';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { styles } from '@/shared/styles/comptabilite/Fiscalite.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.fiscalite;

/**
 * La fiscalité : d'abord les déclarations à valider (RSA trimestriel, URSSAF mensuel), puis chaque déclaration — les impôts,
 * le chiffre d'affaires (RSA pour un élevage), l'URSSAF et la TVA d'une entreprise.
 */
export default function Fiscalite() {
  const router = useRouter();
  const entreprise = modeEntreprise();

  return (
    <Screen>
      <BlocRappels avecTitre={false} />
      <Text style={styles.titreSection}>{T.declarations}</Text>
      <BlocLignes>
        <ListRow
          title={entreprise ? TEXTES.entreprise.menu.impots : TEXTES.commun.general.impotsMicroBa}
          subtitle={T.aideImpots}
          icone="receipt"
          onPress={() => router.push(ROUTES.FISCALITE_IMPOTS)}
        />
        <ListRow
          title={entreprise ? TEXTES.entreprise.menu.chiffreAffaires : TEXTES.commun.general.declarationRsa}
          subtitle={T.aideChiffreAffaires}
          icone="calendar"
          onPress={() => router.push(ROUTES.FISCALITE_RSA)}
        />
        {entreprise ? (
          <ListRow
            title={TEXTES.entreprise.menu.urssaf}
            subtitle={T.aideUrssaf}
            icone="cash"
            onPress={() => router.push(ROUTES.URSSAF)}
          />
        ) : null}
        <ListRow
          title={TEXTES.entreprise.menu.tva}
          subtitle={T.aideTva}
          icone="calculator"
          onPress={() => router.push(ROUTES.TVA)}
        />
      </BlocLignes>
    </Screen>
  );
}
