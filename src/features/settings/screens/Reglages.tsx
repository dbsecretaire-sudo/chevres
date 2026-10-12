import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/**
 * L'onglet Organisation : ce qui est commun à toute l'exploitation — l'établissement, les carnets d'adresses (clients et
 * fournisseurs) et les données (export, sauvegardes). Chaque rubrique ouvre sa page. Les réglages propres à un onglet sont dans cet
 * onglet : le cheptel dans Cheptel › Réglages ; la comptabilité, l'inventaire (conditionnement) et la fiscalité dans Comptabilité.
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
          titre={T.sectionTiers}
          aide={T.aideRubriqueTiers}
          icone="person"
          route={ROUTES.ORGANISATION_TIERS}
        />
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
