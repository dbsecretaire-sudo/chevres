import TextRecognition from '@react-native-ml-kit/text-recognition';
import { nombresParTaille, type MotLu, type ResultatOCR } from '@/features/cheptel/ocr/googleVision';
import { LONGUEUR_MIN_NUMERO_BOUCLE } from '@/shared/constants/google';

/**
 * Lit le numéro d'une boucle directement sur le téléphone (la reconnaissance de texte de Google ML Kit, gratuite et sans réseau). Les mots viennent avec leur cadre :
 * le numéro de l'animal, écrit en gros, passe avant le numéro d'exploitation, écrit en petit au-dessus (voir nombresParTaille). Une ligne de chiffres séparés par des
 * espaces (« 2021 3003 ») compte aussi comme un seul nombre.
 */
export async function lireNumeroBoucleSurTelephone(uriPhoto: string): Promise<ResultatOCR> {
  const lu = await TextRecognition.recognize(uriPhoto);
  const mots: MotLu[] = [];
  for (const bloc of lu.blocks) {
    for (const ligne of bloc.lines) {
      for (const element of ligne.elements) mots.push({ description: element.text, hauteur: element.frame?.height ?? 0 });
      // Une ligne de chiffres coupée par des espaces : un seul nombre, de la taille de la ligne.
      if (/^[\d ]+$/.test(ligne.text) && ligne.elements.length > 1) {
        mots.push({ description: ligne.text, hauteur: ligne.frame?.height ?? 0 });
      }
    }
  }
  const suites = lu.text.match(/[\d ]{2,}\d/g) ?? [];
  const parLongueur = Array.from(
    new Set(suites.map((s) => s.replace(/\s+/g, '')).filter((s) => s.length >= LONGUEUR_MIN_NUMERO_BOUCLE)),
  ).sort((a, b) => b.length - a.length);
  return { texteBrut: lu.text, candidats: [...new Set([...nombresParTaille(mots), ...parLongueur])] };
}
