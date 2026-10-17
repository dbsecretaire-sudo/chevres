import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/** L'encre des valeurs écrites sur un formulaire officiel : un noir un peu bleuté, comme un stylo. */
const ENCRE = rgb(0.1, 0.1, 0.18);

/** De quoi écrire sur un formulaire officiel ; les ordonnées se comptent du bas de la page du modèle, en points (comme dans le PDF). */
export interface Outils {
  page: PDFPage;
  /** La police grasse du document, pour écrire directement sur la page (un filigrane, par exemple). */
  policeGrasse: PDFFont;
  /** Écrit un texte, sa ligne de base en (x, y). */
  texte: (x: number, y: number, valeur: string, taille?: number, gras?: boolean) => void;
  /** Écrit un texte centré sur `xCentre`. */
  centre: (xCentre: number, y: number, valeur: string, taille?: number, gras?: boolean) => void;
  /** Écrit un texte dans une largeur donnée : la taille diminue (jusqu'à `tailleMin`) pour qu'il y tienne. */
  ajuste: (x: number, y: number, valeur: string, largeur: number, tailleMax?: number, tailleMin?: number) => void;
  /** Écrit un caractère par case (des cases de largeur `pas`, la première commençant en `x0`), chacun centré dans la sienne. */
  cases: (x0: number, y: number, pas: number, valeur: string, taille?: number) => void;
  /** Coche une case carrée : une croix dans le carré dont le coin bas gauche est (x, y) et le côté `cote`. */
  croix: (x: number, y: number, cote: number) => void;
  /** Recouvre une zone de blanc (pour effacer un texte imprimé du modèle, un effectif au « 1er janvier » qui change de date). */
  blanc: (x: number, y: number, largeur: number, hauteur: number) => void;
}

/** Un rectangle du modèle, en points : le coin bas gauche, puis la largeur et la hauteur. */
export interface Zone {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

export interface OptionsModele {
  /**
   * La partie du modèle qu'on reprend (par défaut, la page entière) : un modèle qui porte deux formulaires (le bordereau de perte et celui
   * de localisation) n'en donne qu'un.
   */
  zone?: Zone;
  /**
   * Où poser la zone sur chaque feuille, un emplacement par élément d'une page : le décalage vertical (en points, négatif vers le bas) de la
   * zone par rapport à sa place dans le modèle. Par défaut un seul emplacement, à sa place.
   */
  decalages?: number[];
  /**
   * 90 : le modèle est une page en portrait dont le contenu est tourné d'un quart de tour (il se lit en paysage, comme le suivi des mouvements).
   * Les coordonnées des outils sont alors celles de la feuille lue en paysage — l'abscisse vers la droite, l'ordonnée vers le haut, depuis son
   * coin bas gauche —, et les textes sont écrits tournés.
   */
  rotation?: 90;
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
 * Ouvre un formulaire officiel (un PDF embarqué en base64) et y écrit des valeurs. `pages` donne les feuilles à fabriquer, chacune avec les
 * éléments qu'elle porte (un par emplacement) ; `dessiner` écrit les valeurs d'un élément. Rend le PDF obtenu en base64. Le formulaire garde son
 * aspect exact : seuls les textes saisis s'y ajoutent.
 */
export async function remplirModele<T>(
  modeleBase64: string,
  pages: T[][],
  dessiner: (outils: Outils, element: T) => void,
  options: OptionsModele = {},
): Promise<string> {
  const sortie = await PDFDocument.create();
  const police = await sortie.embedFont(StandardFonts.Helvetica);
  const gras = await sortie.embedFont(StandardFonts.HelveticaBold);
  const modele = await PDFDocument.load(modeleBase64);
  const [pageModele] = modele.getPages();
  const { width, height } = pageModele.getSize();
  const zone = options.zone ?? { x: 0, y: 0, largeur: width, hauteur: height };
  const decalages = options.decalages ?? [0];
  const reprise = await sortie.embedPage(pageModele, {
    left: zone.x,
    bottom: zone.y,
    right: zone.x + zone.largeur,
    top: zone.y + zone.hauteur,
  });
  const choisir = (enGras?: boolean) => (enGras ? gras : police);

  for (const elements of pages.length > 0 ? pages : [[] as T[]]) {
    const page = sortie.addPage([width, height]);
    elements.forEach((element, emplacement) => {
      const dy = decalages[emplacement] ?? 0;
      page.drawPage(reprise, { x: zone.x, y: zone.y + dy });
      const tourne = options.rotation === 90;
      /** Un point de la feuille lue en paysage (si elle est tournée) vers la page du PDF. */
      const versPage = (x: number, y: number) => (tourne ? { x: width - y, y: x } : { x, y: y + dy });
      const texte: Outils['texte'] = (x, y, valeur, taille = 9, enGras = false) => {
        page.drawText(nettoyer(choisir(enGras), valeur), {
          ...versPage(x, y),
          size: taille,
          font: choisir(enGras),
          color: ENCRE,
          ...(tourne ? { rotate: degrees(90) } : {}),
        });
      };
      dessiner(
        {
          page,
          policeGrasse: gras,
          texte,
          centre: (xCentre, y, valeur, taille = 9, enGras = false) => {
            const propre = nettoyer(choisir(enGras), valeur);
            texte(xCentre - choisir(enGras).widthOfTextAtSize(propre, taille) / 2, y, propre, taille, enGras);
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
              texte(x0 + pas * (i + 0.5) - police.widthOfTextAtSize(propre, taille) / 2, y, propre, taille);
            });
          },
          croix: (x, y, cote) => {
            const marge = cote * 0.22;
            const trait = { thickness: 1.3, color: ENCRE };
            page.drawLine({ start: versPage(x + marge, y + marge), end: versPage(x + cote - marge, y + cote - marge), ...trait });
            page.drawLine({ start: versPage(x + marge, y + cote - marge), end: versPage(x + cote - marge, y + marge), ...trait });
          },
          blanc: (x, y, largeur, hauteur) => {
            const coin = versPage(x, y);
            page.drawRectangle(
              tourne
                ? { x: coin.x - hauteur, y: coin.y, width: hauteur, height: largeur, color: rgb(1, 1, 1) }
                : { x: coin.x, y: coin.y, width: largeur, height: hauteur, color: rgb(1, 1, 1) },
            );
          },
        },
        element,
      );
    });
  }
  return sortie.saveAsBase64();
}
