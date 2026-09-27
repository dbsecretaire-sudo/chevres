import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { BoucleField } from '@/components/BoucleField';
import { DateField } from '@/components/DateField';
import { SelectField } from '@/components/SelectField';
import { ListRow } from '@/components/ListRow';
import { Checkbox } from '@/components/Checkbox';
import { OptionsModal } from '@/components/OptionsModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { InfoModal } from '@/components/InfoModal';
import { Fab } from '@/components/Fab';
import { colors, statutColors } from '@/theme/colors';
import {
  declarerStatutChevre,
  getChevre,
  listControlesPourChevre,
  listDescendance,
  listVisitesPourChevre,
  numeroBoucleExiste,
  reactiverChevre,
  saveChevre,
  supprimerChevre,
} from '@/storage/repositories';
import type { Chevre, StatutChevre } from '@/types/models';
import { currentYear, formatDateFR, todayISO } from '@/utils/dates';
import { accordNe, afficherBadgeRenouvellement, categorieAnimal, demonstratifAnimal, libelleChevre, statutLabel } from '@/utils/chevreLabel';
import { avecIndicatif } from '@/utils/xlsxExport';
import { useAppSettings } from '@/context/AppSettingsContext';

export default function FicheChevre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useAppSettings();
  const indicatif = settings.exploitation?.indicatifMarquage;

  const [chevre, setChevre] = useState<Chevre | null>(null);
  const [descendance, setDescendance] = useState<Chevre[]>([]);
  const [visites, setVisites] = useState<Awaited<ReturnType<typeof listVisitesPourChevre>>>([]);
  const [controles, setControles] = useState<Awaited<ReturnType<typeof listControlesPourChevre>>>([]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Chevre | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [vueSecondaire, setVueSecondaire] = useState<'visites' | 'controles' | 'suppression' | null>(null);

  const [statutForm, setStatutForm] = useState<StatutChevre>('morte');
  const [dateStatutForm, setDateStatutForm] = useState(todayISO());
  const [showStatutForm, setShowStatutForm] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const c = await getChevre(id);
    setChevre(c ?? null);
    setForm(c ?? null);
    if (c) {
      setDescendance(await listDescendance(c.id));
      setVisites(await listVisitesPourChevre(c.id));
      setControles(await listControlesPourChevre(c.id));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  if (!chevre || !form) {
    return (
      <Screen>
        <Text style={styles.notFound}>Chèvre introuvable.</Text>
      </Screen>
    );
  }

  /** Retourne true si l'enregistrement a réussi (utile pour enchaîner une navigation, ex : ajout d'un cabri). */
  const enregistrerModifications = async (): Promise<boolean> => {
    const boucle = form.numeroBoucle?.trim();
    if (boucle && (await numeroBoucleExiste(boucle, form.id))) {
      setErreur(`Le n° ${boucle} est déjà attribué à une autre chèvre.`);
      return false;
    }
    await saveChevre(form);
    setEditing(false);
    charger();
    return true;
  };

  const supprimerDefinitivement = async () => {
    await supprimerChevre(chevre.id);
    router.back();
  };

  const choisirStatut = (s: StatutChevre) => {
    setStatutForm(s);
    setShowStatutForm(true);
  };

  const enregistrerStatut = async () => {
    await declarerStatutChevre(chevre.id, statutForm, dateStatutForm);
    setShowStatutForm(false);
    charger();
  };

  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{libelleChevre(chevre)}</Text>
          <Text style={styles.subtitle}>
            {chevre.sexe === 'F' ? 'Femelle' : 'Mâle'} · {accordNe(chevre.sexe)} le {formatDateFR(chevre.dateNaissance)}
          </Text>
        </View>
        <View style={styles.headerDroite}>
          <View style={styles.badges}>
            <Badge label={statutLabel(chevre.statut, chevre.sexe)} color={statutColors[chevre.statut]} />
            {chevre.renouvellement && afficherBadgeRenouvellement(chevre.dateNaissance) && (
              <Badge
                label={chevre.renouvellementAnnee ? `Renouvellement ${chevre.renouvellementAnnee}` : 'Renouvellement'}
                color={colors.primary}
              />
            )}
          </View>
          <Pressable style={styles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <OptionsModal
        visible={menuOuvert}
        onClose={() => setMenuOuvert(false)}
        title={libelleChevre(chevre)}
        options={[
          {
            label: `Visites vétérinaires (${visites.length})`,
            icon: 'medkit',
            onPress: () => setVueSecondaire((v) => (v === 'visites' ? null : 'visites')),
          },
          {
            label: `Contrôles (${controles.length})`,
            icon: 'clipboard',
            onPress: () => setVueSecondaire((v) => (v === 'controles' ? null : 'controles')),
          },
          { label: 'Supprimer définitivement', icon: 'trash', onPress: () => setVueSecondaire('suppression') },
        ]}
      />

      {editing ? (
        <Card>
          <Checkbox
            label="Désigné(e) pour le renouvellement"
            value={!!form.renouvellement}
            onChange={(v) =>
              setForm({
                ...form,
                renouvellement: v,
                renouvellementAnnee: v ? (form.renouvellementAnnee ?? currentYear()) : undefined,
              })
            }
          />
          {form.renouvellement && (
            <FormField
              label="Année de désignation"
              value={form.renouvellementAnnee !== undefined ? String(form.renouvellementAnnee) : ''}
              onChangeText={(v) => setForm({ ...form, renouvellementAnnee: Number(v) || undefined })}
              keyboardType="number-pad"
              placeholder={String(currentYear())}
            />
          )}
          {chevre.sexe === 'F' && chevre.statut === 'vivante' && categorieAnimal(chevre) === 'chevre' && (
            <Button
              label="Ajouter un cabri (nouvelle naissance)"
              variant="secondary"
              onPress={async () => {
                const boucleMere = form.numeroBoucle ?? '';
                const ok = await enregistrerModifications();
                if (!ok) return;
                router.push({
                  pathname: '/cheptel/naissance-nouvelle',
                  params: { mereNumeroBoucle: boucleMere },
                });
              }}
            />
          )}
          <BoucleField
            label="N° de boucle"
            value={form.numeroBoucle ?? ''}
            onChangeText={(v) => setForm({ ...form, numeroBoucle: v || undefined })}
            placeholder="Facultatif avant 6 mois"
          />
          {!!form.numeroBoucle?.trim() && (
            <DateField
              label="Date de bouclage"
              value={form.dateBouclage ?? ''}
              onChange={(v) => setForm({ ...form, dateBouclage: v || undefined })}
            />
          )}
          <FormField label="Nom" value={form.nom ?? ''} onChangeText={(v) => setForm({ ...form, nom: v })} />
          <SelectField
            label="Sexe"
            required
            value={form.sexe}
            onChange={(v) => setForm({ ...form, sexe: v })}
            options={[
              { value: 'F', label: 'Femelle' },
              { value: 'M', label: 'Mâle' },
            ]}
          />
          <DateField
            label="Date de naissance"
            required
            value={form.dateNaissance}
            onChange={(v) => setForm({ ...form, dateNaissance: v })}
          />
          <BoucleField
            label="N° de boucle de la mère"
            value={form.mereNumeroBoucle ?? ''}
            onChangeText={(v) => setForm({ ...form, mereNumeroBoucle: v })}
          />
          <FormField
            label="Notes"
            value={form.notes ?? ''}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            multiline
            style={styles.textarea}
          />
          <View style={styles.row}>
            <Button
              style={styles.flex1}
              variant="secondary"
              label="Annuler"
              onPress={() => {
                setForm(chevre);
                setEditing(false);
              }}
            />
            <Button style={styles.flex1} label="Enregistrer" onPress={enregistrerModifications} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.line}>
            N° de boucle : {chevre.numeroBoucle ? avecIndicatif(chevre.numeroBoucle, indicatif) : '—'}
          </Text>
          {chevre.numeroBoucle && (
            <Text style={styles.line}>Date de bouclage : {formatDateFR(chevre.dateBouclage)}</Text>
          )}
          <Text style={styles.line}>Nom : {chevre.nom ?? '—'}</Text>
          <Text style={styles.line}>Sexe : {chevre.sexe === 'F' ? 'Femelle' : 'Mâle'}</Text>
          <Text style={styles.line}>Date de naissance : {formatDateFR(chevre.dateNaissance)}</Text>
          <Text style={styles.line}>
            N° de boucle de la mère : {chevre.mereNumeroBoucle ? avecIndicatif(chevre.mereNumeroBoucle, indicatif) : '—'}
          </Text>
          <Text style={styles.line}>Notes : {chevre.notes ?? '—'}</Text>
          {chevre.statut !== 'vivante' && (
            <Text style={styles.line}>
              {statutLabel(chevre.statut, chevre.sexe)} le {formatDateFR(chevre.dateStatut)}
            </Text>
          )}
          <Button label="Modifier la fiche" variant="secondary" onPress={() => setEditing(true)} />
        </Card>
      )}

      {chevre.statut === 'vivante' && showStatutForm && (
        <Card>
          <Text style={styles.cardTitle}>Déclarer : {statutLabel(statutForm, chevre.sexe)}</Text>
          <DateField label="Date" value={dateStatutForm} onChange={setDateStatutForm} />
          <View style={styles.row}>
            <Button
              style={styles.flex1}
              variant="secondary"
              label="Annuler"
              onPress={() => setShowStatutForm(false)}
            />
            <Button style={styles.flex1} variant="danger" label="Confirmer" onPress={enregistrerStatut} />
          </View>
        </Card>
      )}

      {chevre.statut !== 'vivante' && (
        <Card>
          <Text style={styles.cardTitle}>Statut</Text>
          <Button
            label="Remettre dans le cheptel actif"
            variant="secondary"
            onPress={async () => {
              await reactiverChevre(chevre.id);
              charger();
            }}
          />
        </Card>
      )}

      {descendance.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Descendance ({descendance.length})</Text>
          {descendance.map((d) => (
            <ListRow
              key={d.id}
              title={libelleChevre(d)}
              subtitle={`${d.sexe === 'F' ? 'Née' : 'Né'} le ${formatDateFR(d.dateNaissance)}`}
              trailing={<Badge label={statutLabel(d.statut, d.sexe)} color={statutColors[d.statut]} />}
              onPress={() => router.push(`/cheptel/${d.id}`)}
            />
          ))}
        </Card>
      )}

      {vueSecondaire === 'visites' && (
        <Card>
          <Text style={styles.cardTitle}>Visites vétérinaires ({visites.length})</Text>
          {visites.length === 0 ? (
            <Text style={styles.muted}>Aucune visite enregistrée pour {demonstratifAnimal(chevre)}.</Text>
          ) : (
            visites.map((v) => (
              <View key={v.id} style={styles.entry}>
                <Text style={styles.entryTitle}>{formatDateFR(v.date)} — {v.motif}</Text>
                {v.description ? <Text style={styles.muted}>{v.description}</Text> : null}
              </View>
            ))
          )}
        </Card>
      )}

      {vueSecondaire === 'controles' && (
        <Card>
          <Text style={styles.cardTitle}>Contrôles ({controles.length})</Text>
          {controles.length === 0 ? (
            <Text style={styles.muted}>Aucun contrôle enregistré pour {demonstratifAnimal(chevre)}.</Text>
          ) : (
            controles.map((c) => (
              <View key={c.id} style={styles.entry}>
                <Text style={styles.entryTitle}>{formatDateFR(c.date)} — {c.type}</Text>
                {c.resultat ? <Text style={styles.muted}>{c.resultat}</Text> : null}
              </View>
            ))
          )}
        </Card>
      )}

      </ScrollView>

      <ConfirmModal
        visible={vueSecondaire === 'suppression'}
        title="Supprimer définitivement ?"
        message={`Contrairement à « ${statutLabel('morte', chevre.sexe)} / Abattoir / ${statutLabel('vendue', chevre.sexe)} », cette action efface complètement la fiche de ${libelleChevre(chevre)} — elle ne sera plus enregistrée du tout. Utilisez plutôt « Déclarer ${statutLabel('morte', chevre.sexe).toLowerCase()} / abattoir / ${statutLabel('vendue', chevre.sexe).toLowerCase()} » si vous voulez garder une trace. Cette suppression est irréversible.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() => setVueSecondaire(null)}
        onConfirm={supprimerDefinitivement}
      />

      <InfoModal
        visible={!!erreur}
        title="N° de boucle déjà utilisé"
        message={erreur ?? undefined}
        onClose={() => setErreur(null)}
      />

      {chevre.statut === 'vivante' && !showStatutForm && (
        <Fab
          color={colors.danger}
          icon="remove"
          options={[
            { label: statutLabel('morte', chevre.sexe), icon: 'skull', onPress: () => choisirStatut('morte') },
            {
              label: chevre.sexe === 'M' ? 'Envoyé à l’abattoir' : 'Envoyée à l’abattoir',
              icon: 'cut',
              onPress: () => choisirStatut('abattoir'),
            },
            { label: statutLabel('vendue', chevre.sexe), icon: 'cash', onPress: () => choisirStatut('vendue') },
            {
              label: statutLabel('autoconsommee', chevre.sexe),
              icon: 'restaurant',
              onPress: () => choisirStatut('autoconsommee'),
            },
            { label: statutLabel('mortne', chevre.sexe), icon: 'sad', onPress: () => choisirStatut('mortne') },
          ]}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 160, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  headerDroite: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badges: { flexDirection: 'row', gap: 6 },
  boutonMenu: { padding: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  line: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  entry: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4, gap: 2 },
  entryTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
});
