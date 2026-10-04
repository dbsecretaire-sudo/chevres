import { tauxImpositionAide } from '@/features/comptabilite/utils/planComptable';
import { LABEL_TYPE_AIDE } from '@/shared/textes/libelles';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import type { TypeAide } from '@/features/comptabilite/types';
import { TOUTES_ACTIVITES, type FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { correspondAuFiltre } from '@/features/comptabilite/services/detailComptable';
import { activiteFacture, activiteVente } from '@/features/comptabilite/utils/activite';
import { TYPE_AIDE, TYPE_FACTURE, CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';

// Agrégats calculés à partir des ventes et factures déjà enregistrées (micro-BA, déclaration RSA).
// Ces calculs organisent vos propres montants, ils ne remplacent pas une confirmation avec votre
// comptable, la MSA ou la CAF.

export interface AideParType {
  type: TypeAide;
  /** Libellé précis à afficher (utilise le texte libre pour les types "autre" distincts). */
  libelle: string;
  imposable: number;
  nonImposable: number;
}

export interface RecettesMicroBA {
  annee: number;
  ventesProduits: number; // lait + fromage + cabris (Vente + Facture émise catégorisée)
  aidesParType: AideParType[];
  aidesImposables: number;
  aidesNonImposables: number;
  autresRecettesImposables: number;
  totalImposable: number;
}

/**
 * Total des recettes brutes de l'année, pertinent pour le régime micro-BA
 * (recettes encaissées, hors aides explicitement marquées non imposables).
 * Les aides sont ventilées par type car leur caractère imposable peut différer
 * de l'une à l'autre.
 */
export async function calculerRecettesMicroBA(
  annee: number,
  /** Activité dont on veut les recettes : un cheptel, « commun », ou tout (par défaut, pour la déclaration). */
  filtre: FiltreActivite = TOUTES_ACTIVITES,
): Promise<RecettesMicroBA> {
  const [toutesVentes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  const ventes = toutesVentes.filter((v) => correspondAuFiltre(filtre, activiteVente(v)));

  const ventesProduits = ventes.reduce((s, v) => s + (v.prix ?? 0), 0);
  const emises = factures.filter(
    (f) => f.type === TYPE_FACTURE.EMISE && correspondAuFiltre(filtre, activiteFacture(f)),
  );

  const aides = emises.filter((f) => f.categorieRecette === CATEGORIE_RECETTE.AIDE);
  const parType = new Map<string, AideParType>();
  for (const f of aides) {
    const type = f.typeAide ?? TYPE_AIDE.AUTRE;
    // Pour "autre", chaque libellé libre différent reste une ligne distincte (ex: GNR vs gros
    // rouleurs) plutôt que d'être fusionné dans un seul bloc "Autre aide".
    const libelle = type === TYPE_AIDE.AUTRE && f.typeAideLibre ? f.typeAideLibre : LABEL_TYPE_AIDE[type];
    const cle = type === TYPE_AIDE.AUTRE ? `autre:${libelle}` : type;
    const taux = tauxImpositionAide(type, f.tauxImposition);
    const montantImposable = (f.montant * taux) / 100;
    const entree = parType.get(cle) ?? { type, libelle, imposable: 0, nonImposable: 0 };
    entree.imposable += montantImposable;
    entree.nonImposable += f.montant - montantImposable;
    parType.set(cle, entree);
  }
  const aidesParType = Array.from(parType.values());
  const aidesImposables = aidesParType.reduce((s, a) => s + a.imposable, 0);
  const aidesNonImposables = aidesParType.reduce((s, a) => s + a.nonImposable, 0);

  const autresRecettesImposables = emises
    .filter((f) => f.categorieRecette !== CATEGORIE_RECETTE.AIDE && f.imposable !== false)
    .reduce((s, f) => s + f.montant, 0);

  return {
    annee,
    ventesProduits,
    aidesParType,
    aidesImposables,
    aidesNonImposables,
    autresRecettesImposables,
    totalImposable: ventesProduits + aidesImposables + autresRecettesImposables,
  };
}

export interface RecettesMois {
  mois: number; // 1-12
  ventesProduits: number;
  facturesEmises: number;
  aides: number;
  total: number;
}

/** Ventilation mois par mois des recettes de l'année (utile pour la déclaration trimestrielle RSA). */
export async function calculerRecettesMensuelles(
  annee: number,
  /** Activité dont on veut les recettes : un cheptel, « commun », ou tout (par défaut, pour la déclaration). */
  filtre: FiltreActivite = TOUTES_ACTIVITES,
): Promise<RecettesMois[]> {
  const [toutesVentes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  const ventes = toutesVentes.filter((v) => correspondAuFiltre(filtre, activiteVente(v)));
  const emises = factures.filter(
    (f) => f.type === TYPE_FACTURE.EMISE && correspondAuFiltre(filtre, activiteFacture(f)),
  );

  const mois: RecettesMois[] = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    ventesProduits: 0,
    facturesEmises: 0,
    aides: 0,
    total: 0,
  }));

  for (const v of ventes) {
    const m = Number(v.date.slice(5, 7)) - 1;
    if (m >= 0 && m < 12) mois[m].ventesProduits += v.prix ?? 0;
  }
  for (const f of emises) {
    const m = Number(f.date.slice(5, 7)) - 1;
    if (m < 0 || m >= 12) continue;
    if (f.categorieRecette === CATEGORIE_RECETTE.AIDE) mois[m].aides += f.montant;
    else mois[m].facturesEmises += f.montant;
  }
  for (const m of mois) {
    m.total = m.ventesProduits + m.facturesEmises + m.aides;
  }

  return mois;
}
