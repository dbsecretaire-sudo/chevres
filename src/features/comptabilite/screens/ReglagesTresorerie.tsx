import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Checkbox } from '@/shared/components/Checkbox';
import { SelectField } from '@/shared/components/SelectField';
import type { PeriodiciteAssurance } from '@/features/settings/settings';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { propositionsDeContrats } from '@/features/comptabilite/services/contratsAssurance';
import type { Facture } from '@/features/comptabilite/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const T = TEXTES.comptabilite.tresorerie.reglagesEcran;

/** Ce qu'on saisit d'un emprunt : tout en texte. */
interface SaisieEmprunt {
  id: string;
  nom: string;
  mensualite: string;
  premiereEcheance: string;
  nombreEcheances: string;
}

/** Ce qu'on saisit d'un contrat d'assurance : tout en texte. */
interface SaisieContrat {
  id: string;
  source?: string;
  nom: string;
  prime: string;
  periodicite: PeriodiciteAssurance;
  prochaineEcheance: string;
}

interface Saisie {
  soldeDepart: string;
  dateSolde: string;
  seuilAlerte: string;
  emprunts: SaisieEmprunt[];
  /** La case « Activer l'échéancier » des assurances, et leurs contrats. */
  echeancierAssurance: boolean;
  contrats: SaisieContrat[];
}

/** Un nombre saisi en texte (rien quand le champ est vide), le signe moins permis (un solde peut être négatif). */
const nombreOuRien = (texte: string): number | undefined => (texte.trim() ? parseDecimal(texte) : undefined);
const enTexte = (valeur: number | undefined): string =>
  valeur === undefined ? '' : String(valeur).replace('.', ',');
const MOTIF_NOMBRE = /^-?\d*[.,]?\d*$/;

/**
 * Comptabilité › Trésorerie › Réglages : le solde du compte à une date (le départ des courbes), le seuil sous lequel alerter, et les
 * emprunts en cours (chacun avec sa mensualité, sa première échéance et son nombre d'échéances). Tout s'enregistre tout seul.
 */
export default function ReglagesTresorerie() {
  const { settings, loaded, patchSettings } = useAppSettings();
  const infos = settings.exploitation;

  const depart = (): Saisie => ({
    soldeDepart: enTexte(infos?.tresorerie?.soldeDepart),
    dateSolde: infos?.tresorerie?.dateSolde ?? todayISO(),
    seuilAlerte: enTexte(infos?.tresorerie?.seuilAlerte),
    echeancierAssurance: !!infos?.echeancierAssurance,
    contrats: (infos?.contratsAssurance ?? []).map((c) => ({
      id: c.id,
      source: c.source,
      nom: c.nom,
      prime: enTexte(c.prime),
      periodicite: c.periodicite,
      prochaineEcheance: c.prochaineEcheance,
    })),
    emprunts: (infos?.emprunts ?? []).map((e) => ({
      id: e.id,
      nom: e.nom,
      mensualite: enTexte(e.mensualite),
      premiereEcheance: e.premiereEcheance,
      nombreEcheances: String(e.nombreEcheances),
    })),
  });
  const [saisie, setSaisie] = useState<Saisie>(depart);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [contratAjoutOuvert, setContratAjoutOuvert] = useState(false);
  /** Le choix d'un contrat à ajouter : les assurances déjà notées (véhicules actifs par leur plaque, bâtiments, animaux, visiteurs), ou un nom libre. */
  const [choixContratOuvert, setChoixContratOuvert] = useState(false);
  const [factures, setFactures] = useState<Facture[]>([]);
  useEffect(() => {
    listToutesFactures()
      .then(setFactures)
      .catch(() => undefined);
  }, []);
  const propositions = propositionsDeContrats(factures, infos?.flotte ?? [], saisie.contrats, todayISO());
  const [contratASupprimer, setContratASupprimer] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  /** L'emprunt déplié : tous sont enroulés au départ, un seul est visible à la fois. */
  const [ouvert, setOuvert] = useState<string | null>(null);

  useEffect(() => {
    // Chargement initial unique depuis les réglages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setSaisie(depart());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const enregistrer = async (): Promise<boolean> => {
    await patchSettings({
      exploitation: {
        ...infos,
        tresorerie: {
          soldeDepart: nombreOuRien(saisie.soldeDepart),
          dateSolde: saisie.dateSolde || undefined,
          seuilAlerte: nombreOuRien(saisie.seuilAlerte),
        },
        echeancierAssurance: saisie.echeancierAssurance || undefined,
        contratsAssurance:
          saisie.contrats.length > 0
            ? saisie.contrats.map((c) => ({
                id: c.id,
                source: c.source,
                nom: c.nom,
                prime: nombreOuRien(c.prime) ?? 0,
                periodicite: c.periodicite,
                prochaineEcheance: c.prochaineEcheance,
              }))
            : undefined,
        emprunts: saisie.emprunts.map((e) => ({
          id: e.id,
          nom: e.nom,
          mensualite: nombreOuRien(e.mensualite) ?? 0,
          premiereEcheance: e.premiereEcheance,
          nombreEcheances: Math.max(0, Math.round(nombreOuRien(e.nombreEcheances) ?? 0)),
        })),
      },
    });
    return true;
  };
  useEnregistrementAuto({ actif: loaded, signature: JSON.stringify(saisie), enregistrer });

  const majContrat = (id: string, patch: Partial<SaisieContrat>) =>
    setSaisie((s) => ({ ...s, contrats: s.contrats.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const majEmprunt = (id: string, patch: Partial<SaisieEmprunt>) =>
    setSaisie((s) => ({ ...s, emprunts: s.emprunts.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  return (
    <Screen>
      <Text style={styles.titreSection}>{T.soldeTitre}</Text>
      <Text style={styles.aide}>{T.soldeAide}</Text>
      <Card>
        <FormField
          label={T.soldeDepart}
          value={saisie.soldeDepart}
          onChangeText={(v) => MOTIF_NOMBRE.test(v) && setSaisie((s) => ({ ...s, soldeDepart: v }))}
          keyboardType="numbers-and-punctuation"
          placeholder="0"
        />
        <DateField
          label={T.dateSolde}
          value={saisie.dateSolde}
          onChange={(dateSolde) => setSaisie((s) => ({ ...s, dateSolde }))}
        />
        <FormField
          label={T.seuil}
          value={saisie.seuilAlerte}
          onChangeText={(v) => MOTIF_NOMBRE.test(v) && setSaisie((s) => ({ ...s, seuilAlerte: v }))}
          keyboardType="numbers-and-punctuation"
          placeholder="0"
          aide={T.seuilAide}
        />
      </Card>

      <Text style={styles.titreSection}>{T.empruntsTitre}</Text>
      <Text style={styles.aide}>{T.empruntsAide}</Text>
      {saisie.emprunts.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunEmprunt}</Text> : null}
      {saisie.emprunts.map((e) => {
        // Sur ordinateur, tous les emprunts sont dépliés.
        const deplie = estBureau() || ouvert === e.id;
        return (
          <Card key={e.id}>
            <Pressable
              style={commonStyles.rowCentre}
              onPress={() => setOuvert((actuel) => (actuel === e.id ? null : e.id))}
            >
              <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{e.nom}</Text>
              {estBureau() ? null : (
                <Ionicons name={deplie ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              )}
            </Pressable>
            {deplie ? (
              <View style={commonStyles.gap10}>
                <FormField
                  label={T.mensualite}
                  value={e.mensualite}
                  onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && majEmprunt(e.id, { mensualite: v })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <DateField
                  label={T.premiereEcheance}
                  value={e.premiereEcheance}
                  onChange={(premiereEcheance) => majEmprunt(e.id, { premiereEcheance })}
                />
                <FormField
                  label={T.nombreEcheances}
                  value={e.nombreEcheances}
                  onChangeText={(v) => /^\d*$/.test(v) && majEmprunt(e.id, { nombreEcheances: v })}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Button variant="danger" label={T.supprimer} onPress={() => setASupprimer(e.id)} />
              </View>
            ) : null}
          </Card>
        );
      })}
      <Button variant="secondary" label={T.ajouter} onPress={() => setAjoutOuvert(true)} />

      {/* Les assurances : la case « Activer l'échéancier » et les contrats dont la prime entre dans l'échéancier et la prévision. */}
      <Text style={styles.titreSection}>{T.assurancesTitre}</Text>
      <Text style={styles.aide}>{T.assurancesAide}</Text>
      <Checkbox
        label={T.activerEcheancier}
        value={saisie.echeancierAssurance}
        onChange={(echeancierAssurance) => setSaisie((s) => ({ ...s, echeancierAssurance }))}
      />
      {saisie.echeancierAssurance ? (
        <>
          {saisie.contrats.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunContrat}</Text> : null}
          {saisie.contrats.map((c) => (
            <Card key={c.id}>
              <Text style={commonStyles.cardTitle}>{c.nom}</Text>
              <View style={commonStyles.gap10}>
                <FormField
                  label={T.prime}
                  value={c.prime}
                  onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && majContrat(c.id, { prime: v })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <SelectField<PeriodiciteAssurance>
                  label={T.periodicite}
                  value={c.periodicite}
                  onChange={(periodicite) => majContrat(c.id, { periodicite })}
                  options={(Object.keys(T.periodicites) as PeriodiciteAssurance[]).map((p) => ({
                    value: p,
                    label: T.periodicites[p],
                  }))}
                />
                <DateField
                  label={T.prochaineEcheance}
                  value={c.prochaineEcheance}
                  onChange={(prochaineEcheance) => majContrat(c.id, { prochaineEcheance })}
                />
                <Button variant="danger" label={T.supprimerContrat} onPress={() => setContratASupprimer(c.id)} />
              </View>
            </Card>
          ))}
          <Button
            variant="secondary"
            label={T.ajouterContrat}
            onPress={() => setChoixContratOuvert(true)}
          />
        </>
      ) : null}

      <OptionsModal
        visible={choixContratOuvert}
        onClose={() => setChoixContratOuvert(false)}
        title={T.choisirContrat}
        options={[
          ...propositions.map((p) => ({
            label: p.nom,
            icon: 'shield-checkmark' as const,
            onPress: () => {
              setChoixContratOuvert(false);
              setSaisie((s) => ({
                ...s,
                contrats: [
                  ...s.contrats,
                  {
                    id: generateId(),
                    source: p.cle,
                    nom: p.nom,
                    prime: enTexte(p.prime),
                    periodicite: p.periodicite,
                    prochaineEcheance: p.prochaineEcheance ?? todayISO(),
                  },
                ],
              }));
            },
          })),
          {
            label: T.autreContrat,
            icon: 'create' as const,
            onPress: () => {
              setChoixContratOuvert(false);
              setContratAjoutOuvert(true);
            },
          },
        ]}
      />
      <NomModal
        visible={contratAjoutOuvert}
        titre={T.nomContrat}
        placeholder={T.exempleContrat}
        onValider={(nom) => {
          setSaisie((s) => ({
            ...s,
            contrats: [
              ...s.contrats,
              { id: generateId(), nom, prime: '', periodicite: 'annuelle', prochaineEcheance: todayISO() },
            ],
          }));
          setContratAjoutOuvert(false);
        }}
        onAnnuler={() => setContratAjoutOuvert(false)}
      />
      <ConfirmModal
        visible={!!contratASupprimer}
        title={T.supprimerContratQuestion}
        message={T.supprimerContratMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setContratASupprimer(null)}
        onConfirm={() => {
          setSaisie((s) => ({ ...s, contrats: s.contrats.filter((c) => c.id !== contratASupprimer) }));
          setContratASupprimer(null);
        }}
      />
      <NomModal
        visible={ajoutOuvert}
        titre={T.nomEmprunt}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          const id = generateId();
          setSaisie((s) => ({
            ...s,
            emprunts: [
              ...s.emprunts,
              { id, nom, mensualite: '', premiereEcheance: todayISO(), nombreEcheances: '' },
            ],
          }));
          setOuvert(id);
          setAjoutOuvert(false);
        }}
        onAnnuler={() => setAjoutOuvert(false)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.supprimerQuestion}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={() => {
          setSaisie((s) => ({ ...s, emprunts: s.emprunts.filter((e) => e.id !== aSupprimer) }));
          setASupprimer(null);
        }}
      />
    </Screen>
  );
}
