import { lireBibliotheque } from '@/features/bibliotheque/repository';
import { lireArchiveStock } from '@/features/stock/repository';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import type { Controle } from '@/features/exploitation/types';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { getSettings, piecesDeLaDeclaration } from '@/features/settings/settings';
import { listDocumentsIdentification } from '@/features/identification/repository';

/** Tous les fichiers joints de l'exploitation : les images des cartes du stock, les certificats des véhicules, les analyses du contrôle laitier, les visites vétérinaires, les documents d'identification et les déclarations jointes au bilan annuel. */
export async function toutesLesPieces(): Promise<PieceJointe[]> {
  const [controles, visites, traitements, settings, identification, bibliotheque, ventes, factures, stock, commercial] = await Promise.all([
    loadAllYears(CATEGORIE_STOCKAGE.CONTROLES) as Promise<Controle[]>,
    loadAllYears(CATEGORIE_STOCKAGE.VISITES_VETERINAIRE),
    loadAllYears(CATEGORIE_STOCKAGE.TRAITEMENTS),
    getSettings(),
    listDocumentsIdentification(),
    lireBibliotheque(),
    loadAllYears(CATEGORIE_STOCKAGE.VENTES),
    loadAllYears(CATEGORIE_STOCKAGE.FACTURES),
    lireArchiveStock(),
    lireArchiveCommercial(),
  ]);
  return [
    ...bibliotheque.map((d) => d.piece),
    // Les images choisies pour les cartes du stock, et le verso du certificat d'immatriculation de chaque véhicule de la flotte.
    ...Object.values(stock.images ?? {}),
    // Les pièces du dossier réglementaire de chaque savon et celles des démarches d'accueil du public (le cadre réglementaire).
    ...Object.values(stock.dossiersSavons ?? {}).flatMap((d) => Object.values(d.etapes ?? {}).flatMap((e) => e.fichiers ?? [])),
    ...Object.values(commercial.accueilPublic ?? {}).flatMap((e) => e.fichiers ?? []),
    ...(settings.exploitation?.flotte ?? []).flatMap((v) => (v.certificat ? [v.certificat] : [])),
    // Les rapports d'analyse du fromage et de la charcuterie.
    ...(settings.exploitation?.analysesProduits ?? []).flatMap((a) => a.fichiers ?? []),
    // Les documents de circulation déposés avec les ventes et les dépenses d'animaux vivants.
    ...[...ventes, ...factures].flatMap((e) => (e.documentCirculation ? [e.documentCirculation.piece] : [])),
    ...identification.flatMap((d) => d.fichiers ?? []),
    ...visites.flatMap((v) => v.fichiers ?? []),
    ...traitements.flatMap((t) => t.fichiers ?? []),
    // Les fichiers joints à un lot d'abattage, et le document de circulation d'un bon de livraison.
    ...(settings.exploitation?.lots ?? []).flatMap((l) => [...(l.fichiers ?? []), ...(l.documentCirculation ? [l.documentCirculation.piece] : [])]),
    // Le bon de l'équarrisseur de chaque enlèvement, le document de circulation de chaque vente d'animaux vivants, les pièces du cadre réglementaire de l'atelier et les documents du groupement sanitaire (rapports d'essais compris).
    ...(settings.exploitation?.enlevements ?? []).flatMap((e) => e.fichiers ?? []),
    ...(settings.exploitation?.ventesVivants ?? []).flatMap((v) => (v.documentCirculation ? [v.documentCirculation.piece] : [])),
    ...Object.values(settings.exploitation?.cadreAtelier ?? {}).flatMap((e) => e.fichiers ?? []),
    ...Object.values(settings.exploitation?.gds?.documents ?? {}).flatMap((d) => (Array.isArray(d) ? d : [d]).map((x) => x.piece)),
    ...Object.values(settings.exploitation?.declarationsChambre ?? {}).flatMap(piecesDeLaDeclaration),
    ...controles.flatMap((c) => [
      ...(c.fichiers ?? []),
      ...(c.contenus ?? []).flatMap((contenu) => contenu.fichiers ?? []),
    ]),
  ];
}
