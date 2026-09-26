import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FormField } from './FormField';
import { Button } from './Button';
import { colors } from '@/theme/colors';
import { useAccentColor } from '@/theme/AccentColorContext';
import { lireNumeroBoucle } from '@/ocr/googleVision';

interface Props {
  onDetected: (numero: string) => void;
  /** Bouton/texte secondaire affiché sous la caméra et sous les écrans d'annulation (ex: "Annuler" ou "Passer à la saisie classique"). */
  texteSecondaire: string;
  onSecondaire: () => void;
}

/** Cœur de la logique de scan (caméra → OCR → confirmation), sans Modal — réutilisable en popup ou plein écran. */
export function ScannerBoucleCore({ onDetected, texteSecondaire, onSecondaire }: Props) {
  const accent = useAccentColor();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [enCours, setEnCours] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [candidats, setCandidats] = useState<string[]>([]);
  const [valeur, setValeur] = useState('');

  const reinitialiser = () => {
    setPhotoUri(null);
    setCandidats([]);
    setValeur('');
  };

  const capturer = async () => {
    if (!cameraRef.current || enCours) return;
    setEnCours(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      setPhotoUri(photo.uri);
      const { candidats: trouves } = await lireNumeroBoucle(photo.base64 ?? '');
      setCandidats(trouves);
      setValeur(trouves[0] ?? '');
      if (trouves.length === 0) {
        Alert.alert('Aucun numéro détecté', 'Reprenez la photo en cadrant bien le numéro, ou saisissez-le à la main ci-dessous.');
      }
    } catch (e: any) {
      Alert.alert('Erreur de lecture', e?.message ?? String(e));
    } finally {
      setEnCours(false);
    }
  };

  const confirmer = () => {
    if (!valeur.trim()) return;
    onDetected(valeur.trim());
    reinitialiser();
  };

  if (!permission) return <View style={styles.centre} />;

  if (!permission.granted) {
    return (
      <View style={styles.centre}>
        <Text style={styles.info}>L’accès à l’appareil photo est nécessaire pour scanner un numéro de boucle.</Text>
        <Button label="Autoriser l’appareil photo" onPress={requestPermission} />
        <Button label={texteSecondaire} variant="secondary" onPress={onSecondaire} />
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.resultat}>
        <Image source={{ uri: photoUri }} style={styles.apercu} resizeMode="cover" />
        {enCours ? (
          <View style={styles.centre}>
            <ActivityIndicator color={accent} size="large" />
            <Text style={styles.info}>Lecture du numéro…</Text>
          </View>
        ) : (
          <View style={styles.formulaire}>
            {candidats.length > 1 && (
              <View style={styles.candidats}>
                {candidats.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.candidat, c === valeur && { backgroundColor: accent }]}
                    onPress={() => setValeur(c)}
                  >
                    <Text style={[styles.candidatTexte, c === valeur && styles.candidatTexteSelectionne]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <FormField
              label="Numéro détecté (vérifiez avant de valider)"
              value={valeur}
              onChangeText={setValeur}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.row}>
              <Button style={styles.flex1} variant="secondary" label="Reprendre la photo" onPress={reinitialiser} />
              <Button style={styles.flex1} label="Utiliser ce numéro" onPress={confirmer} disabled={!valeur.trim()} />
            </View>
            <Button label={texteSecondaire} variant="secondary" onPress={onSecondaire} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.cadre} />
        <Text style={styles.consigne}>Cadrez le numéro de boucle</Text>
      </View>
      <View style={styles.controles}>
        <View style={styles.boutonVide} />
        <Pressable style={styles.boutonCapture} onPress={capturer} disabled={enCours}>
          {enCours ? <ActivityIndicator color={accent} /> : <View style={styles.boutonCaptureInterieur} />}
        </Pressable>
        <View style={styles.boutonVide} />
      </View>
      <Pressable style={styles.lienSecondaire} onPress={onSecondaire}>
        <Text style={styles.lienSecondaireTexte}>{texteSecondaire}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  info: { color: '#fff', fontSize: 15, textAlign: 'center' },
  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cadre: {
    width: '75%',
    height: 90,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  consigne: { color: '#fff', fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8 },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  boutonVide: { width: 44, height: 44 },
  boutonCapture: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonCaptureInterieur: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  lienSecondaire: { alignItems: 'center', paddingBottom: 28, paddingTop: 4 },
  lienSecondaireTexte: { color: '#fff', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  resultat: { flex: 1 },
  apercu: { width: '100%', height: '45%' },
  formulaire: { flex: 1, padding: 16, gap: 14, backgroundColor: colors.background },
  candidats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  candidat: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.badgeBg },
  candidatTexte: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  candidatTexteSelectionne: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
