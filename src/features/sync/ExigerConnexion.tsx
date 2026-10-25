import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { lireConnexion, seConnecter, type Connexion } from '@/features/sync/synchronisation';
import { colors } from '@/shared/theme/colors';

/**
 * Ce qui n'est accessible qu'avec le compte du serveur de la ferme : le mode avancé et l'argent. Sans connexion enregistrée sur l'appareil, on demande
 * l'identifiant et le mot de passe ; avec une connexion, les enfants s'affichent. Une connexion expirée (le serveur répond 401) se refait par la synchronisation.
 */
export function ExigerConnexion({ children }: { children: ReactNode }) {
  // « undefined » tant qu'on ne sait pas encore : rien ne s'affiche, pour ne pas montrer le formulaire à tort.
  const [connexion, setConnexion] = useState<Connexion | null | undefined>(undefined);
  useEffect(() => {
    lireConnexion()
      .then(setConnexion)
      .catch(() => setConnexion(null));
  }, []);
  if (connexion === undefined) return null;
  if (connexion) return <>{children}</>;
  return <FormulaireConnexion onConnecte={setConnexion} />;
}

function FormulaireConnexion({ onConnecte }: { onConnecte: (connexion: Connexion) => void }) {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      await seConnecter(identifiant.trim(), motDePasse);
      const nouvelle = await lireConnexion();
      if (nouvelle) onConnecte(nouvelle);
      else setErreur('Connexion impossible.');
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' }}>Connexion</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
        Cette partie de l’application demande le compte de la ferme.
      </Text>
      <TextInput
        value={identifiant}
        onChangeText={setIdentifiant}
        placeholder="Identifiant"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 16, color: colors.text }}
      />
      <TextInput
        value={motDePasse}
        onChangeText={setMotDePasse}
        placeholder="Mot de passe"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoCapitalize="none"
        style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 16, color: colors.text }}
      />
      {erreur ? <Text style={{ color: colors.danger, textAlign: 'center' }}>{erreur}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={valider}
        disabled={enCours || identifiant.trim() === '' || motDePasse === ''}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: enCours || identifiant.trim() === '' || motDePasse === '' ? 0.5 : 1,
        }}
      >
        <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 17 }}>{enCours ? 'Connexion…' : 'Se connecter'}</Text>
      </Pressable>
    </View>
  );
}
