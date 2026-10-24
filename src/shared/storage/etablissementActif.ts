import { ID_ETABLISSEMENT_DEFAUT, PREFIXE_STOCKAGE, SEGMENT_ETABLISSEMENT, SEPARATEUR_CLE } from '@/shared/constants/stockage';

/**
 * L'établissement actif et les clés de stockage qui en dépendent : chaque établissement a ses propres données, rangées sous un préfixe.
 * Ce module est la base du stockage (il ne dépend d'aucune fonctionnalité) ; la liste des établissements et leur choix sont dans la fonctionnalité `etablissements`.
 */
let idActif = ID_ETABLISSEMENT_DEFAUT;

function prefixePour(id: string): string {
  return id === ID_ETABLISSEMENT_DEFAUT
    ? PREFIXE_STOCKAGE
    : `${PREFIXE_STOCKAGE}${SEGMENT_ETABLISSEMENT}${SEPARATEUR_CLE}${id}${SEPARATEUR_CLE}`;
}

/** Le préfixe de toutes les clés d'un établissement (pour retrouver ou effacer ses données). */
export const prefixeDeStockage = prefixePour;

/** Clé AsyncStorage d'une donnée propre à un établissement donné (pour lire les données d'un autre établissement). */
export function cleStockagePour(etablissementId: string, suffixe: string): string {
  return `${prefixePour(etablissementId)}${suffixe}`;
}

/** Clé AsyncStorage d'une donnée propre à l'établissement actif. */
export function cleStockage(suffixe: string): string {
  return cleStockagePour(idActif, suffixe);
}

export function getIdEtablissementActif(): string {
  return idActif;
}

/** Fixe l'établissement actif : toutes les lectures et écritures suivantes portent sur ses données. */
export function definirEtablissementActif(id: string): void {
  idActif = id;
}
