import { View } from 'react-native';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { Screen } from '@/shared/components/Screen';
import { LigneImprimerBoucles } from '@/features/stock/components/LigneImprimerBoucles';
import EntrepotJeu from '@/features/stock/screens/EntrepotJeu';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux;

/**
 * La page « Boucles » (depuis les documents) : la liste des boucles à imprimer, puis le stock de boucles dans son cadre (boucles, boucles rouges,
 * rebouclage, tiptag), dont chaque carte ouvre le tableau de ses boucles.
 */
export default function PageBoucles() {
  return (
    <Screen>
      <GroupeAccueil titre={T.groupeLiens}>
        <BlocLignes>
          <LigneImprimerBoucles />
        </BlocLignes>
      </GroupeAccueil>
      <GroupeAccueil titre={T.documents.pageBoucles.groupeStock}>
        <View style={{ height: 480 }}>
          <EntrepotJeu avecCompte sansFermer lieu="boucles" sections={[SECTION_STOCK.BOUCLES]} titre={TEXTES.stock.boucles.stockDeBoucles} />
        </View>
      </GroupeAccueil>
    </Screen>
  );
}
