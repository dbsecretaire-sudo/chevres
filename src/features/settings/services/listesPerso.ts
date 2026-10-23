/**
 * Les listes de choix personnalisables (« Assurance de », « Catégorie de dépense ») : les choix d'office de l'application, auxquels l'utilisateur ajoute les siens, qu'il
 * renomme ou qu'il masque. Ce module ne contient que la logique (sans écran) : il se teste seul.
 */

/** Un choix ajouté par l'utilisateur. Pour une catégorie de dépense, `compte` est le compte du plan comptable qui reçoit ses écritures. */
export interface ChoixAjoute {
  id: string;
  nom: string;
  compte?: string;
}

/** Ce que l'utilisateur a changé dans une liste. */
export interface ListePerso {
  ajoutes?: ChoixAjoute[];
  /** Le nouveau nom d'un choix d'office (par son identifiant). */
  renommes?: Record<string, string>;
  /** Les choix d'office qu'il ne veut plus voir proposés. */
  masques?: string[];
}

/** Un choix tel que l'écran le propose. */
export interface Choix {
  id: string;
  nom: string;
  /** Vrai pour un choix ajouté par l'utilisateur. */
  perso: boolean;
  compte?: string;
}

/** L'identifiant d'un choix ajouté : son nom, précédé d'un repère (il reste lisible si une liste ne le connaît pas). */
export const PREFIXE_CHOIX_AJOUTE = 'perso:';

/**
 * Les choix proposés : ceux d'office (renommés, sauf ceux masqués), puis ceux de l'utilisateur. Un choix masqué reste proposé s'il est celui déjà choisi
 * (`gardes`) : une écriture ancienne ne perd pas son choix.
 */
export function choixProposes(
  base: readonly { id: string; nom: string }[],
  perso: ListePerso | undefined,
  gardes: readonly string[] = [],
): Choix[] {
  const masques = new Set(perso?.masques ?? []);
  const deLApplication = base
    .filter((b) => !masques.has(b.id) || gardes.includes(b.id))
    .map((b) => ({ id: b.id, nom: perso?.renommes?.[b.id]?.trim() || b.nom, perso: false }));
  // Un choix ajouté se masque comme un choix d'office (la case décochée).
  const ajoutes = (perso?.ajoutes ?? [])
    .filter((a) => !masques.has(a.id) || gardes.includes(a.id))
    .map((a) => ({ id: a.id, nom: a.nom, perso: true, compte: a.compte }));
  return [...deLApplication, ...ajoutes];
}

/** Le nom d'un choix (d'office, renommé ou ajouté) ; à défaut son identifiant, sans le repère des choix ajoutés. */
export function nomDuChoix(id: string, base: readonly { id: string; nom: string }[], perso: ListePerso | undefined): string {
  const ajoute = perso?.ajoutes?.find((a) => a.id === id);
  if (ajoute) return ajoute.nom;
  const nom = perso?.renommes?.[id]?.trim() || base.find((b) => b.id === id)?.nom;
  return nom ?? (id.startsWith(PREFIXE_CHOIX_AJOUTE) ? id.slice(PREFIXE_CHOIX_AJOUTE.length) : id);
}

/** L'identifiant d'un nouveau choix : son nom, sans accent ni espace superflu, avec le repère ; un nom déjà pris reçoit un numéro. */
export function identifiantDuNouveauChoix(nom: string, existants: readonly string[]): string {
  const brut = nom
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const base = `${PREFIXE_CHOIX_AJOUTE}${brut || 'choix'}`;
  if (!existants.includes(base)) return base;
  let n = 2;
  while (existants.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

/** Ajoute un choix ; un nom vide n'ajoute rien. */
export function avecChoixAjoute(perso: ListePerso | undefined, nom: string, compte?: string): ListePerso {
  const propre = nom.trim();
  if (!propre) return perso ?? {};
  const ajoutes = perso?.ajoutes ?? [];
  const id = identifiantDuNouveauChoix(propre, ajoutes.map((a) => a.id));
  return { ...perso, ajoutes: [...ajoutes, { id, nom: propre, compte }] };
}

/** Renomme un choix (d'office ou ajouté) ; un nom vide rend à un choix d'office son nom d'origine. */
export function avecChoixRenomme(perso: ListePerso | undefined, id: string, nom: string): ListePerso {
  const propre = nom.trim();
  if (perso?.ajoutes?.some((a) => a.id === id)) {
    return propre ? { ...perso, ajoutes: perso.ajoutes.map((a) => (a.id === id ? { ...a, nom: propre } : a)) } : (perso ?? {});
  }
  const renommes = { ...(perso?.renommes ?? {}) };
  if (propre) renommes[id] = propre;
  else delete renommes[id];
  return { ...perso, renommes };
}

/** Change le compte d'un choix ajouté (une catégorie de dépense). */
export function avecCompteDuChoix(perso: ListePerso | undefined, id: string, compte: string): ListePerso {
  return { ...perso, ajoutes: (perso?.ajoutes ?? []).map((a) => (a.id === id ? { ...a, compte } : a)) };
}

/** Masque (ou rend de nouveau proposé) un choix, d'office ou ajouté. */
export function avecChoixMasque(perso: ListePerso | undefined, id: string, masque: boolean): ListePerso {
  const autres = (perso?.masques ?? []).filter((m) => m !== id);
  return { ...perso, masques: masque ? [...autres, id] : autres };
}

/** Retire un choix ajouté par l'utilisateur (les écritures déjà faites gardent son nom). */
export function sansChoixAjoute(perso: ListePerso | undefined, id: string): ListePerso {
  return { ...perso, ajoutes: (perso?.ajoutes ?? []).filter((a) => a.id !== id) };
}
