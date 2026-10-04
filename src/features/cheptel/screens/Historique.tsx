import { useCallback, useMemo, useState } from 'react';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Badge } from '@/shared/components/Badge';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { SelectField } from '@/shared/components/SelectField';
import { statutColors } from '@/shared/theme/colors';
import { listChevresHistorique } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { formatDateFR } from '@/shared/utils/dates';
import { libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { styles } from '@/shared/styles/cheptel/Historique.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TRI_HISTORIQUE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

type Tri = ValeurDe<typeof TRI_HISTORIQUE>;

const OPTIONS_TRI: { value: Tri; label: string }[] = [
  { value: TRI_HISTORIQUE.SORTIE, label: TEXTES.cheptel.historique.dateDeSortie },
  { value: TRI_HISTORIQUE.NAISSANCE, label: TEXTES.commun.general.dateDeNaissance },
  { value: TRI_HISTORIQUE.BOUCLE, label: TEXTES.commun.general.nDeBoucle },
];

function compareBoucle(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

export default function Historique() {
  const router = useRouter();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const [chevres, setChevres] = useState<Chevre[]>([]);
  const [tri, setTri] = useState<Tri>(TRI_HISTORIQUE.SORTIE);

  useFocusEffect(
    useCallback(() => {
      listChevresHistorique().then(setChevres);
      // L'espèce n'est pas lue dans le chargement : elle sert à le relancer quand elle change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece]),
  );

  const triees = useMemo(() => {
    return [...chevres].sort((a, b) => {
      if (tri === TRI_HISTORIQUE.NAISSANCE) return b.dateNaissance.localeCompare(a.dateNaissance);
      if (tri === TRI_HISTORIQUE.BOUCLE) return compareBoucle(a.numeroBoucle, b.numeroBoucle);
      return (b.dateStatut ?? '').localeCompare(a.dateStatut ?? '');
    });
  }, [chevres, tri]);

  return (
    <Screen scroll={false}>
      <SelecteurEspece />
      <View style={styles.filtre}>
        <SelectField
          label={TEXTES.cheptel.historique.trierPar}
          value={tri}
          onChange={setTri}
          options={OPTIONS_TRI}
        />
      </View>
      <FlatList
        data={triees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listBox}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.cheptel.historique.aucunHistorique}
            subtitle={TEXTES.cheptel.historique.lesChevresMortesEnvoyeesA}
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={libelleChevre(item)}
            subtitle={TEXTES.commun.general.accordNeLeDate(
              statutLabel(item.statut, item.sexe),
              formatDateFR(item.dateStatut),
            )}
            trailing={<Badge label={statutLabel(item.statut, item.sexe)} color={statutColors[item.statut]} />}
            onPress={() => router.push(ROUTES.ficheChevre(item.id))}
          />
        )}
      />
    </Screen>
  );
}
