import type { ReactNode } from 'react';

/** Où est un bouton à l'écran, au moment de l'appui (de quoi ouvrir ses bulles autour de lui). */
export interface AncreBouton {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** Un bouton de la scène (une maison, un compartiment) : son dessin, son nom, et ce qui le distingue (une pastille de nombre, sa couleur). */
export interface EntreeDeColonne {
  cle: string;
  icone: ReactNode;
  titre: string;
  /** Un nombre en pastille ronde sur le bouton (les lots à facturer, les rappels à valider). */
  pastille?: number;
  /** La couleur du bouton, et des bulles qui en sortent. */
  couleur?: string;
}
