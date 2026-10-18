import { lireBibliotheque } from '@/features/bibliotheque/repository';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import type { Controle } from '@/features/exploitation/types';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { getSettings, piecesDeLaDeclaration } from '@/features/settings/settings';
import { lireArchiveTrading } from '@/features/trading/repository';
import { listDocumentsIdentification } from '@/features/identification/repository';

/** Tous les fichiers joints de l'établissement : ceux des contenus des dossiers et les captures des trades, les analyses du contrôle laitier, les visites vétérinaires, les documents d'identification et les déclarations jointes au bilan annuel. */
export async function toutesLesPieces(): Promise<PieceJointe[]> {
  const [dossiers, trading, controles, visites, traitements, settings, identification, bibliotheque, ventes, factures] = await Promise.all([
    lireArchiveDossiers(),
    lireArchiveTrading(),
    loadAllYears(CATEGORIE_STOCKAGE.CONTROLES) as Promise<Controle[]>,
    loadAllYears(CATEGORIE_STOCKAGE.VISITES_VETERINAIRE),
    loadAllYears(CATEGORIE_STOCKAGE.TRAITEMENTS),
    getSettings(),
    listDocumentsIdentification(),
    lireBibliotheque(),
    loadAllYears(CATEGORIE_STOCKAGE.VENTES),
    loadAllYears(CATEGORIE_STOCKAGE.FACTURES),
  ]);
  return [
    ...bibliotheque.map((d) => d.piece),
    // Les documents de circulation déposés avec les ventes et les dépenses d'animaux vivants.
    ...[...ventes, ...factures].flatMap((e) => (e.documentCirculation ? [e.documentCirculation.piece] : [])),
    ...identification.flatMap((d) => d.fichiers ?? []),
    ...dossiers.elements.flatMap((e) => e.fichiers ?? []),
    ...trading.trades.flatMap((t) => t.captures ?? []),
    ...visites.flatMap((v) => v.fichiers ?? []),
    ...traitements.flatMap((t) => t.fichiers ?? []),
    ...Object.values(settings.exploitation?.declarationsChambre ?? {}).flatMap(piecesDeLaDeclaration),
    ...controles.flatMap((c) => [
      ...(c.fichiers ?? []),
      ...(c.contenus ?? []).flatMap((contenu) => contenu.fichiers ?? []),
    ]),
  ];
}
