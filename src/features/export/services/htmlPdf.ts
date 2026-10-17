import { Platform } from 'react-native';
import { archiverDocument } from '@/features/bibliotheque/services/archive';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getSettings, identificationCheptel, type InfosExploitation } from '@/features/settings/settings';
import { especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { HAUTEUR_PAGE_A4, LARGEUR_PAGE_A4, MIME_PDF, UTI_PDF } from '@/shared/constants/export';
import { colors } from '@/shared/theme/colors';
import { formatDateFR, todayISO } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

export function echapper(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Une valeur qui se lit comme un nombre (montant, quantité, pourcentage) : alignée à droite dans sa colonne. */
const estNumerique = (v: unknown): boolean =>
  typeof v === 'number' || (typeof v === 'string' && /^[-+−]?\d[\d\s.,]*\s?(€|%|kg|L|l)?$/.test(v.trim()));

/** Un numéro d'identification (une boucle : « FR 21228200701 ») : il ne se coupe pas en deux lignes, sa colonne s'élargit. */
const estIdentifiant = (v: unknown): boolean =>
  typeof v === 'string' && /^[A-Za-z]{0,3}\s?\d{6,}$/.test(v.trim());

export interface OptionsTableau {
  /** La dernière ligne est un total : en gras, sur un fond teinté. */
  totaux?: boolean;
}

/**
 * Un tableau compact : en-tête qui se répète à chaque page, lignes jamais coupées, rangées alternées, colonnes de chiffres
 * alignées à droite.
 */
export function tableauHtml(
  rows: Record<string, unknown>[],
  messageVide: string,
  options: OptionsTableau = {},
): string {
  if (rows.length === 0) return `<p class="vide">${echapper(messageVide)}</p>`;
  const colonnes = Object.keys(rows[0]);
  const numerique = colonnes.map((c) => {
    const valeurs = rows
      .map((r) => r[c])
      .filter((v) => v !== '' && v !== undefined && v !== null && v !== '—');
    return valeurs.length > 0 && valeurs.every(estNumerique);
  });
  // Une colonne de numéros d'identification (n° de boucle, boucle de la mère) : ses cellules ne passent pas à la ligne.
  const identifiant = colonnes.map((c, i) => {
    const valeurs = rows
      .map((r) => r[c])
      .filter((v) => v !== '' && v !== undefined && v !== null && v !== '—');
    return !numerique[i] && valeurs.length > 0 && valeurs.every(estIdentifiant);
  });
  const entetes = colonnes
    .map((c, i) => `<th${numerique[i] ? ' class="num"' : ''}>${echapper(c)}</th>`)
    .join('');
  const lignes = rows
    .map((r, index) => {
      const classe = options.totaux && index === rows.length - 1 ? ' class="total"' : '';
      const cellules = colonnes
        .map(
          (c, i) =>
            `<td${numerique[i] ? ' class="num"' : identifiant[i] ? ' class="id"' : ''}>${echapper(r[c])}</td>`,
        )
        .join('');
      return `<tr${classe}>${cellules}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${entetes}</tr></thead><tbody>${lignes}</tbody></table>`;
}

/** Des chiffres clés en bandeau : une carte par chiffre (libellé en petit, valeur en grand, détail facultatif). */
export function cartesHtml(cartes: { libelle: string; valeur: string; detail?: string }[]): string {
  const carte = (c: { libelle: string; valeur: string; detail?: string }) =>
    `<div class="carte"><div class="carte-libelle">${echapper(c.libelle)}</div><div class="carte-valeur">${echapper(c.valeur)}</div>${
      c.detail ? `<div class="carte-detail">${echapper(c.detail)}</div>` : ''
    }</div>`;
  return `<div class="cartes">${cartes.map(carte).join('')}</div>`;
}

/** Une section : son titre, puis son contenu. */
export function sectionHtml(titre: string, contenu: string): string {
  return `<section><h2>${echapper(titre)}</h2>${contenu}</section>`;
}

/** Le titre d'une liste d'articles (en gras) et, en gris, son compte du plan comptable. */
export const listeTitreHtml = (titre: string, detail: string): string =>
  `<div class="liste-titre"><strong>${echapper(titre)}</strong><span>${echapper(detail)}</span></div>`;

/**
 * Un histogramme en colonnes (de simples blocs) : une barre par valeur — pleine pour la référence, cernée pour les autres — avec son nom,
 * sa valeur et une ligne de détail dessous. La plus grande valeur donne la hauteur du dessin.
 */
export function histogrammeHtml(
  colonnes: { libelle: string; valeur: number; texte: string; detail?: string; pleine?: boolean }[],
): string {
  const max = Math.max(...colonnes.map((c) => c.valeur), 1);
  const colonne = (c: (typeof colonnes)[number]) =>
    `<div class="histo-col"><div class="histo-zone"><div class="histo-barre${c.pleine ? ' pleine' : ''}" style="height:${Math.max(2, Math.round((Math.max(0, c.valeur) / max) * 100))}%"></div></div><div class="histo-libelle">${echapper(c.libelle)}</div><div class="histo-valeur">${echapper(c.texte)}</div>${c.detail ? `<div class="histo-detail">${echapper(c.detail)}</div>` : ''}</div>`;
  return `<div class="histo">${colonnes.map(colonne).join('')}</div>`;
}

/** Une petite note en italique (d'où viennent les chiffres, ce qui n'est pas calculé…). */
export const noteHtml = (texte: string): string => `<p class="note">${echapper(texte)}</p>`;

/**
 * En-tête de l'exploitation : coordonnées communes, puis l'identification du cheptel. Pour un rapport sur une seule
 * espèce, son n° de cheptel et son indicatif suivent les coordonnées ; pour plusieurs espèces, une ligne par espèce.
 */
function enTeteExploitationHtml(infos: InfosExploitation | undefined, especes: EspeceAnimale[]): string {
  if (!infos) return '';
  const identite = [infos.nomExploitant, infos.adresseExploitant].filter(Boolean).map(echapper);
  const unique = especes.length === 1 ? identificationCheptel(infos, especes[0]) : undefined;
  const champs: [string, string | undefined][] = [
    [TEXTES.export.pdfExport.nExploitation, infos.numeroExploitation],
    [TEXTES.commun.general.siret, infos.siret],
    [TEXTES.commun.general.nCheptel, unique?.numeroCheptel],
    [TEXTES.commun.general.indicatifDeMarquage, unique?.indicatifMarquage],
    [TEXTES.export.pdfExport.nPacage, infos.numeroPacage],
    [TEXTES.export.pdfExport.nDetenteur, infos.numeroDetenteur],
  ];
  const champsRenseignes = champs.filter(([, v]) => !!v);
  const parEspece =
    especes.length > 1
      ? especes
          .map((espece) => ({ espece, id: identificationCheptel(infos, espece) }))
          .filter(({ id }) => !!id.numeroCheptel || !!id.indicatifMarquage)
      : [];
  if (identite.length === 0 && champsRenseignes.length === 0 && parEspece.length === 0) return '';

  const ligneIdentite = identite.length > 0 ? `<div class="identite">${identite.join(' — ')}</div>` : '';
  const ligneChamps =
    champsRenseignes.length > 0
      ? `<div class="exploitation-grid">${champsRenseignes
          .map(([label, v]) => `<span><strong>${label} :</strong> ${echapper(v)}</span>`)
          .join('')}</div>`
      : '';
  const lignesEspeces = parEspece
    .map(({ espece, id }) => {
      const details = [
        id.numeroCheptel ? `${TEXTES.commun.general.nCheptel} : ${echapper(id.numeroCheptel)}` : '',
        id.indicatifMarquage
          ? `${TEXTES.commun.general.indicatifDeMarquage} : ${echapper(id.indicatifMarquage)}`
          : '',
      ].filter(Boolean);
      return `<div><strong>${echapper(LABEL_ACTIVITE_COMPTABLE[espece])}</strong> — ${details.join(' · ')}</div>`;
    })
    .join('');
  return `<div class="exploitation">${ligneIdentite}${ligneChamps}${lignesEspeces}</div>`;
}

/** Les options d'un document : un sous-titre sous le titre (l'année, la période…). */
export interface OptionsDocument {
  sousTitre?: string;
}

/**
 * Document HTML complet : un bandeau de titre (avec la date d'édition), l'identité de l'exploitation, le corps, puis un pied de
 * page répété sur chaque page. La mise en page est faite pour tenir en peu de pages : tableaux compacts, en-têtes répétés.
 */
export function documentHtml(
  titre: string,
  infos: InfosExploitation | undefined,
  corps: string,
  /** Espèces couvertes par le rapport (celles de l'établissement par défaut) : leur identification figure en en-tête. */
  especes: EspeceAnimale[] = especesActives(),
  /** En-tête déjà construit (celui d'une entreprise) : il remplace celui de l'exploitation. */
  enTete?: string,
  options: OptionsDocument = {},
): string {
  const edite = TEXTES.export.pdf.edite(formatDateFR(todayISO()));
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${colors.text}; padding: 20px 24px 34px; font-size: 10px; line-height: 1.35; }
  .bandeau { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid ${colors.primary}; padding-bottom: 8px; margin-bottom: 10px; }
  h1 { font-size: 19px; margin: 0; color: ${colors.primaryDark}; }
  .sous-titre { font-size: 11px; color: ${colors.textMuted}; margin-top: 2px; }
  .edite { font-size: 9px; color: ${colors.textMuted}; white-space: nowrap; }
  h2 { font-size: 11px; margin: 14px 0 6px; padding: 3px 0 3px 8px; border-left: 4px solid ${colors.primary}; background: ${colors.badgeBg}; color: ${colors.primaryDark}; text-transform: uppercase; letter-spacing: 0.4px; page-break-after: avoid; }
  section { page-break-inside: auto; }
  .titre-perso { font-size: 11px; font-weight: 700; color: ${colors.textMuted}; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; }
  .exploitation { font-size: 9.5px; color: ${colors.textMuted}; margin: 0 0 8px; line-height: 1.5; border: 1px solid ${colors.border}; border-radius: 4px; padding: 6px 10px; }
  .exploitation .identite { color: ${colors.text}; font-weight: 600; }
  .exploitation-grid { display: flex; flex-wrap: wrap; gap: 2px 16px; margin-top: 2px; }
  .cartes { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 4px; }
  .carte { flex: 1 1 110px; border: 1px solid ${colors.border}; border-top: 3px solid ${colors.primary}; border-radius: 4px; padding: 6px 9px; }
  .carte-libelle { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.4px; color: ${colors.textMuted}; }
  .carte-valeur { font-size: 15px; font-weight: 800; color: ${colors.primaryDark}; margin-top: 1px; }
  .carte-detail { font-size: 8.5px; color: ${colors.textMuted}; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border-bottom: 1px solid ${colors.border}; padding: 3px 6px; font-size: 9px; text-align: left; vertical-align: top; }
  th { overflow-wrap: break-word; background: ${colors.badgeBg}; font-weight: 700; color: ${colors.primaryDark}; border-bottom: 2px solid ${colors.primary}; }
  tbody tr:nth-child(even) td { background: ${colors.background}; }
  th.num, td.num { text-align: right; white-space: nowrap; }
  td.id { white-space: nowrap; }
  tr.total td { font-weight: 800; background: ${colors.badgeBg}; border-top: 2px solid ${colors.primary}; }
  .vide { font-size: 10px; color: ${colors.textMuted}; font-style: italic; margin: 4px 0 8px; }
  .liste-titre { margin: 6px 0 2px; font-size: 10px; page-break-after: avoid; }
  .liste-titre span { color: ${colors.textMuted}; margin-left: 8px; font-size: 9px; }
  .note { font-size: 8.5px; color: ${colors.textMuted}; font-style: italic; margin: 2px 0 8px; }
  .groupe { font-weight: 800; background: ${colors.badgeBg}; }
  .pied { position: fixed; bottom: 0; left: 24px; right: 24px; display: flex; justify-content: space-between; font-size: 8px; color: ${colors.textMuted}; border-top: 1px solid ${colors.border}; padding: 3px 0; background: ${colors.surface}; }
  .histo { display: flex; align-items: flex-end; gap: 10px; margin: 8px 0 10px; border-left: 1px solid ${colors.primary}; padding-left: 8px; page-break-inside: avoid; }
  .histo-col { flex: 1; text-align: center; }
  .histo-zone { height: 110px; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid ${colors.primary}; }
  .histo-barre { width: 60%; max-width: 54px; border: 2px solid ${colors.primary}; border-bottom: none; background: transparent; }
  .histo-barre.pleine { background: ${colors.primary}; }
  .histo-libelle { font-weight: 700; font-size: 9px; margin-top: 3px; }
  .histo-valeur { font-size: 9px; }
  .histo-detail { font-size: 8px; color: ${colors.textMuted}; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
  <div class="bandeau">
    <div>
      <h1>${echapper(titre)}</h1>
      ${options.sousTitre ? `<div class="sous-titre">${echapper(options.sousTitre)}</div>` : ''}
    </div>
    <div class="edite">${echapper(edite)}</div>
  </div>
  ${enTete ?? enTeteExploitationHtml(infos, especes)}
  ${corps}
  <div class="pied"><span>${echapper(titre)}</span><span>${echapper(edite)}</span></div>
</body>
</html>`;
}

/** Les options d'impression : A4 en portrait (par défaut) ou en paysage pour les tableaux larges. */
export interface OptionsImpression {
  paysage?: boolean;
  /** Un document à la taille exacte de la feuille (un formulaire) : aucune marge autour de la page. */
  sansMarges?: boolean;
}

/**
 * Android fabrique le PDF avec le moteur de Chrome, comme la version Windows : sa page A4 a 96 points par pouce au lieu de 72 (iOS). Un
 * formulaire dessiné pour une page de 595 × 842 points n'en remplirait que les trois quarts, en haut à gauche, et déborderait sur une
 * deuxième page. Comme sur l'ordinateur (voir bureau/print.ts), il s'agrandit d'un tiers (--k), sans marge.
 */
const ECHELLE_PAGE_ANDROID = 1.33;
const stylePageSansMargesAndroid = (paysage: boolean | undefined) =>
  `@page { size: A4${paysage ? ' landscape' : ''}; margin: 0 } :root { --k: ${ECHELLE_PAGE_ANDROID} }`;

/** Écrit un PDF déjà fabriqué (en base64, par exemple un formulaire officiel rempli) sous `nomFichier` et ouvre le menu de partage. */
export async function ecrirePdfBase64EtPartager(base64: string, nomFichier: string, titre: string): Promise<void> {
  const destination = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.writeAsStringAsync(destination, base64, { encoding: FileSystem.EncodingType.Base64 });
  await archiverDocument(destination, nomFichier, titre);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destination, { mimeType: MIME_PDF, dialogTitle: titre, UTI: UTI_PDF });
  }
}

/** Génère le PDF depuis le HTML, le copie sous `nomFichier` et ouvre le menu de partage. */
export async function ecrireEtPartagerPdf(
  source: string,
  nomFichier: string,
  titre: string,
  options: OptionsImpression = {},
): Promise<void> {
  // Le titre personnalisé de l'utilisateur (Organisation › Export) s'imprime en tête des PDF (pas d'un formulaire à la taille exacte de la page : il la ferait déborder).
  const titrePerso = options.sansMarges ? undefined : (await getSettings()).exploitation?.titrePdf?.trim();
  const html = titrePerso
    ? source.replace('<body>', `<body>\n  <div class="titre-perso">${echapper(titrePerso)}</div>`)
    : source;
  const { uri } = await Print.printToFileAsync({
    html:
      options.sansMarges && Platform.OS === 'android'
        ? html.replace('</head>', `<style>${stylePageSansMargesAndroid(options.paysage)}</style></head>`)
        : html,
    base64: false,
    // Une page A4 : sans taille, l'impression suit le format du pays de l'appareil (Letter aux États-Unis).
    width: options.paysage ? HAUTEUR_PAGE_A4 : LARGEUR_PAGE_A4,
    height: options.paysage ? LARGEUR_PAGE_A4 : HAUTEUR_PAGE_A4,
    ...(options.sansMarges ? { margins: { top: 0, right: 0, bottom: 0, left: 0 } } : {}),
  });
  const destination = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  await archiverDocument(destination, nomFichier, titre);

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(destination, {
      mimeType: MIME_PDF,
      dialogTitle: titre,
      UTI: UTI_PDF,
    });
  }
}
