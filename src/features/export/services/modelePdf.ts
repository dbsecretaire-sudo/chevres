import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/** L'encre des valeurs écrites sur un formulaire officiel : un noir un peu bleuté, comme un stylo. */
const ENCRE = rgb(0.1, 0.1, 0.18);

/** De quoi écrire sur une page d'un formulaire officiel ; les ordonnées se comptent du bas de la page, en points (comme dans le PDF). */
export interface Outils {
  page: PDFPage;
  /** Écrit un texte, sa ligne de base en (x, y). */
  texte: (x: number, y: number, valeur: string, taille?: number, gras?: boolean) => void;
  /** Écrit un texte centré sur `xCentre`. */
  centre: (xCentre: number, y: number, valeur: string, taille?: number, gras?: boolean) => void;
  /** Écrit un texte dans une largeur donnée : la taille diminue (jusqu'à `tailleMin`) pour qu'il y tienne. */
  ajuste: (x: number, y: number, valeur: string, largeur: number, tailleMax?: number, tailleMin?: number) => void;
  /** Écrit un caractère par case (des cases de largeur `pas`, la première commençant en `x0`), chacun centré dans la sienne. */
  cases: (x0: number, y: number, pas: number, valeur: string, taille?: number) => void;
}

/** Remplace ce que la police standard ne sait pas écrire (une espèce de tiret, une lettre rare) par un point d'interrogation. */
function nettoyer(police: PDFFont, valeur: string): string {
  const connus = new Set(police.getCharacterSet());
  return [...valeur.replace(/[  ]/g, ' ')]
    .map((c) => (c === '\n' || connus.has(c.codePointAt(0) ?? 0) ? c : '?'))
    .join('')
    .replace(/\n/g, ' ');
}

/**
 * Ouvre un formulaire officiel (un PDF embarqué en base64) et y écrit des valeurs : `copies` pages identiques, que `dessiner` remplit une à
 * une. Rend le PDF obtenu en base64. Le formulaire garde son aspect exact : seuls les textes saisis s'y ajoutent.
 */
export async function remplirModele(
  modeleBase64: string,
  copies: number,
  dessiner: (outils: Outils, indice: number) => void,
): Promise<string> {
  const sortie = await PDFDocument.create();
  const police = await sortie.embedFont(StandardFonts.Helvetica);
  const gras = await sortie.embedFont(StandardFonts.HelveticaBold);
  const modele = await PDFDocument.load(modeleBase64);
  const [original] = await sortie.embedPdf(modele, [0]);

  for (let indice = 0; indice < Math.max(1, copies); indice++) {
    const page = sortie.addPage([original.width, original.height]);
    page.drawPage(original);
    const choisir = (enGras?: boolean) => (enGras ? gras : police);
    const texte: Outils['texte'] = (x, y, valeur, taille = 9, enGras = false) => {
      page.drawText(nettoyer(choisir(enGras), valeur), { x, y, size: taille, font: choisir(enGras), color: ENCRE });
    };
    dessiner(
      {
        page,
        texte,
        centre: (xCentre, y, valeur, taille = 9, enGras = false) => {
          const propre = nettoyer(choisir(enGras), valeur);
          const largeur = choisir(enGras).widthOfTextAtSize(propre, taille);
          texte(xCentre - largeur / 2, y, propre, taille, enGras);
        },
        ajuste: (x, y, valeur, largeur, tailleMax = 9, tailleMin = 5.5) => {
          const propre = nettoyer(police, valeur);
          let taille = tailleMax;
          while (taille > tailleMin && police.widthOfTextAtSize(propre, taille) > largeur) taille -= 0.25;
          texte(x, y, propre, taille);
        },
        cases: (x0, y, pas, valeur, taille = 10) => {
          [...valeur].forEach((c, i) => {
            if (c === ' ') return;
            const propre = nettoyer(police, c);
            const largeur = police.widthOfTextAtSize(propre, taille);
            texte(x0 + pas * (i + 0.5) - largeur / 2, y, propre, taille);
          });
        },
      },
      indice,
    );
  }
  return sortie.saveAsBase64();
}
