import { useCallback, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DetailRappelLot } from '@/features/production/components/DetailRappelLot';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuProduit,
  etatDuLot,
  lotsARappeler,
  trierLots,
  validerRappelLot,
} from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { ETAT_LOT, PRODUIT_A_LOTS, TRI_LOT } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateShortFR, todayISO } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.rappelsLots;

/**
 * La section des rappels de lots : les lots vendus dont le contrôle n'est pas ok (à rappeler), puis ceux déjà rappelés, pour les
 * fromages et la boucherie / charcuterie de l'animal actif. Le bouton + lance un rappel.
 */
export default function RappelsLots() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  /** Le lot dont on confirme la validation du rappel. */
  const [aValider, setAValider] = useState<LotFromage | null>(null);
  /** Le lot dont on affiche le détail (il reste en place pendant que la fenêtre se ferme). */
  const [lotOuvert, setLotOuvert] = useState<LotFromage | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const charger = useCallback(() => lireArchiveStock().then(setArchive), []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const articles = archive
    ? new Set(
        Object.values(PRODUIT_A_LOTS).flatMap((p) => articlesDuProduit(p, archive, espece).map((a) => a.cle)),
      )
    : new Set<string>();
  const duProduit = (l: LotFromage) => articles.has(l.article);
  const aRappeler = trierLots(lotsARappeler({ lots: archive?.lots }).filter(duProduit), TRI_LOT.NUMERO, false);
  const rappeles = (archive?.lots ?? []).filter((l) => etatDuLot(l) === ETAT_LOT.RAPPELE && duProduit(l));
  const lignes = [
    ...aRappeler.map((lot) => ({ lot, detail: T.aRappeler(formatDateShortFR(lot.dateVente)) })),
    ...rappeles
      .sort((a, b) => (b.dateRappel ?? '').localeCompare(a.dateRappel ?? ''))
      .map((lot) => ({
        lot,
        detail: lot.dateRappelValide
          ? T.rappeleValide(formatDateShortFR(lot.dateRappel), formatDateShortFR(lot.dateRappelValide))
          : T.rappele(formatDateShortFR(lot.dateRappel)),
      })),
  ];

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <SelecteurEspece />
        {archive && lignes.length === 0 ? (
          <EmptyState title={T.aucun} />
        ) : (
          <BlocLignes>
            {lignes.map(({ lot, detail }) => (
              <ListRow
                key={lot.id}
                title={`${libelleArticle(lot.article, archive as ArchiveStock)} · ${lot.numero}`}
                subtitle={detail}
                onPress={() => {
                  setLotOuvert(lot);
                  setDetailVisible(true);
                }}
                trailing={
                  lot.dateRappel ? (
                    lot.dateRappelValide ? (
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={28}
                        color={colors.primary}
                        accessibilityLabel={T.valide}
                      />
                    ) : (
                      <Pressable
                        onPress={() => setAValider(lot)}
                        hitSlop={10}
                        accessibilityLabel={T.validerLeRappel}
                      >
                        <Ionicons name="time-outline" size={28} color={colors.textMuted} />
                      </Pressable>
                    )
                  ) : undefined
                }
              />
            ))}
          </BlocLignes>
        )}
      </ScrollView>
      <Fab
        options={[
          {
            label: TEXTES.production.fromages.rappeler,
            icon: 'alert-circle',
            onPress: () => router.push(ROUTES.productionRappel(PRODUIT_A_LOTS.FROMAGE)),
          },
          {
            label: TEXTES.production.charcuterie.rappeler,
            icon: 'alert-circle',
            onPress: () => router.push(ROUTES.productionRappel(PRODUIT_A_LOTS.CHARCUTERIE)),
          },
        ]}
      />
      <DetailRappelLot
        lot={lotOuvert}
        archive={archive}
        visible={detailVisible}
        onFermer={() => setDetailVisible(false)}
      />
      <ConfirmModal
        visible={!!aValider}
        title={T.validerQuestion(aValider?.numero ?? '')}
        message={T.validerMessage}
        confirmLabel={T.valider}
        onCancel={() => setAValider(null)}
        onConfirm={async () => {
          if (aValider) await validerRappelLot(aValider.id, todayISO());
          setAValider(null);
          charger();
        }}
      />
    </Screen>
  );
}
