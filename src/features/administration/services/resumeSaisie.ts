/**
 * Ce que change une saisie d'utilisateur, pour le modérateur. Le résumé (« 1 naissance », « 1 sortie (morte) », « 1 élément ajouté »…) se
 * compare à la fiche telle qu'elle est sur le serveur (« actuel ») ; le détail donne, au clic, toutes les informations de la saisie, en français.
 * Les zones du cheptel ont des phrases propres (naissance, achat, sortie). Les autres listes (un nouveau fromage, par exemple) se
 * résument en éléments ajoutés, modifiés ou supprimés. Une fiche qui n'est pas une liste dit seulement « nouvelle » ou « modifiée ».
 */

/** Le nom d'un statut d'animal quand il sort du troupeau (un statut « vivante » ne sort pas). */
const STATUT_SORTIE: Record<string, string> = {
  morte: 'morte',
  abattoir: 'envoyée à l’abattoir',
  vendue: 'vendue',
  autoconsommee: 'autoconsommée',
  mortne: 'mort-née',
};

/** Les statuts d'un animal, tels qu'on les lit. */
const STATUT_LIBELLE: Record<string, string> = {
  vivante: 'Vivante',
  morte: 'Morte',
  abattoir: 'Envoyée à l’abattoir',
  vendue: 'Vendue',
  autoconsommee: 'Autoconsommée',
  mortne: 'Mort-née',
};

/** Les noms des champs d'une fiche, en français. Un champ absent de cette liste garde un nom lisible (« date Naissance » devient « Date naissance »). */
const LIBELLE_CHAMP: Record<string, string> = {
  espece: 'Espèce',
  sexe: 'Sexe',
  nom: 'Nom',
  numeroBoucle: 'Numéro de boucle',
  dateBouclage: 'Date de pose de la boucle',
  numeroBoucleRouge: 'Boucle rouge',
  dateBoucleRouge: 'Date de la boucle rouge',
  dateRebouclage: 'Date de rebouclage',
  dateEntree: 'Date d’entrée',
  vendeur: 'Vendeur',
  dateNaissance: 'Date de naissance',
  mereNumeroBoucle: 'Boucle de la mère',
  pereNumeroBoucle: 'Boucle du père',
  statut: 'Statut',
  dateStatut: 'Date du statut',
  renouvellement: 'Renouvellement',
  renouvellementAnnee: 'Année de renouvellement',
  poidsKg: 'Poids (kg)',
  aCompleter: 'À compléter',
  notes: 'Notes',
  reservation: 'Réservation',
};

/** Un élément d'une liste : son identifiant, et le reste de la fiche. */
type Element = { id: string } & Record<string, unknown>;

/** Un champ du détail : son nom en français, sa valeur avant (si elle existait) et après la saisie. */
export interface ChampDetail {
  nom: string;
  avant?: string;
  apres?: string;
}

/** Un bloc du détail : un élément ajouté, modifié ou supprimé, ou la fiche entière. */
export interface BlocDetail {
  titre: string;
  champs: ChampDetail[];
}

function estListe(valeur: unknown): valeur is Element[] {
  return (
    Array.isArray(valeur) &&
    valeur.every((x) => typeof x === 'object' && x !== null && typeof (x as { id?: unknown }).id === 'string')
  );
}

const texte = (valeur: unknown): string => (typeof valeur === 'string' ? valeur : '');

const pluriel = (n: number, singulier: string, pluriels: string): string => `${n} ${n > 1 ? pluriels : singulier}`;

/** Vrai pour une zone du cheptel (« troupeau:v1:data:cheptel:2026 »), qui a son vocabulaire d'animaux. */
const estZoneCheptel = (zone: string): boolean => /(^|:)cheptel(:|$)/.test(zone);

/** Le nom lisible d'une zone : « troupeau:v1:data:cheptel:2026 » devient « Cheptel 2026 ». */
export function libelleZone(zone: string): string {
  const reste = zone.startsWith('troupeau:v1:data:') ? zone.slice('troupeau:v1:data:'.length) : zone;
  const [nom, annee] = reste.split(':');
  if (nom === 'cheptel') return annee ? `Cheptel ${annee}` : 'Cheptel';
  return reste.split(':').join(' · ');
}

/** Le nom d'un champ en français : son libellé s'il est connu, sinon son nom découpé (« prixVente » devient « Prix vente »). */
export function libelleChamp(cle: string): string {
  if (LIBELLE_CHAMP[cle]) return LIBELLE_CHAMP[cle];
  const decoupe = cle.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return decoupe.charAt(0).toUpperCase() + decoupe.slice(1);
}

/** Un champ qui n'est qu'une référence technique (un identifiant interne) : il ne se montre pas. */
const estReferenceTechnique = (cle: string): boolean => cle === 'id' || /Id$/.test(cle);

/**
 * La valeur d'un champ, en français : dates en jj/mm/aaaa, oui ou non, sexe, statut et espèce traduits, nombres à la française. Rend undefined
 * pour une valeur qu'on ne montre pas (un objet sans nom lisible).
 */
export function valeurFrancaise(cle: string, valeur: unknown): string | undefined {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  if (typeof valeur === 'boolean') return valeur ? 'Oui' : 'Non';
  if (typeof valeur === 'number') return valeur.toLocaleString('fr-FR');
  if (typeof valeur === 'object') {
    const client = (valeur as { client?: unknown }).client;
    return typeof client === 'string' ? client : undefined;
  }
  const texteBrut = String(valeur);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texteBrut)) return texteBrut.split('-').reverse().join('/');
  if (cle === 'sexe') {
    const bas = texteBrut.toLowerCase();
    if (bas === 'f' || bas === 'femelle') return 'Femelle';
    if (bas === 'm' || bas === 'mâle' || bas === 'male') return 'Mâle';
  }
  if (cle === 'statut') return STATUT_LIBELLE[texteBrut] ?? texteBrut;
  if (cle === 'espece' && texteBrut === 'chevres') return 'Chèvres';
  return texteBrut;
}

/** Ce qui désigne un élément : son numéro de boucle, son nom, son libellé, ou à défaut son identifiant. */
function etiquette(element: Element): string {
  for (const cle of ['numeroBoucle', 'nom', 'libelle', 'titre']) {
    const valeur = texte(element[cle]);
    if (valeur) return valeur;
  }
  return element.id;
}

function libelleNaissances(naissances: Element[]): string {
  const libelle = pluriel(naissances.length, 'naissance', 'naissances');
  if (naissances.length !== 1) return libelle;
  const date = texte(naissances[0].dateNaissance);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${libelle} (le ${date.split('-').reverse().join('/')})` : libelle;
}

/** Les éléments ajoutés, modifiés et supprimés d'une liste, comparée à la liste actuelle (par identifiant). */
function comparer(anciens: Element[], nouveau: Element[]) {
  const parId = new Map(anciens.map((a) => [a.id, a] as const));
  const idsNouveaux = new Set(nouveau.map((a) => a.id));
  const ajoutes = nouveau.filter((a) => !parId.has(a.id));
  const supprimes = anciens.filter((a) => !idsNouveaux.has(a.id));
  const modifies = nouveau.flatMap((apres) => {
    const avant = parId.get(apres.id);
    return avant && JSON.stringify(avant) !== JSON.stringify(apres) ? [{ avant, apres }] : [];
  });
  return { ajoutes, supprimes, modifies };
}

/**
 * Les résumés d'une saisie. `actuel` est la fiche sur le serveur (null si elle n'existe pas), `nouveau` ce que la saisie veut écrire
 * (null si elle la supprime).
 */
export function resumerSaisie(zone: string, actuel: unknown, nouveau: unknown): string[] {
  if (nouveau === null || nouveau === undefined) return ['Fiche supprimée'];
  const anciens = actuel === null || actuel === undefined ? [] : actuel;
  if (!estListe(nouveau) || !estListe(anciens)) {
    return [actuel === null || actuel === undefined ? 'Nouvelle fiche' : 'Fiche modifiée'];
  }
  const { ajoutes, supprimes, modifies } = comparer(anciens, nouveau);

  if (!estZoneCheptel(zone)) {
    const lignes: string[] = [];
    if (ajoutes.length > 0) lignes.push(pluriel(ajoutes.length, 'élément ajouté', 'éléments ajoutés'));
    if (modifies.length > 0) lignes.push(pluriel(modifies.length, 'élément modifié', 'éléments modifiés'));
    if (supprimes.length > 0) lignes.push(pluriel(supprimes.length, 'élément supprimé', 'éléments supprimés'));
    return lignes.length > 0 ? lignes : ['Aucune modification'];
  }

  // Un animal vivant qui passe à un autre statut sort du troupeau ; sinon, sa fiche a seulement changé.
  const sorties = modifies.filter(
    ({ avant, apres }) => texte(avant.statut) === 'vivante' && texte(apres.statut) !== '' && texte(apres.statut) !== 'vivante',
  );
  const autres = modifies.filter((m) => !sorties.includes(m));

  // Un animal sans date d'entrée est né ici ; avec une date d'entrée, il a été acheté.
  const naissances = ajoutes.filter((a) => !texte(a.dateEntree));
  const entrees = ajoutes.filter((a) => texte(a.dateEntree) !== '');

  const lignes: string[] = [];
  if (naissances.length > 0) lignes.push(libelleNaissances(naissances));
  if (entrees.length > 0) lignes.push(pluriel(entrees.length, 'entrée (achat)', 'entrées (achats)'));

  const parStatut = new Map<string, number>();
  for (const { apres } of sorties) {
    const statut = STATUT_SORTIE[texte(apres.statut)] ?? texte(apres.statut);
    parStatut.set(statut, (parStatut.get(statut) ?? 0) + 1);
  }
  for (const [statut, n] of parStatut) lignes.push(`${pluriel(n, 'sortie', 'sorties')} (${statut})`);

  if (autres.length > 0) lignes.push(pluriel(autres.length, 'animal modifié', 'animaux modifiés'));
  if (supprimes.length > 0) lignes.push(pluriel(supprimes.length, 'animal supprimé', 'animaux supprimés'));

  return lignes.length > 0 ? lignes : ['Aucune modification'];
}

/** Les champs d'un élément à montrer (sans les références techniques), avec leur valeur en français. */
function champsDe(element: Record<string, unknown>): ChampDetail[] {
  return Object.entries(element)
    .filter(([cle]) => !estReferenceTechnique(cle))
    .flatMap(([cle, valeur]) => {
      const apres = valeurFrancaise(cle, valeur);
      return apres === undefined ? [] : [{ nom: libelleChamp(cle), apres }];
    });
}

/**
 * Toutes les informations de la saisie, bloc par bloc, en français : chaque élément ajouté (tous ses champs), modifié (les champs qui ont
 * changé, avant et après), supprimé ; ou, pour une fiche qui n'est pas une liste, ses champs.
 */
export function detaillerSaisie(actuel: unknown, nouveau: unknown): BlocDetail[] {
  if (nouveau === null || nouveau === undefined) return [{ titre: 'Fiche supprimée', champs: [] }];
  const anciens = actuel === null || actuel === undefined ? [] : actuel;
  if (!estListe(nouveau) || !estListe(anciens)) {
    const apres = nouveau as Record<string, unknown>;
    const avant = (actuel !== null && typeof actuel === 'object' ? actuel : {}) as Record<string, unknown>;
    const nouvelle = actuel === null || actuel === undefined;
    const cles = [...new Set([...Object.keys(avant), ...Object.keys(apres)])].filter((cle) => !estReferenceTechnique(cle));
    const champs = cles.flatMap((cle) => {
      if (JSON.stringify(avant[cle]) === JSON.stringify(apres[cle])) return [];
      const valeurApres = valeurFrancaise(cle, apres[cle]);
      if (valeurApres === undefined) return [];
      return [{ nom: libelleChamp(cle), avant: nouvelle ? undefined : (valeurFrancaise(cle, avant[cle]) ?? '—'), apres: valeurApres }];
    });
    return [{ titre: nouvelle ? 'Nouvelle fiche' : 'Fiche', champs }];
  }

  const { ajoutes, supprimes, modifies } = comparer(anciens, nouveau);
  const blocs: BlocDetail[] = [];
  for (const element of ajoutes) {
    blocs.push({ titre: `Ajouté : ${etiquette(element)}`, champs: champsDe(element) });
  }
  for (const { avant, apres } of modifies) {
    const cles = [...new Set([...Object.keys(avant), ...Object.keys(apres)])].filter((cle) => !estReferenceTechnique(cle));
    blocs.push({
      titre: `Modifié : ${etiquette(apres)}`,
      champs: cles.flatMap((cle) => {
        if (JSON.stringify(avant[cle]) === JSON.stringify(apres[cle])) return [];
        const valeurApres = valeurFrancaise(cle, apres[cle]);
        if (valeurApres === undefined) return [];
        return [{ nom: libelleChamp(cle), avant: valeurFrancaise(cle, avant[cle]) ?? '—', apres: valeurApres }];
      }),
    });
  }
  for (const element of supprimes) {
    blocs.push({
      titre: `Supprimé : ${etiquette(element)}`,
      champs: champsDe(element).map((champ) => ({ nom: champ.nom, avant: champ.apres })),
    });
  }
  return blocs;
}
