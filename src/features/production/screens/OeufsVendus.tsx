import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Fab } from '@/shared/components/Fab';
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
import { CATEGORIE_RECETTE, CATEGORIE_VENTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.oeufs;

/** Les œufs vendus de l'année (pour l'animal actif : les poules), avec leur nombre et leur total : un appui ouvre la vente. */
export default function OeufsVendus() {
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
          v.categorie === CATEGORIE_VENTE.OEUFS &&
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
  const nombre = ventes.reduce((somme, v) => somme + (v.quantite ?? 0), 0);

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
          <Text style={commonStyles.lineBold}>{T.total(String(nombre), formatMontant(total))}</Text>
        ) : null}
      </View>
      <FlatList
        data={ventes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listeBlocAvecFab}
        ListEmptyComponent={<EmptyState title={T.aucune} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={ventes.length}>
            <ListRow
              title={`${item.quantite} ${TEXTES.comptabilite.ficheVente.oeufs}`}
              subtitle={[formatDateFR(item.date), item.client].filter(Boolean).join(' · ')}
              trailing={<Text style={commonStyles.lineBold}>{formatMontant(item.prix ?? 0)}</Text>}
              onPress={() => router.push(ROUTES.ficheVente(item.id))}
            />
          </LigneDeBloc>
        )}
      />
      {/* Une vente d'œufs s'enregistre comme toute recette : la nouvelle écriture, ouverte sur les œufs. */}
      <Fab
        options={[
          {
            label: T.ajouter,
            icon: 'add-circle',
            onPress: () =>
              router.push({
                pathname: ROUTES.COMPTABILITE_NOUVELLE,
                params: { type: TYPE_FACTURE.EMISE, categorie: CATEGORIE_RECETTE.OEUFS },
              }),
          },
        ]}
      />
    </Screen>
  );
}
