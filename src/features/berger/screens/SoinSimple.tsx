import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type { Chevre } from '@/features/cheptel/types';
import {
  DELAI_LAIT_PAR_DEFAUT,
  dateDuJour,
  enregistrerSoin,
  messageDelaiLait,
  PRODUITS_SOIN,
} from '@/features/berger/services/soin';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';

interface Props {
  /** La chèvre scannée, qui reçoit le soin. */
  animal: Chevre;
  /** Enregistré : on passe à l'écran de confirmation, avec de quoi annuler. */
  onFait: (traitementId: string) => void;
}

/** Le soin d'une chèvre : le produit, la date de la dernière prise, et le délai d'attente pour le lait. */
export function SoinSimple({ animal, onFait }: Props) {
  const [produit, setProduit] = useState<string>(PRODUITS_SOIN[0]);
  const [date, setDate] = useState(dateDuJour());
  const [delai, setDelai] = useState(String(DELAI_LAIT_PAR_DEFAUT));
  const [enCours, setEnCours] = useState(false);

  const delaiJours = Number.parseInt(delai, 10);
  const delaiValide = Number.isFinite(delaiJours) && delaiJours >= 0;
  const message = delaiValide ? messageDelaiLait(date, delaiJours) : undefined;

  const valider = async () => {
    setEnCours(true);
    try {
      const id = await enregistrerSoin(animal, { produit, date, delaiLaitJours: delaiValide ? delaiJours : 0 });
      onFait(id);
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : String(erreur));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <View style={commonStyles.flex1}>
      <Text style={commonStyles.cardTitle}>Produit</Text>
      <View style={commonStyles.row}>
        {PRODUITS_SOIN.map((nom) => (
          <Pressable
            key={nom}
            accessibilityRole="button"
            onPress={() => setProduit(nom)}
            style={[commonStyles.chip, nom === produit && { backgroundColor: colors.primary }]}
          >
            <Text style={[{ fontWeight: '600', color: colors.text }, nom === produit && commonStyles.textWhite]}>{nom}</Text>
          </Pressable>
        ))}
      </View>

      <DateField label="Date de la dernière prise" value={date} onChange={setDate} />
      <FormField
        label="Délai d’attente pour le lait (jours)"
        value={delai}
        onChangeText={setDelai}
        keyboardType="number-pad"
        erreur={delaiValide ? undefined : 'Un nombre de jours est attendu.'}
      />

      {message ? (
        <Card>
          <Text style={commonStyles.muted}>{message}</Text>
        </Card>
      ) : null}

      <Button label="Valider le soin" onPress={valider} loading={enCours} disabled={!delaiValide || !produit} />
    </View>
  );
}
