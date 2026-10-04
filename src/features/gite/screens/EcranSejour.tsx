import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { SelectField } from '@/shared/components/SelectField';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { enregistrerSejour, getSejour, listSejours, supprimerSejour } from '@/features/gite/repository';
import {
  supprimerFactureSejour,
  synchroniserFactureSejour,
} from '@/features/gite/services/comptabiliteSejour';
import { sejourEnConflit } from '@/features/gite/services/occupation';
import type { Sejour } from '@/features/gite/types';
import { LITS_PAR_CHAMBRE, NUMEROS_CHAMBRES } from '@/shared/constants/gite';
import { ajouterJours, nuitsDuSejour } from '@/shared/utils/calendrier';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite.sejour;

const OPTIONS_CHAMBRE = NUMEROS_CHAMBRES.map((n) => ({ value: String(n), label: T.chambreNumero(n) }));

/**
 * Saisie ou modification d'un séjour : la chambre, les nuits, le locataire, le nombre de personnes et le prix payé.
 * Le prix crée (ou met à jour) la facture d'hébergement en comptabilité.
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
  const [chambre, setChambre] = useState(chambreParam ?? '1');
  const [arrivee, setArrivee] = useState(premiereNuit);
  const [depart, setDepart] = useState(ajouterJours(premiereNuit, 1));
  const [nom, setNom] = useState('');
  const [clientId, setClientId] = useState('');
  const [personnes, setPersonnes] = useState('1');
  const [prix, setPrix] = useState('');
  const [notes, setNotes] = useState('');
  const [factureId, setFactureId] = useState<string | undefined>();
  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  useEffect(() => {
    listClients().then(setClients);
  }, []);

  useEffect(() => {
    if (!id) return;
    getSejour(id).then((s) => {
      if (!s) return;
      setChambre(String(s.chambre));
      setArrivee(s.arrivee);
      setDepart(s.depart);
      setNom(s.nom);
      setClientId(s.clientId ?? '');
      setPersonnes(String(s.personnes));
      setPrix(s.prix ? String(s.prix).replace('.', ',') : '');
      setNotes(s.notes ?? '');
      setFactureId(s.factureId);
    });
  }, [id]);

  const choisirClient = (valeur: string) => {
    setClientId(valeur);
    const client = clients.find((c) => c.id === valeur);
    // On propose le nom de la fiche tant qu'aucun nom n'a été saisi.
    if (client && !nom.trim()) setNom(nomComplet(client));
  };

  const enregistrer = async () => {
    const nombre = Math.round(parseDecimal(personnes));
    if (!nom.trim()) return setErreur(T.nomRequis);
    if (nombre < 1 || nombre > LITS_PAR_CHAMBRE) return setErreur(T.personnesInvalides);
    if (depart <= arrivee) return setErreur(T.departApresArrivee);
    const numero = Number(chambre);
    const conflit = sejourEnConflit(await listSejours(), numero, arrivee, depart, id);
    if (conflit) return setErreur(T.chambreOccupee(conflit.nom));

    const sejour: Omit<Sejour, 'id'> & { id?: string } = {
      id,
      chambre: numero,
      arrivee,
      depart,
      nom: nom.trim(),
      clientId: clientId || undefined,
      personnes: nombre,
      prix: parseDecimal(prix),
      notes: notes.trim() || undefined,
      factureId,
    };
    const enregistre = await enregistrerSejour(sejour);
    // La facture d'hébergement suit le séjour : créée, mise à jour, ou retirée si le prix est vide.
    const nouvelleFacture = await synchroniserFactureSejour(enregistre);
    if (nouvelleFacture !== enregistre.factureId) {
      await enregistrerSejour({ ...enregistre, factureId: nouvelleFacture });
    }
    router.back();
  };

  const supprimer = async () => {
    const sejour = id ? await getSejour(id) : undefined;
    if (sejour) {
      await supprimerFactureSejour(sejour);
      await supprimerSejour(sejour.id);
    }
    setSuppressionOuverte(false);
    router.back();
  };

  const nuits = nuitsDuSejour(arrivee, depart).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: existant ? T.modifier : T.nouveau }} />

      <SelectField<string>
        label={T.chambre}
        required
        value={chambre}
        options={OPTIONS_CHAMBRE}
        onChange={setChambre}
      />

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
          <FormField
            label={T.personnes}
            value={personnes}
            onChangeText={setPersonnes}
            keyboardType="number-pad"
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={T.prix}
            value={prix}
            onChangeText={setPrix}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
        </View>
      </View>
      <Text style={commonStyles.note}>{T.comptabilise}</Text>

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
        <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={enregistrer} />
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
  );
}
