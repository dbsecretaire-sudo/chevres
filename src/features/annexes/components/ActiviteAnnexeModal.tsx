import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { listComptesPcg } from '@/features/comptes-pcg/repository';
import type { ActiviteAnnexe } from '@/features/annexes/types';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { ICONES_ANNEXE, PREFIXE_COMPTES_RECETTE_ANNEXE } from '@/shared/constants/annexes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.annexes.activite;

interface Props {
  visible: boolean;
  /** L'activité qu'on modifie ; absente pour en créer une. */
  activite?: ActiviteAnnexe;
  onValider: (donnees: Omit<ActiviteAnnexe, 'id'>) => void;
  onFermer: () => void;
}

/** Petite fenêtre pour créer ou modifier une activité annexe : son nom, son icône, son compte comptable et sa TVA. */
export function ActiviteAnnexeModal({ visible, activite, onValider, onFermer }: Props) {
  const [nom, setNom] = useState('');
  const [icone, setIcone] = useState<string>(ICONES_ANNEXE[0]);
  const [compte, setCompte] = useState('');
  const [tva, setTva] = useState('');
  const [repasGite, setRepasGite] = useState(false);
  const [comptes, setComptes] = useState<{ value: string; label: string; shortLabel: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart de l'activité modifiée, ou d'un formulaire vide.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNom(activite?.nom ?? '');
      setIcone(activite?.icone ?? ICONES_ANNEXE[0]);
      setCompte(activite?.compte ?? '');
      setTva(activite?.tauxTva !== undefined ? String(activite.tauxTva) : '');
      setRepasGite(activite?.repasGite ?? false);
      setErreur(null);
      listComptesPcg().then((liste) =>
        setComptes(
          liste
            .filter((c) => c.numero.startsWith(PREFIXE_COMPTES_RECETTE_ANNEXE))
            .map((c) => ({ value: c.numero, label: `${c.numero} — ${c.libelle}`, shortLabel: c.numero })),
        ),
      );
    }
  }, [visible, activite]);

  const valider = () => {
    if (!nom.trim()) return setErreur(T.nomRequis);
    if (!compte) return setErreur(T.compteRequis);
    onValider({
      nom: nom.trim(),
      icone,
      compte,
      tauxTva: tva === '' ? undefined : Number(tva),
      repasGite: repasGite || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>
            {activite ? TEXTES.annexes.modifierActivite : TEXTES.annexes.ajouterActivite}
          </Text>
          <ScrollView style={commonStyles.listeDeFenetre} contentContainerStyle={commonStyles.gap10}>
            <FormField
              label={T.nom}
              required
              value={nom}
              onChangeText={setNom}
              placeholder={T.nomPlaceholder}
            />
            <View style={commonStyles.gap6}>
              <Text style={commonStyles.lineSemiBold}>{T.icone}</Text>
              <View style={commonStyles.rowWrap}>
                {ICONES_ANNEXE.map((nomIcone) => (
                  <Pressable
                    key={nomIcone}
                    onPress={() => setIcone(nomIcone)}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityState={{ selected: icone === nomIcone }}
                  >
                    <Ionicons
                      name={nomIcone as keyof typeof Ionicons.glyphMap}
                      size={30}
                      color={icone === nomIcone ? colors.primary : colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
            <SelectField<string>
              label={T.compte}
              required
              searchable
              placeholder={T.choixDuCompte}
              value={compte}
              onChange={setCompte}
              options={comptes}
            />
            <SelectField<string>
              label={T.tva}
              value={tva}
              onChange={setTva}
              options={[{ value: '', label: '—' }, ...OPTIONS_TAUX_TVA]}
            />
            <Checkbox label={T.repasGite} value={repasGite} onChange={setRepasGite} />
          </ScrollView>
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
