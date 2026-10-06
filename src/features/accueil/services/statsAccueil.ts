import type { Chevre } from '@/features/cheptel/types';
import type { Facture, Vente } from '@/features/comptabilite/types';
import type { VisiteVeterinaire } from '@/features/exploitation/types';
import type { BilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { categorieAnimal, type CategorieAnimal } from '@/features/cheptel/utils/chevreLabel';
import { activiteVente, partsDeFacture } from '@/features/comptabilite/utils/activite';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { CATEGORIE_ANIMAL, SEXE } from '@/shared/constants/cheptel';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';

export interface StatsAccueil {
  totalVivantes: number;
  chevres: number;
  boucs: number;
  cabrits: number;
  cabritsAnnee: number;
  ventesTotal: number;
  soldeFactures: number;
  kgParAnimalAlimentation?: number;
  gParAnimalParJour: number | undefined;
  derniereVisite?: string;
}

/** Petit = moins que l’âge limite OU pas encore bouclé (même si plus âgé) ; sinon femelle/mâle adulte selon le sexe. */
export function categorieAccueil(c: Chevre): CategorieAnimal {
  if (!c.numeroBoucle || categorieAnimal(c) === CATEGORIE_ANIMAL.CABRIT) return CATEGORIE_ANIMAL.CABRIT;
  return c.sexe === SEXE.MALE ? CATEGORIE_ANIMAL.BOUC : CATEGORIE_ANIMAL.CHEVRE;
}

interface Sources {
  annee: number;
  vivantes: Chevre[];
  ventes: Vente[];
  factures: Facture[];
  visites: VisiteVeterinaire[];
  alimentation: BilanAlimentation;
}

/**
 * Statistiques de l'Accueil pour l'activité (espèce) active : effectifs, alimentation, visites, et solde des
 * ventes et factures de cette activité (les écritures « commun » n'y sont pas, voir l'écran Comptabilité).
 */
export function calculerStatsAccueil({
  annee,
  vivantes,
  ventes: toutesVentes,
  factures: toutesFactures,
  visites,
  alimentation,
}: Sources): StatsAccueil {
  const espece = especeCourante();
  const ventes = toutesVentes.filter((v) => activiteVente(v) === espece);
  const factures = toutesFactures
    .flatMap(partsDeFacture)
    .filter((p) => p.activite === espece)
    .map((p) => p.facture);

  const nombre = (categorie: CategorieAnimal) =>
    vivantes.filter((c) => categorieAccueil(c) === categorie).length;

  const cabritsAnnee = vivantes.filter(
    (c) => c.mereNumeroBoucle && c.dateNaissance.startsWith(String(annee)),
  ).length;

  const ventesTotal = ventes.reduce((sum, v) => sum + (v.prix ?? 0), 0);

  // « Autre » n'est pas représentatif de la santé financière de l'activité : exclu du solde, y
  // compris la part « Autre » à l'intérieur d'une facture Alimentation regroupant plusieurs lignes.
  const totalFactures = (type: Facture['type']) =>
    factures.filter((f) => f.type === type).reduce((sum, f) => sum + f.montant, 0);

  return {
    totalVivantes: vivantes.length,
    chevres: nombre(CATEGORIE_ANIMAL.CHEVRE),
    boucs: nombre(CATEGORIE_ANIMAL.BOUC),
    cabrits: nombre(CATEGORIE_ANIMAL.CABRIT),
    cabritsAnnee,
    ventesTotal,
    soldeFactures: ventesTotal + totalFactures(TYPE_FACTURE.EMISE) - totalFactures(TYPE_FACTURE.RECUE),
    kgParAnimalAlimentation: alimentation.kgParAnimal,
    gParAnimalParJour: alimentation.gParAnimalParJour,
    derniereVisite: visites[0]?.date,
  };
}
