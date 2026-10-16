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
import type { Chevre } from '@/features/cheptel/types';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { CATEGORIE_VENTE, SEPARATEUR_ANIMAUX } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.viande;

/** La viande vendue de l'année (pour l'animal actif), avec leur total : un appui ouvre la vente. */
export default function ViandeVendue() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  /** Les fiches du cheptel, par identifiant : une vente de viande désigne ses animaux (la traçabilité passe par leurs boucles). */
  const [animaux, setAnimaux] = useState<Map<string, Chevre>>(new Map());

  const charger = useCallback(async () => {
    const [toutesAnnees, liste] = await Promise.all([
      toutesLesAnneesConnues(),
      regrouper ? listToutesVentes() : listVentes(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setAnimaux(new Map((await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)).map((a) => [a.id, a as Chevre])));
    setVentes(
      liste.filter(
        (v) =>
          v.categorie === CATEGORIE_VENTE.VIANDE &&
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

  /**
   * Ce que la vente dit de la viande : le jour d'abattoir, les boucles des animaux (de quoi retrouver d'où vient la viande, sans
   * lots : les betes passent par l'abattoir) et leur poids.
   */
  const tracabilite = (v: Vente): string => {
    const betes = (v.animaux ?? '')
      .split(SEPARATEUR_ANIMAUX)
      .filter(Boolean)
      .map((id) => animaux.get(id))
      .filter((a): a is Chevre => !!a);
    const boucles = betes.map((a) => a.numeroBoucle || a.nom || T.sansBoucle);
    const poids = poidsTotal(betes) ?? v.poidsKg;
    return [
      v.dateAbattoir ? T.abattoirLe(formatDateFR(v.dateAbattoir)) : '',
      boucles.length > 0 ? T.boucles(boucles.join(', ')) : '',
      poids ? T.poids(String(poids).replace('.', ',')) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  };

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
        contentContainerStyle={commonStyles.listeBlocAvecFab}
        ListEmptyComponent={<EmptyState title={T.aucune} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={ventes.length}>
            <ListRow
              title={item.precision || LABEL_CATEGORIE_VENTE[item.categorie]}
              subtitle={[[formatDateFR(item.date), item.client].filter(Boolean).join(' · '), tracabilite(item)]
                .filter(Boolean)
                .join('\n')}
              trailing={<Text style={commonStyles.lineBold}>{formatMontant(item.prix ?? 0)}</Text>}
              onPress={() => router.push(ROUTES.ficheVente(item.id))}
            />
          </LigneDeBloc>
        )}
      />
      {/* Le rappel de lots de la boucherie / charcuterie vendue. */}
      <Fab
        options={[
          {
            label: T.rappeler,
            icon: 'alert-circle',
            onPress: () => router.push(ROUTES.productionRappel(PRODUIT_A_LOTS.CHARCUTERIE)),
          },
        ]}
      />
    </Screen>
  );
}
