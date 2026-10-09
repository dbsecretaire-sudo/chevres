import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { NatureUrssaf } from '@/features/comptabilite/types';
import type { SaisieFacturation } from '@/features/dossiers/services/facturation';
import { NATURE_URSSAF } from '@/shared/constants/entreprise';
import { TYPE_FACTURATION } from '@/shared/constants/dossiers';
import { LABEL_NATURE_URSSAF } from '@/shared/textes/libelles';
import { estDateISO } from '@/shared/utils/dates';
import { useAnneeImposee } from '@/features/settings/hooks/useAnneeImposee';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.dossiers.facturation;

interface Props {
  /** Facturer le contenu ou enregistrer un acompte ; la fenêtre est fermée quand il est absent. */
  mode: typeof TYPE_FACTURATION.FACTURE | typeof TYPE_FACTURATION.ACOMPTE | null;
  /** Le client du dossier : la facture est à son nom. */
  nomClient: string;
  /** Le titre du contenu qu'on facture. */
  titre: string;
  /** La nature d'office de la prestation (celle du régime de l'entreprise : très souvent des prestations de services). */
  natureParDefaut: NatureUrssaf;
  onValider: (saisie: SaisieFacturation) => void;
  onFermer: () => void;
}

/**
 * La fenêtre pour facturer un contenu au client de son dossier : le montant, la date, la nature de la prestation (pour
 * l'URSSAF) et le numéro de facture. Une facture peut aussi s'ajouter sur la note du client, sans numéro, pour tout facturer
 * ensemble plus tard (pas pour un acompte, qui est encaissé tout de suite).
 */
export function FacturationModal({ mode, nomClient, titre, natureParDefaut, onValider, onFermer }: Props) {
  const [montant, setMontant] = useState('');
  const { anneeImposee, dateDuJour } = useAnneeImposee();
  const [date, setDate] = useState(dateDuJour);
  const [nature, setNature] = useState<NatureUrssaf>(natureParDefaut);
  const [numero, setNumero] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart d'un formulaire vide, à la date du jour.
    if (mode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMontant('');
      setDate(dateDuJour);
      setNature(natureParDefaut);
      setNumero('');
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, natureParDefaut]);

  const acompte = mode === TYPE_FACTURATION.ACOMPTE;

  /** Contrôle le montant et la date, puis envoie la saisie (le numéro de facture n'est exigé que pour facturer). */
  const valider = (type: SaisieFacturation['type']) => {
    const valeur = parseDecimal(montant);
    if (!(valeur > 0)) return setErreur(T.montantInvalide);
    if (!estDateISO(date)) return setErreur(TEXTES.commun.dateField.invalide);
    if (type !== TYPE_FACTURATION.NOTE && !numero.trim()) return setErreur(T.numeroRequis);
    onValider({
      type,
      montant: valeur,
      date,
      nature,
      numeroFacture: type === TYPE_FACTURATION.NOTE ? undefined : numero.trim(),
    });
  };

  return (
    <Modal visible={!!mode} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{acompte ? T.titreAcompte : T.titreFacturer}</Text>
          <Text style={commonStyles.note}>{T.pour(titre)}</Text>
          <ScrollView style={commonStyles.listeDeFenetre} contentContainerStyle={commonStyles.gap10}>
            <FormField label={T.client} value={nomClient} editable={false} style={commonStyles.verrouille} />
            <View style={commonStyles.row}>
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.montant}
                  required
                  value={montant}
                  onChangeText={(texte) => {
                    setMontant(texte);
                    setErreur(null);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={commonStyles.flex1}>
                <DateField
                  label={T.date}
                  required
                  value={date}
                  onChange={setDate}
                  anneeImposee={anneeImposee}
                  jourMoisAnnee
                />
              </View>
            </View>
            <SelectField<string>
              label={T.nature}
              value={nature}
              onChange={(v) => setNature(v as NatureUrssaf)}
              options={Object.values(NATURE_URSSAF).map((n) => ({
                value: n as string,
                label: LABEL_NATURE_URSSAF[n],
              }))}
            />
            <FormField
              label={T.numero}
              required
              value={numero}
              onChangeText={(texte) => {
                setNumero(texte);
                setErreur(null);
              }}
            />
          </ScrollView>
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          {acompte ? null : (
            <Button
              variant="secondary"
              label={T.ajouterALaNote}
              onPress={() => valider(TYPE_FACTURATION.NOTE)}
            />
          )}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button
              style={commonStyles.flex1}
              label={acompte ? T.enregistrerLAcompte : T.facturer}
              onPress={() => valider(mode ?? TYPE_FACTURATION.FACTURE)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
