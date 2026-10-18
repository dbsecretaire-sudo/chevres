import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireBibliotheque } from '@/features/bibliotheque/repository';
import type { DocumentGenere } from '@/features/bibliotheque/types';

/** Les documents déjà générés, relus à chaque retour sur l'écran (pour montrer ceux qui existent déjà). */
export function useBibliotheque(): DocumentGenere[] {
  const [documents, setDocuments] = useState<DocumentGenere[]>([]);
  useFocusEffect(
    useCallback(() => {
      lireBibliotheque()
        .then(setDocuments)
        .catch(() => undefined);
    }, []),
  );
  return documents;
}
