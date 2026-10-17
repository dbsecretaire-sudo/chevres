import { useCallback, useState } from 'react';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Fab } from '@/shared/components/Fab';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { Checkbox } from '@/shared/components/Checkbox';
import { LigneChevre } from '@/features/cheptel/components/LigneChevre';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PoidsModal } from '@/features/cheptel/components/PoidsModal';
import { SelectModal } from '@/shared/components/SelectModal';
import { listClients } from '@/features/clients/repository';
import { enregistrerCommande, getCommande } from '@/features/commercial/repository';
import { STATUT_COMMANDE } from '@/shared/constants/commercial';
import { estParticulier } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { getChevre, saveChevre } from '@/features/cheptel/repository/chevres';
import { estReserve, liberer, reservesDeLaCommande } from '@/features/cheptel/services/reservations';
import type { Commande } from '@/features/commercial/types';
import { bonOuvertDuClient, reserverAnimauxPourClient } from '@/features/commercial/services/reservations';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import { ageAtteint } from '@/shared/utils/age';
import { nomComplet } from '@/shared/utils/personne';
import { STATUT_CHEVRE, agePetitMax } from '@/shared/constants/cheptel';
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
import {
  animauxSansFactureAReparer,
  joursAbattusAFacturer,
  type JourAbattu,
} from '@/features/comptabilite/utils/animauxVendus';
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
import { formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';
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
  /** L'adresse de cet écran : la fiche d'un animal ouverte d'ici y revient. */
  const retour = useAdresseCourante();
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
  /** Les animaux d'un bon dont le poids manque, à demander avant d'ouvrir la facture (le premier est à l'écran). */
  const [poidsAvantVente, setPoidsAvantVente] = useState<{
    restants: Chevre[];
    /** Un bon déjà là (réservation validée) ; ou une facture directe : l'animal et son client, rien n'est réservé tant que la vente n'est pas ouverte. */
    bon?: Commande;
    direct?: { animal: Chevre; client: Client };
  } | null>(null);
  /** L'animal dont on note le poids (il s'écrit sur sa fiche : « Poids (kg) »). */
  const [pesee, setPesee] = useState<Chevre | null>(null);
  /** Des cabris réservés : remis vivants ou morts (morts : pas de document de circulation). */
  const [choixEtat, setChoixEtat] = useState<{ animal: Chevre; client: Client } | null>(null);
  /** « À vendre » : les animaux libres, ou ceux déjà réservés pour un client. */
  const [dispo, setDispo] = useState<'disponibles' | 'reserves'>('disponibles');
  const estPetit = (a: Chevre) => !ageAtteint(a.dateNaissance, agePetitMax(), todayISO());

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
    let cheptel = (await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)) as Chevre[];
    // Une seule fois : les animaux des ventes sans facture notés « morts » par l'ancienne règle sont « vendus ».
    if (!settings.exploitation?.reparationVentesSansFacture) {
      const reparees = new Map(animauxSansFactureAReparer(cheptel, toutesVentes).map((a) => [a.id, a]));
      for (const a of reparees.values()) await saveChevre(a);
      cheptel = cheptel.map((a) => reparees.get(a.id) ?? a);
      await patchSettings({ exploitation: { ...settings.exploitation, reparationVentesSansFacture: true } });
    }
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
  }, [settings.anneeActive, regrouper, espece, settings.exploitation, patchSettings]);

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
  const estVivante = (v: Vente) => v.etatAnimaux === 'vivants';
  /** Le nombre d'animaux de ces ventes (une vente peut en désigner plusieurs). */
  const nbAnimaux = (liste: Vente[]) => liste.reduce((n, v) => n + idsDesAnimaux(v).length, 0);
  const ventesVivantes = sansFacture.filter(estVivante);
  const ventesMortes = sansFacture.filter((v) => !estVivante(v));
  const aVendreLibres = aVendre.filter((a) => !estReserve(a));
  // Les réservés : par réservation (un client après l'autre, donc un bon de commande après l'autre), puis du plus récent au plus ancien.
  const aVendreReserves = aVendre
    .filter((a) => estReserve(a))
    .sort(
      (a, b) =>
        a.reservation!.client.localeCompare(b.reservation!.client, 'fr', { sensitivity: 'base' }) || parNaissance(a, b),
    );
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
        ...(animal.reservation?.etat ? { etat: animal.reservation.etat } : {}),
      },
    });

  /**
   * Valide la préparation du bon de commande de l'animal réservé, puis ouvre la vente : le bon est repris (circuit, produit, quantité, état
   * des animaux). Une réservation sans bon (d'avant les bons de commande) ouvre directement l'écriture.
   */
  const validerEtVendre = async (animal: Chevre) => {
    const bon = animal.reservation?.commandeId ? await getCommande(animal.reservation.commandeId) : undefined;
    if (!bon) return ouvrirEcriture(animal, animal.reservation?.clientId);
    await preparerEtVendre(bon, reservesDeLaCommande([...animaux.values()], bon.id));
  };

  /** Les animaux du bon sans poids : leur poids se demande avant la facture, un par un ; puis la vente s'ouvre. */
  const preparerEtVendre = async (bon: Commande, animauxDuBon: Chevre[]) => {
    const sansPoids = animauxDuBon.filter((a) => !a.poidsKg);
    if (sansPoids.length > 0) return setPoidsAvantVente({ bon, restants: sansPoids });
    await ouvrirLaVente(bon);
  };

  /** Le bon est validé (« préparée »), puis la vente s'ouvre avec lui. */
  const ouvrirLaVente = async (bon: Commande) => {
    if (bon.statut === STATUT_COMMANDE.A_PREPARER) await enregistrerCommande({ ...bon, statut: STATUT_COMMANDE.PREPAREE });
    router.push({
      pathname: ROUTES.COMPTABILITE_NOUVELLE,
      params: {
        type: TYPE_FACTURE.EMISE,
        categorie: CATEGORIE_RECETTE.VIANDE,
        facture: 'non',
        commande: bon.id,
      },
    });
  };

  /** Le poids saisi (ou passé) d'un animal du bon : on passe au suivant, puis à la facture. */
  const poidsSuivant = async (poidsKg?: number) => {
    const courant = poidsAvantVente;
    if (!courant) return;
    const [animal, ...restants] = courant.restants;
    if (poidsKg !== undefined) await saveChevre({ ...animal, poidsKg });
    if (restants.length > 0) return setPoidsAvantVente({ ...courant, restants });
    setPoidsAvantVente(null);
    if (courant.direct) return finirLaFactureDirecte(courant.direct.animal, courant.direct.client);
    await charger();
    if (courant.bon) await ouvrirLaVente(courant.bon);
  };

  /**
   * Facturer un animal sans réservation : c'est seulement à l'ouverture de la vente que l'animal est réservé (le bon du client se crée).
   * Une facture abandonnée avant (la fenêtre du poids fermée) n'enregistre rien : l'animal reste « à vendre ».
   */
  const finirLaFactureDirecte = async (animal: Chevre, client: Client) => {
    // L'animal est relu : son poids vient d'être noté.
    const frais = (await getChevre(animal.id)) ?? animal;
    const bon = await reserverAnimauxPourClient([frais], client);
    await charger();
    await ouvrirLaVente(bon);
  };

  /** Une facture directe : le poids de l'animal (et de ceux déjà au bon du client) se demande d'abord, sans rien enregistrer. */
  const lancerLaFactureDirecte = async (animal: Chevre, client: Client) => {
    const bonExistant = await bonOuvertDuClient(client);
    const duBon = bonExistant
      ? reservesDeLaCommande([...animaux.values()], bonExistant.id).filter((a) => a.id !== animal.id)
      : [];
    const sansPoids = [...duBon, animal].filter((a) => !a.poidsKg);
    if (sansPoids.length > 0) return setPoidsAvantVente({ restants: sansPoids, direct: { animal, client } });
    await finirLaFactureDirecte(animal, client);
  };

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
    // Les animaux sans boucle n'ont rien à lister : on en donne le nombre.
    const boucles = betes.filter((a) => a.numeroBoucle || a.nom).map((a) => a.numeroBoucle || a.nom!);
    const poids = poidsTotal(betes) ?? v.poidsKg;
    return [
      v.dateAbattoir ? T.abattoirLe(formatDateFR(v.dateAbattoir)) : '',
      boucles.length > 0 ? T.boucles(boucles.join(', ')) : '',
      betes.length > 0 ? T.animauxVendus(betes.length) : '',
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
                  { valeur: 'vendue' as const, label: T.onglets.sansFactureVendue(nbAnimaux(sansFacture)) },
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
        {ongletActif === 'avendre' ? (
          <PucesDefilantes<'disponibles' | 'reserves'>
            puces={[
              { valeur: 'disponibles', label: T.sousOnglets.disponibles(aVendreLibres.length) },
              { valeur: 'reserves', label: T.sousOnglets.reserves(aVendreReserves.length) },
            ]}
            valeur={dispo}
            onChoisir={setDispo}
          />
        ) : null}
        {ongletActif === 'vendue' ? (
          <>
            <PucesDefilantes<SorteDeVendus>
              puces={[
                { valeur: 'morts', label: T.sousOnglets.morts(nbAnimaux(ventesMortes)) },
                { valeur: 'vivants', label: T.sousOnglets.vivants(nbAnimaux(ventesVivantes)) },
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
          data={dispo === 'disponibles' ? aVendreLibres : aVendreReserves}
          keyExtractor={(a) => a.id}
          contentContainerStyle={commonStyles.listeBlocAvecFab}
          ListEmptyComponent={<EmptyState title={T.rienASansFacture} />}
          renderItem={({ item, index }) => (
            <LigneDeBloc index={index} total={(dispo === 'disponibles' ? aVendreLibres : aVendreReserves).length}>
              {/* Un animal réservé : « Réservation » et le nom du client en titre. */}
              <LigneChevre
                chevre={item}
                titre={estReserve(item) ? TEXTES.cheptel.reservation.reservationDe(item.reservation!.client) : undefined}
                onPress={() => setMenu(item)}
              />
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
                        label: TEXTES.cheptel.reservation.validerEtVendre,
                        icon: 'receipt' as const,
                        onPress: () => validerEtVendre(menu),
                      },
                      ...(estPetit(menu)
                        ? (['vivants', 'morts'] as const)
                            .filter((etat) => menu.reservation?.etat !== etat)
                            .map((etat) => ({
                              label: TEXTES.cheptel.reservation.remis[etat],
                              icon: (etat === 'vivants' ? 'heart' : 'skull') as 'heart' | 'skull',
                              onPress: async () => {
                                await saveChevre({ ...menu, reservation: { ...menu.reservation!, etat } });
                                charger();
                              },
                            }))
                        : []),
                      {
                        label: TEXTES.cheptel.reservation.indiquerLePoids,
                        icon: 'paw' as const,
                        onPress: () => setPesee(menu),
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
                  onPress: () => router.push(ROUTES.ficheChevreDepuis(menu.id, retour)),
                },
              ]
            : []
        }
      />
      <OptionsModal
        visible={!!choixEtat}
        onClose={() => setChoixEtat(null)}
        title={TEXTES.cheptel.reservation.etatTitre}
        options={[
          {
            label: TEXTES.cheptel.reservation.remis.vivants,
            icon: 'heart',
            onPress: async () => {
              if (choixEtat) await reserverAnimauxPourClient([choixEtat.animal], choixEtat.client, 'vivants');
              charger();
            },
          },
          {
            label: TEXTES.cheptel.reservation.remis.morts,
            icon: 'skull',
            onPress: async () => {
              if (choixEtat) await reserverAnimauxPourClient([choixEtat.animal], choixEtat.client, 'morts');
              charger();
            },
          },
          {
            label: TEXTES.cheptel.reservation.etatPlusTard,
            icon: 'time',
            onPress: async () => {
              if (choixEtat) await reserverAnimauxPourClient([choixEtat.animal], choixEtat.client);
              charger();
            },
          },
        ]}
      />
      <PoidsModal
        visible={!!pesee}
        valeurInitiale={pesee?.poidsKg}
        onValider={async (poidsKg) => {
          const animal = pesee;
          setPesee(null);
          if (!animal) return;
          await saveChevre({ ...animal, poidsKg });
          charger();
        }}
        onFermer={() => setPesee(null)}
      />
      <PoidsModal
        visible={!!poidsAvantVente}
        titre={poidsAvantVente ? libelleChevre(poidsAvantVente.restants[0]) : undefined}
        onValider={poidsSuivant}
        // Fermer la fenêtre (un appui à côté) abandonne la facture : rien n'est enregistré, l'animal reste « à vendre ».
        onFermer={() => setPoidsAvantVente(null)}
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
          // Facturer sans réservation d'abord : même chemin qu'une réservation validée (le bon du client se crée, le poids se demande si
          // besoin, puis la vente s'ouvre avec le circuit, le détail selon la date et l'animal déjà choisis).
          if (choisi.action === 'ecriture') return lancerLaFactureDirecte(choisi.animal, client);
          // Un cabri : vivant ou mort à la remise. Les autres animaux rejoignent tout de suite le bon de commande ouvert du client.
          if (estPetit(choisi.animal)) return setChoixEtat({ animal: choisi.animal, client });
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
