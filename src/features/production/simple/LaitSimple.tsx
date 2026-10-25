import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { enregistrerLaitJour } from '@/features/stock/services/stock';
import { Button } from '@/shared/components/Button';
import { ClavierNumerique } from '@/features/berger/components/ClavierNumerique';
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
    <ScrollView contentContainerStyle={styles.contenuDefilant}>
      <Text style={styles.titre}>{T.combienDeLait}</Text>
      <ClavierNumerique valeur={litres} onChange={setLitres} virgule />
      {/* Les litres tapés : centrés, non modifiables à la main. */}
      <View style={styles.affichageNumero} accessibilityLabel={`${T.litres} ${litres}`}>
        <Text style={styles.affichageNumeroTexte}>{litres}</Text>
      </View>
      {erreur ? <Text style={styles.erreur}>{T.erreur}</Text> : null}
      <Button label={T.valider} disabled={!(parseDecimal(litres) > 0)} onPress={enregistrer} />
      <Button label={T.retour} variant="secondary" onPress={onTerminer} />
    </ScrollView>
  );
}
