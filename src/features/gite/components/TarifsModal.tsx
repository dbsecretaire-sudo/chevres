import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { getSettings, montantTaxeSejourDe, updateSettings } from '@/features/settings/settings';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  /** Les nuits et les repas comptés dans le prix de la réservation, modifiables ici. */
  nuits: number;
  repas: number;
  /** Appelée une fois les tarifs enregistrés, avec les nuits et les repas choisis, pour que la réservation les reprenne. */
  onEnregistre: (nuits: number, repas: number) => void;
  onFermer: () => void;
}

const T = TEXTES.entreprise.informations;
const TG = TEXTES.gite.sejour.tarifs;

const enTexte = (montant?: number) => (montant === undefined ? '' : String(montant).replace('.', ','));

/**
 * Petite fenêtre pour régler les tarifs du gîte (prix d'une chambre par nuit, d'un repas, taxe de séjour) sans quitter la
 * réservation. Ce sont les mêmes tarifs que dans les informations de l'entreprise : ils y sont enregistrés, et partout
 * dans l'application ils sont repris.
 */
export function TarifsModal({ visible, nuits, repas, onEnregistre, onFermer }: Props) {
  const [nuit, setNuit] = useState('');
  const [prixRepas, setPrixRepas] = useState('');
  const [nombreNuits, setNombreNuits] = useState('');
  const [nombreRepas, setNombreRepas] = useState('');
  const [taxeSuivie, setTaxeSuivie] = useState(true);
  const [taxe, setTaxe] = useState('');

  useEffect(() => {
    // Chaque ouverture repart des tarifs enregistrés.
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNombreNuits(String(nuits));
    setNombreRepas(String(repas));
    getSettings().then((s) => {
      const entreprise = s.exploitation?.entreprise;
      setNuit(enTexte(entreprise?.tarifNuit));
      setPrixRepas(enTexte(entreprise?.tarifRepas));
      setTaxeSuivie(entreprise?.taxeSejour ?? true);
      setTaxe(enTexte(montantTaxeSejourDe(entreprise)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const enregistrer = async () => {
    const s = await getSettings();
    await updateSettings({
      exploitation: {
        ...s.exploitation,
        entreprise: {
          ...s.exploitation?.entreprise,
          tarifNuit: parseDecimal(nuit) || undefined,
          tarifRepas: parseDecimal(prixRepas) || undefined,
          taxeSejour: taxeSuivie,
          montantTaxeSejour: taxeSuivie ? parseDecimal(taxe) || undefined : undefined,
          taxeSejourParNuit: undefined,
        },
      },
    });
    const nuitsChoisies = Math.round(parseDecimal(nombreNuits));
    onEnregistre(
      nuitsChoisies >= 1 ? nuitsChoisies : nuits,
      Math.max(0, Math.round(parseDecimal(nombreRepas))),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titreTarifs}</Text>
          <FormField
            label={T.tarifNuit}
            value={nuit}
            onChangeText={setNuit}
            keyboardType="decimal-pad"
            placeholder={T.exempleMontant}
          />
          <FormField
            label={T.tarifRepas}
            value={prixRepas}
            onChangeText={setPrixRepas}
            keyboardType="decimal-pad"
            placeholder={T.exempleMontant}
          />
          <Checkbox label={T.suivreTaxeSejour} value={taxeSuivie} onChange={setTaxeSuivie} />
          {taxeSuivie ? (
            <FormField
              label={T.montantTaxeSejour}
              value={taxe}
              onChangeText={setTaxe}
              keyboardType="decimal-pad"
              placeholder={T.exempleMontant}
            />
          ) : null}
          <View style={commonStyles.row}>
            <View style={commonStyles.flex1}>
              <FormField
                label={TG.nuits}
                value={nombreNuits}
                onChangeText={setNombreNuits}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>
            <View style={commonStyles.flex1}>
              <FormField
                label={TG.repas}
                value={nombreRepas}
                onChangeText={setNombreRepas}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
          </View>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.commun.general.enregistrer}
              onPress={enregistrer}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
