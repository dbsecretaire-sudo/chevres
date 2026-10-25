import { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { enregistrerLaitJour } from '@/features/stock/services/stock';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.production.fabricationSimple;

/** Ajouter du lait en très grands boutons : les litres du jour (la date est celle d'aujourd'hui), puis c'est enregistré. */
export function LaitSimple({ onTerminer }: { onTerminer: () => void }) {
  const [litres, setLitres] = useState('');
  const [fait, setFait] = useState<number | null>(null);
  const [erreur, setErreur] = useState(false);

  const enregistrer = async () => {
    const valeur = parseDecimal(litres);
    if (!(valeur > 0)) return;
    try {
      await enregistrerLaitJour({ date: todayISO(), litres: valeur });
      await noterAEnvoyer();
      setFait(valeur);
    } catch {
      setErreur(true);
    }
  };

  if (fait !== null)
    return (
      <View style={styles.contenu}>
        <Ionicons name="checkmark-circle" size={96} color={colors.primary} style={styles.coche} />
        <Text style={styles.message}>{T.laitFait(fait)}</Text>
        <Button label={T.terminer} onPress={onTerminer} />
      </View>
    );
  return (
    <View style={styles.contenu}>
      <Text style={styles.titre}>{T.combienDeLait}</Text>
      <FormField label={T.litres} value={litres} onChangeText={setLitres} keyboardType="decimal-pad" autoFocus />
      {erreur ? <Text style={styles.erreur}>{T.erreur}</Text> : null}
      <Button label={T.valider} disabled={!(parseDecimal(litres) > 0)} onPress={enregistrer} />
      <Button label={T.retour} variant="secondary" onPress={onTerminer} />
    </View>
  );
}
