import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.tresorerie.reglagesEcran;

/** Ce qu'on saisit d'un emprunt : tout en texte. */
interface SaisieEmprunt {
  id: string;
  nom: string;
  mensualite: string;
  premiereEcheance: string;
  nombreEcheances: string;
}

interface Saisie {
  soldeDepart: string;
  dateSolde: string;
  seuilAlerte: string;
  emprunts: SaisieEmprunt[];
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
        const deplie = ouvert === e.id;
        return (
          <Card key={e.id}>
            <Pressable
              style={commonStyles.rowCentre}
              onPress={() => setOuvert((actuel) => (actuel === e.id ? null : e.id))}
            >
              <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{e.nom}</Text>
              <Ionicons name={deplie ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
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
