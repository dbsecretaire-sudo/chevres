import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlocListe, separationBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { colors } from '@/shared/theme/colors';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import AccueilEntreprise from '@/features/accueil/screens/AccueilEntreprise';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TuilesAccueil } from '@/features/accueil/components/TuilesAccueil';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { TEXTES } from '@/shared/textes';

/** Accueil de l'élevage, ou celui de l'entreprise quand l'établissement actif n'est pas un élevage. */
export default function Accueil() {
  return modeEntreprise() ? <AccueilEntreprise /> : <AccueilElevage />;
}

function AccueilElevage() {
  const router = useRouter();
  const { annee, annees, setAnneeActive, stats } = useAccueil();
  const T = TEXTES.accueil.accueil;

  /** Une ligne d'action : une icône, ce qu'on y fait, et une flèche. */
  const action = (titre: string, icone: keyof typeof Ionicons.glyphMap, route: string, aide?: string) => (
    <ListRow
      key={route}
      title={titre}
      subtitle={aide}
      trailing={<Ionicons name={icone} size={24} color={colors.primary} />}
      onPress={() => router.push(route as never)}
    />
  );

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>

      <TuilesAccueil stats={stats} annee={annee} />

      <Text style={styles.sectionTitle}>{T.aSavoir}</Text>
      {action(
        T.derniereVisiteVeterinaire,
        'medkit',
        ROUTES.SANTE_VETERINAIRE,
        stats?.derniereVisite
          ? new Date(stats.derniereVisite).toLocaleDateString(LOCALE)
          : T.aucuneVisiteEnregistreeCetteAnnee,
      )}

      <Text style={styles.sectionTitle}>{T.actionsRapides}</Text>
      {/* Les actions rapides : un seul bloc blanc, les lignes séparées par un fin trait. */}
      <BlocListe>
        {[
          action(T.ajouterUnAnimal, 'add-circle', ROUTES.CHEPTEL_AJOUT_RAPIDE),
          action(T.saisirUneEcriture, 'cash', ROUTES.COMPTABILITE_NOUVELLE),
          action(T.sante, 'nutrition', ROUTES.SANTE),
        ].map((ligne, i) => (
          <View key={i} style={i > 0 ? separationBloc : undefined}>
            {ligne}
          </View>
        ))}
      </BlocListe>
    </Screen>
  );
}
