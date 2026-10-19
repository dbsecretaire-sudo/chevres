import { codePostalEtCommune } from '@/features/cheptel/services/estive';
import { estPetitLe, getChevre } from '@/features/cheptel/repository/chevres';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import { lireArchiveStock } from '@/features/stock/repository';
import { numerosTiptag } from '@/features/stock/services/boucles';
import { listTousTraitements } from '@/features/exploitation/repository/traitements';
import { delaisDeLAnimal } from '@/features/exploitation/services/delaisAttente';
import type { Traitement } from '@/features/exploitation/types';
import type { Chevre } from '@/features/cheptel/types';
import { especeDe } from '@/features/cheptel/utils/espece';
import { listClients } from '@/features/clients/repository';
import { estClientAbattoir } from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { getFacture } from '@/features/comptabilite/repository/factures';
import { getVente } from '@/features/comptabilite/repository/ventes';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux, idsDesAnimauxAchetes, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { avecIndicatif } from '@/features/export/services/lignesExport';
import { ecrirePdfBase64EtPartager } from '@/features/export/services/htmlPdf';
import { MODELE_CIRCULATION } from '@/features/export/modeles/circulation';
import { remplirModele, type Outils } from '@/features/export/services/modelePdf';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { identiteDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { getSettings, identificationCheptel, type InfosExploitation, type LotAnimaux } from '@/features/settings/settings';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';

const C = TEXTES.cheptel.circulation;

/** Le type du lieu d'arrivée, tel que le formulaire le propose (les cases à cocher). */
export const LIEU_ARRIVEE = {
  ELEVAGE: 'elevage',
  OPERATEUR: 'operateur',
  CENTRE: 'centre',
  MARCHE: 'marche',
  ABATTOIR: 'abattoir',
  PARTICULIER: 'particulier',
} as const;
export type LieuArrivee = (typeof LIEU_ARRIVEE)[keyof typeof LIEU_ARRIVEE];

/** Ce que le document de circulation reprend d'une vente d'animaux. */
export interface DonneesCirculation {
  /** La date du chargement : celle de la vente. */
  date: string;
  depart: { numeroExploitation: string; siren: string; nom: string; adresse: string; codePostal: string; commune: string };
  arrivee: { lieu: LieuArrivee; nom: string; adresse: string; codePostal: string; commune: string };
  /** Vrai pour des brebis ou des agneaux (la ligne « ovins »), faux pour des caprins. */
  ovins: boolean;
  /** Les petits de boucherie (agneaux, chevreaux), par indicatif de marquage, et leur nombre. */
  boucherie: { indicatif: string; nombre: number }[];
  /** Les reproducteurs et réformes : le nombre, et leur numéro individuel (indicatif + numéro). */
  reproducteurs: number;
  individuels: string[];
  /** Qui de l'exploitation notifie le mouvement, en bas du document : le départ (une vente, un envoi à l'abattoir) ou l'arrivée (un achat). D'office, le départ. */
  notifie?: 'depart' | 'arrivee';
  /** Les animaux morts pendant le transport (déclarés dans le lot d'abattage) : la ligne « Nb de morts transport » de l'arrivée. */
  mortsTransport: number;
  /**
   * L'information sanitaire (la chaîne alimentaire) : des animaux sous délai d'attente pour la viande le jour du chargement — un
   * traitement en cours — obligent à fournir le document dédié au détenteur d'arrivée ; sinon, aucun risque à signaler.
   */
  sanitaire: { risque: boolean; animaux: { boucle: string; produit: string; fin: string }[] };
}

/** Le lieu d'arrivée d'après la vente : l'abattoir pour de la viande déclarée, sinon d'après la catégorie du client. */
export function lieuDArrivee(
  vente: Pick<Vente, 'categorie' | 'choixFacture' | 'etatAnimaux'>,
  client?: Pick<Client, 'categorie'>,
): LieuArrivee {
  // Un client de catégorie Abattoir : l'abattoir est le lieu d'arrivée, que les animaux y partent vivants ou non.
  if (estClientAbattoir(client)) return LIEU_ARRIVEE.ABATTOIR;
  // Des animaux vendus vivants à un client (même pour leur viande) vont chez lui ; sinon, la viande déclarée passe par l'abattoir.
  if (vente.categorie === CATEGORIE_VENTE.VIANDE && venteADeclarer(vente) && vente.etatAnimaux !== 'vivants')
    return LIEU_ARRIVEE.ABATTOIR;
  if (client?.categorie === CATEGORIE_CLIENT.ENTREPRISE) return LIEU_ARRIVEE.OPERATEUR;
  if (!client?.categorie || client.categorie === CATEGORIE_CLIENT.PARTICULIER) return LIEU_ARRIVEE.PARTICULIER;
  return LIEU_ARRIVEE.ELEVAGE;
}

/** Les adresses du formulaire : la première ligne (le lieu-dit), le code postal et la commune. */
function adresseEnPartie(adresse: string | undefined): { adresse: string; codePostal: string; commune: string } {
  const lignes = (adresse ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const { codePostal, commune } = codePostalEtCommune(adresse);
  return { adresse: lignes.find((l) => !/^\d{5}\s/.test(l)) ?? '', codePostal, commune };
}

/**
 * Les données du document de circulation d'une vente d'animaux : le détenteur de départ (l'exploitation), l'arrivée (le client et son
 * type), puis les animaux — les petits de boucherie comptés par indicatif de marquage, les autres (reproducteurs et réformes) un par un.
 */
export function donneesDeCirculation(entree: {
  vente: Vente;
  animaux: Chevre[];
  client?: Client;
  infos?: InfosExploitation;
  /** Vrai pour un petit à la date de la vente (voir estPetitLe). */
  petit: (animal: Chevre) => boolean;
  /** Les traitements de l'élevage : ceux dont le délai d'attente pour la viande court le jour du chargement sont signalés. */
  traitements?: Traitement[];
  /** Le nombre d'animaux morts pendant le transport (écrit sur la ligne « Nb de morts transport »). */
  mortsTransport?: number;
}): DonneesCirculation {
  const { vente, animaux, client, infos, petit, traitements = [], mortsTransport = 0 } = entree;
  const jour = vente.dateAbattoir && vente.categorie === CATEGORIE_VENTE.VIANDE ? vente.dateAbattoir : vente.date;
  const sousDelai = animaux.flatMap((a) => {
    const delai = delaisDeLAnimal(a.numeroBoucle, traitements, jour).viande;
    return delai ? [{ boucle: a.numeroBoucle ?? '—', produit: delai.traitement.produit, fin: delai.fin }] : [];
  });
  const identite = identiteDuSuivi(infos);
  const espece = animaux[0] ? especeDe(animaux[0]) : undefined;
  const indicatif = (a: Chevre) => identificationCheptel(infos, especeDe(a)).indicatifMarquage ?? '';
  const parIndicatif = new Map<string, number>();
  const individuels: string[] = [];
  for (const a of animaux) {
    if (petit(a)) parIndicatif.set(indicatif(a), (parIndicatif.get(indicatif(a)) ?? 0) + 1);
    else individuels.push(avecIndicatif(a.numeroBoucle, indicatif(a)) || '—');
  }
  return {
    date: vente.dateAbattoir && vente.categorie === CATEGORIE_VENTE.VIANDE ? vente.dateAbattoir : vente.date,
    depart: {
      numeroExploitation: identite.numeroExploitation ? `FR${identite.numeroExploitation}` : '',
      siren: identite.siret.slice(0, 9),
      nom: identite.nom,
      ...adresseEnPartie(infos?.adresseExploitant),
    },
    arrivee: {
      lieu: lieuDArrivee(vente, client),
      nom: client ? nomComplet(client) : (vente.client ?? ''),
      ...adresseEnPartie(client?.adressePostale),
    },
    ovins: espece === TYPE_ANIMAL_ETABLISSEMENT.BREBIS,
    boucherie: [...parIndicatif.entries()].map(([ind, nombre]) => ({ indicatif: ind, nombre })),
    reproducteurs: individuels.length,
    individuels: individuels.sort(),
    mortsTransport,
    sanitaire: { risque: sousDelai.length > 0, animaux: sousDelai },
  };
}

/**
 * Les feuillets de la liasse, avec leur couleur et ce qu'en fait l'exploitation (le rappel du document de circulation) : en cas de vente
 * (elle est au départ), ou d'achat (elle est à l'arrivée).
 */
export const feuilletsCirculation = (sens: 'vente' | 'achat') =>
  // Rangés par action, un groupe après l'autre (une ligne les sépare) : ceux qu'on garde, ceux qu'on donne, puis celui qu'on garde d'abord avant de l'envoyer à la Chambre.
  (sens === 'vente'
    ? [
        { groupe: 'garde', couleur: [1, 1, 1], libelle: C.feuillets.vente.blanc },
        { groupe: 'garde', couleur: [0.96, 0.88, 0.37], libelle: C.feuillets.vente.jaune },
        { groupe: 'donne', couleur: [0.49, 0.76, 0.49], libelle: C.feuillets.vente.vert },
        { groupe: 'donne', couleur: [0.49, 0.66, 0.88], libelle: C.feuillets.vente.bleu },
        { groupe: 'chambre', couleur: [0.95, 0.65, 0.76], libelle: C.feuillets.vente.rose },
      ]
    : [
        { groupe: 'garde', couleur: [0.49, 0.66, 0.88], libelle: C.feuillets.achat.bleu },
        { groupe: 'donne', couleur: [1, 1, 1], libelle: C.feuillets.achat.blanc },
        { groupe: 'donne', couleur: [0.96, 0.88, 0.37], libelle: C.feuillets.achat.jaune },
        { groupe: 'donne', couleur: [0.95, 0.65, 0.76], libelle: C.feuillets.achat.rose },
        { groupe: 'chambre', couleur: [0.49, 0.76, 0.49], libelle: C.feuillets.achat.vert },
      ]) as readonly { groupe: 'garde' | 'donne' | 'chambre'; couleur: readonly number[]; libelle: string }[];

/** Le nombre de lignes du tableau des numéros individuels du formulaire (dix lignes de quatre colonnes) : le reste va sur la page d'annexe. */
const PLACES_INDIVIDUELLES = 40;

/** L'indicatif de marquage tel qu'il s'écrit dans les cases du formulaire : sans « FR » ni espaces (« FR 212282 » devient « 212282 »). */
/**
 * Les animaux de « agneaux / chevreaux de boucherie » du formulaire : les petits à la date du document, et les tiptag de l'inventaire (un
 * tiptag est destiné à l'abattoir : il compte avec les chevreaux de boucherie, par indicatif de marquage, et non parmi les reproducteurs et
 * réformes, un par un).
 */
export const petitOuTiptag =
  (date: string, tiptags: ReadonlySet<string>) =>
  (animal: Chevre): boolean =>
    estPetitLe(animal, date) || estTiptag(animal, tiptags);

/** Les tiptag de l'inventaire de l'établissement (relus à chaque document). */
const tiptagsDeLInventaire = async (): Promise<ReadonlySet<string>> => numerosTiptag((await lireArchiveStock()).boucles);

export const chiffresDeLIndicatif = (indicatif: string): string =>
  indicatif.replace(/^\s*FR/i, '').replace(/\s+/g, '');

/** Les cases à cocher du type de lieu d'arrivée : le coin bas gauche de chacune (points). */
const CASES_ARRIVEE: Record<LieuArrivee, [number, number]> = {
  elevage: [312, 705.5],
  operateur: [357.7, 705.5],
  centre: [424, 705.5],
  marche: [516, 705.5],
  abattoir: [311, 692.5],
  particulier: [357.7, 692.5],
};

/** Une zone du formulaire que l'application ne peut pas remplir : le coin bas gauche, la largeur et la hauteur (points). */
type ZoneACompleter = [x: number, y: number, largeur: number, hauteur: number];

/**
 * Les zones à compléter à la main, en jaune sur le document : le transporteur et son véhicule, l'heure du chargement, le déchargement, les
 * signatures, le numéro d'exploitation (ou d'abattoir) et le SIREN de l'arrivée. Les coordonnées du détenteur de départ ou d'arrivée, et
 * les morts pendant le transport, n'y sont que lorsqu'elles ne sont pas connues.
 */
export function zonesACompleter(d: DonneesCirculation): ZoneACompleter[] {
  const zones: ZoneACompleter[] = [
    [105, 771, 75, 12],
    [247, 771, 143, 12],
    [443, 771, 112, 12],
    [199, 758, 37, 11],
    [428, 758, 75, 11],
    [40, 735, 256, 11],
    [302, 735, 256, 11],
    [406, 666, 127, 12],
    [423, 644, 105, 12],
    // En bas du document, l'exploitation notifie le départ (une vente) ou l'arrivée (un achat) : sa date et sa signature.
    d.notifie === 'arrivee' ? [428, 50, 130, 38] : [165, 60, 250, 16],
  ];
  const coordonnees = (x: number, p: { nom: string; adresse: string; codePostal: string; commune: string }) => {
    if (!p.nom) zones.push([x - 2, 629, 165, 12]);
    if (!p.adresse) zones.push([x - 2, 601, 165, 12]);
    if (!p.codePostal) zones.push([x - 2, 588, 60, 12]);
    if (!p.commune) zones.push([x - 2, 575.5, 165, 12]);
  };
  coordonnees(124, d.depart);
  coordonnees(394, d.arrivee);
  if (d.mortsTransport === 0) zones.push([391, 498, 80, 12]);
  return zones;
}

/**
 * Les zones que l'application remplit, elles aussi surlignées en jaune (le jaune d'abord, puis la valeur écrite dessus) : le chargement, le
 * départ et l'arrivée, les nombres d'animaux, les indicatifs et les numéros individuels, la mention sanitaire, la date, et, tout en bas, le
 * mouvement que l'exploitation notifie à l'EDE (« je notifie un départ » pour une vente, « une arrivée » pour un achat).
 */
export function zonesPrerempliees(d: DonneesCirculation): ZoneACompleter[] {
  const zones: ZoneACompleter[] = [
    [148, 759, 50, 11],
    [143, 666, 26, 12],
    [175, 666, 94, 12],
    [162, 644, 103, 12],
    [118, 63, 45, 11],
    d.notifie === 'arrivee' ? [458, 17, 92, 11] : [309, 17, 86, 11],
  ];
  const lieu = CASES_ARRIVEE[d.arrivee.lieu];
  zones.push([42, 705, 9.5, 9.5], [lieu[0] - 1, lieu[1] - 1, 9.5, 9.5]);
  const coordonnees = (x: number, p: { nom: string; adresse: string; codePostal: string; commune: string }) => {
    if (p.nom) zones.push([x - 2, 629, 165, 12]);
    if (p.adresse) zones.push([x - 2, 601, 165, 12]);
    if (p.codePostal) zones.push([x - 2, 588, 60, 12]);
    if (p.commune) zones.push([x - 2, 575.5, 165, 12]);
  };
  coordonnees(124, d.depart);
  coordonnees(394, d.arrivee);
  const yLigne = d.ovins ? 538 : 520;
  const nombreBoucherie = d.boucherie.reduce((t, b) => t + b.nombre, 0);
  for (const [xBoucherie, xRepro] of [[164, 249], [430.9, 516.8]]) {
    if (nombreBoucherie > 0) zones.push([xBoucherie - 36, yLigne - 4, 72, 14]);
    if (d.reproducteurs > 0) zones.push([xRepro - 36, yLigne - 4, 72, 14]);
  }
  if (d.mortsTransport > 0) zones.push([391, 498, 80, 12]);
  const lotsBoucherie = [
    { x0: 79.3, pas: 11.5, xNombre: 176 },
    { x0: 226.7, pas: 11.4, xNombre: 335 },
    { x0: 374, pas: 11.55, xNombre: 470.5 },
  ];
  d.boucherie.slice(0, 3).forEach((_, i) => {
    zones.push([lotsBoucherie[i].x0, 417, 6 * lotsBoucherie[i].pas, 12], [lotsBoucherie[i].xNombre - 12, 415, 24, 13]);
  });
  const colonnes = [38, 170, 302, 433];
  d.individuels.slice(0, PLACES_INDIVIDUELLES).forEach((_, k) => {
    zones.push([colonnes[Math.floor(k / 10)] - 2, 355.3 - 17.3 * (k % 10) - 12.3 - 3, 124, 12]);
  });
  zones.push(d.sanitaire.risque ? [45.7, 91, 8.5, 8.5] : [45.7, 114, 8.5, 8.5]);
  return zones;
}

/**
 * Écrit les valeurs d'une vente sur le formulaire (la feuille du détenteur de départ, telle que la Chambre la fournit). Les positions sont
 * celles du modèle remis à l'endroit : points depuis le coin bas gauche de la page (593 × 839).
 */
function ecrireLeFormulaire(o: Outils, d: DonneesCirculation): void {
  // Le bandeau du haut : pour exemple (le filigrane « EXEMPLE » passe en travers de la page).
  o.centre(296, 829, C.bandeauCourt, 8, true);
  // Ce que l'application écrit et ce qui reste à compléter à la main se détachent en jaune (sous les valeurs écrites ensuite).
  for (const [x, y, largeur, hauteur] of [...zonesPrerempliees(d), ...zonesACompleter(d)]) {
    o.page.drawRectangle({ x, y, width: largeur, height: hauteur, color: rgb(1, 0.88, 0.1), opacity: 0.5, borderColor: rgb(0.9, 0.55, 0), borderWidth: 0.8, borderOpacity: 0.9 });
  }
  o.page.drawText(C.exemple, { x: 120, y: 250, size: 120, font: o.policeGrasse, color: rgb(0, 0, 0), opacity: 0.06, rotate: degrees(40) });
  // Le chargement : la date de la vente.
  o.ajuste(150, 762.5, formatDateFR(d.date), 85, 9);
  // Le départ : un élevage, avec son numéro d'exploitation (FR + chiffres, en cases) et son SIREN.
  o.croix(43, 706, 7.5);
  const exploitation = d.depart.numeroExploitation;
  o.cases(145, 672.5, 11.4, exploitation.slice(0, 2), 10);
  o.cases(177, 672.5, 11.46, exploitation.slice(2), 10);
  o.cases(162.5, 650.5, 11.4, d.depart.siren, 10);
  // L'arrivée : son type (case cochée) — son numéro d'exploitation ou d'abattoir reste à écrire, le client ne nous le donne pas.
  const [cx, cy] = CASES_ARRIVEE[d.arrivee.lieu];
  o.croix(cx, cy, 7.5);
  // Le détenteur, l'adresse, le code postal et la commune des deux côtés.
  const coordonnees = (x: number, p: { nom: string; adresse: string; codePostal: string; commune: string }) => {
    o.ajuste(x, 632, p.nom, 163, 9);
    o.ajuste(x, 603.5, p.adresse, 163, 8.5);
    o.texte(x, 590.5, p.codePostal, 9);
    o.ajuste(x, 578, p.commune, 163, 9);
  };
  coordonnees(124, d.depart);
  coordonnees(394, d.arrivee);
  // Les nombres d'animaux : la ligne des ovins ou des caprins, la colonne des petits de boucherie ou des reproducteurs et réformes.
  const nombreBoucherie = d.boucherie.reduce((t, b) => t + b.nombre, 0);
  const yLigne = d.ovins ? 538 : 520;
  /** La ligne « Nb de morts transport » est sous celle des caprins. */
  const yMortsTransport = yLigne - 14;
  const nombres = (xBoucherie: number, xRepro: number) => {
    if (nombreBoucherie > 0) o.centre(xBoucherie, yLigne, String(nombreBoucherie), 10, true);
    if (d.reproducteurs > 0) o.centre(xRepro, yLigne, String(d.reproducteurs), 10, true);
  };
  nombres(164, 249);
  nombres(430.9, 516.8);
  // Les animaux morts pendant le transport : la ligne « Nb de morts transport » du tableau de l'arrivée.
  if (d.mortsTransport > 0) o.centre(430.9, yMortsTransport, String(d.mortsTransport), 10, true);
  // Les petits de boucherie : l'indicatif de marquage (en cases) et leur nombre, trois indicatifs au plus.
  const lotsBoucherie: { x0: number; pas: number; xNombre: number }[] = [
    { x0: 79.3, pas: 11.5, xNombre: 176 },
    { x0: 226.7, pas: 11.4, xNombre: 335 },
    { x0: 374, pas: 11.55, xNombre: 470.5 },
  ];
  d.boucherie.slice(0, 3).forEach((b, i) => {
    const { x0, pas, xNombre } = lotsBoucherie[i];
    // L'indicatif de marquage s'écrit sans « FR » : ses six chiffres, un par case.
    const chiffres = chiffresDeLIndicatif(b.indicatif);
    if (chiffres.length <= 6) o.cases(x0, 417.5, pas, chiffres, 10);
    else o.ajuste(x0, 417.5, chiffres, 6 * pas, 9);
    o.centre(xNombre, 421, String(b.nombre), 10, true);
  });
  // Les reproducteurs et réformes : un numéro individuel par case du tableau, colonne après colonne.
  const colonnes = [38, 170, 302, 433];
  d.individuels.slice(0, PLACES_INDIVIDUELLES).forEach((numero, k) => {
    const colonne = Math.floor(k / 10);
    const ligne = k % 10;
    o.ajuste(colonnes[colonne], 355.3 - 17.3 * ligne - 12.3, numero, 122, 9);
  });
  // Les informations sanitaires : la mention utile est cochée (aucun risque, ou des animaux sous délai d'attente).
  if (d.sanitaire.risque) o.croix(46.7, 92, 6.5);
  else o.croix(46.7, 115, 6.5);
  o.texte(120, 66, formatDateFR(d.date), 8.5);
  // Tout en bas : « je notifie un départ » (une vente) ou « une arrivée » (un achat), cochée d'une croix devant la mention.
  const xCroix = d.notifie === 'arrivee' ? 446 : 298;
  o.page.drawRectangle({ x: xCroix, y: 18, width: 9, height: 9, borderColor: rgb(0, 0, 0), borderWidth: 0.8 });
  o.croix(xCroix, 18, 9);
}

/**
 * Le document de circulation d'une vente d'animaux, rempli pour exemple sur le formulaire de la Chambre : la feuille du détenteur de départ
 * (page 1), puis une page de rappel (les feuillets de la liasse et à qui les remettre, les animaux sous délai d'attente, les numéros qui ne
 * tiennent pas dans le tableau). Rend le PDF en base64.
 */
export async function remplirDocumentCirculation(d: DonneesCirculation): Promise<string> {
  const page1 = await remplirModele(MODELE_CIRCULATION, [[d]], (outils, element) => ecrireLeFormulaire(outils, element));
  const doc = await PDFDocument.load(page1);
  const police = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);
  const propre = (texte: string) => [...texte].map((c) => (police.getCharacterSet().includes(c.codePointAt(0) ?? 0) ? c : '?')).join('');
  let y = 790;
  /** Écrit un texte en le coupant à la largeur de la page : une ligne par morceau. */
  const ligne = (texte: string, taille = 10, enGras = false, x = 50) => {
    const font = enGras ? gras : police;
    const largeur = 545 - x;
    let courante = '';
    const ecrire = (morceau: string) => {
      page.drawText(propre(morceau), { x, y, size: taille, font, color: rgb(0.1, 0.1, 0.18) });
      y -= taille + 3;
    };
    for (const mot of propre(texte).split(' ')) {
      const essai = courante ? `${courante} ${mot}` : mot;
      if (courante && font.widthOfTextAtSize(essai, taille) > largeur) {
        ecrire(courante);
        courante = mot;
      } else courante = essai;
    }
    if (courante) ecrire(courante);
    y -= 3;
  };
  ligne(C.bandeau, 9, true);
  y -= 10;
  const sens = d.notifie === 'arrivee' ? 'achat' : 'vente';
  ligne(C.rappelTitre[sens], 13, true);
  y -= 4;
  let groupe = '';
  for (const f of feuilletsCirculation(sens)) {
    // Une ligne sépare les feuillets qu'on garde, ceux qu'on donne et celui qu'on envoie à la Chambre.
    if (groupe && f.groupe !== groupe) {
      y -= 2;
      page.drawLine({ start: { x: 50, y: y + 6 }, end: { x: 545, y: y + 6 }, thickness: 0.7, color: rgb(0.6, 0.6, 0.6) });
      y -= 8;
    }
    groupe = f.groupe;
    page.drawRectangle({ x: 50, y: y - 2, width: 12, height: 12, color: rgb(f.couleur[0], f.couleur[1], f.couleur[2]), borderColor: rgb(0, 0, 0), borderWidth: 0.8 });
    ligne(f.libelle, 10.5, false, 70);
  }
  y -= 4;
  ligne(C.rappelNote, 8);
  if (d.sanitaire.animaux.length > 0) {
    y -= 14;
    ligne(C.sanitaire.titre, 11, true);
    ligne(C.sanitaire.risque, 9);
    for (const a of d.sanitaire.animaux) ligne(`${a.boucle} : ${a.produit}, ${C.sanitaire.jusquau} ${formatDateFR(a.fin)}`, 9.5, false, 60);
  }
  if (d.individuels.length > PLACES_INDIVIDUELLES) {
    y -= 14;
    ligne(C.suiteNumeros, 11, true);
    const reste = d.individuels.slice(PLACES_INDIVIDUELLES);
    for (let i = 0; i < reste.length; i += 4) ligne(reste.slice(i, i + 4).join('    '), 9.5, false, 60);
  }
  return doc.saveAsBase64();
}

/**
 * Les animaux morts pendant le transport, d'après les lots d'abattage des réglages : ceux de `animaux` déclarés « morte pendant le
 * transport » dans le lot du jour d'abattage. Le document les lit lui-même, d'où qu'on le génère.
 */
export const mortsTransportDuJour = (lots: readonly LotAnimaux[] | undefined, jour: string, ids: readonly string[]): number =>
  (lots ?? [])
    .filter((l) => l.abattoir === jour)
    .flatMap((l) => l.inconsommables ?? [])
    .filter((i) => i.motif === 'transport' && ids.includes(i.id)).length;

/**
 * Le document de circulation d'un lot d'abattoir : les animaux partent vivants de l'exploitation vers l'abattoir à la date d'abattage. Faux
 * quand aucun animal n'est retrouvé, sauf `sansAnimal` (la dépense d'un abattoir sans lot : le modèle pré-rempli, animaux à écrire à la main).
 */
export async function exporterDocumentCirculationAbattoirPdf(
  date: string,
  idsAnimaux: string[],
  abattoir?: string,
  sansAnimal = false,
  /** Les animaux déclarés morts pendant le transport (voir le suivi sanitaire du lot) : écrits sur « Nb de morts transport » ; sinon, lus dans le lot. */
  mortsTransport?: number,
): Promise<boolean> {
  const animaux = (await Promise.all(idsAnimaux.map(getChevre))).filter((a): a is Chevre => !!a);
  if (animaux.length === 0 && !sansAnimal) return false;
  const [settings, traitements] = await Promise.all([getSettings(), listTousTraitements()]);
  // Une vente déclarée de viande, pour l'abattoir : le lieu d'arrivée est l'abattoir.
  const vente = {
    id: '',
    activite: '',
    date,
    dateAbattoir: date,
    categorie: CATEGORIE_VENTE.VIANDE,
    quantite: animaux.length,
    unite: 'piece',
    prix: 0,
    tauxTva: 0,
    client: abattoir,
    choixFacture: undefined,
  } as unknown as Vente;
  const donnees = donneesDeCirculation({
    vente,
    animaux,
    infos: settings.exploitation,
    petit: petitOuTiptag(date, await tiptagsDeLInventaire()),
    traitements,
    mortsTransport: mortsTransport ?? mortsTransportDuJour(settings.exploitation?.lots, date, idsAnimaux),
  });
  await ecrirePdfBase64EtPartager(
    await remplirDocumentCirculation(donnees),
    `${C.fichier}_abattoir_${date}.${FORMAT_EXPORT.PDF}`,
    C.titre,
  );
  return true;
}

/**
 * Le document de circulation d'un achat d'animaux vivants (dépense « Animaux vivants ») : le vendeur est le détenteur de départ (son nom et
 * son adresse d'après le contact), l'exploitation est le lieu d'arrivée. Faux sans animal retrouvé.
 */
export async function exporterDocumentCirculationAchatPdf(factureId: string): Promise<boolean> {
  const facture = await getFacture(factureId);
  if (!facture) return false;
  const animaux = (await Promise.all(idsDesAnimauxAchetes(facture).map(getChevre))).filter((a): a is Chevre => !!a);
  if (animaux.length === 0) return false;
  const [fournisseurs, settings, traitements] = await Promise.all([listFournisseurs(), getSettings(), listTousTraitements()]);
  const vendeur = fournisseurs.find((f) => (f.nomEntreprise || f.nom).trim().toLowerCase() === facture.tiers.trim().toLowerCase());
  const vente = {
    id: '',
    activite: '',
    date: facture.date,
    categorie: CATEGORIE_VENTE.ANIMAL_VIVANT,
    quantite: animaux.length,
    unite: 'piece',
    prix: 0,
    tauxTva: 0,
    client: facture.tiers,
  } as unknown as Vente;
  const donnees = donneesDeCirculation({
    vente,
    animaux,
    infos: settings.exploitation,
    petit: petitOuTiptag(facture.date, await tiptagsDeLInventaire()),
    traitements,
  });
  const identite = identiteDuSuivi(settings.exploitation);
  // L'achat inverse le trajet : de chez le vendeur vers l'exploitation (un élevage).
  donnees.depart = {
    numeroExploitation: '',
    siren: (vendeur?.siret ?? '').slice(0, 9),
    nom: vendeur ? vendeur.nomEntreprise || vendeur.nom : facture.tiers,
    ...adresseEnPartie(vendeur?.adressePostale),
  };
  // Un achat : l'exploitation notifie l'arrivée des animaux (en bas à droite du document).
  donnees.notifie = 'arrivee';
  donnees.arrivee = {
    lieu: LIEU_ARRIVEE.ELEVAGE,
    nom: identite.nom,
    ...adresseEnPartie(settings.exploitation?.adresseExploitant),
  };
  await ecrirePdfBase64EtPartager(
    await remplirDocumentCirculation(donnees),
    `${C.fichier}_achat_${facture.date}.${FORMAT_EXPORT.PDF}`,
    C.titre,
  );
  return true;
}

/** Crée le document de circulation (exemple) d'une vente d'animaux et l'ouvre à l'envoi ou à l'impression ; faux sans animal. */
export async function exporterDocumentCirculationPdf(venteId: string): Promise<boolean> {
  const vente = await getVente(venteId);
  if (!vente) return false;
  const animaux = (await Promise.all(idsDesAnimaux(vente).map(getChevre))).filter((a): a is Chevre => !!a);
  if (animaux.length === 0) return false;
  const [clients, settings, traitements] = await Promise.all([listClients(), getSettings(), listTousTraitements()]);
  const client = clients.find((c) => nomComplet(c) === vente.client?.trim());
  const donnees = donneesDeCirculation({
    vente,
    animaux,
    client,
    infos: settings.exploitation,
    petit: petitOuTiptag(vente.date, await tiptagsDeLInventaire()),
    traitements,
    // Une vente de viande d'un jour d'abattage : les bêtes mortes pendant le transport sont celles du lot de ce jour.
    mortsTransport: vente.dateAbattoir ? mortsTransportDuJour(settings.exploitation?.lots, vente.dateAbattoir, idsDesAnimaux(vente)) : 0,
  });
  await ecrirePdfBase64EtPartager(
    await remplirDocumentCirculation(donnees),
    `${C.fichier}_${vente.date}.${FORMAT_EXPORT.PDF}`,
    C.titre,
  );
  return true;
}
