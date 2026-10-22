import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fab } from '@/shared/components/Fab';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { analysesDuProduit, joursDepuis, verdictDeLAnalyse, type Verdict } from '@/features/analyses/services/analysesProduits';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { ProduitAnalyse } from '@/features/settings/settings';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const T = TEXTES.analysesProduits;

/** La couleur et l'icône de chaque jugement. */
const APPARENCE: Record<Verdict, { icone: keyof typeof Ionicons.glyphMap; couleur: string }> = {
  conforme: { icone: 'checkmark-circle', couleur: colors.success },
  surveiller: { icone: 'alert-circle', couleur: '#C98A2B' },
  non_conforme: { icone: 'close-circle', couleur: colors.danger },
};

/**
 * Les analyses d'un produit fini (fromage ou charcuterie) : les autocontrôles de la ferme, de la plus récente à la plus ancienne, chacune avec son
 * jugement (conforme, à surveiller, non conforme) ; « + » en ajoute une. Le produit se donne en paramètre (`?produit=fromage`).
 */
export default function ListeAnalysesProduit() {
  const router = useRouter();
  const { produit: demande } = useLocalSearchParams<{ produit?: string }>();
  const produit: ProduitAnalyse = demande === 'charcuterie' ? 'charcuterie' : 'fromage';
  const { settings } = useAppSettings();
  const analyses = analysesDuProduit(settings.exploitation?.analysesProduits, produit);
  const derniere = analyses[0];

  return (
    <Screen>
      <Text style={commonStyles.note}>{T.repere}</Text>
      <Text style={commonStyles.note}>{T.frequenceAide}</Text>
      {derniere ? (
        <Text style={commonStyles.lineBold}>
          {T.derniere(formatDateFR(derniere.date), Math.max(0, joursDepuis(derniere.date, todayISO())))}
        </Text>
      ) : (
        <Text style={commonStyles.mutedItalic}>{T.aucuneAnalyse}</Text>
      )}
      <BlocLignes>
        {analyses.map((a) => {
          const verdict = verdictDeLAnalyse(a);
          const apparence = verdict ? APPARENCE[verdict] : undefined;
          return (
            <ListRow
              key={a.id}
              title={[formatDateFR(a.date), a.echantillon].filter(Boolean).join(' · ')}
              subtitle={[verdict ? T.verdicts[verdict] : T.sansVerdict, a.lot ? `lot ${a.lot}` : undefined, a.numeroRapport ? `rapport ${a.numeroRapport}` : undefined]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                apparence ? (
                  <View>
                    <Ionicons name={apparence.icone} size={26} color={apparence.couleur} />
                  </View>
                ) : undefined
              }
              onPress={() => router.push(ROUTES.analyseProduit(produit, a.id) as never)}
            />
          );
        })}
      </BlocLignes>
      {/* De la place sous la dernière ligne : le bouton « + » ne la cache pas. */}
      <View style={{ height: 80 }} />
      <Fab options={[{ label: T.nouvelle, icon: 'add-circle', onPress: () => router.push(ROUTES.analyseProduit(produit) as never) }]} />
    </Screen>
  );
}
