import { Platform } from 'react-native';
import { cleVisionConfiguree, lireNumeroBoucle, type ResultatOCR } from '@/features/cheptel/ocr/googleVision';
import { lireNumeroBoucleSurTelephone } from '@/features/cheptel/ocr/lectureSurTelephone';
import { TEXTES } from '@/shared/textes';

/** Vrai quand la lecture doit demander la photo en texte (base64) : seulement pour Google Vision (la version web, ou une clé configurée). */
export const photoEnBase64Requise = (): boolean => Platform.OS === 'web' || cleVisionConfiguree();

/**
 * Lit le numéro d'une boucle sur la photo : d'abord sur le téléphone (gratuit, sans réseau) ; si cette version de l'application ne sait pas le faire (la version web,
 * ou un téléphone dont l'application n'a pas encore été recompilée), par Google Vision quand sa clé est configurée ; sinon on invite à saisir le numéro à la main.
 */
export async function lireNumeroBoucleDeLaPhoto(photo: { uri: string; base64?: string }): Promise<ResultatOCR> {
  if (Platform.OS !== 'web') {
    try {
      return await lireNumeroBoucleSurTelephone(photo.uri);
    } catch {
      // La lecture sur le téléphone n'est pas là (application à recompiler) : on essaie l'autre.
    }
  }
  if (cleVisionConfiguree() && photo.base64) return lireNumeroBoucle(photo.base64);
  throw new Error(TEXTES.cheptel.googleVision.lectureIndisponible);
}
