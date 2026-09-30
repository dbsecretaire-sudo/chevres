import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ListRow } from '@/components/ListRow';
import { OptionsModal } from '@/components/OptionsModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { InfoModal } from '@/components/InfoModal';

import { colors } from '@/theme/colors';
import { getClient, enregistrerClient, supprimerClient } from '@/storage/clients';
import { listToutesFactures, listToutesVentes } from '@/storage/repositories';
import { formatDateFR, formatMontant } from '@/utils/dates';
import type { Client, Facture, TypeFromage, Vente } from '@/types/models';

interface EcritureClient {
  id: string;
  date: string;
  titre: string;
  montant: number;
  source: 'vente' | 'facture';
}

const nomAffiche = (c: Client) => `${c.nom}${c.prenom ? ` ${c.prenom}` : ''}`;

const LIBELLE_CATEGORIE_VENTE: Record<string, string> = {
  lait: 'Lait',
  fromage: 'Fromage',
  cabris: 'Cabris',
};

const LABEL_TYPE_FROMAGE: Record<TypeFromage, string> = {
  frais: 'Frais',
  affine: 'Affiné (vieux)',
  crottin: 'Crottin',
  brocciu: 'Brocciu',
  autre: 'Autre',
};

const libelleUnite = (unite: string) => (unite === 'piece' ? 'pièce(s)' : unite === 'kg' ? 'kg' : unite);

export default function FicheClient() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Client | null>(null);
  const [ecritures, setEcritures] = useState<EcritureClient[]>([]);
  const [ventesClient, setVentesClient] = useState<Vente[]>([]);
  const [facturesClient, setFacturesClient] = useState<Facture[]>([]);
  const [detailFromageOuvert, setDetailFromageOuvert] = useState(false);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const c = await getClient(id);
    setClient(c ?? null);
    setForm(c ?? null);
    if (c) {
      const nom = nomAffiche(c);
      const [ventes, factures] = await Promise.all([listToutesVentes(), listToutesFactures()]);
      const deVentesListe = ventes.filter((v) => v.client === nom);
      const deFacturesListe = factures.filter((f) => f.type === 'emise' && f.tiers === nom);
      setVentesClient(deVentesListe);
      setFacturesClient(deFacturesListe);
      const deVentes: EcritureClient[] = deVentesListe.map((v) => ({
        id: v.id,
        date: v.date,
        titre: `${LIBELLE_CATEGORIE_VENTE[v.categorie] ?? v.categorie} — ${v.quantite} ${v.categorie === 'lait' ? 'L' : v.unite}`,
        montant: v.prix ?? 0,
        source: 'vente',
      }));
      const deFactures: EcritureClient[] = deFacturesListe.map((f) => ({
        id: f.id,
        date: f.date,
        titre: f.description || 'Facture',
        montant: f.montant,
        source: 'facture',
      }));
      setEcritures([...deVentes, ...deFactures].sort((a, b) => b.date.localeCompare(a.date)));
    } else {
      setVentesClient([]);
      setFacturesClient([]);
      setEcritures([]);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const resume = useMemo(() => {
    const ventesLait = ventesClient.filter((v) => v.categorie === 'lait');
    const totalLitresLait = ventesLait.reduce((s, v) => s + v.quantite, 0);

    const ventesFromage = ventesClient.filter((v) => v.categorie === 'fromage');
    const totalFromage = ventesFromage.reduce((s, v) => s + v.quantite, 0);
    const uniteFromage = ventesFromage.length > 0 ? ventesFromage[0].unite : 'piece';
    const uniteFromageUniforme = ventesFromage.every((v) => v.unite === uniteFromage);
    const detailFromage = (Object.keys(LABEL_TYPE_FROMAGE) as TypeFromage[])
      .map((type) => {
        const lignes = ventesFromage.filter((v) => (v.typeFromage ?? 'autre') === type);
        const quantite = lignes.reduce((s, v) => s + v.quantite, 0);
        const libelle =
          type === 'autre' && lignes.some((v) => v.typeFromageLibre)
            ? lignes.find((v) => v.typeFromageLibre)?.typeFromageLibre ?? LABEL_TYPE_FROMAGE.autre
            : LABEL_TYPE_FROMAGE[type];
        const uniteLigne = lignes.length > 0 ? lignes[0].unite : uniteFromage;
        return { type, libelle, quantite, unite: uniteLigne };
      })
      .filter((d) => d.quantite > 0);

    const ventesCabris = ventesClient.filter((v) => v.categorie === 'cabris');
    const nombreCabris = ventesCabris.reduce((s, v) => s + v.quantite, 0);
    const kgCabris = ventesCabris.reduce((s, v) => s + (v.poidsKg ?? 0), 0);

    const facturesAide = facturesClient.filter((f) => f.categorieRecette === 'aide');
    const montantAide = facturesAide.reduce((s, f) => s + f.montant, 0);

    const facturesAutre = facturesClient.filter((f) => f.categorieRecette === 'autre');
    const montantAutre = facturesAutre.reduce((s, f) => s + f.montant, 0);

    const totalPaye = ecritures.reduce((s, e) => s + e.montant, 0);

    return {
      totalLitresLait,
      aLait: ventesLait.length > 0,
      totalFromage,
      uniteFromage,
      uniteFromageUniforme,
      detailFromage,
      aFromage: ventesFromage.length > 0,
      nombreCabris,
      kgCabris,
      aCabris: ventesCabris.length > 0,
      montantAide,
      aAide: facturesAide.length > 0,
      montantAutre,
      aAutre: facturesAutre.length > 0,
      totalPaye,
    };
  }, [ventesClient, facturesClient, ecritures]);

  const enregistrerModifications = async () => {
    if (!form) return;
    if (!form.nom.trim()) return setErreur('Nom requis');

    const nettoye: Client = {
      ...form,
      nom: form.nom.trim(),
      prenom: form.prenom?.trim() || undefined,
      telephone: form.telephone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      adressePostale: form.adressePostale?.trim() || undefined,
    };
    await enregistrerClient(nettoye);
    setClient(nettoye);
    setForm(nettoye);
    setEditing(false);
  };

  const supprimerDefinitivement = async () => {
    if (!client) return;
    await supprimerClient(client.id);
    router.back();
  };

  if (!client || !form) {
    return (
      <Screen>
        <Text style={styles.notFound}>Client introuvable.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>
              {client.nom}
              {client.prenom ? ` ${client.prenom}` : ''}
            </Text>
            {client.telephone || client.email ? (
              <Text style={styles.subtitle}>{[client.telephone, client.email].filter(Boolean).join(' · ')}</Text>
            ) : null}
          </View>
          <Pressable style={styles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={`${client.nom}${client.prenom ? ` ${client.prenom}` : ''}`}
          options={[
            { label: 'Modifier la fiche', icon: 'create', onPress: () => { setMenuOuvert(false); setEditing(true); } },
            { label: 'Supprimer définitivement', icon: 'trash', color: colors.danger, onPress: () => { setMenuOuvert(false); setSuppressionOuverte(true); } },
          ]}
        />

        {!editing ? (
          <Card>
            <Text style={styles.line}>
              Nom : {client.nom}
              {client.prenom ? ` ${client.prenom}` : ''}
            </Text>
            {client.telephone ? <Text style={styles.line}>Téléphone : {client.telephone}</Text> : null}
            {client.email ? <Text style={styles.line}>Email : {client.email}</Text> : null}
            {client.adressePostale ? <Text style={styles.line}>Adresse : {client.adressePostale}</Text> : null}

            <Button label="Modifier la fiche" variant="secondary" onPress={() => setEditing(true)} />
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>Modifier la fiche</Text>

            <FormField label="Nom" required value={form.nom} onChangeText={(v) => setForm({ ...form, nom: v })} />
            <FormField label="Prénom" value={form.prenom ?? ''} onChangeText={(v) => setForm({ ...form, prenom: v })} placeholder="Facultatif" />
            <FormField label="Téléphone" value={form.telephone ?? ''} onChangeText={(v) => setForm({ ...form, telephone: v })} keyboardType="phone-pad" placeholder="Facultatif" />
            <FormField label="Email" value={form.email ?? ''} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" placeholder="Facultatif" />
            <FormField
              label="Adresse postale"
              value={form.adressePostale ?? ''}
              onChangeText={(v) => setForm({ ...form, adressePostale: v })}
              multiline
              style={styles.textarea}
              placeholder="Facultatif"
            />

            <View style={styles.row}>
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Annuler"
                onPress={() => { setForm(client); setEditing(false); }}
              />
              <Button style={styles.flex1} label="Enregistrer" onPress={enregistrerModifications} />
            </View>
          </Card>
        )}

        {!editing && ecritures.length > 0 && (
          <Card style={styles.resumeCard}>
            <Text style={styles.resumeTitre}>Résumé</Text>

            {resume.aLait && (
              <View style={styles.resumeLigne}>
                <Text style={styles.line}>Lait vendu</Text>
                <Text style={styles.resumeValeur}>{resume.totalLitresLait} L</Text>
              </View>
            )}

            {resume.aFromage && (
              <View style={styles.resumeBlocFromage}>
                <View style={styles.resumeLigne}>
                  <Text style={styles.line}>Fromage vendu</Text>
                  <Text style={styles.resumeValeur}>
                    {resume.totalFromage}
                    {resume.uniteFromageUniforme ? ` ${libelleUnite(resume.uniteFromage)}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => setDetailFromageOuvert((v) => !v)}>
                  <Text style={styles.lienDetails}>
                    {detailFromageOuvert ? 'Masquer les détails' : 'Voir les détails'}
                  </Text>
                </Pressable>
                {detailFromageOuvert && (
                  <View style={styles.resumeDetailBloc}>
                    {resume.detailFromage.map((d) => (
                      <View key={d.type} style={styles.resumeLigne}>
                        <Text style={styles.resumeDetailLabel}>{d.libelle}</Text>
                        <Text style={styles.resumeDetailValeur}>
                          {d.quantite} {libelleUnite(d.unite)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {resume.aCabris && (
              <View style={styles.resumeLigne}>
                <Text style={styles.line}>Cabris vendus</Text>
                <Text style={styles.resumeValeur}>
                  {resume.nombreCabris}
                  {resume.kgCabris > 0 ? ` (${resume.kgCabris} kg)` : ''}
                </Text>
              </View>
            )}

            {resume.aAide && (
              <View style={styles.resumeLigne}>
                <Text style={styles.line}>Aides / subventions</Text>
                <Text style={styles.resumeValeur}>{formatMontant(resume.montantAide)}</Text>
              </View>
            )}

            {resume.aAutre && (
              <View style={styles.resumeLigne}>
                <Text style={styles.line}>Autre</Text>
                <Text style={styles.resumeValeur}>{formatMontant(resume.montantAutre)}</Text>
              </View>
            )}

            <View style={styles.resumeSeparateur} />
            <View style={styles.resumeLigne}>
              <Text style={styles.resumeTotalLabel}>Total payé par ce client</Text>
              <Text style={styles.resumeTotalValeur}>{formatMontant(resume.totalPaye)}</Text>
            </View>
          </Card>
        )}

        {!editing && (
          <View style={styles.ecrituresBloc}>
            <Text style={styles.ecrituresTitre}>
              Écritures liées{ecritures.length > 0 ? ` (${ecritures.length})` : ''}
            </Text>
            {ecritures.length === 0 ? (
              <Text style={styles.ecrituresVide}>Aucune écriture liée à ce client pour l’instant.</Text>
            ) : (
              ecritures.map((e) => (
                <ListRow
                  key={e.id}
                  title={e.titre}
                  subtitle={formatDateFR(e.date)}
                  trailing={<Text style={styles.montantEcriture}>+{formatMontant(e.montant)}</Text>}
                  onPress={() => router.push(`/comptabilite/${e.source === 'vente' ? 'vente' : 'facture'}/${e.id}`)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={suppressionOuverte}
        title="Supprimer définitivement ?"
        message={`Cette action supprimera définitivement la fiche de ${client.nom}${client.prenom ? ` ${client.prenom}` : ''}. Les ventes déjà enregistrées ne sont pas modifiées.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimerDefinitivement}
      />

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerMain: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  boutonMenu: { padding: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  line: { fontSize: 14, color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  resumeCard: { gap: 8 },
  resumeTitre: { fontSize: 15, fontWeight: '700', color: colors.text },
  resumeLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumeValeur: { fontSize: 14, fontWeight: '700', color: colors.text },
  resumeBlocFromage: { gap: 4 },
  lienDetails: { fontSize: 13, fontWeight: '600', color: colors.ajout },
  resumeDetailBloc: { gap: 2, paddingLeft: 8, marginTop: 2 },
  resumeDetailLabel: { fontSize: 13, color: colors.textMuted },
  resumeDetailValeur: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  resumeSeparateur: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  resumeTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  resumeTotalValeur: { fontSize: 16, fontWeight: '800', color: colors.primary },
  ecrituresBloc: { gap: 10 },
  ecrituresTitre: { fontSize: 15, fontWeight: '700', color: colors.text },
  ecrituresVide: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  montantEcriture: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
