import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { YearPicker } from '@/shared/components/YearPicker';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { listToutesVentes, listVentes } from '@/features/comptabilite/repository/ventes';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import type { Vente } from '@/features/comptabilite/types';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { CATEGORIES_VENTE_VIANDE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.viande;

/** La viande et la charcuterie vendues de l'année (pour l'animal actif), avec leur total : un appui ouvre la vente. */
export default function ViandeVendue() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [ventes, setVentes] = useState<Vente[]>([]);

  const charger = useCallback(async () => {
    const [toutesAnnees, liste] = await Promise.all([
      toutesLesAnneesConnues(),
      regrouper ? listToutesVentes() : listVentes(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setVentes(
      liste.filter(
        (v) =>
          (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(v.categorie) &&
          [espece as string, ACTIVITE_COMMUNE as string].includes(activiteVente(v)),
      ),
    );
  }, [settings.anneeActive, regrouper, espece]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const total = ventes.reduce((somme, v) => somme + (v.prix ?? 0), 0);

  return (
    <Screen scroll={false}>
      <View style={commonStyles.enteteListe}>
        <LigneFiltres>
          <YearPicker
            annees={annees}
            value={settings.anneeActive}
            onChange={setAnneeActive}
            tout={regrouper}
            onChoisirTout={choisirToutesAnnees}
          />
          <SelecteurEspece />
        </LigneFiltres>
        {ventes.length > 0 ? (
          <Text style={commonStyles.lineBold}>{T.total(formatMontant(total))}</Text>
        ) : null}
      </View>
      <FlatList
        data={ventes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listeBloc}
        ListEmptyComponent={<EmptyState title={T.aucune} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={ventes.length}>
            <ListRow
              title={item.precision || LABEL_CATEGORIE_VENTE[item.categorie]}
              subtitle={[formatDateFR(item.date), item.client].filter(Boolean).join(' · ')}
              trailing={<Text style={commonStyles.lineBold}>{formatMontant(item.prix ?? 0)}</Text>}
              onPress={() => router.push(ROUTES.ficheVente(item.id))}
            />
          </LigneDeBloc>
        )}
      />
    </Screen>
  );
}
