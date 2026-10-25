import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { codeDefini, deverrouiller, estDeverrouille, verifierCode } from '@/features/securite/codeAcces';
import { colors } from '@/shared/theme/colors';

/** Le nombre d'essais avant une pause, et la durée de la pause : contre les essais en série sur l'appareil. */
const ESSAIS_AVANT_PAUSE = 5;
const DUREE_PAUSE_MS = 30000;

/**
 * Le code d'accès à l'ouverture : sans code défini, l'application s'ouvre directement ; avec un code, elle demande de le saisir avant tout le reste.
 * Le déverrouillage vaut pour cette ouverture seulement.
 */
export function VerrouAcces({ children }: { children: ReactNode }) {
  // « undefined » tant qu'on ne sait pas : rien ne s'affiche, pour ne pas montrer l'application avant le verrou.
  const [etat, setEtat] = useState<'chargement' | 'ouvert' | 'verrouille'>('chargement');
  useEffect(() => {
    codeDefini()
      .then((defini) => setEtat(!defini || estDeverrouille() ? 'ouvert' : 'verrouille'))
      .catch(() => setEtat('ouvert'));
  }, []);
  if (etat === 'chargement') return null;
  if (etat === 'ouvert') return <>{children}</>;
  return (
    <EcranCode
      onOuvrir={() => {
        deverrouiller();
        setEtat('ouvert');
      }}
    />
  );
}

function EcranCode({ onOuvrir }: { onOuvrir: () => void }) {
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [echecs, setEchecs] = useState(0);
  const [enPause, setEnPause] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      if (await verifierCode(code)) {
        onOuvrir();
        return;
      }
      const nouveaux = echecs + 1;
      setEchecs(nouveaux);
      setCode('');
      if (nouveaux >= ESSAIS_AVANT_PAUSE) {
        setEnPause(true);
        setTimeout(() => setEnPause(false), DUREE_PAUSE_MS);
        setEchecs(0);
        setErreur('Trop d’essais. Réessaie dans 30 secondes.');
      } else {
        setErreur('Code incorrect.');
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' }}>Code d’accès</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Saisis le code pour ouvrir l’application.</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Code"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!enPause}
        onSubmitEditing={valider}
        style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 18, color: colors.text, textAlign: 'center' }}
      />
      {erreur ? <Text style={{ color: colors.danger, textAlign: 'center' }}>{erreur}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={valider}
        disabled={enCours || enPause || code === ''}
        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', opacity: enCours || enPause || code === '' ? 0.5 : 1 }}
      >
        <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 17 }}>Ouvrir</Text>
      </Pressable>
    </View>
  );
}
