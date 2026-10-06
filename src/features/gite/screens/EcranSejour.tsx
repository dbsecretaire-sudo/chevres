import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PucesMultiples } from '@/shared/components/PucesMultiples';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { AjustementSejourModal } from '@/features/gite/components/AjustementSejourModal';
import { LignesPaiement } from '@/features/gite/components/LignesPaiement';
import { ValidationPaiementModal } from '@/features/gite/components/ValidationPaiementModal';
import { TarifsModal } from '@/features/gite/components/TarifsModal';
import { useChambres } from '@/features/gite/hooks/useChambres';
import {
  enregistrerSejour,
  getSejour,
  listChambres,
  listSejours,
  supprimerSejour,
} from '@/features/gite/repository';
import {
  creerFactureAjustement,
  synchroniserAcompte,
  supprimerFacturesSejour,
  synchroniserFacturesSejour,
} from '@/features/gite/services/comptabiliteSejour';
import { chambresIndisponibles, sejourEnConflit } from '@/features/gite/services/occupation';
import { calculerTarif, totalAvecAjustements } from '@/features/gite/services/tarifSejour';
import type { AcompteSejour, AjustementSejour, Sejour } from '@/features/gite/types';
import { getSettings, montantTaxeSejourDe } from '@/features/settings/settings';
import {
  LITS_PAR_CHAMBRE,
  REPAS_PAR_NUIT,
  SERVICE_REPAS,
  SERVICE_REPAS_PAR_DEFAUT,
  TYPE_AJUSTEMENT_SEJOUR,
} from '@/shared/constants/gite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { LABEL_SERVICE_REPAS } from '@/shared/textes/libelles';
import { ROUTES } from '@/shared/constants/routes';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { ajouterJours, nuitsDuSejour } from '@/shared/utils/calendrier';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite.sejour;

/** Un nombre saisi à l'écran, vide pour zéro. */
const enTexte = (nombre: number | undefined): string => (nombre ? String(nombre) : '');

/**
 * Saisie ou modification d'une réservation : les chambres, les nuits, le locataire, le nombre de personnes (pour les
 * lits) et de repas. Le prix se calcule avec les tarifs des réglages (chambres × nuits × prix de la chambre, taxe de
 * séjour, repas × prix du repas) ; une fois le paiement validé, l'hébergement et les repas sont inscrits en comptabilité.
 */
export default function EcranSejour() {
  const router = useRouter();
  const {
    id,
    chambre: chambreParam,
    date: dateParam,
    copie,
  } = useLocalSearchParams<{
    id?: string;
    chambre?: string;
    date?: string;
    copie?: string;
  }>();
  const existant = !!id;
  const premiereNuit = dateParam ?? todayISO();

  const [clients, setClients] = useState<Client[]>([]);
  const { chambres: chambresDuGite } = useChambres();
  const pucesChambres = chambresDuGite.map((c) => ({ valeur: c.numero, label: T.chambreNumero(c.numero) }));
  const [chambres, setChambres] = useState<number[]>(chambreParam ? [Number(chambreParam)] : [1]);
  const [arrivee, setArrivee] = useState(premiereNuit);
  const [depart, setDepart] = useState(ajouterJours(premiereNuit, 1));
  const [nom, setNom] = useState('');
  const [clientId, setClientId] = useState('');
  const [personnes, setPersonnes] = useState('1');
  const [repas, setRepas] = useState('');
  /** Ce dont les repas ont été calculés (personnes, nuits, service) : quand cela change, les repas se recalculent. */
  const [baseRepas, setBaseRepas] = useState('');
  /** Midi, soir ou midi et soir (le soir par défaut). */
  const [service, setService] = useState<ValeurDe<typeof SERVICE_REPAS>>(SERVICE_REPAS_PAR_DEFAUT);
  const [notes, setNotes] = useState('');
  const [paye, setPaye] = useState(false);
  const [datePaiement, setDatePaiement] = useState(todayISO());
  const [factures, setFactures] = useState<Pick<Sejour, 'factureId' | 'factureRepasId'>>({});
  /** Les tarifs en vigueur (réglages) et ceux qui ont été retenus pour ce séjour quand on le rouvre. */
  const [tarifNuit, setTarifNuit] = useState(0);
  const [tarifRepas, setTarifRepas] = useState(0);
  const [prixNuitRetenu, setPrixNuitRetenu] = useState<number | undefined>();
  const [prixRepasRetenu, setPrixRepasRetenu] = useState<number | undefined>();
  /** Montant de la taxe de séjour, quand l'établissement la suit (0 sinon). */
  const [montantTaxeCourant, setMontantTaxe] = useState(0);
  /** La taxe payée, une fois le séjour payé : elle ne bouge plus avec les réglages. */
  const [taxeRetenue, setTaxeRetenue] = useState<number | undefined>();
  /** Vrai quand le paiement est déjà enregistré : le détail du prix est alors figé, et on n'annule plus le paiement. */
  const [payeEnregistre, setPayeEnregistre] = useState(false);
  /** L'acompte déjà versé (il n'empêche aucune modification), et la fenêtre qui confirme le paiement. */
  /** Tous les séjours du gîte : ils servent à griser les chambres déjà prises aux dates choisies. */
  const [sejoursDuGite, setSejoursDuGite] = useState<Sejour[]>([]);
  /** Vrai quand le client a été remboursé sans garder sa réservation : elle est abandonnée, sa chambre est libre. */
  const [abandonne, setAbandonne] = useState(false);
  const [acompte, setAcompte] = useState<AcompteSejour | undefined>();
  const [validationOuverte, setValidationOuverte] = useState(false);
  const [ajustements, setAjustements] = useState<AjustementSejour[]>([]);
  const [menuPaiementOuvert, setMenuPaiementOuvert] = useState(false);
  const [typeAjustement, setTypeAjustement] = useState<AjustementSejour['type'] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [tarifsOuverts, setTarifsOuverts] = useState(false);

  /** Relit les tarifs des informations de l'entreprise ; si « reprendre », ce séjour les adopte (même payé). */
  const chargerTarifs = (reprendre: boolean) =>
    getSettings().then((s) => {
      const entreprise = s.exploitation?.entreprise;
      setTarifNuit(entreprise?.tarifNuit ?? 0);
      setTarifRepas(entreprise?.tarifRepas ?? 0);
      // La taxe de séjour est suivie par défaut.
      setMontantTaxe((entreprise?.taxeSejour ?? true) ? (montantTaxeSejourDe(entreprise) ?? 0) : 0);
      if (reprendre) {
        setPrixNuitRetenu(undefined);
        setPrixRepasRetenu(undefined);
      }
    });

  // Les fiches sont relues à chaque retour sur l'écran : celle qu'on vient de créer apparaît dans la liste.
  useFocusEffect(
    useCallback(() => {
      listClients().then(setClients);
      listSejours().then(setSejoursDuGite);
    }, []),
  );

  useEffect(() => {
    chargerTarifs(false);
  }, []);

  // Une copie garde les dates, le client, les personnes, les repas et les notes d'un séjour, mais change de chambre(s) :
  // les premières chambres libres à ces dates, en même nombre. Elle n'a rien de son paiement (ni acompte, ni
  // remboursement, ni facture).
  useEffect(() => {
    if (id || !copie) return;
    Promise.all([getSejour(copie), listSejours(), listChambres()]).then(([s, tous, chambresDuGiteCopie]) => {
      if (!s) return;
      const prises = chambresIndisponibles(tous, s.arrivee, s.depart);
      const libres = chambresDuGiteCopie.map((c) => c.numero).filter((numero) => !prises.has(numero));
      const nouvelles = libres.slice(0, s.chambres.length);
      const nuitsCopiees = nuitsDuSejour(s.arrivee, s.depart).length;
      setChambres(nouvelles);
      setArrivee(s.arrivee);
      setDepart(s.depart);
      setNom(s.nom);
      setClientId(s.clientId ?? '');
      // Moins de chambres libres, moins de lits : le nombre de personnes suit.
      const personnesCopiees = s.personnes
        ? Math.min(s.personnes, LITS_PAR_CHAMBRE * Math.max(nouvelles.length, 1))
        : undefined;
      setPersonnes(enTexte(personnesCopiees));
      setRepas(enTexte(s.repas));
      const serviceCopie = s.service ?? SERVICE_REPAS_PAR_DEFAUT;
      setService(serviceCopie);
      setBaseRepas(`${personnesCopiees ?? 0}|${nuitsCopiees}|${serviceCopie}`);
      setNotes(s.notes ?? '');
    });
  }, [id, copie]);

  useEffect(() => {
    if (!id) return;
    getSejour(id).then((s) => {
      if (!s) return;
      setChambres(s.chambres);
      setArrivee(s.arrivee);
      setDepart(s.depart);
      setNom(s.nom);
      setClientId(s.clientId ?? '');
      setPersonnes(enTexte(s.personnes));
      const nuitsDuSejourCharge = nuitsDuSejour(s.arrivee, s.depart).length;
      setRepas(enTexte(s.repas));
      const serviceCharge = s.service ?? SERVICE_REPAS_PAR_DEFAUT;
      setService(serviceCharge);
      // Le nombre de repas enregistré est gardé tel quel : il ne se recalcule qu'au prochain changement.
      setBaseRepas(`${s.personnes ?? 0}|${nuitsDuSejourCharge}|${serviceCharge}`);
      // Tant que le séjour n'est pas payé, ses prix suivent les tarifs des réglages ; payé, ils sont figés.
      if (s.paye) {
        // Un séjour d'avant le détail du prix n'a qu'un prix payé : on le ramène à un prix par chambre et par nuit.
        const nuitsEtChambres = nuitsDuSejourCharge * s.chambres.length;
        setPrixNuitRetenu(s.prixNuit ?? (nuitsEtChambres > 0 ? s.prix / nuitsEtChambres : s.prix));
        setPrixRepasRetenu(s.prixRepas);
        setTaxeRetenue(s.taxe ?? 0);
        setPayeEnregistre(true);
      }
      setAcompte(s.acompte);
      setAbandonne(!!s.abandonne);
      setAjustements(s.ajustements ?? []);
      setNotes(s.notes ?? '');
      setPaye(!!s.paye);
      setDatePaiement(s.datePaiement ?? todayISO());
      setFactures({ factureId: s.factureId, factureRepasId: s.factureRepasId });
    });
  }, [id]);

  const client = clients.find((c) => c.id === clientId);
  const coordonnees = [client?.telephone, client?.email].filter(Boolean).join(' · ');

  const nuits = nuitsDuSejour(arrivee, depart).length;
  const indisponibles = chambresIndisponibles(sejoursDuGite, arrivee, depart, id);
  // Changer de dates décoche les chambres qui ne sont plus libres (sauf une fois payé : les dates sont alors figées).
  if (!payeEnregistre && chambres.some((c) => indisponibles.has(c))) {
    setChambres(chambres.filter((c) => !indisponibles.has(c)));
  }
  // Quatre lits par chambre réservée : on ne peut pas saisir plus de personnes.
  const maximumPersonnes = LITS_PAR_CHAMBRE * chambres.length;
  const nombrePersonnes = personnes.trim() ? Math.round(parseDecimal(personnes)) : 0;
  // Chaque personne prend un repas par nuit (deux si midi et soir) : le nombre se recalcule dès qu'une de ces valeurs
  // change, et reste modifiable à la main si les repas ne sont pas tous pris.
  const baseCourante = `${nombrePersonnes}|${nuits}|${service}`;
  if (baseRepas !== baseCourante) {
    setBaseRepas(baseCourante);
    setRepas(enTexte(nombrePersonnes * nuits * REPAS_PAR_NUIT[service]));
  }
  const nombreRepas = Math.max(0, Math.round(parseDecimal(repas)));
  const montantTaxe = taxeRetenue ?? montantTaxeCourant;
  const prixNuit = prixNuitRetenu ?? tarifNuit;
  const prixRepas = prixRepasRetenu ?? tarifRepas;
  const tarif = calculerTarif({
    chambres: chambres.length,
    nuits: nuits,
    prixNuit,
    taxe: montantTaxe,
    repas: nombreRepas,
    prixRepas,
  });

  /**
   * Enregistre le séjour. Avec `validerPaiement`, c'est la validation du paiement : le séjour est enregistré tout de
   * suite comme payé (sa recette entre en comptabilité), on reste sur l'écran et le détail du prix est figé. Avec
   * `nouvelAcompte`, l'acompte est enregistré (et inscrit en comptabilité) sans rien figer.
   */
  const enregistrer = async (
    options: { validerPaiement?: boolean; nouvelAcompte?: { montant: number; date: string } } = {},
  ) => {
    const { validerPaiement = false, nouvelAcompte } = options;
    if (chambres.length === 0) return setErreur(T.chambresRequises);
    // Chaque réservation passe par une fiche client ; seuls les anciens séjours (sans fiche) gardent le nom qu'ils avaient.
    if (!client && !nom.trim()) return setErreur(T.clientRequis);
    if (client && !coordonnees) return setErreur(T.coordonneesRequises);
    if (personnes.trim() && (nombrePersonnes < 1 || nombrePersonnes > maximumPersonnes)) {
      return setErreur(T.personnesInvalides(maximumPersonnes));
    }
    if (depart <= arrivee) return setErreur(T.departApresArrivee);
    const triees = [...chambres].sort((a, b) => a - b);
    const conflit = sejourEnConflit(await listSejours(), triees, arrivee, depart, id);
    if (conflit) return setErreur(T.chambreOccupee(T.chambresListe(conflit.chambres), conflit.sejour.nom));

    if (nouvelAcompte && nouvelAcompte.montant > tarif.total) return setErreur(T.acompte.depasse);
    const payeFinal = paye || validerPaiement;
    const datePaiementFinale = validerPaiement ? todayISO() : datePaiement;
    const sejour: Omit<Sejour, 'id'> & { id?: string } = {
      id,
      chambres: triees,
      arrivee,
      depart,
      nom: client ? nomComplet(client) : nom.trim(),
      clientId: clientId || undefined,
      personnes: nombrePersonnes > 0 ? nombrePersonnes : undefined,
      prix: tarif.total,
      prixNuit,
      repas: nombreRepas > 0 ? nombreRepas : undefined,
      service: nombreRepas > 0 ? service : undefined,
      prixRepas: nombreRepas > 0 ? prixRepas : undefined,
      taxe: tarif.taxe > 0 ? tarif.taxe : undefined,
      notes: notes.trim() || undefined,
      paye: payeFinal,
      datePaiement: payeFinal ? datePaiementFinale : undefined,
      acompte: nouvelAcompte ?? acompte,
      abandonne: abandonne || undefined,
      ajustements: ajustements.length > 0 ? ajustements : undefined,
      ...factures,
    };
    const enregistre = await enregistrerSejour(sejour);
    // L'acompte entre en comptabilité (une seule fois), puis les factures du séjour suivent le séjour : créées, mises à
    // jour (le solde est le total moins l'acompte), ou retirées quand leur montant est nul.
    const acompteInscrit = await synchroniserAcompte(enregistre);
    const base = { ...enregistre, acompte: acompteInscrit };
    const nouvelles = await synchroniserFacturesSejour(base);
    if (
      nouvelles.factureId !== base.factureId ||
      nouvelles.factureRepasId !== base.factureRepasId ||
      acompteInscrit?.factureId !== enregistre.acompte?.factureId
    ) {
      await enregistrerSejour({ ...base, ...nouvelles });
    }
    if (nouvelAcompte) {
      // Un nouveau séjour se rouvre comme séjour enregistré ; un séjour existant montre son acompte sur place.
      if (!id) return router.replace(ROUTES.sejour(enregistre.id));
      setAcompte(acompteInscrit);
      setFactures({ factureId: nouvelles.factureId, factureRepasId: nouvelles.factureRepasId });
      return;
    }
    if (!validerPaiement) return router.back();
    // Un nouveau séjour se rouvre comme séjour enregistré ; un séjour existant se fige sur place.
    if (!id) return router.replace(ROUTES.sejour(enregistre.id));
    setPaye(true);
    setDatePaiement(datePaiementFinale);
    setPrixNuitRetenu(prixNuit);
    setPrixRepasRetenu(prixRepas);
    setTaxeRetenue(tarif.taxe);
    setFactures({ factureId: nouvelles.factureId, factureRepasId: nouvelles.factureRepasId });
    setPayeEnregistre(true);
  };

  /** Inscrit en comptabilité un remboursement ou une prestation du séjour payé, et le garde tout de suite avec le séjour. */
  const ajouterAjustement = async (valeurs: { montant: number; date: string; maintenue: boolean }) => {
    const type = typeAjustement;
    setTypeAjustement(null);
    const stocke = id ? await getSejour(id) : undefined;
    if (!type || !stocke) return;
    const ajustement = await creerFactureAjustement(stocke, {
      type,
      montant: valeurs.montant,
      date: valeurs.date,
      maintenue: type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT ? valeurs.maintenue : undefined,
    });
    // Un remboursement sans maintien de la réservation l'abandonne : sa chambre est libérée, sa trace reste.
    const abandon =
      type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT && !valeurs.maintenue ? true : stocke.abandonne;
    await enregistrerSejour({
      ...stocke,
      abandonne: abandon,
      ajustements: [...(stocke.ajustements ?? []), ajustement],
    });
    setAjustements((actuels) => [...actuels, ajustement]);
    setAbandonne(!!abandon);
  };

  const supprimer = async () => {
    const sejour = id ? await getSejour(id) : undefined;
    if (sejour) {
      await supprimerFacturesSejour(sejour);
      await supprimerSejour(sejour.id);
    }
    setSuppressionOuverte(false);
    router.back();
  };

  // Une fois le paiement enregistré, plus rien ne se modifie (hors les notes) : toute trace de paiement reste en comptabilité.
  const verrou = payeEnregistre ? commonStyles.verrouille : undefined;
  const evenements = payeEnregistre ? 'none' : 'auto';

  return (
    <AccentColorProvider
      color={existant ? colors.primary : colors.ajout}
      softColor={existant ? colors.badgeBg : colors.ajoutBadgeBg}
    >
      <Screen>
        <Stack.Screen
          options={{
            title: existant ? T.modifier : T.nouveau,
            // Dupliquer : un nouveau séjour prérempli, à droite du titre.
            headerRight: existant
              ? () => (
                  <Pressable
                    style={commonStyles.boutonEnteteDroite}
                    onPress={() => router.push(ROUTES.sejourCopie(id!))}
                    hitSlop={10}
                    accessibilityLabel={T.dupliquer}
                  >
                    <Ionicons name="copy-outline" size={24} color={colors.blanc} />
                  </Pressable>
                )
              : undefined,
          }}
        />

        {abandonne ? <Text style={commonStyles.required}>{T.abandonneeInfo}</Text> : null}

        <View style={[commonStyles.gap6, verrou]} pointerEvents={evenements}>
          <Text style={commonStyles.lineSemiBold}>
            {T.chambres}
            <Text style={commonStyles.required}> *</Text>
          </Text>
          <PucesMultiples<number>
            puces={pucesChambres}
            valeurs={chambres}
            desactivees={[...indisponibles]}
            onChange={(choisies) => {
              setChambres(choisies);
              // Moins de chambres, moins de lits : le nombre de personnes suit.
              const lits = LITS_PAR_CHAMBRE * choisies.length;
              if (Math.round(parseDecimal(personnes)) > lits) setPersonnes(enTexte(lits));
            }}
          />
        </View>

        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <DateField
              label={T.arrivee}
              required
              value={arrivee}
              onChange={(valeur) => {
                setArrivee(valeur);
                // Payé, seule l'arrivée se change : le départ suit, avec le même nombre de nuits.
                if (payeEnregistre) setDepart(ajouterJours(valeur, nuits));
                // Le départ reste après l'arrivée : on le repousse au lendemain s'il la précède.
                else if (depart <= valeur) setDepart(ajouterJours(valeur, 1));
              }}
            />
          </View>
          <View style={[commonStyles.flex1, verrou]} pointerEvents={evenements}>
            <DateField
              label={T.depart}
              required
              value={depart}
              onChange={(valeur) => {
                setDepart(valeur);
              }}
            />
          </View>
        </View>
        {nuits > 0 ? <Text style={commonStyles.note}>{T.nuits(nuits)}</Text> : null}

        <View style={verrou} pointerEvents={evenements}>
          <SelectFieldEditable<string>
            label={T.client}
            required
            searchable
            placeholder={T.aucuneFiche}
            value={clientId}
            options={clients.map((c) => ({ value: c.id, label: nomComplet(c) }))}
            onChange={setClientId}
            onEdit={() => router.push(ROUTES.CLIENTS)}
          />
        </View>
        {coordonnees ? <Text style={commonStyles.note}>{coordonnees}</Text> : null}

        <View style={[commonStyles.row, verrou]} pointerEvents={evenements}>
          <View style={commonStyles.flex1}>
            <SelectField<string>
              label={T.personnes}
              value={personnes}
              options={[
                { value: '', label: T.personnesNonPrecisees },
                ...Array.from({ length: maximumPersonnes }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                })),
              ]}
              onChange={setPersonnes}
            />
          </View>
          <View style={commonStyles.flex1}>
            <FormField
              label={T.repas}
              value={repas}
              onChangeText={setRepas}
              keyboardType="number-pad"
              placeholder="0"
            />
          </View>
        </View>

        <View style={[commonStyles.gap6, verrou]} pointerEvents={evenements}>
          <Text style={commonStyles.lineSemiBold}>{T.service}</Text>
          <PucesDefilantes<ValeurDe<typeof SERVICE_REPAS>>
            puces={Object.values(SERVICE_REPAS).map((valeur) => ({
              valeur,
              label: LABEL_SERVICE_REPAS[valeur],
            }))}
            valeur={service}
            onChoisir={setService}
          />
        </View>
        <Text style={commonStyles.note}>{T.repasCalcules}</Text>

        {/* Payé, le détail du prix est figé : il perd son fond blanc, et c'est le paiement qui reste sur fond blanc. */}
        <Card style={payeEnregistre ? commonStyles.carteTransparente : undefined}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.cardTitle}>{T.recapitulatif}</Text>
            {payeEnregistre ? null : (
              <Pressable
                onPress={() => setTarifsOuverts(true)}
                hitSlop={10}
                accessibilityLabel={T.reprendreTarifs}
              >
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
            )}
          </View>
          <Text style={commonStyles.muted}>
            {T.ligneHebergement(
              chambres.length,
              nuits,
              formatMontant(prixNuit),
              formatMontant(tarif.hebergement),
            )}
          </Text>
          {montantTaxe > 0 ? (
            <Text style={commonStyles.muted}>{T.ligneTaxe(formatMontant(tarif.taxe))}</Text>
          ) : null}
          {nombreRepas > 0 ? (
            <Text style={commonStyles.muted}>
              {T.ligneRepas(nombreRepas, nuits, formatMontant(prixRepas), formatMontant(tarif.restauration))}
            </Text>
          ) : null}
          <Text style={commonStyles.lineSemiBold}>
            {T.total} : {formatMontant(tarif.total)}
          </Text>
        </Card>
        {prixNuit === 0 && !payeEnregistre ? <Text style={commonStyles.note}>{T.tarifsAbsents}</Text> : null}
        {payeEnregistre ? null : <Text style={commonStyles.note}>{T.comptabilise}</Text>}
        {montantTaxe > 0 ? <Text style={commonStyles.note}>{T.taxeHorsCa}</Text> : null}

        <Card style={payeEnregistre ? undefined : commonStyles.carteSansFond}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={commonStyles.cardTitle}>{T.paiement}</Text>
            {payeEnregistre ? (
              <Pressable
                onPress={() => setMenuPaiementOuvert(true)}
                hitSlop={10}
                accessibilityLabel={T.ajustement.modifierPaiement}
              >
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
          {paye ? (
            <LignesPaiement
              paiement={{ montant: tarif.total - (acompte?.montant ?? 0), date: datePaiement }}
              acompte={acompte}
              ajustements={ajustements}
            />
          ) : (
            <>
              {acompte ? <LignesPaiement acompte={acompte} ajustements={[]} /> : null}
              <Text style={commonStyles.note}>{T.paiementEnAttente}</Text>
              <Button label={T.validerPaiement} onPress={() => setValidationOuverte(true)} />
            </>
          )}
        </Card>

        <FormField
          label={T.notes}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.textareaBasse}
        />

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={() => router.back()}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.commun.general.enregistrer}
            onPress={() => enregistrer()}
          />
        </View>
        {existant ? (
          <Button
            variant="danger"
            label={T.supprimer}
            disabled={payeEnregistre || !!acompte}
            onPress={() => setSuppressionOuverte(true)}
          />
        ) : null}

        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
        <ValidationPaiementModal
          visible={validationOuverte}
          acomptePossible={!acompte}
          onValider={() => {
            setValidationOuverte(false);
            enregistrer({ validerPaiement: true });
          }}
          onAcompte={(valeurs) => {
            setValidationOuverte(false);
            enregistrer({ nouvelAcompte: valeurs });
          }}
          onFermer={() => setValidationOuverte(false)}
        />
        <OptionsModal
          visible={menuPaiementOuvert}
          onClose={() => setMenuPaiementOuvert(false)}
          options={[
            {
              label: T.ajustement.remboursement,
              icon: 'arrow-undo',
              onPress: () => setTypeAjustement(TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT),
            },
            {
              label: T.ajustement.prestation,
              icon: 'add-circle',
              onPress: () => setTypeAjustement(TYPE_AJUSTEMENT_SEJOUR.PRESTATION),
            },
          ]}
        />
        <AjustementSejourModal
          type={typeAjustement}
          totalPaye={totalAvecAjustements(tarif.total, ajustements)}
          onValider={ajouterAjustement}
          onFermer={() => setTypeAjustement(null)}
        />
        <TarifsModal
          visible={tarifsOuverts}
          nuits={nuits}
          repas={nombreRepas}
          onEnregistre={(nouvellesNuits, nouveauxRepas) => {
            // Le départ suit le nombre de nuits ; les repas saisis dans la fenêtre l'emportent sur le calcul automatique.
            setDepart(ajouterJours(arrivee, nouvellesNuits));
            setBaseRepas(`${nombrePersonnes}|${nouvellesNuits}|${service}`);
            setRepas(enTexte(nouveauxRepas));
            setTarifsOuverts(false);
            chargerTarifs(true);
          }}
          onFermer={() => setTarifsOuverts(false)}
        />
        <ConfirmModal
          visible={suppressionOuverte}
          title={T.supprimerQuestion}
          message={T.supprimerMessage}
          confirmLabel={TEXTES.commun.general.supprimer}
          onCancel={() => setSuppressionOuverte(false)}
          onConfirm={supprimer}
        />
      </Screen>
    </AccentColorProvider>
  );
}
