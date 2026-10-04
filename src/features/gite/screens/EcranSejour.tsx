import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { PucesMultiples } from '@/shared/components/PucesMultiples';
import { SelectField } from '@/shared/components/SelectField';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { enregistrerSejour, getSejour, listSejours, supprimerSejour } from '@/features/gite/repository';
import {
  supprimerFacturesSejour,
  synchroniserFacturesSejour,
} from '@/features/gite/services/comptabiliteSejour';
import { sejourEnConflit } from '@/features/gite/services/occupation';
import { calculerTarif } from '@/features/gite/services/tarifSejour';
import type { Sejour } from '@/features/gite/types';
import { getSettings, montantTaxeSejourDe } from '@/features/settings/settings';
import { LITS_PAR_CHAMBRE, NUMEROS_CHAMBRES } from '@/shared/constants/gite';
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

const PUCES_CHAMBRES = NUMEROS_CHAMBRES.map((n) => ({ valeur: n, label: T.chambreNumero(n) }));

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
  } = useLocalSearchParams<{
    id?: string;
    chambre?: string;
    date?: string;
  }>();
  const existant = !!id;
  const premiereNuit = dateParam ?? todayISO();

  const [clients, setClients] = useState<Client[]>([]);
  const [chambres, setChambres] = useState<number[]>(chambreParam ? [Number(chambreParam)] : [1]);
  const [arrivee, setArrivee] = useState(premiereNuit);
  const [depart, setDepart] = useState(ajouterJours(premiereNuit, 1));
  const [nom, setNom] = useState('');
  const [clientId, setClientId] = useState('');
  const [personnes, setPersonnes] = useState('');
  const [repas, setRepas] = useState('');
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
  const [montantTaxe, setMontantTaxe] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  useEffect(() => {
    listClients().then(setClients);
    getSettings().then((s) => {
      const entreprise = s.exploitation?.entreprise;
      setTarifNuit(entreprise?.tarifNuit ?? 0);
      setTarifRepas(entreprise?.tarifRepas ?? 0);
      // La taxe de séjour est suivie par défaut.
      setMontantTaxe((entreprise?.taxeSejour ?? true) ? (montantTaxeSejourDe(entreprise) ?? 0) : 0);
    });
  }, []);

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
      setRepas(enTexte(s.repas));
      // Un séjour d'avant le détail du prix n'a qu'un prix payé : on le ramène à un prix par chambre et par nuit.
      const nuitsEtChambres = nuitsDuSejour(s.arrivee, s.depart).length * s.chambres.length;
      setPrixNuitRetenu(s.prixNuit ?? (nuitsEtChambres > 0 ? s.prix / nuitsEtChambres : s.prix));
      setPrixRepasRetenu(s.prixRepas);
      setNotes(s.notes ?? '');
      setPaye(!!s.paye);
      setDatePaiement(s.datePaiement ?? todayISO());
      setFactures({ factureId: s.factureId, factureRepasId: s.factureRepasId });
    });
  }, [id]);

  const choisirClient = (valeur: string) => {
    setClientId(valeur);
    const client = clients.find((c) => c.id === valeur);
    // On propose le nom de la fiche tant qu'aucun nom n'a été saisi.
    if (client && !nom.trim()) setNom(nomComplet(client));
  };

  const nuits = nuitsDuSejour(arrivee, depart).length;
  // Quatre lits par chambre réservée : on ne peut pas saisir plus de personnes.
  const maximumPersonnes = LITS_PAR_CHAMBRE * chambres.length;
  const nombrePersonnes = personnes.trim() ? Math.round(parseDecimal(personnes)) : 0;
  const nombreRepas = Math.round(parseDecimal(repas));
  const prixNuit = prixNuitRetenu ?? tarifNuit;
  const prixRepas = prixRepasRetenu ?? tarifRepas;
  const tarif = calculerTarif({
    chambres: chambres.length,
    nuits,
    prixNuit,
    taxe: montantTaxe,
    repas: nombreRepas,
    prixRepas,
  });
  const tarifsDifferents =
    existant && (prixNuit !== tarifNuit || (nombreRepas > 0 && prixRepas !== tarifRepas));

  const enregistrer = async () => {
    if (chambres.length === 0) return setErreur(T.chambresRequises);
    if (!nom.trim()) return setErreur(T.nomRequis);
    if (personnes.trim() && (nombrePersonnes < 1 || nombrePersonnes > maximumPersonnes)) {
      return setErreur(T.personnesInvalides(maximumPersonnes));
    }
    if (depart <= arrivee) return setErreur(T.departApresArrivee);
    const triees = [...chambres].sort((a, b) => a - b);
    const conflit = sejourEnConflit(await listSejours(), triees, arrivee, depart, id);
    if (conflit) return setErreur(T.chambreOccupee(T.chambresListe(conflit.chambres), conflit.sejour.nom));

    const sejour: Omit<Sejour, 'id'> & { id?: string } = {
      id,
      chambres: triees,
      arrivee,
      depart,
      nom: nom.trim(),
      clientId: clientId || undefined,
      personnes: nombrePersonnes > 0 ? nombrePersonnes : undefined,
      prix: tarif.total,
      prixNuit,
      repas: nombreRepas > 0 ? nombreRepas : undefined,
      prixRepas: nombreRepas > 0 ? prixRepas : undefined,
      taxe: tarif.taxe > 0 ? tarif.taxe : undefined,
      notes: notes.trim() || undefined,
      paye,
      datePaiement: paye ? datePaiement : undefined,
      ...factures,
    };
    const enregistre = await enregistrerSejour(sejour);
    // Les factures suivent le séjour : créées, mises à jour, ou retirées quand leur montant est nul.
    const nouvelles = await synchroniserFacturesSejour(enregistre);
    if (
      nouvelles.factureId !== enregistre.factureId ||
      nouvelles.factureRepasId !== enregistre.factureRepasId
    ) {
      await enregistrerSejour({ ...enregistre, ...nouvelles });
    }
    router.back();
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

  return (
    <AccentColorProvider
      color={existant ? colors.primary : colors.ajout}
      softColor={existant ? colors.badgeBg : colors.ajoutBadgeBg}
    >
      <Screen>
        <Stack.Screen options={{ title: existant ? T.modifier : T.nouveau }} />

        <View style={commonStyles.gap6}>
          <Text style={commonStyles.lineSemiBold}>
            {T.chambres}
            <Text style={commonStyles.required}> *</Text>
          </Text>
          <PucesMultiples<number>
            puces={PUCES_CHAMBRES}
            valeurs={chambres}
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
                // Le départ reste après l'arrivée : on le repousse au lendemain s'il la précède.
                if (depart <= valeur) setDepart(ajouterJours(valeur, 1));
              }}
            />
          </View>
          <View style={commonStyles.flex1}>
            <DateField label={T.depart} required value={depart} onChange={setDepart} />
          </View>
        </View>
        {nuits > 0 ? <Text style={commonStyles.note}>{T.nuits(nuits)}</Text> : null}

        <FormField label={T.nom} required value={nom} onChangeText={setNom} placeholder={T.exempleNom} />
        <SelectField<string>
          label={T.client}
          value={clientId}
          options={[
            { value: '', label: T.aucuneFiche },
            ...clients.map((c) => ({ value: c.id, label: nomComplet(c) })),
          ]}
          onChange={choisirClient}
        />

        <View style={commonStyles.row}>
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

        <Card>
          <Text style={commonStyles.cardTitle}>{T.recapitulatif}</Text>
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
              {T.ligneRepas(nombreRepas, formatMontant(prixRepas), formatMontant(tarif.restauration))}
            </Text>
          ) : null}
          <Text style={commonStyles.lineSemiBold}>
            {T.total} : {formatMontant(tarif.total)}
          </Text>
        </Card>
        {prixNuit === 0 ? <Text style={commonStyles.note}>{T.tarifsAbsents}</Text> : null}
        {tarifsDifferents ? (
          <Button
            variant="secondary"
            label={T.appliquerTarifs}
            onPress={() => {
              setPrixNuitRetenu(undefined);
              setPrixRepasRetenu(undefined);
            }}
          />
        ) : null}
        <Text style={commonStyles.note}>{T.comptabilise}</Text>
        {montantTaxe > 0 ? <Text style={commonStyles.note}>{T.taxeHorsCa}</Text> : null}

        <View style={commonStyles.gap6}>
          <Text style={commonStyles.cardTitle}>{T.paiement}</Text>
          {paye ? (
            <>
              <DateField label={T.datePaiement} required value={datePaiement} onChange={setDatePaiement} />
              <Text style={commonStyles.note}>{T.paiementValide}</Text>
              <Button variant="secondary" label={T.annulerPaiement} onPress={() => setPaye(false)} />
            </>
          ) : (
            <>
              <Text style={commonStyles.note}>{T.paiementEnAttente}</Text>
              <Button
                label={T.validerPaiement}
                onPress={() => {
                  setPaye(true);
                  setDatePaiement(todayISO());
                }}
              />
            </>
          )}
        </View>

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
            onPress={enregistrer}
          />
        </View>
        {existant ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setSuppressionOuverte(true)} />
        ) : null}

        <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
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
