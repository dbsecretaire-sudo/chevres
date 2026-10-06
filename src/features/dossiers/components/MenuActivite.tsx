import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { colors } from '@/shared/theme/colors';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { TEXTES } from '@/shared/textes';

/** Menu burger de l'écran Activité : la liste des clients (la structure type des dossiers est dans les Réglages). */
export function MenuActivite() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const T = TEXTES.dossiers.explorateur;

  return (
    <>
      <Pressable style={styles.boutonEntete} onPress={() => setOuvert(true)} hitSlop={8}>
        <Ionicons name="menu" size={28} color={colors.blanc} />
      </Pressable>
      <OptionsModal
        visible={ouvert}
        onClose={() => setOuvert(false)}
        options={[
          { label: T.menuClients, icon: 'people', onPress: () => router.push(ROUTES.CLIENTS) },
          // Prestations de service et activité financière ensemble : le journal est proposé ici.
          ...(activitesEtablissement().includes(ACTIVITE_SOCIETE.LIBERAL)
            ? [
                {
                  label: TEXTES.trading.journal.titre,
                  icon: 'stats-chart' as const,
                  onPress: () => router.push(ROUTES.JOURNAL_TRADING),
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
