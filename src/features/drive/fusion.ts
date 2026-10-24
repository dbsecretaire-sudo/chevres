/**
 * La fusion de deux jeux de données qui ont vécu chacun de leur côté (deux appareils branchés sur le même Drive, qui ont travaillé sans se synchroniser) : rien de ce
 * que l'un a saisi ne se perd. Les listes d'éléments à identifiant (écritures, animaux, mouvements de stock…) s'additionnent ; un même élément modifié des deux côtés
 * garde ce que chacun a de plus (un champ que l'un n'a pas rempli vient de l'autre) ; sur une valeur différente, c'est celle de l'appareil qui fusionne qui reste.
 *
 * Avec l'état de la dernière synchronisation (la « base », voir `empreintesDe`), la fusion sait en plus ce qui a changé de chaque côté depuis : un élément supprimé
 * d'un côté et resté tel quel de l'autre est supprimé aussi ; un élément modifié d'un seul côté prend la version modifiée en entier (un article de facture renommé
 * n'est pas ajouté à l'ancien). Sans base (première synchronisation), une suppression faite d'un seul côté ne se propage pas.
 */

/** Ce que la fusion a trouvé : des éléments venus de l'autre appareil, et des valeurs différentes des deux côtés (celle de l'appareil local est gardée). */
export interface RapportFusion {
  ajoutes: number;
  conflits: number;
  /** Les éléments supprimés d'un côté (et inchangés de l'autre) qui l'ont été des deux côtés ; absent tant qu'il n'y en a pas. */
  supprimes?: number;
}

/** L'état d'une donnée à la dernière synchronisation : une empreinte par élément à identifiant (« chemin|identifiant »), et par liste d'objets sans identifiant (« chemin|* »). */
export type Empreintes = Record<string, string>;

const vide = (valeur: unknown): boolean => valeur === undefined || valeur === null || valeur === '';
const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  !!valeur && typeof valeur === 'object' && !Array.isArray(valeur);
const avecIdentifiant = (valeur: unknown): valeur is Record<string, unknown> & { id: string } =>
  estObjet(valeur) && typeof valeur.id === 'string';

/** Une valeur écrite toujours pareil : clés triées, champs vides ignorés, valeurs simples en texte (ce qu'un fichier CSV rend du même élément reste égal à l'original). */
function canonique(valeur: unknown): string {
  if (Array.isArray(valeur)) return `[${valeur.map(canonique).join(',')}]`;
  if (estObjet(valeur)) {
    const champs = Object.keys(valeur)
      .filter((cle) => !vide(valeur[cle]) && valeur[cle] !== false && !(Array.isArray(valeur[cle]) && (valeur[cle] as unknown[]).length === 0))
      .sort();
    return `{${champs.map((cle) => `${JSON.stringify(cle)}:${canonique(valeur[cle])}`).join(',')}}`;
  }
  return JSON.stringify(String(valeur));
}

/** Une empreinte courte d'une valeur (deux valeurs égales ont la même ; la moindre différence en donne une autre). */
function empreinte(valeur: unknown): string {
  const texte = canonique(valeur);
  let h = 5381;
  for (let i = 0; i < texte.length; i += 1) h = ((h * 33) ^ texte.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}.${texte.length.toString(36)}`;
}

/** L'état d'une donnée, à garder après une synchronisation : de quoi savoir, à la suivante, ce qui a été supprimé ou modifié depuis. */
export function empreintesDe(valeur: unknown, chemin = '', sortie: Empreintes = {}): Empreintes {
  if (Array.isArray(valeur)) {
    const objets = valeur.filter(estObjet);
    const identifies = objets.filter(avecIdentifiant);
    for (const element of identifies) sortie[`${chemin}|${element.id}`] = empreinte(element);
    if (objets.length > 0 && identifies.length === 0) sortie[`${chemin}|*`] = empreinte(valeur);
    for (const objet of objets) {
      for (const [cle, champ] of Object.entries(objet)) if (champ && typeof champ === 'object') empreintesDe(champ, `${chemin}.${cle}`, sortie);
    }
  } else if (estObjet(valeur)) {
    for (const [cle, champ] of Object.entries(valeur)) if (champ && typeof champ === 'object') empreintesDe(champ, `${chemin}.${cle}`, sortie);
  }
  return sortie;
}

const compter = (rapport: RapportFusion) => {
  rapport.supprimes = (rapport.supprimes ?? 0) + 1;
};

/** Les éléments de deux listes réunis : par identifiant quand ils en ont un (un élément des deux côtés est lui-même fusionné), sinon sans doublon. */
function fusionnerListes(local: unknown[], distant: unknown[], rapport: RapportFusion, base: Empreintes | undefined, chemin: string): unknown[] {
  // Des objets sans identifiant (les articles d'une facture) : avec la base, c'est la liste du côté qui l'a changée depuis, en entier ; sinon ils s'additionnent.
  const objets = [...local, ...distant].filter(estObjet);
  if (base && objets.length > 0 && !objets.some(avecIdentifiant)) {
    const etatListe = base[`${chemin}|*`];
    if (etatListe !== undefined) {
      if (empreinte(local) === etatListe) return empreinte(distant) !== etatListe ? distant : local;
      if (empreinte(distant) === etatListe) return local;
      rapport.conflits += 1;
      return local;
    }
  }
  const distantsParId = new Map(distant.filter(avecIdentifiant).map((d) => [d.id, d]));
  const idsLocaux = new Set(local.filter(avecIdentifiant).map((l) => l.id));
  const dejaLa = new Set(local.map((l) => JSON.stringify(l)));
  const etatDe = (id: string): string | undefined => base?.[`${chemin}|${id}`];
  const resultat: unknown[] = [];
  for (const l of local) {
    if (!avecIdentifiant(l)) {
      resultat.push(l);
      continue;
    }
    const d = distantsParId.get(l.id);
    const etat = etatDe(l.id);
    if (!d) {
      // Absent de l'autre côté : supprimé là-bas si on ne l'a pas touché depuis la dernière synchronisation.
      if (etat !== undefined && empreinte(l) === etat) compter(rapport);
      else resultat.push(l);
      continue;
    }
    if (etat !== undefined) {
      const distantChange = empreinte(d) !== etat;
      if (!distantChange) {
        resultat.push(l);
        continue;
      }
      if (empreinte(l) === etat) {
        resultat.push(d);
        continue;
      }
    }
    resultat.push(fusionner(l, d, rapport, base, chemin));
  }
  for (const d of distant) {
    if (avecIdentifiant(d)) {
      if (idsLocaux.has(d.id)) continue;
      const etat = etatDe(d.id);
      // Absent d'ici : supprimé ici si l'autre côté ne l'a pas touché depuis la dernière synchronisation.
      if (etat !== undefined && empreinte(d) === etat) {
        compter(rapport);
        continue;
      }
    } else if (dejaLa.has(JSON.stringify(d))) continue;
    resultat.push(d);
    rapport.ajoutes += 1;
  }
  return resultat;
}

/** La fusion de deux valeurs : listes réunies, objets fusionnés champ par champ, valeur simple différente → celle du local. `base` : l'état de la dernière synchronisation. */
export function fusionner(
  local: unknown,
  distant: unknown,
  rapport: RapportFusion = { ajoutes: 0, conflits: 0 },
  base?: Empreintes,
  chemin = '',
): unknown {
  if (vide(distant)) return local;
  if (vide(local)) return distant;
  if (Array.isArray(local) && Array.isArray(distant)) return fusionnerListes(local, distant, rapport, base, chemin);
  if (estObjet(local) && estObjet(distant)) {
    const resultat: Record<string, unknown> = {};
    for (const [cle, valeur] of Object.entries(local)) {
      resultat[cle] = cle in distant ? fusionner(valeur, distant[cle], rapport, base, `${chemin}.${cle}`) : valeur;
    }
    for (const [cle, valeur] of Object.entries(distant)) {
      if (!(cle in local) && !vide(valeur)) resultat[cle] = valeur;
    }
    return resultat;
  }
  if (local !== distant) rapport.conflits += 1;
  return local;
}
