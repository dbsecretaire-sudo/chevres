import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useFiltreActivite } from '@/features/comptabilite/hooks/useFiltreActivite';
import { rentabilite, type Rentabilite } from '@/features/comptabilite/services/rentabilite';
import {
  construirePlan,
  type AnneePrecedente,
  type PlanEconomies,
} from '@/features/comptabilite/services/pistesEconomie';
import { listControles } from '@/features/exploitation/repository/controles';
import { productionLaitiere } from '@/features/exploitation/services/productionLaitiere';
import { ATELIER, type Atelier } from '@/shared/constants/ateliers';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import type { FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { reglagesTva } from '@/features/comptabilite/utils/reglagesTva';
import { calculerBilan } from '@/features/cheptel/services/bilanCheptel';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { REGIME_TVA_PILOTAGE } from '@/shared/constants/tva';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { cleArticle, conditionnementDe, libelleArticle } from '@/features/stock/services/stock';
import { GRAMMES_PAR_KILO } from '@/shared/constants/format';
import { ALIMENTS_EN_SILO } from '@/shared/constants/economies';
import { reglageInvestissement } from '@/features/settings/settings';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import {
  coutsUnitairesAchats,
  coutsUnitairesEmballages,
  partsReelles,
} from '@/features/comptabilite/services/repartitionLait';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit } from '@/features/stock/services/lots';
import { CLE_PRIX_LAIT, GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import type { InfosExploitation } from '@/features/settings/settings';

interface OptionsPlan {
  annee: number;
  filtre: FiltreActivite;
  horsTaxes: boolean;
  effectif?: number;
  laitier: boolean;
}

/** Ce que l'année d'avant donnait : le coût alimentaire du litre et le lait par chèvre et par traite (rien quand elle n'a pas de lait). */
async function anneePrecedente(options: OptionsPlan): Promise<AnneePrecedente | undefined> {
  const { annee, ...autres } = options;
  const [r, production] = await Promise.all([rentabilite(annee - 1, autres), productionLaitiere(annee - 1)]);
  if (!(r.litresProduits > 0)) return undefined;
  const aliment = r.postes.find((p) => p.categorie === CATEGORIE_DEPENSE.ALIMENTATION)?.montant;
  return {
    coutAlimentParLitre: aliment !== undefined ? aliment / r.litresProduits : undefined,
    litresParChevreParTraite: production.litresParChevreParTraite,
  };
}

/** Le plan d'économies d'une année : les analyses du lait, le lait par traite et ce que l'année d'avant donnait. */
async function construirePlanDeLAnnee(
  r: Rentabilite,
  options: OptionsPlan,
  espece: EspeceAnimale,
  investissements: InfosExploitation['investissementsEconomie'],
): Promise<PlanEconomies> {
  const [controles, production, precedente, stock, alimentation, factures] = await Promise.all([
    listControles(options.annee),
    productionLaitiere(options.annee),
    anneePrecedente(options),
    lireArchiveStock(),
    calculerBilanAlimentation(options.annee),
    listToutesFactures(),
  ]);
  // Les grains achetés (ce que le silo touche) : les aliments de l'espèce qui se stockent en silo.
  const clesGrains = new Set(ALIMENTS_EN_SILO.map((type) => cleArticle(GENRE_ARTICLE.ALIMENT, type)));
  const grains = alimentation.lignes
    .filter((l) => clesGrains.has(l.cle))
    .reduce((t, l) => ({ montant: t.montant + l.montant, quantiteKg: t.quantiteKg + l.quantiteKg }), {
      montant: 0,
      quantiteKg: 0,
    });
  const analyses = controles.filter((c) => c.famille === FAMILLE_CONTROLE.ANALYSE);
  // Les fromages de l'inventaire qui ont un prix de vente et les litres de lait qu'il faut pour les faire.
  const couts = coutsUnitairesEmballages(factures, options.horsTaxes);
  // Le sel : l'article de l'inventaire qui s'appelle « sel », au prix moyen de ses achats (au kilo) ; il entre dans les frais du brocciu.
  const coutsAchats = coutsUnitairesAchats(factures, options.horsTaxes);
  const cleSel = Object.keys(coutsAchats).find((cle) => /^sel\b/i.test(libelleArticle(cle, stock)));
  const coutSelParGramme = cleSel ? coutsAchats[cleSel] / GRAMMES_PAR_KILO : undefined;
  const fromages = articlesDuProduit(PRODUIT_A_LOTS.FROMAGE, stock, espece).flatMap((a) =>
    a.prix && a.prix > 0 && a.litresParFromage && a.litresParFromage > 0
      ? [
          {
            cle: a.cle,
            libelle: a.libelle,
            prix: a.prix,
            litresParFromage: a.litresParFromage,
            // Les emballages d'un fromage vendu : ceux de son conditionnement, au prix moyen de leurs achats.
            coutEmballage: conditionnementDe(a.id ?? a.cle.split(':')[1], stock, options.annee).reduce(
              (t, code) => t + (couts[cleArticle(GENRE_ARTICLE.EMBALLAGE, code)] ?? 0),
              0,
            ),
          },
        ]
      : [],
  );
  return construirePlan({
    rentabilite: r,
    production,
    precedente,
    analyses,
    investissements: Object.fromEntries(
      Object.entries(investissements ?? {}).map(([cle, valeur]) => [cle, reglageInvestissement(valeur)]),
    ),
    grains,
    fromages,
    prixLaitInventaire: stock.prix[CLE_PRIX_LAIT],
    partsReelles: partsReelles(stock.mouvements, r.litresProduits, options.annee),
    coutSelParGramme,
  });
}

/** Les limites que la rentabilité peut prendre (l'adresse : `?perimetre=agritourisme`) : les ateliers qu'elle couvre alors. */
export const PERIMETRES_RENTABILITE = {
  /** L'agritourisme seul (le côté Agritourisme de l'accueil). */
  agritourisme: [ATELIER.AGRITOURISME],
  /** Ce qu'on fabrique : le lait, le fromage, la viande et la charcuterie (le côté Atelier de l'accueil). */
  atelier: [ATELIER.LAIT, ATELIER.FROMAGE, ATELIER.VIANDE],
} as const satisfies Record<string, readonly Atelier[]>;

export type PerimetreRentabilite = keyof typeof PERIMETRES_RENTABILITE;

/** La rentabilité de l'année active et de l'activité choisie, rechargée à chaque retour sur l'écran. */
export function useRentabilite() {
  const { perimetre: demande } = useLocalSearchParams<{ perimetre?: string }>();
  const perimetre: PerimetreRentabilite | undefined =
    demande && demande in PERIMETRES_RENTABILITE ? (demande as PerimetreRentabilite) : undefined;
  const { settings, setAnneeActive } = useAppSettings();
  const { espece, especes } = useEtablissement();
  const [filtre, setFiltre] = useFiltreActivite();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [resultat, setResultat] = useState<Rentabilite | null>(null);
  /** Le plan d'économies (pour une espèce laitière) : d'après les analyses du lait, le lait par traite et l'année d'avant. */
  const [plan, setPlan] = useState<PlanEconomies | null>(null);
  const annee = settings.anneeActive;
  const infos = settings.exploitation;
  const { regime } = reglagesTva(infos);
  const investissementsEconomie = infos?.investissementsEconomie;
  /** Les montants s'entendent hors taxes quand la TVA est déclarée (réel simplifié ou normal). */
  const horsTaxes =
    regime === REGIME_TVA_PILOTAGE.REEL_SIMPLIFIE || regime === REGIME_TVA_PILOTAGE.REEL_NORMAL;

  /** Le lait ne concerne que les espèces laitières (chèvres, brebis, vaches) : pas de coût du litre pour des cochons ou des poules. */
  const laitier = (filtre === TOUTES_ACTIVITES || filtre === ACTIVITE_COMMUNE ? especes : [filtre]).some(
    laiterieActive,
  );

  const charger = useCallback(async () => {
    // Le coût par animal se calcule sur le nombre de femelles (les chèvres, de 6 mois et plus) vivantes au 31/12 de l'espèce
    // active, comme le bilan annuel : avec « Tout » ou « Commun », toutes les charges s'y rapportent ; avec l'activité d'une autre
    // espèce, ce nombre ne la concerne pas.
    const autreEspece = filtre !== TOUTES_ACTIVITES && filtre !== ACTIVITE_COMMUNE && filtre !== espece;
    const effectif = autreEspece ? undefined : (await calculerBilan(annee)).chevresVivantesFinAnnee;
    const [toutesAnnees, r] = await Promise.all([
      toutesLesAnneesConnues(),
      rentabilite(annee, {
        filtre,
        horsTaxes,
        effectif,
        laitier,
        perimetre: perimetre ? PERIMETRES_RENTABILITE[perimetre] : undefined,
      }),
    ]);
    setAnnees(toutesAnnees);
    setResultat(r);
    // Le plan d'économies porte sur toute l'exploitation : il n'a pas de sens limité à des ateliers.
    setPlan(
      laitier && !perimetre
        ? await construirePlanDeLAnnee(
            r,
            { annee, filtre, horsTaxes, effectif, laitier },
            espece,
            investissementsEconomie,
          )
        : null,
    );
  }, [annee, filtre, horsTaxes, espece, laitier, investissementsEconomie, perimetre]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee, annees, setAnneeActive, filtre, setFiltre, resultat, laitier, plan, perimetre };
}
