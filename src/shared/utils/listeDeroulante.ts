/**
 * Le repère d'une liste déroulante (le panneau d'un choix : SelectModal, SelectModalMultiple, OptionsModal). Sur le web et sous Windows il devient un attribut `data-liste` de la
 * page : le poste de comptabilité (affichage sobre) s'en sert pour poser la liste juste sous le champ qui l'a ouverte, au lieu de la faire flotter au milieu de l'écran
 * (voir StyleComptable). Sur téléphone, il n'a aucun effet.
 */
export const LISTE_DEROULANTE = { dataSet: { liste: 'deroulante' } } as object;

/** Le champ qui ouvre la liste, et la fenêtre où elle s'ouvre (en pixels de l'écran, avant zoom). */
export interface MesuresListe {
  champ: { left: number; top: number; bottom: number; width: number };
  fenetre: { largeur: number; hauteur: number };
  /** Le zoom de la page (1 sans zoom) : les mesures de l'écran sont divisées par lui. */
  zoom?: number;
}

/** Où poser la liste : à la largeur du champ (au moins 260), juste dessous, ou au-dessus quand il n'y a pas la place dessous ; sa hauteur est bornée. */
export interface PositionListe {
  left: number;
  largeur: number;
  maxHeight: number;
  /** Posée sous le champ : sa distance au haut ; sinon (au-dessus), sa distance au bas. */
  top?: number;
  bottom?: number;
}

export const LARGEUR_MINI_LISTE = 260;

export function positionDeLaListe({ champ, fenetre, zoom = 1 }: MesuresListe): PositionListe {
  const z = zoom || 1;
  const c = { left: champ.left / z, top: champ.top / z, bottom: champ.bottom / z, width: champ.width / z };
  const hauteur = fenetre.hauteur / z;
  const largeurFenetre = fenetre.largeur / z;
  const largeur = Math.max(c.width, LARGEUR_MINI_LISTE);
  const dessous = hauteur - c.bottom - 8;
  const auDessus = dessous < 220 && c.top > dessous;
  const maxHeight = Math.max(160, Math.min(420, auDessus ? c.top - 8 : dessous));
  const left = Math.max(8, Math.min(c.left, largeurFenetre - largeur - 8));
  return auDessus ? { left, largeur, maxHeight, bottom: hauteur - c.top + 2 } : { left, largeur, maxHeight, top: c.bottom + 2 };
}
