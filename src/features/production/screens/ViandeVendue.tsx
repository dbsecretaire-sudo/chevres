import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Fab } from '@/shared/components/Fab';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { Checkbox } from '@/shared/components/Checkbox';
import { LigneChevre } from '@/features/cheptel/components/LigneChevre';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { SelectModal } from '@/shared/components/SelectModal';
import { listClients } from '@/features/clients/repository';
import { estParticulier } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { saveChevre } from '@/features/cheptel/repository/chevres';
import { estReserve, liberer } from '@/features/cheptel/services/reservations';
import { reserverAnimauxPourClient } from '@/features/commercial/services/reservations';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import { nomComplet } from '@/shared/utils/personne';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { useLots } from '@/features/exploitation/hooks/useLots';
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
/** Les ventes sans facture d'animaux sans boucle : morts (d'office) ou vendus vivants. */
type SorteDeVendus = 'morts' | 'vivants';

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

  /** Les clients, et l'animal sans boucle touché : son menu (réserver, écriture sans facture…), puis le choix du client. */
  const [clients, setClients] = useState<Client[]>([]);
  const [menu, setMenu] = useState<Chevre | null>(null);
  const [cible, setCible] = useState<{ animal: Chevre; action: 'reserver' | 'ecriture' } | null>(null);

  const charger = useCallback(async () => {
    // Un animal se réserve, ou se vend sans facture, pour un client particulier seulement.
    listClients().then((liste) => setClients(liste.filter(estParticulier)));
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
  /** Vendues sans facture : les ventes (écritures) des animaux sans boucle, mortes (« morte » ou à l'abattoir) ou vivantes (« vendue »). */
  const estVivante = (v: Vente) =>
    idsDesAnimaux(v).some((id) => animaux.get(id)?.statut === STATUT_CHEVRE.VENDUE);
  const ventesVivantes = sansFacture.filter(estVivante);
  const ventesMortes = sansFacture.filter((v) => !estVivante(v));
  const ongletActif: OngletViande =
    !avance && (onglet === 'avendre' || onglet === 'vendue') ? 'afacturer' : onglet;
  const venteDeLOnglet =
    ongletActif === 'facturee'
      ? facturees
      : ongletActif === 'vendue'
        ? sousOnglet === 'morts'
          ? ventesMortes
          : ventesVivantes
        : [];
  const total = venteDeLOnglet.reduce((somme, v) => somme + (v.prix ?? 0), 0);

  /** L'écriture comptable sans facture d'un animal pour un client : la vente s'ouvre avec le client et l'animal. */
  const ouvrirEcriture = (animal: Chevre, clientId?: string) =>
    router.push({
      pathname: ROUTES.COMPTABILITE_NOUVELLE,
      params: {
        type: TYPE_FACTURE.EMISE,
        categorie: CATEGORIE_RECETTE.VIANDE,
        facture: 'non',
        animaux: animal.id,
        ...(clientId ? { client: clientId } : {}),
      },
    });

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
                  { valeur: 'vendue' as const, label: T.onglets.sansFactureVendue(sansFacture.length) },
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
        {ongletActif === 'vendue' ? (
          <>
            <PucesDefilantes<SorteDeVendus>
              puces={[
                { valeur: 'morts', label: T.sousOnglets.morts(ventesMortes.length) },
                { valeur: 'vivants', label: T.sousOnglets.vivants(ventesVivantes.length) },
              ]}
              valeur={sousOnglet}
              onChoisir={setSousOnglet}
            />
          </>
        ) : null}
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
          ListEmptyComponent={<EmptyState title={T.rienASansFacture} />}
          renderItem={({ item, index }) => (
            <LigneDeBloc index={index} total={aVendre.length}>
              <LigneChevre chevre={item} onPress={() => setMenu(item)} />
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
      {/* Un animal sans boucle à vendre : le réserver pour un client, ou inscrire sa vente sans facture. */}
      <OptionsModal
        visible={!!menu}
        onClose={() => setMenu(null)}
        title={menu ? libelleChevre(menu) : undefined}
        options={
          menu
            ? [
                ...(estReserve(menu)
                  ? [
                      {
                        label: TEXTES.cheptel.reservation.ecriturePour(menu.reservation!.client),
                        icon: 'receipt' as const,
                        onPress: () => ouvrirEcriture(menu, menu.reservation!.clientId),
                      },
                      {
                        label: TEXTES.cheptel.reservation.liberer,
                        icon: 'lock-open' as const,
                        onPress: async () => {
                          await saveChevre(liberer(menu));
                          charger();
                        },
                      },
                    ]
                  : [
                      {
                        label: TEXTES.cheptel.reservation.reserver,
                        icon: 'bookmark' as const,
                        onPress: () => setCible({ animal: menu, action: 'reserver' }),
                      },
                      {
                        label: TEXTES.cheptel.reservation.ecriture,
                        icon: 'receipt' as const,
                        onPress: () => setCible({ animal: menu, action: 'ecriture' }),
                      },
                    ]),
                {
                  label: TEXTES.cheptel.reservation.ouvrirLaFiche,
                  icon: 'paw' as const,
                  onPress: () => router.push(ROUTES.ficheChevre(menu.id)),
                },
              ]
            : []
        }
      />
      <SelectModal<string>
        visible={!!cible}
        titre={clients.length === 0 ? TEXTES.cheptel.reservation.aucunClient : TEXTES.cheptel.reservation.choisirClient}
        value=""
        searchable
        options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
        onSelect={async (clientId) => {
          const choisi = cible;
          const client = clients.find((c) => c.id === clientId);
          setCible(null);
          if (!choisi || !client) return;
          if (choisi.action === 'ecriture') return ouvrirEcriture(choisi.animal, client.id);
          // L'animal rejoint le bon de commande ouvert de ce client (créé s'il n'y en a pas).
          await reserverAnimauxPourClient([choisi.animal], client);
          charger();
        }}
        onClose={() => setCible(null)}
      />
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
