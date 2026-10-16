import { getSettings } from '@/features/settings/settings';
import {
  cartesHtml,
  documentHtml,
  ecrireEtPartagerPdf,
  histogrammeHtml,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import type { CalculAmortissement } from '@/features/comptabilite/services/amortissement';
import type { Repartition } from '@/features/comptabilite/services/repartitionLait';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_SIMULATION_LAIT } from '@/shared/constants/export';
import { LOCALE } from '@/shared/constants/format';
import { CLE_FROMAGE_BROCCIU } from '@/shared/constants/lait';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const P = TEXTES.export.pdf.simulationLait;
const R = TEXTES.comptabilite.rentabilite.plan.repartition;

const nombre = (valeur: number, decimales = 0): string =>
  valeur.toLocaleString(LOCALE, { maximumFractionDigits: decimales });
const pourcent = (part: number, decimales = 2): string => `${nombre(part * 100, decimales)} %`;

/**
 * La simulation du lait en fromage en PDF : les chiffres clés, un histogramme du net de chaque part, le tableau de répartition (parts,
 * litres, nombre de fromages, recette, emballages, net), puis le résultat final — les recettes nettes moins les charges du lait et, si
 * l'utilisateur l'inclut, l'amortissement de la fromagerie.
 */
export async function exporterSimulationLaitPdf(entree: {
  annee: number;
  /** Le lait de l'année (litres). */
  litres: number;
  repartition: Repartition;
  prixLait?: number;
  /** Les charges de l'année (toutes, comme le coût du litre) : elles se retranchent des recettes pour le résultat final. */
  charges?: number;
  /** L'amortissement de la fromagerie, quand l'utilisateur l'inclut : il figure au PDF et se retranche du résultat. */
  amortissement?: CalculAmortissement;
  /** Les recettes de l'agritourisme de l'année, quand l'utilisateur les ajoute au résultat final. */
  agritourisme?: number;
}): Promise<void> {
  const { annee, litres, repartition: r, prixLait, charges, amortissement, agritourisme } = entree;
  const settings = await getSettings();
  const F = P.resultatFinal;
  const amortissementAnnuel = amortissement?.inclure ? amortissement.annuel : 0;
  const resultatFinal = r.total.net + (agritourisme ?? 0) - (charges ?? 0) - amortissementAnnuel;
  const ecart = r.total.net - r.toutVendu;
  const prixDevenu = r.total.litres > 0 ? r.total.net / r.total.litres : 0;
  const brocciu = r.lignes.find((l) => l.cle === CLE_FROMAGE_BROCCIU);

  const cartes = cartesHtml([
    {
      libelle: P.cartes.lait,
      valeur: `${nombre(litres)} L`,
      detail: P.cartes.laitDetail(formatMontant(r.toutVendu)),
    },
    {
      libelle: P.cartes.resultat,
      valeur: formatMontant(r.total.net),
      detail: ecart >= 0 ? P.cartes.plus(formatMontant(ecart)) : P.cartes.moins(formatMontant(-ecart)),
    },
    {
      libelle: P.cartes.prix,
      valeur: P.cartes.leLitre(formatMontant(prixDevenu)),
      detail: prixLait !== undefined ? P.cartes.contre(formatMontant(prixLait)) : undefined,
    },
    ...(charges !== undefined
      ? [
          {
            libelle: F.final,
            valeur: formatMontant(resultatFinal),
            detail: F.detail(
              formatMontant(charges),
              amortissementAnnuel ? formatMontant(amortissementAnnuel) : undefined,
            ),
          },
        ]
      : []),
    ...(r.brocciu?.actif && brocciu
      ? [
          {
            libelle: P.cartes.brocciu,
            valeur: P.cartes.pots(nombre(brocciu.nombre, 0)),
            detail: P.cartes.brocciuDetail(
              nombre(r.brocciu.petitLaitUtilise, 1),
              nombre(r.brocciu.selGrammes, 0),
            ),
          },
        ]
      : []),
  ]);

  const tourisme = agritourisme && agritourisme > 0 ? agritourisme : 0;
  const histogramme = histogrammeHtml([
    {
      libelle: R.laitVendu,
      valeur: r.vendu.recette,
      texte: formatMontant(r.vendu.recette),
      detail: pourcent(r.vendu.part, 1),
      pleine: true,
    },
    ...r.lignes.map((l) => ({
      libelle: l.libelle,
      valeur: l.net,
      texte: formatMontant(l.net),
      detail: pourcent(l.part, 1),
    })),
    ...(tourisme
      ? [{ libelle: R.tourisme, valeur: tourisme, texte: formatMontant(tourisme), detail: '' }]
      : []),
  ]);

  const lignesRepartition = [
    ...r.lignes.map((l) => ({
      [R.colonnes.type]: l.libelle,
      [R.colonnes.part]: pourcent(l.part),
      [R.colonnes.lait]: `${nombre(l.litres, 1)} L`,
      [R.colonnes.nombre]: nombre(l.nombre, 1),
      [R.colonnes.recette]: formatMontant(l.recette),
      [R.colonnes.emballages]: formatMontant(-l.emballages),
      [R.colonnes.net]: formatMontant(l.net),
    })),
    ...(tourisme
      ? [
          {
            [R.colonnes.type]: R.tourisme,
            [R.colonnes.part]: '—',
            [R.colonnes.lait]: '—',
            [R.colonnes.nombre]: '—',
            [R.colonnes.recette]: formatMontant(tourisme),
            [R.colonnes.emballages]: '—',
            [R.colonnes.net]: formatMontant(tourisme),
          },
        ]
      : []),
    {
      [R.colonnes.type]: R.laitVendu,
      [R.colonnes.part]: pourcent(r.vendu.part),
      [R.colonnes.lait]: `${nombre(r.vendu.litres, 1)} L`,
      [R.colonnes.nombre]: '—',
      [R.colonnes.recette]: formatMontant(r.vendu.recette),
      [R.colonnes.emballages]: '—',
      [R.colonnes.net]: formatMontant(r.vendu.recette),
    },
    {
      [R.colonnes.type]: R.total,
      [R.colonnes.part]: pourcent(r.total.part),
      [R.colonnes.lait]: `${nombre(r.total.litres, 1)} L`,
      [R.colonnes.nombre]: nombre(r.total.nombre, 1),
      [R.colonnes.recette]: formatMontant(r.total.recette + tourisme),
      [R.colonnes.emballages]: formatMontant(-r.total.emballages),
      [R.colonnes.net]: formatMontant(r.total.net + tourisme),
    },
  ];

  const sections = [
    sectionHtml(P.sections.resume, cartes + histogramme),
    sectionHtml(
      tourisme ? P.sections.repartitionTourisme : P.sections.repartition,
      [
        tableauHtml(lignesRepartition, '', { totaux: true }),
        noteHtml(
          ecart >= 0
            ? R.compare.plus(formatMontant(ecart), formatMontant(prixDevenu))
            : R.compare.moins(formatMontant(-ecart), formatMontant(prixDevenu)),
        ),
        noteHtml(R.aideEmballages),
      ].join(''),
    ),
  ];

  // Le résultat final : les recettes nettes, moins les charges du lait et l'amortissement de la fromagerie quand il est inclus.
  if (charges !== undefined) {
    sections.push(
      sectionHtml(
        P.sections.resultat,
        [
          tableauHtml(
            [
              {
                [F.poste]: tourisme ? F.recettesAvecTourisme : F.recettes,
                [F.montant]: formatMontant(r.total.net + tourisme),
              },
              { [F.poste]: F.charges, [F.montant]: formatMontant(-charges) },
              ...(amortissementAnnuel
                ? [{ [F.poste]: F.amortissement, [F.montant]: formatMontant(-amortissementAnnuel) }]
                : []),
              { [F.poste]: F.final, [F.montant]: formatMontant(resultatFinal) },
            ],
            '',
            { totaux: true },
          ),
          noteHtml(F.note),
        ].join(''),
      ),
    );
  }

  // L'amortissement de la fromagerie, quand l'utilisateur l'a inclus : le détail de ses éléments.
  if (amortissement?.inclure) {
    const A = P.amortissement;
    sections.push(
      sectionHtml(
        P.sections.amortissement,
        [
          tableauHtml(
            [
              ...amortissement.lignes.map((l) => ({
                [A.element]: l.libelle || A.fromagerie,
                [A.montant]: formatMontant(l.montant),
                [A.duree]: A.ans(l.duree),
                [A.parAn]: formatMontant(l.annuel),
              })),
              {
                [A.element]: R.total,
                [A.montant]: formatMontant(amortissement.total),
                [A.duree]: '',
                [A.parAn]: formatMontant(amortissement.annuel),
              },
            ],
            '',
            { totaux: true },
          ),
          noteHtml(TEXTES.comptabilite.rentabilite.plan.amortissement.aide),
        ].join(''),
      ),
    );
  }

  await ecrireEtPartagerPdf(
    documentHtml(P.titre, settings.exploitation, sections.join(''), especesActives(), undefined, {
      sousTitre: P.sousTitre(annee),
    }),
    `${NOM_FICHIER_EXPORT_SIMULATION_LAIT}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
