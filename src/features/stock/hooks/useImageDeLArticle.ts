import { useEffect, useSyncExternalStore } from 'react';
import { getIdEtablissementActif } from '@/features/etablissements/repository';
import type { PieceJointe } from '@/features/fichiers/types';
import { lireArchiveStock } from '@/features/stock/repository';

type Images = Record<string, PieceJointe>;

const AUCUNE: Images = {};

/** Les images choisies par l'utilisateur pour les cartes du stock de l'établissement actif : lues une fois, partagées par toutes les cartes. */
let images: Images = AUCUNE;
let etablissement: string | undefined;
let chargement: Promise<void> | null = null;
const ecouteurs = new Set<() => void>();

const charger = (): Promise<void> => {
  chargement ??= lireArchiveStock()
    .then((archive) => {
      images = archive.images && Object.keys(archive.images).length > 0 ? archive.images : AUCUNE;
      etablissement = getIdEtablissementActif();
      ecouteurs.forEach((f) => f());
    })
    .finally(() => {
      chargement = null;
    });
  return chargement;
};

/** Relit les images (après un changement) : les cartes affichées se mettent à jour d'elles-mêmes. */
export const rafraichirImages = (): Promise<void> => charger();

const abonner = (f: () => void) => {
  ecouteurs.add(f);
  return () => {
    ecouteurs.delete(f);
  };
};

/** Les images du stock de l'établissement actif (rien tant que ce sont celles d'un autre établissement). */
const instantane = (): Images => (etablissement === getIdEtablissementActif() ? images : AUCUNE);

/** L'image choisie pour un article (par son identifiant), ou rien : la carte garde alors son dessin d'origine. */
export function useImageDeLArticle(cle?: string): PieceJointe | undefined {
  const toutes = useSyncExternalStore(abonner, instantane, instantane);
  useEffect(() => {
    if (etablissement !== getIdEtablissementActif()) void charger();
  }, []);
  return cle ? toutes[cle] : undefined;
}
