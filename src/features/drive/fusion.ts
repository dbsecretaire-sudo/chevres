/**
 * La fusion de deux jeux de données qui ont vécu chacun de leur côté (deux appareils branchés sur le même Drive, qui ont travaillé sans se synchroniser) : rien de ce
 * que l'un a saisi ne se perd. Les listes d'éléments à identifiant (écritures, animaux, mouvements de stock…) s'additionnent ; un même élément modifié des deux côtés
 * garde ce que chacun a de plus (un champ que l'un n'a pas rempli vient de l'autre) ; sur une valeur différente, c'est celle de l'appareil qui fusionne qui reste.
 * Une suppression faite d'un seul côté ne se propage pas : l'élément supprimé revient, puisqu'on ne peut pas savoir s'il a été supprimé ou jamais reçu.
 */

/** Ce que la fusion a trouvé : des éléments venus de l'autre appareil, et des valeurs différentes des deux côtés (celle de l'appareil local est gardée). */
export interface RapportFusion {
  ajoutes: number;
  conflits: number;
}

const vide = (valeur: unknown): boolean => valeur === undefined || valeur === null || valeur === '';
const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  !!valeur && typeof valeur === 'object' && !Array.isArray(valeur);
const avecIdentifiant = (valeur: unknown): valeur is Record<string, unknown> & { id: string } =>
  estObjet(valeur) && typeof valeur.id === 'string';

/** Les éléments de deux listes réunis : par identifiant quand ils en ont un (un élément des deux côtés est lui-même fusionné), sinon sans doublon. */
function fusionnerListes(local: unknown[], distant: unknown[], rapport: RapportFusion): unknown[] {
  const distantsParId = new Map(distant.filter(avecIdentifiant).map((d) => [d.id, d]));
  const idsLocaux = new Set(local.filter(avecIdentifiant).map((l) => l.id));
  const dejaLa = new Set(local.map((l) => JSON.stringify(l)));
  const resultat = local.map((l) => {
    const autre = avecIdentifiant(l) ? distantsParId.get(l.id) : undefined;
    return autre ? fusionner(l, autre, rapport) : l;
  });
  for (const d of distant) {
    const nouveau = avecIdentifiant(d) ? !idsLocaux.has(d.id) : !dejaLa.has(JSON.stringify(d));
    if (!nouveau) continue;
    resultat.push(d);
    rapport.ajoutes += 1;
  }
  return resultat;
}

/** La fusion de deux valeurs : listes réunies, objets fusionnés champ par champ, valeur simple différente → celle du local. */
export function fusionner(local: unknown, distant: unknown, rapport: RapportFusion = { ajoutes: 0, conflits: 0 }): unknown {
  if (vide(distant)) return local;
  if (vide(local)) return distant;
  if (Array.isArray(local) && Array.isArray(distant)) return fusionnerListes(local, distant, rapport);
  if (estObjet(local) && estObjet(distant)) {
    const resultat: Record<string, unknown> = {};
    for (const [cle, valeur] of Object.entries(local)) {
      resultat[cle] = cle in distant ? fusionner(valeur, distant[cle], rapport) : valeur;
    }
    for (const [cle, valeur] of Object.entries(distant)) {
      if (!(cle in local) && !vide(valeur)) resultat[cle] = valeur;
    }
    return resultat;
  }
  if (local !== distant) rapport.conflits += 1;
  return local;
}
