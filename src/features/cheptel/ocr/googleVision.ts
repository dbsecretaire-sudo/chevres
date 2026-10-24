import {
  CLE_VISION_NON_CONFIGUREE,
  GOOGLE_VISION_API_KEY,
  LONGUEUR_MIN_NUMERO_BOUCLE,
  MIME_JSON,
  VISION_ENDPOINT,
  VISION_LANGUE,
  VISION_MAX_RESULTATS,
  VISION_TYPE_DETECTION,
} from '@/shared/constants/google';
import { TEXTES } from '@/shared/textes';

/** Un mot lu par Google Vision : son texte et le cadre (ses coins) où il se trouve sur la photo. */
export interface MotLu {
  description?: string;
  boundingPoly?: { vertices?: { x?: number; y?: number }[] };
}

/** La hauteur d'un mot sur la photo : la taille de son écriture. */
const hauteurDuMot = (mot: MotLu): number => {
  const ys = (mot.boundingPoly?.vertices ?? []).map((v) => v.y ?? 0);
  return ys.length > 0 ? Math.max(...ys) - Math.min(...ys) : 0;
};

/**
 * Les nombres lus sur la photo, du plus grand au plus petit (par la taille de leur écriture). Sur une boucle, le numéro de l'animal est écrit en gros et le numéro de l'exploitation
 * en petit au-dessus : le plus grand est donc la boucle, même si le numéro d'exploitation a plus de chiffres. À taille égale, le plus long d'abord.
 */
export function nombresParTaille(mots: readonly MotLu[]): string[] {
  const nombres = mots
    .map((m) => ({ texte: (m.description ?? '').replace(/\s+/g, ''), taille: hauteurDuMot(m) }))
    .filter((m) => /^\d+$/.test(m.texte) && m.texte.length >= LONGUEUR_MIN_NUMERO_BOUCLE);
  nombres.sort((a, b) => b.taille - a.taille || b.texte.length - a.texte.length);
  return [...new Set(nombres.map((m) => m.texte))];
}

export interface ResultatOCR {
  /** Texte brut détecté (toutes lignes), pour affichage/debug. */
  texteBrut: string;
  /** Les nombres trouvés : d'abord ceux écrits en gros (le numéro de la boucle), puis les autres (le numéro d'exploitation, plus petit). */
  candidats: string[];
}

/** Envoie une photo (base64 JPEG) à Google Cloud Vision et en extrait les suites de chiffres détectées. */
export async function lireNumeroBoucle(base64Jpeg: string): Promise<ResultatOCR> {
  if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === CLE_VISION_NON_CONFIGUREE) {
    throw new Error(TEXTES.cheptel.googleVision.cleApiGoogleVisionNon);
  }

  const res = await fetch(`${VISION_ENDPOINT}?key=${GOOGLE_VISION_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': MIME_JSON },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Jpeg },
          features: [{ type: VISION_TYPE_DETECTION, maxResults: VISION_MAX_RESULTATS }],
          imageContext: { languageHints: [VISION_LANGUE] },
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      TEXTES.cheptel.googleVision.erreurGoogleVisionStatusStatustext(res.status, res.statusText, body),
    );
  }

  const json = await res.json();
  const erreurApi = json.responses?.[0]?.error;
  if (erreurApi) throw new Error(TEXTES.cheptel.googleVision.erreurGoogleVisionMessage(erreurApi.message));

  const texteBrut: string = json.responses?.[0]?.fullTextAnnotation?.text ?? '';

  // Cherche les suites de chiffres (avec espaces internes éventuels retirés), du plus long au plus court.
  const suites = texteBrut.match(/[\d ]{2,}\d/g) ?? [];
  const parLongueur = Array.from(
    new Set(suites.map((s) => s.replace(/\s+/g, '')).filter((s) => s.length >= LONGUEUR_MIN_NUMERO_BOUCLE)),
  ).sort((a, b) => b.length - a.length);
  // Le premier élément de la liste est tout le texte ; les suivants sont les mots, avec leur cadre : le plus gros nombre est la boucle.
  const mots: MotLu[] = (json.responses?.[0]?.textAnnotations ?? []).slice(1);
  const candidats = [...new Set([...nombresParTaille(mots), ...parLongueur])];

  return { texteBrut, candidats };
}
