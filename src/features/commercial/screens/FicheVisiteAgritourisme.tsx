import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ROUTES } from '@/shared/constants/routes';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import {
  defaireVisite,
  enregistrerVisite,
  montantVisite,
  realiserVisite,
  supprimerVisite,
} from '@/features/commercial/services/agritourisme';
import type { FormuleAgritourisme, StockDeVisite, VisiteAgritourisme } from '@/features/commercial/types';
import { FraisDeLaVisite } from '@/features/commercial/components/FraisDeLaVisite';
import { ChoixLotsVisite } from '@/features/commercial/components/ChoixLotsVisite';
import { besoinsDeLaVisite } from '@/features/commercial/services/stockVisite';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import { PARTICIPANTS_PAR_DEFAUT, STATUT_VISITE, type StatutVisite } from '@/shared/constants/agritourisme';
import { generateId } from '@/shared/utils/id';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/commercial/Commercial.styles';
import { TEXTES } from '@/shared/textes';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { optionClient } from '@/features/contacts/services/optionsContacts';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

const T = TEXTES.commercial.agritourisme.visite;

const texte = (valeur: number): string => String(valeur).replace('.', ',');

/** Une visite de la ferme : le groupe, la date, la formule, le nombre de personnes et le prix, puis sa réalisation (la recette). */
export default function FicheVisiteAgritourisme() {
  const router = useRouter();
  const retour = useAdresseCourante();
  // La visite enregistrée n'est lue qu'une fois : au retour de la fiche d'un client, les changements en cours sont gardés.
  const dejaLue = useRef(false);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existante, setExistante] = useState<VisiteAgritourisme | undefined>();
  const [clients, setClients] = useState<Client[]>([]);
  const [formules, setFormules] = useState<FormuleAgritourisme[]>([]);

  const [date, setDate] = useState(todayISO());
  const [clientId, setClientId] = useState('');
  const [clientLibre, setClientLibre] = useState('');
  const [formuleId, setFormuleId] = useState('');
  const [participants, setParticipants] = useState(String(PARTICIPANTS_PAR_DEFAUT));
  const [prix, setPrix] = useState('');
  const [note, setNote] = useState('');
  const [enAttente, setEnAttente] = useState(false);
  const [echeance, setEcheance] = useState('');
  const [statut, setStatut] = useState<StatutVisite>(STATUT_VISITE.PREVUE);
  const [erreur, setErreur] = useState('');
  const [confirmation, setConfirmation] = useState<'realiser' | 'defaire' | 'supprimer' | null>(null);
  const [choixLotsOuvert, setChoixLotsOuvert] = useState(false);
  /** Le stock en archive : les noms des produits à prévoir et utilisés, et les numéros de lots. */
  const [archiveStock, setArchiveStock] = useState<ArchiveStock | null>(null);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setArchiveStock)
        .catch(() => undefined);
      Promise.all([listClients(), lireArchiveCommercial()]).then(([listeClients, archive]) => {
        setClients(listeClients);
        setFormules(archive.formules);
        const visite = id ? archive.visites.find((v) => v.id === id) : undefined;
        if (visite) {
          if (dejaLue.current) return;
          dejaLue.current = true;
          setExistante(visite);
          setDate(visite.date);
          setClientId(visite.clientId ?? '');
          setClientLibre(visite.clientId ? '' : visite.client);
          setFormuleId(visite.formuleId);
          setParticipants(String(visite.participants));
          setPrix(texte(visite.prixParPersonne));
          setNote(visite.note ?? '');
          setEnAttente(!!visite.enAttente);
          setEcheance(visite.echeance ?? '');
          setStatut(visite.statut);
        } else if (!id && archive.formules[0]) {
          // Une nouvelle visite : la première formule, avec son prix.
          setFormuleId((courante) => courante || archive.formules[0].id);
          setPrix((courant) => courant || texte(archive.formules[0].prix));
        }
      });
    }, [id]),
  );

  const formule = formules.find((f) => f.id === formuleId);
  const nombre = Math.round(parseDecimal(participants));
  const client = clients.find((c) => c.id === clientId);
  const nomClient = client ? nomComplet(client) : clientLibre.trim();
  const modifiable = statut === STATUT_VISITE.PREVUE;
  const brouillon = { participants: nombre, prixParPersonne: parseDecimal(prix) };
  const recette = montantVisite(brouillon);

  const changerFormule = (nouvelle: string) => {
    setFormuleId(nouvelle);
    const f = formules.find((x) => x.id === nouvelle);
    if (f) setPrix(texte(f.prix));
  };

  const construire = (): VisiteAgritourisme | undefined => {
    if (!nomClient) return void setErreur(T.clientRequis);
    if (!formule) return void setErreur(T.formuleRequise);
    if (!(nombre > 0)) return void setErreur(T.participantsRequis);
    setErreur('');
    return {
      id: existante?.id ?? generateId(),
      date,
      clientId: client?.id,
      client: nomClient,
      formuleId: formule.id,
      formule: formule.nom,
      participants: nombre,
      prixParPersonne: parseDecimal(prix) || 0,
      statut,
      note: note.trim() || undefined,
      enAttente: enAttente || undefined,
      echeance: enAttente && echeance ? echeance : undefined,
      factureId: existante?.factureId,
    };
  };

  const enregistrer = async () => {
    const visite = construire();
    if (!visite) return;
    await enregistrerVisite(visite);
    retournerALaPageDAvant(router);
  };

  const changerStatut = async (nouveau: StatutVisite) => {
    const visite = construire();
    if (!visite) return;
    await enregistrerVisite({ ...visite, statut: nouveau });
    retournerALaPageDAvant(router);
  };

  const realiser = async (stock?: StockDeVisite[]) => {
    setConfirmation(null);
    setChoixLotsOuvert(false);
    const visite = construire();
    if (!visite) return;
    await realiserVisite(visite, formule, stock);
    retournerALaPageDAvant(router);
  };
  /** Le stock que la formule demande pour ce groupe : la réalisation passe alors par le choix des lots. */
  const besoins = besoinsDeLaVisite(formule, nombre > 0 ? nombre : 0);
  const demanderRealisation = () => (besoins.length > 0 ? setChoixLotsOuvert(true) : setConfirmation('realiser'));

  const defaire = async () => {
    setConfirmation(null);
    if (existante) await defaireVisite(existante);
    retournerALaPageDAvant(router);
  };

  const supprimer = async () => {
    setConfirmation(null);
    if (existante) await supprimerVisite(existante.id);
    retournerALaPageDAvant(router);
  };

  return (
    <Screen>
      {existante ? (
        <Text style={commonStyles.lineBold}>{TEXTES.commercial.agritourisme.statuts[statut]}</Text>
      ) : null}
      <SectionForm>
        <DateField label={T.date} value={date} onChange={setDate} />
        <SelectFieldEditable
          label={T.client}
          onEdit={() => router.push(ROUTES.clientsDepuis(retour) as never)}
          value={clientId}
          options={[
            { value: '', label: T.clientPlaceholder },
            ...clients.map(optionClient),
          ]}
          onChange={setClientId}
          searchable
          parCategories
        />
        {!clientId ? (
          <FormField
            label={T.clientLibre}
            aide={T.clientLibreAide}
            value={clientLibre}
            onChangeText={setClientLibre}
          />
        ) : null}
      </SectionForm>
      <SectionForm>
        {formules.length === 0 ? <Text style={commonStyles.note}>{T.aucuneFormule}</Text> : null}
        <SelectField
          label={T.formule}
          value={formuleId}
          options={formules.map((f) => ({ value: f.id, label: f.nom }))}
          onChange={changerFormule}
        />
        <View style={styles.champsLigne}>
          <View style={styles.champLigne}>
            <FormField
              label={T.participants}
              value={participants}
              onChangeText={(v) => /^\d*$/.test(v) && setParticipants(v)}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.champLigne}>
            <FormField label={T.prix} value={prix} onChangeText={setPrix} keyboardType="decimal-pad" />
          </View>
        </View>
        <Text style={commonStyles.lineBold}>{T.total(formatMontant(recette))}</Text>
        <Text style={commonStyles.note}>{T.chargesAide}</Text>
      </SectionForm>
      {existante && formuleId ? <FraisDeLaVisite formuleId={formuleId} date={date} recette={recette} /> : null}
      <SectionForm>
        <FormField
          label={T.note}
          value={note}
          onChangeText={setNote}
          placeholder={T.notePlaceholder}
          multiline
        />
        <Checkbox
          label={T.pasEncaissee}
          value={enAttente}
          onChange={(attente) => {
            setEnAttente(attente);
            if (attente && !echeance) setEcheance(ajouterMois(todayISO(), 1));
          }}
        />
        {enAttente ? (
          <DateField
            label={TEXTES.comptabilite.tresorerie.paiement.echeance}
            value={echeance}
            onChange={setEcheance}
          />
        ) : null}
      </SectionForm>

      {/* Le stock de la formule : ce qu'il faut prévoir pour ce groupe, puis ce qui a été utilisé une fois la visite réalisée. */}
      {archiveStock && (existante?.stock?.length || besoins.length > 0) ? (
        <SectionForm titre={TEXTES.commercial.agritourisme.stock.titre}>
          {existante?.stock?.length
            ? existante.stock.map((s) => {
                const numeros = (archiveStock.lots ?? []).filter((l) => s.lotIds.includes(l.id)).map((l) => l.numero);
                return (
                  <Text key={s.article} style={commonStyles.note}>
                    {TEXTES.commercial.agritourisme.stock.ligne(s.quantite, libelleArticle(s.article, archiveStock))} —{' '}
                    {numeros.length > 0
                      ? TEXTES.commercial.agritourisme.stock.lots(numeros.join(', '))
                      : TEXTES.commercial.agritourisme.stock.sansNumero}
                  </Text>
                );
              })
            : besoins.map((b) => (
                <Text key={b.article} style={commonStyles.note}>
                  {TEXTES.commercial.agritourisme.stock.ligne(b.quantite, libelleArticle(b.article, archiveStock))}
                </Text>
              ))}
        </SectionForm>
      ) : null}

      {erreur ? <Text style={styles.alerte}>{erreur}</Text> : null}

      <View style={styles.actions}>
        {modifiable ? <Button label={T.enregistrer} onPress={enregistrer} /> : null}
        {existante && modifiable ? (
          <Button label={T.actions.realiser} onPress={demanderRealisation} />
        ) : null}
        {existante && statut === STATUT_VISITE.REALISEE ? (
          <Button variant="secondary" label={T.actions.defaire} onPress={() => setConfirmation('defaire')} />
        ) : null}
        {existante && modifiable ? (
          <Button
            variant="secondary"
            label={T.actions.annuler}
            onPress={() => changerStatut(STATUT_VISITE.ANNULEE)}
          />
        ) : null}
        {existante && statut === STATUT_VISITE.ANNULEE ? (
          <Button
            variant="secondary"
            label={T.actions.rouvrir}
            onPress={() => changerStatut(STATUT_VISITE.PREVUE)}
          />
        ) : null}
        {existante ? (
          <Button variant="danger" label={T.supprimer} onPress={() => setConfirmation('supprimer')} />
        ) : null}
      </View>

      <ConfirmModal
        visible={confirmation === 'realiser'}
        title={T.realiser.titre}
        message={T.realiser.message(formatMontant(recette))}
        confirmLabel={T.realiser.confirmer}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => realiser()}
      />
      <ChoixLotsVisite
        visible={choixLotsOuvert}
        visiteId={existante?.id}
        formule={formule}
        participants={nombre > 0 ? nombre : 0}
        onValider={(stock) => realiser(stock)}
        onAnnuler={() => setChoixLotsOuvert(false)}
      />
      <ConfirmModal
        visible={confirmation === 'defaire'}
        title={T.defaire.titre}
        message={T.defaire.message}
        confirmLabel={T.defaire.confirmer}
        onCancel={() => setConfirmation(null)}
        onConfirm={defaire}
      />
      <ConfirmModal
        visible={confirmation === 'supprimer'}
        title={T.supprimerTitre}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setConfirmation(null)}
        onConfirm={supprimer}
      />
    </Screen>
  );
}
