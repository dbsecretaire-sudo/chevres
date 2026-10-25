import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/shared/styles/cheptel/ScannerBoucleCore.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Une photo prise dans le navigateur : son adresse (une image encodée dans le texte) et son contenu en base64, pour la lecture du numéro. */
export interface PhotoNavigateur {
  uri: string;
  base64: string;
}

export interface CameraNavigateurHandle {
  capturer: (qualite: number) => PhotoNavigateur;
}

interface Props {
  /** Affiché à la place de la vidéo quand le navigateur ne donne pas accès à la caméra. */
  messageErreur: string;
}

/**
 * La caméra dans le navigateur (la version PWA) : on prend directement le flux vidéo. Le composant caméra de l'application
 * n'affiche rien dans Safari sur iPhone, alors que la vidéo du navigateur y marche.
 */
export const CameraNavigateur = forwardRef<CameraNavigateurHandle, Props>(function CameraNavigateur({ messageErreur }, ref) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!navigator.mediaDevices) {
      setErreur(true);
      return;
    }
    let flux: MediaStream | undefined;
    let annule = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((recu) => {
        if (annule) {
          recu.getTracks().forEach((piste) => piste.stop());
          return;
        }
        flux = recu;
        if (video.current) {
          video.current.srcObject = recu;
          void video.current.play();
        }
      })
      .catch(() => setErreur(true));
    return () => {
      annule = true;
      flux?.getTracks().forEach((piste) => piste.stop());
    };
  }, []);

  useImperativeHandle(ref, () => ({
    capturer: (qualite) => {
      const source = video.current;
      if (!source || !source.videoWidth) throw new Error(messageErreur);
      const toile = document.createElement('canvas');
      toile.width = source.videoWidth;
      toile.height = source.videoHeight;
      toile.getContext('2d')?.drawImage(source, 0, 0);
      const uri = toile.toDataURL('image/jpeg', qualite);
      return { uri, base64: uri.slice(uri.indexOf(',') + 1) };
    },
  }));

  if (erreur) {
    return (
      <View style={styles.centre}>
        <Text style={styles.info}>{messageErreur}</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.flex1}>
      {createElement('video', {
        ref: video,
        autoPlay: true,
        muted: true,
        playsInline: true,
        style: { width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' },
      })}
    </View>
  );
});
