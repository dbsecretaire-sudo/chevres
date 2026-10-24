import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { enregistrerLaitJour } from '@/features/stock/services/stock';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.stock.laitJour;

/** « Ajouter du lait » : le lait du jour, sans date à saisir (c'est celle d'aujourd'hui) — seulement les litres. Ouvert d'un appui sur « Lait du jour » dans l'atelier. */
export default function AjoutLaitDuJour() {
  const router = useRouter();
  const [litres, setLitres] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async () => {
    const valeur = parseDecimal(litres);
    if (!(valeur > 0)) return setErreur(T.litresInvalides);
    setEnCours(true);
    try {
      await enregistrerLaitJour({ date: todayISO(), litres: valeur });
      retournerALaPageDAvant(router);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      <Text style={commonStyles.subheading}>{T.ajouter}</Text>
      <FormField
        label={T.litres}
        required
        value={litres}
        onChangeText={(texte) => {
          setLitres(texte);
          setErreur(null);
        }}
        keyboardType="decimal-pad"
        placeholder="0"
        autoFocus
      />
      {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
      <View style={commonStyles.row}>
        <Button style={commonStyles.flex1} variant="secondary" label={TEXTES.commun.general.annuler} onPress={() => retournerALaPageDAvant(router)} />
        <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={enregistrer} loading={enCours} />
      </View>
      </View>
    </Screen>
  );
}
