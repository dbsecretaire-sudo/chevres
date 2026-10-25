import { Switch, Text, View } from 'react-native';
import { useAccueilEnDeuxColonnes } from '@/bureau/colonnes';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { LigneRubrique } from '@/features/settings/components/LigneRubrique';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/settings/Reglages.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/**
 * L'onglet Organisation : ce qui est commun à toute l'exploitation — l'établissement, les carnets d'adresses (clients et
 * fournisseurs) et les données (export, sauvegardes). Chaque rubrique ouvre sa page. Les réglages propres à un onglet sont dans cet
 * onglet : le cheptel dans Cheptel › Réglages ; la comptabilité, l'inventaire (conditionnement) et la fiscalité dans Comptabilité.
 */
export default function Reglages() {
  const { role, choisir } = useRole();
  // Deux colonnes : le menu est déjà à gauche, la colonne de droite montre l'établissement.
  const redirection = useAccueilEnDeuxColonnes(ROUTES.ORGANISATION_ETABLISSEMENT);
  if (redirection) return redirection;
  return (
    <Screen>
      {/* Comme sur la maquette : le mode avancé, en interrupteur (le bandeau du menu Plus renvoie ici). Éteint, on passe au mode normal. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{TEXTES.roles.choix.secretaire}</Text>
          <Text style={{ color: colors.textMuted }}>{TEXTES.roles.choix.secretaireAide}</Text>
        </View>
        <Switch
          value={role === ROLE.SECRETAIRE}
          onValueChange={(avance) => choisir(avance ? ROLE.SECRETAIRE : ROLE.BERGER)}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <BlocLignes>
        <LigneRubrique
          titre={T.sectionEtablissement}
          aide={T.aideRubriqueEtablissement}
          icone="business"
          route={ROUTES.ORGANISATION_ETABLISSEMENT}
        />
        <LigneRubrique
          titre={TEXTES.settings.listesChoix.titre}
          aide={T.aideListesChoix}
          icone="list"
          route={ROUTES.ORGANISATION_LISTES}
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
        <LigneRubrique
          titre={T.sectionRegles}
          aide={T.aideRubriqueRegles}
          icone="list"
          route={ROUTES.ORGANISATION_REGLES}
        />
      </BlocLignes>
      <Text style={styles.footer}>{T.troupeauChevresToutesLesDonnees}</Text>
    </Screen>
  );
}
