import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { listComptesPcg } from '@/features/comptes-pcg/repository';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { getSettings, updateSettings } from '@/features/settings/settings';
import { TAUX_TVA_RECETTE_ENTREPRISE, CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import { PREFIXE_COMPTES_RECETTE_ANNEXE } from '@/shared/constants/annexes';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite.activite;

interface Props {
  visible: boolean;
  onFermer: () => void;
}

/** Petite fenêtre « Modifier l'activité » du gîte : le compte du plan comptable et le taux de TVA de l'hébergement. */
export function ActiviteGiteModal({ visible, onFermer }: Props) {
  const [compte, setCompte] = useState('');
  const [tva, setTva] = useState('');
  const [comptes, setComptes] = useState<{ value: string; label: string; shortLabel: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart des réglages en vigueur (ceux d'office quand rien n'a été choisi).
    if (visible) {
      setErreur(null); // eslint-disable-line react-hooks/set-state-in-effect
      getSettings().then((settings) => {
        const infos = settings.exploitation?.entreprise;
        setCompte(infos?.giteCompte ?? COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.HEBERGEMENT].numero);
        setTva(String(infos?.giteTauxTva ?? TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.HEBERGEMENT]));
      });
      listComptesPcg().then((liste) =>
        setComptes(
          liste
            .filter((c) => c.numero.startsWith(PREFIXE_COMPTES_RECETTE_ANNEXE))
            .map((c) => ({ value: c.numero, label: `${c.numero} — ${c.libelle}`, shortLabel: c.numero })),
        ),
      );
    }
  }, [visible]);

  const enregistrer = async () => {
    if (!compte) return setErreur(T.compteRequis);
    const settings = await getSettings();
    await updateSettings({
      exploitation: {
        ...settings.exploitation,
        entreprise: {
          ...settings.exploitation?.entreprise,
          giteCompte: compte,
          giteTauxTva: tva === '' ? undefined : Number(tva),
        },
      },
    });
    onFermer();
  };

  // Le compte d'office reste choisissable même s'il n'est pas dans la liste enregistrée.
  const options = comptes.some((c) => c.value === compte)
    ? comptes
    : [{ value: compte, label: compte, shortLabel: compte }, ...comptes].filter((c) => c.value);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.modifier}</Text>
          <SelectField<string>
            label={T.compte}
            required
            searchable
            placeholder={T.choixDuCompte}
            value={compte}
            onChange={setCompte}
            options={options}
          />
          <SelectField<string> label={T.tva} value={tva} onChange={setTva} options={OPTIONS_TAUX_TVA} />
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
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
