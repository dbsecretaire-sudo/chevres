import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { CameraNavigateur, type CameraNavigateurHandle } from '@/features/cheptel/components/CameraNavigateur';

import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { lireNumeroBoucleDeLaPhoto, photoEnBase64Requise } from '@/features/cheptel/ocr/lectureDeLaPhoto';
import { styles } from '@/shared/styles/cheptel/ScannerBoucleCore.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { QUALITE_PHOTO_OCR } from '@/shared/constants/google';
import { TEXTES } from '@/shared/textes';

interface Props {
  onDetected: (numero: string) => void;
  /** Bouton/texte secondaire affiché sous la caméra et sous les écrans d'annulation (ex: "Annuler" ou "Passer à la saisie classique"). */
  texteSecondaire: string;
  onSecondaire: () => void;
  /** On scanne le numéro d'un lot (lettres comprises) et non d'une boucle : les phrases et le clavier changent. */
  lot?: boolean;
}

/** Cœur de la logique de scan (caméra → OCR → confirmation), sans Modal — réutilisable en popup ou plein écran. */
export function ScannerBoucleCore({ onDetected, texteSecondaire, onSecondaire, lot = false }: Props) {
  const textes = lot ? { ...TEXTES.cheptel.scannerBoucleCore, ...TEXTES.cheptel.scannerBoucleCore.lot } : TEXTES.cheptel.scannerBoucleCore;
  const accent = useAccentColor();
  const surNavigateur = Platform.OS === 'web';
  const cameraRef = useRef<CameraView>(null);
  const cameraNavigateurRef = useRef<CameraNavigateurHandle>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [enCours, setEnCours] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  /** Le numéro se tape à la main, sans photo. */
  const [saisieLibre, setSaisieLibre] = useState(false);
  const [candidats, setCandidats] = useState<string[]>([]);
  const [valeur, setValeur] = useState('');

  const reinitialiser = () => {
    setPhotoUri(null);
    setSaisieLibre(false);
    setCandidats([]);
    setValeur('');
  };

  const capturer = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      // Sur le web, la photo vient de la vidéo du navigateur ; sur le téléphone, de la caméra de l'application.
      const photo = surNavigateur
        ? cameraNavigateurRef.current?.capturer(QUALITE_PHOTO_OCR)
        : await cameraRef.current?.takePictureAsync({ base64: photoEnBase64Requise(), quality: QUALITE_PHOTO_OCR });
      if (!photo) return;
      setPhotoUri(photo.uri);
      const { candidats: trouves } = await lireNumeroBoucleDeLaPhoto({ uri: photo.uri, base64: photo.base64 });
      setCandidats(trouves);
      setValeur(trouves[0] ?? '');
      if (trouves.length === 0) {
        Alert.alert(
          TEXTES.cheptel.scannerBoucleCore.aucunNumeroDetecte,
          TEXTES.cheptel.scannerBoucleCore.reprenezLaPhotoEnCadrant,
        );
      }
    } catch (e: any) {
      Alert.alert(TEXTES.cheptel.scannerBoucleCore.erreurDeLecture, e?.message ?? String(e));
    } finally {
      setEnCours(false);
    }
  };

  const confirmer = () => {
    if (!valeur.trim()) return;
    onDetected(valeur.trim());
    reinitialiser();
  };

  if (!surNavigateur && !permission) return <View style={styles.centre} />;

  if (!surNavigateur && !permission?.granted) {
    return (
      <View style={styles.centre}>
        <Text style={styles.info}>{textes.lAccesALAppareil}</Text>
        <Button
          label={TEXTES.cheptel.scannerBoucleCore.autoriserLAppareilPhoto}
          onPress={requestPermission}
        />
        <Button label={texteSecondaire} variant="secondary" onPress={onSecondaire} />
      </View>
    );
  }

  if (photoUri || saisieLibre) {
    return (
      <View style={commonStyles.flex1}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.apercu} resizeMode="cover" /> : null}
        {enCours ? (
          <View style={styles.centre}>
            <ActivityIndicator color={accent} size="large" />
            <Text style={styles.info}>{TEXTES.cheptel.scannerBoucleCore.lectureDuNumeroPoints}</Text>
          </View>
        ) : (
          <View style={styles.formulaire}>
            {candidats.length > 1 && (
              <View style={styles.candidats}>
                {candidats.map((c) => (
                  <Pressable
                    key={c}
                    style={[commonStyles.chip, c === valeur && { backgroundColor: accent }]}
                    onPress={() => setValeur(c)}
                  >
                    <Text style={[styles.candidatTexte, c === valeur && commonStyles.textWhite]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <FormField
              label={TEXTES.cheptel.scannerBoucleCore.numeroDetecteVerifiezAvantDe}
              value={valeur}
              onChangeText={setValeur}
              keyboardType={lot ? 'default' : 'number-pad'}
              autoCapitalize={lot ? 'characters' : undefined}
              autoFocus
            />
            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.cheptel.scannerBoucleCore.reprendreLaPhoto}
                onPress={reinitialiser}
              />
              <Button
                style={commonStyles.flex1}
                label={TEXTES.cheptel.scannerBoucleCore.utiliserCeNumero}
                onPress={confirmer}
                disabled={!valeur.trim()}
              />
            </View>
            <Button label={texteSecondaire} variant="secondary" onPress={onSecondaire} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={commonStyles.flex1}>
      {surNavigateur ? (
        <CameraNavigateur ref={cameraNavigateurRef} messageErreur={textes.lAccesALAppareil} />
      ) : (
        <CameraView ref={cameraRef} style={commonStyles.flex1} facing="back" />
      )}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.cadre} />
        <Text style={styles.consigne}>{textes.cadrezLeNumeroDeBoucle}</Text>
      </View>
      <View style={styles.haut}>
        <Button label={TEXTES.cheptel.scannerBoucleCore.saisirALaMain} variant="secondary" onPress={() => setSaisieLibre(true)} />
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
