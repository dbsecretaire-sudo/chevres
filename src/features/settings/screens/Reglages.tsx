import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ROUTES } from '@/shared/constants/routes';
import { inventaireAccessible } from '@/features/settings/utils/rubriques';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/**
 * L'onglet Organisation : un menu de rubriques (l'établissement, la comptabilité, l'inventaire, les données), comme l'onglet
 * Santé. Chaque rubrique ouvre sa page, où se trouvent ses options.
 */
export default function Reglages() {
  return (
    <Screen>
      <BlocLignes>
        <LigneRubrique
          titre={T.sectionEtablissement}
          aide={T.aideRubriqueEtablissement}
          icone="business"
          route={ROUTES.ORGANISATION_ETABLISSEMENT}
        />
        <LigneRubrique
          titre={T.sectionComptabilite}
          aide={T.aideRubriqueComptabilite}
          icone="calculator"
          route={ROUTES.ORGANISATION_COMPTABILITE}
        />
        {inventaireAccessible() ? (
          <LigneRubrique
            titre={T.sectionInventaire}
            aide={T.aideRubriqueInventaire}
            icone="cube"
            route={ROUTES.ORGANISATION_INVENTAIRE}
          />
        ) : null}
        <LigneRubrique
          titre={T.sectionDonnees}
          aide={T.aideRubriqueDonnees}
          icone="server"
          route={ROUTES.ORGANISATION_DONNEES}
        />
      </BlocLignes>
      <Text style={styles.footer}>{T.troupeauChevresToutesLesDonnees}</Text>
    </Screen>
  );
}
