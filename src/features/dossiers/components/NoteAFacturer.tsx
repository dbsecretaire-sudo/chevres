import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { totalDeLaNote, type LigneDeNote } from '@/features/dossiers/services/facturation';
import { LABEL_NATURE_URSSAF } from '@/shared/textes/libelles';
import { estDateISO, formatMontant } from '@/shared/utils/dates';
import { useAnneeImposee } from '@/features/settings/hooks/useAnneeImposee';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.dossiers.facturation.note;

interface Props {
  lignes: LigneDeNote[];
  /** Facture la note sous ce numéro de facture, à cette date. */
  onFacturer: (numeroFacture: string, date: string) => void;
}

/**
 * La note d'un client : les prestations ajoutées « sur la note » (rien n'est encore facturé), avec leur total, et le bouton
 * qui les facture toutes sous un seul numéro de facture. Rien quand la note est vide.
 */
export function NoteAFacturer({ lignes, onFacturer }: Props) {
  const [ouverte, setOuverte] = useState(false);
  /** La note est repliée : une ligne (titre, total, pastille rouge) ; un appui déroule ses prestations et « Facturer la note ». */
  const [depliee, setDepliee] = useState(false);
  const [numero, setNumero] = useState('');
  const { anneeImposee, dateDuJour } = useAnneeImposee();
  const [date, setDate] = useState(dateDuJour);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (ouverte) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNumero('');
      setDate(dateDuJour);
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouverte]);

  if (lignes.length === 0) return null;

  const valider = () => {
    if (!numero.trim()) return setErreur(TEXTES.dossiers.facturation.numeroRequis);
    if (!estDateISO(date)) return setErreur(TEXTES.commun.dateField.invalide);
    setOuverte(false);
    onFacturer(numero.trim(), date);
  };

  return (
    <>
      <Card style={commonStyles.gap6}>
        <Pressable
          style={commonStyles.rowSpaceBetween}
          onPress={() => setDepliee((d) => !d)}
          accessibilityLabel={T.titre}
        >
          <Text style={commonStyles.cardTitle}>{T.titre}</Text>
          <View style={commonStyles.rowCentre}>
            <Text style={commonStyles.strongPrimary}>{formatMontant(totalDeLaNote(lignes))}</Text>
            <PastilleAlerte />
          </View>
        </Pressable>
        {depliee ? (
          <>
            {lignes.map(({ element, ligne }) => (
              <View key={ligne.id} style={commonStyles.rowSpaceBetween}>
                <View style={commonStyles.flex1}>
                  <Text style={commonStyles.line}>{element.titre}</Text>
                  <Text style={commonStyles.note}>{LABEL_NATURE_URSSAF[ligne.nature]}</Text>
                </View>
                <Text style={commonStyles.lineBold}>{formatMontant(ligne.montant)}</Text>
              </View>
            ))}
            <Button label={T.facturer} onPress={() => setOuverte(true)} />
          </>
        ) : null}
      </Card>

      <Modal visible={ouverte} transparent animationType="fade" onRequestClose={() => setOuverte(false)}>
        <Pressable style={commonStyles.backdrop} onPress={() => setOuverte(false)}>
          <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={commonStyles.subheading}>{T.titreFenetre}</Text>
            <Text style={commonStyles.note}>
              {T.resume(lignes.length, formatMontant(totalDeLaNote(lignes)))}
            </Text>
            <FormField
              label={TEXTES.dossiers.facturation.numero}
              required
              value={numero}
              onChangeText={(texte) => {
                setNumero(texte);
                setErreur(null);
              }}
            />
            <DateField
              label={TEXTES.dossiers.facturation.date}
              required
              value={date}
              onChange={setDate}
              anneeImposee={anneeImposee}
              jourMoisAnnee
            />
            {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={() => setOuverte(false)}
              />
              <Button style={commonStyles.flex1} label={T.facturer} onPress={valider} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
