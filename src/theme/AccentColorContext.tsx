import { createContext, useContext, type ReactNode } from 'react';
import { colors } from './colors';

const AccentColorContext = createContext<string>(colors.primary);
const AccentSoftColorContext = createContext<string>(colors.badgeBg);

/** Fait passer boutons, liens et icônes d'un écran en bleu tant qu'on est dans un flux d'ajout. */
export function AccentColorProvider({
  color,
  softColor,
  children,
}: {
  color: string;
  /** Fond des boutons secondaires (ex: Annuler) — teinte claire assortie à `color`. */
  softColor?: string;
  children: ReactNode;
}) {
  return (
    <AccentColorContext.Provider value={color}>
      <AccentSoftColorContext.Provider value={softColor ?? colors.badgeBg}>
        {children}
      </AccentSoftColorContext.Provider>
    </AccentColorContext.Provider>
  );
}

/** Couleur d'accent à utiliser pour les boutons/liens/icônes — bleue dans un écran d'ajout, verte sinon. */
export function useAccentColor(): string {
  return useContext(AccentColorContext);
}

/** Teinte claire (fond des boutons secondaires) assortie à la couleur d'accent courante. */
export function useAccentSoftColor(): string {
  return useContext(AccentSoftColorContext);
}
