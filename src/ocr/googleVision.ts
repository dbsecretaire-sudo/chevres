import { GOOGLE_VISION_API_KEY } from './googleVisionApiKey';

const ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

export interface ResultatOCR {
  /** Texte brut détecté (toutes lignes), pour affichage/debug. */
  texteBrut: string;
  /** Suites de chiffres trouvées dans le texte, des plus longues (donc les plus probables) aux plus courtes. */
  candidats: string[];
}

/** Envoie une photo (base64 JPEG) à Google Cloud Vision et en extrait les suites de chiffres détectées. */
export async function lireNumeroBoucle(base64Jpeg: string): Promise<ResultatOCR> {
  if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'À_REMPLACER') {
    throw new Error(
      "Clé API Google Vision non configurée. Voir src/ocr/googleVisionApiKey.ts pour l'obtenir dans Google Cloud Console.",
    );
  }

  const res = await fetch(`${ENDPOINT}?key=${GOOGLE_VISION_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Jpeg },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          imageContext: { languageHints: ['fr'] },
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Erreur Google Vision : ${res.status} ${res.statusText} — ${body}`);
  }

  const json = await res.json();
  const erreurApi = json.responses?.[0]?.error;
  if (erreurApi) throw new Error(`Erreur Google Vision : ${erreurApi.message}`);

  const texteBrut: string = json.responses?.[0]?.fullTextAnnotation?.text ?? '';

  // Cherche les suites de chiffres (avec espaces internes éventuels retirés), du plus long au plus court.
  const suites = texteBrut.match(/[\d ]{2,}\d/g) ?? [];
  const candidats = Array.from(new Set(suites.map((s) => s.replace(/\s+/g, '')).filter((s) => s.length >= 2))).sort(
    (a, b) => b.length - a.length,
  );

  return { texteBrut, candidats };
}
