import type { DocumentGdsDepose, ReglagesGds } from '@/features/settings/settings';

/** Les documents d'une rubrique, dans l'ordre où ils ont été déposés (une ancienne sauvegarde n'en gardait qu'un). */
export function documentsGds(gds: ReglagesGds | undefined, rubrique: string): DocumentGdsDepose[] {
  const valeur = gds?.documents?.[rubrique];
  return !valeur ? [] : Array.isArray(valeur) ? valeur : [valeur];
}

const avec = (gds: ReglagesGds | undefined, rubrique: string, documents: DocumentGdsDepose[]): ReglagesGds => {
  const suivants = { ...(gds?.documents ?? {}) };
  if (documents.length > 0) suivants[rubrique] = documents;
  else delete suivants[rubrique];
  return { ...gds, documents: suivants };
};

/** Ajoute un document à une rubrique : les autres restent. */
export const ajouterUnDocumentGds = (gds: ReglagesGds | undefined, rubrique: string, document: DocumentGdsDepose): ReglagesGds =>
  avec(gds, rubrique, [...documentsGds(gds, rubrique), document]);

/** Remplace un document (celui dont la pièce a cet identifiant) par un autre, à la même place. */
export const remplacerUnDocumentGds = (
  gds: ReglagesGds | undefined,
  rubrique: string,
  idPiece: string,
  document: DocumentGdsDepose,
): ReglagesGds =>
  avec(
    gds,
    rubrique,
    documentsGds(gds, rubrique).map((d) => (d.piece.id === idPiece ? document : d)),
  );

/** Rattache un document (celui dont la pièce a cet identifiant) à une visite du vétérinaire, ou le détache (visite vide). */
export const lierUnDocumentGds = (gds: ReglagesGds | undefined, rubrique: string, idPiece: string, visiteId: string): ReglagesGds =>
  avec(
    gds,
    rubrique,
    documentsGds(gds, rubrique).map((d) => {
      if (d.piece.id !== idPiece) return d;
      const { visiteId: _ancienne, ...reste } = d;
      return visiteId ? { ...reste, visiteId } : reste;
    }),
  );

/** Retire un document (celui dont la pièce a cet identifiant) ; la rubrique sans document n'a plus d'entrée. */
export const retirerUnDocumentGds = (gds: ReglagesGds | undefined, rubrique: string, idPiece: string): ReglagesGds =>
  avec(
    gds,
    rubrique,
    documentsGds(gds, rubrique).filter((d) => d.piece.id !== idPiece),
  );
