import { createContext, useContext } from 'react';
import { colors } from '@/shared/theme/colors';

/** Le fond des champs de saisie : blanc sur la page, teinté sur une carte (voir SectionForm). */
const FondChampContext = createContext<string>(colors.surface);

export const FondChampProvider = FondChampContext.Provider;

export function useFondChamp(): string {
  return useContext(FondChampContext);
}
