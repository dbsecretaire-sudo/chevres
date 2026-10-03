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

export interface ResultatOCR {
  /** Texte brut détecté (toutes lignes), pour affichage/debug. */
  texteBrut: string;
  /** Suites de chiffres trouvées dans le texte, des plus longues (donc les plus probables) aux plus courtes. */
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
  const candidats = Array.from(
    new Set(suites.map((s) => s.replace(/\s+/g, '')).filter((s) => s.length >= LONGUEUR_MIN_NUMERO_BOUCLE)),
  ).sort((a, b) => b.length - a.length);

  return { texteBrut, candidats };
}
