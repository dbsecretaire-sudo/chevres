import type { PieceJointe } from '@/features/fichiers/types';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { ETAT_ESPRIT, SENS_TRADE, TYPE_INSTRUMENT } from '@/shared/constants/trading';

export type SensTrade = ValeurDe<typeof SENS_TRADE>;
export type TypeInstrument = ValeurDe<typeof TYPE_INSTRUMENT>;
export type EtatEsprit = ValeurDe<typeof ETAT_ESPRIT>;

/** Un trade : une position ouverte à une date et à un prix, puis (une fois clos) fermée à une autre date et à un autre prix. */
export interface Trade {
  id: string;
  /** Ce qui est négocié : un symbole, une paire, un contrat (« AAPL », « EUR/USD »…). */
  instrument: string;
  typeInstrument?: TypeInstrument;
  sens: SensTrade;
  dateEntree: string;
  prixEntree: number;
  /** Nombre d'unités (actions, lots, contrats…). */
  quantite: number;
  /** Absents tant que le trade est ouvert. */
  dateSortie?: string;
  prixSortie?: number;
  /** Frais et commissions du trade (€), entrée et sortie comprises. */
  frais?: number;
  /** Prix du stop prévu : il fixe le risque pris, d'où le résultat en multiples de ce risque (R). */
  stop?: number;
  /** Prix de l'objectif prévu. */
  objectif?: number;
  /** Le plan ou la stratégie suivie (« cassure », « retour à la moyenne »…). */
  strategie?: string;
  /** Vrai si le trade respectait le plan de trading ; absent si non renseigné. */
  planRespecte?: boolean;
  etatEsprit?: EtatEsprit;
  notes?: string;
  etiquettes?: string[];
  /** La recette (gain) ou la dépense (perte) créée en comptabilité pour ce trade clos (mise à jour avec lui). */
  factureId?: string;
  /** Captures d'écran ou photos du graphique, transformées en PDF (rangées dans l'appareil, envoyées aussi sur Drive). */
  captures?: PieceJointe[];
}

/** Tout le journal d'un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveTrading {
  trades: Trade[];
}
