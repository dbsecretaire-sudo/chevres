import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LONGUEUR_MIN_CODE, changerCode, codeDefini, definirCode, supprimerCode } from '@/features/securite/codeAcces';
import { colors } from '@/shared/theme/colors';

const champ = { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 16, color: colors.text };

/**
 * Le code d'accès de l'application, demandé à chaque ouverture. Sans code, on en définit un ; avec un code, on peut le changer ou le supprimer
 * (il faut toujours saisir le code actuel).
 */
export function CarteCodeAcces() {
  const [defini, setDefini] = useState<boolean | undefined>(undefined);
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [repete, setRepete] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    codeDefini()
      .then(setDefini)
      .catch(() => setDefini(false));
  }, []);

  const pretPourNouveau = nouveau.length >= LONGUEUR_MIN_CODE && nouveau === repete;
  const effacer = () => {
    setActuel('');
    setNouveau('');
    setRepete('');
  };

  const definir = async () => {
    await definirCode(nouveau);
    setDefini(true);
    effacer();
    setMessage('Le code est défini. Il sera demandé à la prochaine ouverture.');
  };

  const changer = async () => {
    const ok = await changerCode(actuel, nouveau);
    setMessage(ok ? 'Le code est changé.' : 'Le code actuel est incorrect.');
    if (ok) effacer();
  };

  const supprimer = async () => {
    const ok = await supprimerCode(actuel);
    if (ok) {
      setDefini(false);
      effacer();
      setMessage('Le code est supprimé.');
    } else {
      setMessage('Le code actuel est incorrect.');
    }
  };

  if (defini === undefined) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Code d’accès</Text>
      <Text style={{ color: colors.textMuted }}>
        {defini ? 'Demandé à chaque ouverture de l’application.' : 'Protège l’application : il sera demandé à chaque ouverture.'}
      </Text>
      {defini ? (
        <TextInput value={actuel} onChangeText={setActuel} placeholder="Code actuel" placeholderTextColor={colors.textMuted} secureTextEntry style={champ} />
      ) : null}
      <TextInput value={nouveau} onChangeText={setNouveau} placeholder={`Nouveau code (${LONGUEUR_MIN_CODE} caractères au moins)`} placeholderTextColor={colors.textMuted} secureTextEntry style={champ} />
      <TextInput value={repete} onChangeText={setRepete} placeholder="Répéter le nouveau code" placeholderTextColor={colors.textMuted} secureTextEntry style={champ} />
      {message ? <Text style={{ color: colors.primary }}>{message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={!pretPourNouveau || (defini && actuel === '')}
        onPress={defini ? changer : definir}
        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: 'center', opacity: !pretPourNouveau || (defini && actuel === '') ? 0.5 : 1 }}
      >
        <Text style={{ color: colors.blanc, fontWeight: '800' }}>{defini ? 'Changer le code' : 'Définir le code'}</Text>
      </Pressable>
      {defini ? (
        <Pressable accessibilityRole="button" disabled={actuel === ''} onPress={supprimer} style={{ alignItems: 'center', padding: 10, opacity: actuel === '' ? 0.5 : 1 }}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Supprimer le code</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
