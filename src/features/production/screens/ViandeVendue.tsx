import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Fab } from '@/shared/components/Fab';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { Checkbox } from '@/shared/components/Checkbox';
import { LigneChevre } from '@/features/cheptel/components/LigneChevre';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { useLots } from '@/features/exploitation/hooks/useLots';
import { nomDuLotVendus, type SorteDeVendus } from '@/features/exploitation/services/lotsVendus';
import { idsDesAnimaux, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { YearPicker } from '@/shared/components/YearPicker';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { listToutesVentes, listVentes } from '@/features/comptabilite/repository/ventes';
import { joursAbattusAFacturer, type JourAbattu } from '@/features/comptabilite/utils/animauxVendus';
import { especeDe } from '@/features/cheptel/utils/espece';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import type { Vente } from '@/features/comptabilite/types';
import type { Chevre } from '@/features/cheptel/types';
import { poidsTotal } from '@/features/cheptel/utils/poids';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import {
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  SEPARATEUR_ANIMAUX,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.viande;

type OngletViande = 'afacturer' | 'facturee' | 'avendre' | 'vendue';

/** La viande vendue de l'année (pour l'animal actif), avec leur total : un appui ouvre la vente. */
export default function ViandeVendue() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { settings, setAnneeActive, choisirToutesAnnees, patchSettings } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  /** Les fiches du cheptel, par identifiant : une vente de viande désigne ses animaux (la traçabilité passe par leurs boucles). */
  const [animaux, setAnimaux] = useState<Map<string, Chevre>>(new Map());
  /** Les jours d'abattage dont la viande n'est pas encore facturée. */
  const [aFacturer, setAFacturer] = useState<JourAbattu[]>([]);
  /** Les animaux que désigne une vente (de toutes les années) : un animal sans boucle déjà vendu n'est plus à vendre. */
  const [idsVendus, setIdsVendus] = useState<Set<string>>(new Set());
  /** Les animaux sans boucle vendus sans facture : morts ou vivants. */
  const [sousOnglet, setSousOnglet] = useState<SorteDeVendus>('morts');

  const charger = useCallback(async () => {
    const [toutesAnnees, liste, toutesVentes] = await Promise.all([
      toutesLesAnneesConnues(),
      regrouper ? listToutesVentes() : listVentes(settings.anneeActive),
      listToutesVentes(),
    ]);
    setAnnees(toutesAnnees);
    setIdsVendus(new Set(toutesVentes.flatMap((v) => idsDesAnimaux(v))));
    const cheptel = (await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)) as Chevre[];
    setAnimaux(new Map(cheptel.map((a) => [a.id, a])));
    setAFacturer(
      joursAbattusAFacturer(
        cheptel.filter((a) => especeDe(a) === espece),
        toutesVentes,
      ),
    );
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

  /** Trois onglets : la viande à facturer, la viande facturée, et celle vendue sans facture (les animaux sans boucle). */
  const [onglet, setOnglet] = useState<OngletViande>('afacturer');
  const facturees = ventes.filter((v) => venteADeclarer(v));
  const sansFacture = ventes.filter((v) => !venteADeclarer(v));
  /** Les animaux à l'abattoir pas encore vendus, par jour d'abattage : ceux avec boucle se facturent, ceux sans boucle se vendent sans facture. */
  const groupes = aFacturer.flatMap((j) =>
    [true, false]
      .map((avecBoucle) => ({
        date: j.date,
        avecBoucle,
        animaux: j.animaux.filter((a) => !!a.numeroBoucle === avecBoucle),
      }))
      .filter((g) => g.animaux.length > 0),
  );
  const groupesAFacturer = groupes.filter((g) => g.avecBoucle);
  const venteDeLOnglet = onglet === 'facturee' ? facturees : [];
  const { lots } = useLots();
  /** Un lot (d'abattoir ou d'animaux vendus) ouvert d'ici : la flèche de retour revient à la viande. */
  const ouvrirLot = (id: string) =>
    `${ROUTES.lot(id)}&retour=${encodeURIComponent(ROUTES.PRODUCTION_VIANDE)}`;
  /** Le mode avancé : les animaux sans boucle vendus sans facture (à vendre, vendus morts ou vivants) ont leurs onglets. */
  const avance = !!settings.exploitation?.ventesSansFacture;
  const parNaissance = (a: Chevre, b: Chevre) => b.dateNaissance.localeCompare(a.dateNaissance);
  const sansBoucle = [...animaux.values()].filter((a) => especeDe(a) === espece && !a.numeroBoucle?.trim());
  /** À vendre : les animaux sans boucle vivants, ou déjà à l'abattoir, qu'aucune vente ne désigne. */
  const aVendre = sansBoucle
    .filter(
      (a) =>
        (a.statut === STATUT_CHEVRE.VIVANTE || a.statut === STATUT_CHEVRE.ABATTOIR) && !idsVendus.has(a.id),
    )
    .sort(parNaissance);
  /** Vendus sans facture : ceux des ventes sans facture de l'année, morts (« morte » ou à l'abattoir) ou vivants (« vendue »). */
  const idsSansFacture = new Set(sansFacture.flatMap((v) => idsDesAnimaux(v)));
  const vendus = sansBoucle.filter((a) => idsSansFacture.has(a.id)).sort(parNaissance);
  const vendusMorts = vendus.filter((a) => a.statut !== STATUT_CHEVRE.VENDUE);
  const vendusVivants = vendus.filter((a) => a.statut === STATUT_CHEVRE.VENDUE);
  const ongletActif: OngletViande =
    !avance && (onglet === 'avendre' || onglet === 'vendue') ? 'afacturer' : onglet;
  const total = venteDeLOnglet.reduce((somme, v) => somme + (v.prix ?? 0), 0);

  /** La ligne d'un jour d'abattage : un appui ouvre la facture (ou la vente sans facture), sur ce jour d'abattage. */
  const ligneDuJour = (g: { date: string; avecBoucle: boolean; animaux: Chevre[] }) => {
    const poids = poidsTotal(g.animaux);
    return (
      <ListRow
        key={`${g.date}-${g.avecBoucle}`}
        title={T.abattoirLe(formatDateFR(g.date))}
        subtitle={[
          T.animaux(g.animaux.length),
          g.avecBoucle ? T.avecBoucle : T.sansBoucleSansFacture,
          poids ? T.poids(String(poids).replace('.', ',')) : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        onPress={() => {
          // Avec boucle : le lot d'abattoir (sa facture, ses animaux, d'où l'on facture) ; sans boucle : la vente sans facture.
          const lot = lots.find((l) => l.abattoir === g.date);
          if (g.avecBoucle && lot) return router.push(ouvrirLot(lot.id) as never);
          router.push({
            pathname: ROUTES.COMPTABILITE_NOUVELLE,
            params: {
              type: TYPE_FACTURE.EMISE,
              categorie: CATEGORIE_RECETTE.VIANDE,
              abattoir: g.date,
              ...(g.avecBoucle ? {} : { facture: 'non' }),
            },
          });
        }}
      />
    );
  };

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
        <PucesDefilantes<OngletViande>
          puces={[
            { valeur: 'afacturer', label: T.onglets.aFacturer(groupesAFacturer.length) },
            { valeur: 'facturee', label: T.onglets.facturee(facturees.length) },
            ...(avance
              ? [
                  { valeur: 'avendre' as const, label: T.onglets.sansFactureAVendre(aVendre.length) },
                  { valeur: 'vendue' as const, label: T.onglets.sansFactureVendue(vendus.length) },
                ]
              : []),
          ]}
          valeur={ongletActif}
          onChoisir={setOnglet}
        />
        {/* Avancé : activer ou désactiver les onglets des animaux sans boucle vendus sans facture. */}
        <Checkbox
          label={T.avance}
          value={avance}
          onChange={(v) =>
            patchSettings({ exploitation: { ...settings.exploitation, ventesSansFacture: v } })
          }
        />
        {venteDeLOnglet.length > 0 ? (
          <Text style={commonStyles.lineBold}>{T.total(formatMontant(total))}</Text>
        ) : null}
      </View>
      {/* La viande des animaux déjà à l'abattoir qui n'est pas encore vendue : un appui ouvre la facture, sur ce jour d'abattage. */}
      {ongletActif === 'afacturer' ? (
        <View style={commonStyles.listeSimple}>
          {groupesAFacturer.length === 0 ? (
            <EmptyState title={T.rienAFacturer} />
          ) : (
            groupesAFacturer.map(ligneDuJour)
          )}
        </View>
      ) : ongletActif === 'avendre' ? (
        <FlatList
          data={aVendre}
          keyExtractor={(a) => a.id}
          contentContainerStyle={commonStyles.listeBlocAvecFab}
          ListHeaderComponent={<Text style={commonStyles.note}>{T.sansFactureAVendreAide}</Text>}
          ListEmptyComponent={<EmptyState title={T.rienASansFacture} />}
          renderItem={({ item, index }) => (
            <LigneDeBloc index={index} total={aVendre.length}>
              <LigneChevre chevre={item} onPress={() => router.push(ROUTES.ficheChevre(item.id))} />
            </LigneDeBloc>
          )}
        />
      ) : ongletActif === 'vendue' ? (
        <FlatList
          data={sousOnglet === 'morts' ? vendusMorts : vendusVivants}
          keyExtractor={(a) => a.id}
          contentContainerStyle={commonStyles.listeBlocAvecFab}
          ListHeaderComponent={
            <View style={commonStyles.gap6}>
              <PucesDefilantes<SorteDeVendus>
                puces={[
                  { valeur: 'morts', label: T.sousOnglets.morts(vendusMorts.length) },
                  { valeur: 'vivants', label: T.sousOnglets.vivants(vendusVivants.length) },
                ]}
                valeur={sousOnglet}
                onChoisir={setSousOnglet}
              />
              {/* Le lot « Animaux vendus morts / vivants » : on y passe une vente de morts à vivants (leurs fiches suivent). */}
              {lots.some((l) => l.vendus === sousOnglet) ? (
                <Pressable
                  onPress={() =>
                    router.push(ouvrirLot(lots.find((l) => l.vendus === sousOnglet)!.id) as never)
                  }
                >
                  <Text style={commonStyles.lien}>{nomDuLotVendus(sousOnglet)}</Text>
                </Pressable>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptyState title={T.aucune} />}
          renderItem={({ item, index }) => (
            <LigneDeBloc index={index} total={(sousOnglet === 'morts' ? vendusMorts : vendusVivants).length}>
              <LigneChevre chevre={item} onPress={() => router.push(ROUTES.ficheChevre(item.id))} />
            </LigneDeBloc>
          )}
        />
      ) : (
        <FlatList
          data={venteDeLOnglet}
          keyExtractor={(item) => item.id}
          contentContainerStyle={commonStyles.listeBlocAvecFab}
          ListEmptyComponent={<EmptyState title={T.aucune} />}
          renderItem={({ item, index }) => (
            <LigneDeBloc index={index} total={venteDeLOnglet.length}>
              <ListRow
                title={item.precision || LABEL_CATEGORIE_VENTE[item.categorie]}
                subtitle={[
                  [formatDateFR(item.date), item.client].filter(Boolean).join(' · '),
                  tracabilite(item),
                ]
                  .filter(Boolean)
                  .join('\n')}
                trailing={<Text style={commonStyles.lineBold}>{formatMontant(item.prix ?? 0)}</Text>}
                onPress={() => router.push(ROUTES.ficheVente(item.id))}
              />
            </LigneDeBloc>
          )}
        />
      )}
      {/* Le rappel de lots de la boucherie / charcuterie vendue. */}
      <Fab
        options={[
          ...(avance
            ? [
                {
                  label: T.vendreSansFacture,
                  icon: 'add' as const,
                  onPress: () =>
                    router.push({
                      pathname: ROUTES.COMPTABILITE_NOUVELLE,
                      params: {
                        type: TYPE_FACTURE.EMISE,
                        categorie: CATEGORIE_RECETTE.VIANDE,
                        facture: 'non',
                      },
                    }),
                },
              ]
            : []),
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
