import { codePostalEtCommune } from '@/features/cheptel/services/estive';
import { estPetitLe, getChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { especeDe } from '@/features/cheptel/utils/espece';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { getVente } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { avecIndicatif } from '@/features/export/services/lignesExport';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { identiteDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { getSettings, identificationCheptel, type InfosExploitation } from '@/features/settings/settings';
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
}

/** Le lieu d'arrivée d'après la vente : l'abattoir pour de la viande déclarée, sinon d'après la catégorie du client. */
export function lieuDArrivee(vente: Pick<Vente, 'categorie' | 'choixFacture'>, client?: Pick<Client, 'categorie'>): LieuArrivee {
  if (vente.categorie === CATEGORIE_VENTE.VIANDE && venteADeclarer(vente)) return LIEU_ARRIVEE.ABATTOIR;
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
}): DonneesCirculation {
  const { vente, animaux, client, infos, petit } = entree;
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
  };
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0 5mm; font-size: 8.5pt; position: relative; }
  .exemple { background: #fff3b0; border: 1.5px solid #c9a800; padding: 2mm 3mm; font-weight: 700; margin-bottom: 3mm; }
  .filigrane { position: fixed; top: 105mm; left: 0; right: 0; text-align: center; font-size: 90pt; font-weight: 800; color: rgba(0,0,0,0.07); transform: rotate(-30deg); z-index: 0; }
  .titre { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm; }
  .titre h1 { font-size: 13pt; margin: 0; text-align: center; flex: 1; }
  .titre h1 small { display: block; font-size: 10pt; }
  .folio { border: 1.2px solid #111; width: 42mm; padding: 1.5mm 2mm; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; position: relative; z-index: 1; }
  td, th { border: 1.2px solid #111; padding: 1.2mm 2mm; vertical-align: top; }
  .blanc td { height: 6mm; }
  .entete { text-align: center; font-weight: 800; background: #eee; }
  .valeur { color: #1a2a8a; font-weight: 700; }
  .case { display: inline-block; width: 3.2mm; height: 3.2mm; border: 1px solid #111; margin: 0 1mm 0 2mm; vertical-align: -0.5mm; text-align: center; line-height: 3mm; font-size: 8pt; font-weight: 800; color: #1a2a8a; }
  h2 { font-size: 9.5pt; margin: 4mm 0 1.5mm; }
  .numeros td { height: 6mm; text-align: center; }
  .signature td { height: 22mm; }
  .rappel { margin-top: 4mm; border: 1.5px solid #111; padding: 2mm 3mm; position: relative; z-index: 1; background: #fff; }
  .rappel h3 { margin: 0 0 1.5mm; font-size: 9.5pt; }
  .rappel .ligne { display: flex; align-items: center; gap: 2mm; margin: 0.8mm 0; }
  .puce { width: 5mm; height: 5mm; border: 1px solid #111; flex: none; }
  .note { font-size: 7.5pt; color: #444; margin-top: 1.5mm; }
`;

const caseHtml = (cochee: boolean): string => `<span class="case">${cochee ? '✕' : ''}</span>`;

/** Les feuillets de la liasse, avec leur couleur et ce qu'on en fait (le rappel du document de circulation). */
export const FEUILLETS_CIRCULATION = [
  { couleur: '#ffffff', libelle: C.feuillets.blanc },
  { couleur: '#7ec27e', libelle: C.feuillets.vert },
  { couleur: '#7ea8e0', libelle: C.feuillets.bleu },
  { couleur: '#f2a6c1', libelle: C.feuillets.rose },
  { couleur: '#f6e05e', libelle: C.feuillets.jaune },
] as const;

/** Le document de circulation, rempli pour exemple d'après la vente : à recopier sur la liasse officielle de la Chambre d'agriculture. */
export function documentCirculationHtml(d: DonneesCirculation): string {
  const lieux: [LieuArrivee, string][] = [
    [LIEU_ARRIVEE.ELEVAGE, C.lieux.elevage],
    [LIEU_ARRIVEE.OPERATEUR, C.lieux.operateur],
    [LIEU_ARRIVEE.CENTRE, C.lieux.centre],
    [LIEU_ARRIVEE.MARCHE, C.lieux.marche],
    [LIEU_ARRIVEE.ABATTOIR, C.lieux.abattoir],
    [LIEU_ARRIVEE.PARTICULIER, C.lieux.particulier],
  ];
  const choixDepart = `${caseHtml(true)}${echapper(C.lieux.elevage)} ${caseHtml(false)}${echapper(C.lieux.operateur)} ${caseHtml(false)}${echapper(C.lieux.centre)} ${caseHtml(false)}${echapper(C.lieux.marche)}`;
  const choixArrivee = lieux.map(([lieu, libelle]) => `${caseHtml(d.arrivee.lieu === lieu)}${echapper(libelle)}`).join(' ');
  const nombreBoucherie = d.boucherie.reduce((t, b) => t + b.nombre, 0);
  const ligneOvins = (valeurBoucherie: number, valeurRepro: number, ovins: boolean) =>
    `<tr><td>${echapper(ovins ? C.ovins : C.caprins)}</td><td class="valeur">${ovins === d.ovins && valeurBoucherie > 0 ? valeurBoucherie : ''}</td><td class="valeur">${ovins === d.ovins && valeurRepro > 0 ? valeurRepro : ''}</td></tr>`;
  const tableauComptes = `<table>
      <tr><td></td><th>${echapper(C.boucherie)}</th><th>${echapper(C.reproducteurs)}</th></tr>
      ${ligneOvins(nombreBoucherie, d.reproducteurs, true)}
      ${ligneOvins(nombreBoucherie, d.reproducteurs, false)}
    </table>`;
  const bloc = (titre: string, entete: string, p: DonneesCirculation['depart'] | (DonneesCirculation['arrivee'] & { numeroExploitation?: string; siren?: string })) => {
    const numero = 'numeroExploitation' in p ? (p.numeroExploitation ?? '') : '';
    const siren = 'siren' in p ? (p.siren ?? '') : '';
    return `<td style="width:50%">
      <div class="entete">${echapper(titre)}</div>
      <div>${entete}</div>
      <div><b>${echapper(C.numeroExploitation)}</b> <span class="valeur">${echapper(numero)}</span></div>
      <div><b>${echapper(C.siren)}</b> <span class="valeur">${echapper(siren)}</span></div>
      <div>${echapper(C.detenteur)} : <span class="valeur">${echapper(p.nom)}</span></div>
      <div>${echapper(C.adresse)} : <span class="valeur">${echapper(p.adresse)}</span></div>
      <div>${echapper(C.codePostal)} : <span class="valeur">${echapper(p.codePostal)}</span> — ${echapper(C.commune)} : <span class="valeur">${echapper(p.commune)}</span></div>
      ${tableauComptes}
    </td>`;
  };
  const individuels = d.individuels.length > 0 ? d.individuels : [];
  const lignesIndividuels = Array.from({ length: Math.max(8, Math.ceil(individuels.length / 4)) }, (_, r) =>
    `<tr>${[0, 1, 2, 3].map((c) => `<td class="valeur">${echapper(individuels[c * Math.max(8, Math.ceil(individuels.length / 4)) + r] ?? '')}</td>`).join('')}</tr>`,
  ).join('');
  const lignesBoucherie = Array.from({ length: 3 }, (_, i) =>
    `<td>${echapper(C.indicatif)} : <span class="valeur">${echapper(d.boucherie[i]?.indicatif ?? '')}</span></td><td class="valeur" style="width:14mm">${d.boucherie[i]?.nombre ?? ''}</td>`,
  ).join('');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
  <div class="filigrane">${echapper(C.exemple)}</div>
  <div class="exemple">${echapper(C.bandeau)}</div>
  <div class="titre">
    <h1>${echapper(C.titre)}<small>${echapper(C.sousTitre)}</small></h1>
    <div class="folio">${echapper(C.folio)} :</div>
  </div>
  <table class="blanc">
    <tr><td>${echapper(C.transporteur)} :</td><td>${echapper(C.numeroTransporteur)} :</td><td>${echapper(C.vehicule)} :</td></tr>
    <tr><td colspan="2">${echapper(C.chargement)} : <span class="valeur">${echapper(formatDateFR(d.date))}</span></td><td>${echapper(C.dechargement)} :</td></tr>
  </table>
  <table style="margin-top:2mm"><tr>
    ${bloc(C.depart, choixDepart, d.depart)}
    ${bloc(C.arrivee, choixArrivee, d.arrivee)}
  </tr></table>
  <h2>${echapper(C.aCompleter)}</h2>
  <table><tr>${lignesBoucherie}</tr></table>
  <div style="margin:1.5mm 0; font-weight:700">${echapper(C.titreBoucherie)}</div>
  <div style="font-weight:700; margin-top:2mm">${echapper(C.titreReproducteurs)}</div>
  <table class="numeros">${lignesIndividuels}</table>
  <table class="signature" style="margin-top:3mm"><tr>
    <td style="width:60%">${echapper(C.attestation)}<br><br>${echapper(C.dateSignature)}</td>
    <td>${echapper(C.detenteurArrivee)}<br><br>${echapper(C.dateSignature)}</td>
  </tr></table>
  <div class="rappel">
    <h3>${echapper(C.rappelTitre)}</h3>
    ${FEUILLETS_CIRCULATION.map((f) => `<div class="ligne"><span class="puce" style="background:${f.couleur}"></span>${echapper(f.libelle)}</div>`).join('')}
    <div class="note">${echapper(C.rappelNote)}</div>
  </div>
</body>
</html>`;
}

/** Crée le document de circulation (exemple) d'une vente d'animaux et l'ouvre à l'envoi ou à l'impression ; rien (faux) sans animal. */
export async function exporterDocumentCirculationPdf(venteId: string): Promise<boolean> {
  const vente = await getVente(venteId);
  if (!vente) return false;
  const animaux = (await Promise.all(idsDesAnimaux(vente).map(getChevre))).filter((a): a is Chevre => !!a);
  if (animaux.length === 0) return false;
  const [clients, settings] = await Promise.all([listClients(), getSettings()]);
  const client = clients.find((c) => nomComplet(c) === vente.client?.trim());
  const html = documentCirculationHtml(
    donneesDeCirculation({ vente, animaux, client, infos: settings.exploitation, petit: (a) => estPetitLe(a, vente.date) }),
  );
  await ecrireEtPartagerPdf(html, `${C.fichier}_${vente.date}.${FORMAT_EXPORT.PDF}`, C.titre);
  return true;
}
