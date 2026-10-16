import { pont } from '@/bureau/pont';

/**
 * L'agrandissement d'un formulaire dessiné pour une page de 595 × 842 points : l'A4 de l'ordinateur a 96 points par pouce au lieu de 72
 * (soit un tiers de plus). Un peu moins que 96 / 72, pour que la page tienne dans la feuille sans que l'impression la réduise.
 */
const ECHELLE_PAGE = 1.33;
/** Le pied de page des documents (titre à gauche, date d'édition à droite) : l'impression le pose dans la marge du bas de chaque page. */
const PIED_DE_PAGE = /<div class="pied"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/div>/;

const stylePageSansMarges = (paysage: boolean) =>
  `@page { size: A4${paysage ? ' landscape' : ''}; margin: 0 } :root { --k: ${ECHELLE_PAGE} }`;

/** printToFileAsync de expo-print : un PDF fabriqué à partir d'un HTML, sans internet (la fenêtre cachée de l'ordinateur l'imprime). */
export async function printToFileAsync(options: {
  html?: string;
  base64?: boolean;
  /** La taille de la page, en points : plus large que haute, c'est un document en paysage. */
  width?: number;
  height?: number;
  /** Les marges de la page (en points) : toutes nulles pour un formulaire à la taille exacte de la feuille. */
  margins?: { top: number; right: number; bottom: number; left: number };
}): Promise<{ uri: string }> {
  const paysage = !!options.width && !!options.height && options.width > options.height;
  const sansMarges = !!options.margins;
  // Un formulaire est dessiné pour une page de 595 × 842 points : sur l'A4 de l'ordinateur (96 points par pouce au lieu de 72), la
  // page s'agrandit d'un tiers, sans marge. C'est la page elle-même qui le demande, pas l'impression.
  const source = options.html ?? '';
  // Un pied de page fixe se pose sur les dernières lignes de chaque page : il est retiré du document et imprimé dans la marge.
  const pied = sansMarges ? null : PIED_DE_PAGE.exec(source);
  const html = sansMarges
    ? source.replace('</head>', `<style>${stylePageSansMarges(paysage)}</style></head>`)
    : pied
      ? source.replace(PIED_DE_PAGE, '')
      : source;
  return {
    uri: await pont().fichiers.imprimerPdf(
      html,
      paysage,
      sansMarges,
      pied ? { gauche: pied[1], droite: pied[2] } : undefined,
    ),
  };
}
