import { DESSIN_BROCCIU, DESSIN_CROTTIN, DESSIN_FROMAGE_DE_CHEVRE } from '@/features/export/documents/modelesEtiquettesFromage';
import type { EtiquetteDeLot } from '@/features/stock/services/etiquetteLot';
import { formatDateFR } from '@/shared/utils/dates';

/**
 * Les étiquettes rondes des fromages, sur vos dessins : le fromage de chèvre et le brocciu en 9 cm, le crottin en 4 cm. Un fromage affiné (ajouté au stock
 * comme « Brocciu affiné ») prend le dessin de son fromage, d'après son nom. Le DDM, le numéro de lot et le poids net s'écrivent à la place des blancs.
 */
type Modele = 'chevre' | 'brocciu' | 'crottin';

interface Dessin {
  diametreCm: number;
  image: string;
  /** Les dimensions de l'image (pixels) : le texte s'écrit dans les mêmes coordonnées. */
  largeur: number;
  hauteur: number;
  taille: number;
  /** Où commence chaque valeur, et son inclinaison (degrés), sur les blancs du dessin. */
  ddm: { x: number; y: number; angle: number };
  lot: { x: number; y: number; angle: number };
  /** Le poids net n'existe que sur le fromage de chèvre et le brocciu. */
  poids?: { x: number; y: number; angle: number };
}

const DESSINS: Record<Modele, Dessin> = {
  chevre: {
    diametreCm: 9,
    image: DESSIN_FROMAGE_DE_CHEVRE,
    largeur: 530,
    hauteur: 530,
    taille: 26,
    ddm: { x: 140, y: 306, angle: 16 },
    lot: { x: 166, y: 357, angle: 19 },
    poids: { x: 218, y: 416, angle: 17 },
  },
  brocciu: {
    diametreCm: 9,
    image: DESSIN_BROCCIU,
    largeur: 702,
    hauteur: 724,
    taille: 30,
    ddm: { x: 186, y: 424, angle: 14 },
    lot: { x: 222, y: 500, angle: 14 },
    poids: { x: 298, y: 580, angle: 14 },
  },
  crottin: {
    diametreCm: 4,
    image: DESSIN_CROTTIN,
    largeur: 530,
    hauteur: 530,
    taille: 26,
    ddm: { x: 158, y: 306, angle: 23 },
    lot: { x: 196, y: 390, angle: 23 },
  },
};

/**
 * Le poids net par défaut (kg) quand le lot n'a pas été pesé : celui du frais, et pour l'affiné environ 10 % de moins (un fromage perd du poids en mûrissant).
 */
const POIDS_PAR_DEFAUT: Record<Modele, { frais: number; affine: number }> = {
  chevre: { frais: 0.85, affine: 0.75 },
  brocciu: { frais: 0.48, affine: 0.43 },
  crottin: { frais: 0.05, affine: 0.045 },
};

/** Le modèle d'une étiquette, d'après le nom du fromage (« Brocciu affiné », « Crottin », « Frais »…). */
function modeleDuFromage(produit: string): Modele {
  const nom = produit.toLowerCase();
  if (nom.includes('crottin')) return 'crottin';
  if (nom.includes('brocciu')) return 'brocciu';
  return 'chevre';
}

const echapper = (texte: string): string =>
  texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Une valeur écrite sur un blanc, dans son sens (inclinée comme la ligne imprimée). */
const valeur = (texte: string, place: { x: number; y: number; angle: number }, taille: number): string =>
  texte
    ? `<text transform="translate(${place.x} ${place.y}) rotate(${place.angle})" font-family="'Times New Roman', Times, serif" font-size="${taille}" fill="#111">${echapper(texte)}</text>`
    : '';

/**
 * L'étiquette ronde d'un lot de fromage : le dessin, avec la DDM (date de fabrication plus la durée de conservation), le numéro de lot et le poids net quand
 * il a été pesé à la vente.
 */
export function etiquetteRondeHtml(e: EtiquetteDeLot): string {
  const modele = modeleDuFromage(e.produit);
  const dessin = DESSINS[modele];
  const ddm = e.dlc ? formatDateFR(e.dlc) : '';
  // Le poids pesé à la vente, sinon le poids par défaut de ce fromage (frais ou affiné).
  const affine = /affin/i.test(e.produit);
  const poidsKg = e.poidsNetKg ?? POIDS_PAR_DEFAUT[modele][affine ? 'affine' : 'frais'];
  const poids = `${Math.round(poidsKg * 1000)} g`;
  const champs = [
    valeur(ddm, dessin.ddm, dessin.taille),
    valeur(e.numero, dessin.lot, dessin.taille),
    dessin.poids ? valeur(poids, dessin.poids, dessin.taille) : '',
  ].join('');
  // Une étiquette ne se coupe pas entre deux pages : elle passe entière sur la suivante.
  return `<div class="ronde" style="position:relative;display:inline-block;vertical-align:top;margin:3px;width:${dessin.diametreCm}cm;height:${dessin.diametreCm}cm;border-radius:50%;overflow:hidden;break-inside:avoid;page-break-inside:avoid">
    <img src="${dessin.image}" alt="" style="position:absolute;inset:0;width:100%;height:100%" />
    <svg viewBox="0 0 ${dessin.largeur} ${dessin.hauteur}" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">${champs}</svg>
  </div>`;
}
