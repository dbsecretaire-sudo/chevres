import type { MouvementStock } from '@/features/stock/types';
import { ROUTES } from '@/shared/constants/routes';

// Ce que l'accueil « ferme » montre : les minuteurs (les échéances qui approchent), les papiers à jour, les jours d'aliment restants.
// Des calculs purs, sans écran : ils se testent à part.

/** L'icône d'un minuteur (l'écran choisit le dessin). */
export type IconeMinuteur = 'lait' | 'viande' | 'declaration' | 'bilan' | 'circulation' | 'facturer' | 'rappel';

/** Une échéance ou un reste à faire, en pastille ronde sur le côté de l'accueil. */
export interface Minuteur {
  id: string;
  icone: IconeMinuteur;
  /** Son nom court (« RSA », « Délai lait »). */
  libelle: string;
  /** Son nom complet (« Déclaration RSA · 2e trimestre 2026 »), quand le nom court ne suffit pas à le distinguer. */
  titre?: string;
  /** Ce que dit la pastille : « 3 j », « Retard », « 12 ». */
  valeur: string;
  /** Vrai : en retard, ou à faire sans attendre (la pastille est rouge). */
  urgent: boolean;
  /** Les jours qui restent (négatifs : en retard) ; rien pour un simple nombre de choses à faire. */
  jours?: number;
  route: string;
}

/** Le bilan sanitaire annuel (voir etatDuBilan). */
export interface BilanDeLAccueil {
  etat: 'aucun' | 'bientot' | 'expire' | 'valide';
  echeance?: string;
  jours?: number;
}

export interface DeclarationAFaire {
  id: string;
  /** « RSA », ou le nom d'une échéance. */
  libelle: string;
  /** Son nom complet (« Déclaration RSA · 2e trimestre 2026 »). */
  titre?: string;
  echeance: string;
  enRetard: boolean;
  route: string;
}

export interface EntreeMinuteurs {
  aujourdhui: string;
  /** La fin du délai d'attente du lait et de la viande (la plus tardive des animaux traités). */
  finLait?: string;
  finViande?: string;
  /** Le bilan sanitaire à suivre (rien pour une espèce qui n'en a pas). */
  bilan?: BilanDeLAccueil;
  declarations: readonly DeclarationAFaire[];
  /** Des documents de circulation à envoyer à la chambre d'agriculture (le nombre). */
  documentsAEnvoyer: number;
  /** Des lots de viande abattus, à facturer à un client (le nombre de jours d'abattage). */
  lotsAFacturer: number;
  /** Des lots de fromage ou de charcuterie vendus à rappeler (le nombre). */
  lotsARappeler: number;
}

/** Le nombre de jours de `aujourdhui` à `date` (négatif : la date est passée). */
export function joursJusqua(aujourdhui: string, date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${aujourdhui}T00:00:00Z`)) / 86_400_000);
}

/** Ce que dit une pastille pour un nombre de jours : « 3 j », « Auj. », « Retard ». */
export const dureeCourte = (jours: number): string => (jours < 0 ? 'Retard' : jours === 0 ? 'Auj.' : `${jours} j`);

/** Le rang d'un minuteur : ceux en retard d'abord, puis ce qui est à faire tout de suite, puis par jours restants ; un simple nombre à faire passe après les échéances proches. */
const rang = (m: Minuteur): number =>
  m.jours === undefined ? (m.urgent ? -500 : 7) : m.jours < 0 ? -1000 + m.jours : m.jours;

/**
 * Les minuteurs de l'accueil, du plus pressé au moins pressé : les délais d'attente qui se terminent, les déclarations à faire, le bilan
 * sanitaire, puis ce qui est à faire sans date (documents à envoyer, lots à facturer, lots à rappeler).
 */
export function construireMinuteurs(e: EntreeMinuteurs): Minuteur[] {
  const liste: Minuteur[] = [];
  const parDate = (id: string, icone: IconeMinuteur, libelle: string, date: string, route: string, urgentSiRetard = true, titre?: string) => {
    const jours = joursJusqua(e.aujourdhui, date);
    liste.push({ id, icone, libelle, titre, valeur: dureeCourte(jours), urgent: urgentSiRetard && jours < 0, jours, route });
  };
  // Un délai d'attente qui se termine : il n'est « en retard » nulle part, il dit seulement combien de jours restent.
  if (e.finLait && e.finLait >= e.aujourdhui) parDate('delai-lait', 'lait', 'Délai lait', e.finLait, ROUTES.CHEPTEL_TRAITEMENTS, false);
  if (e.finViande && e.finViande >= e.aujourdhui) parDate('delai-viande', 'viande', 'Délai viande', e.finViande, ROUTES.CHEPTEL_TRAITEMENTS, false);
  for (const d of e.declarations) parDate(`declaration:${d.id}`, 'declaration', d.libelle, d.echeance, d.route, true, d.titre);
  if (e.bilan && e.bilan.etat !== 'valide') {
    if (e.bilan.etat === 'aucun') {
      liste.push({ id: 'bilan', icone: 'bilan', libelle: 'Bilan sanitaire', valeur: 'À faire', urgent: true, route: ROUTES.CHEPTEL_TRAITEMENTS });
    } else if (e.bilan.echeance) {
      parDate('bilan', 'bilan', 'Bilan sanitaire', e.bilan.echeance, ROUTES.CHEPTEL_TRAITEMENTS);
    }
  }
  const nombre = (id: string, icone: IconeMinuteur, libelle: string, n: number, route: string) => {
    if (n > 0) liste.push({ id, icone, libelle, valeur: String(n), urgent: false, route });
  };
  nombre('circulation', 'circulation', 'Documents à envoyer', e.documentsAEnvoyer, ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION);
  nombre('facturer', 'facturer', 'Lots à facturer', e.lotsAFacturer, `${ROUTES.PRODUCTION_VIANDE}?onglet=afacturer`);
  nombre('rappeler', 'rappel', 'Lots à rappeler', e.lotsARappeler, ROUTES.PRODUCTION_RAPPELS_LOTS);
  return liste.sort((a, b) => rang(a) - rang(b));
}

/** La prochaine échéance (celle qui a une date), pour la ligne sous la barre : « RSA dans 12 j », « Bilan sanitaire en retard ». */
export function prochaineEcheance(minuteurs: readonly Minuteur[]): { texte: string; route: string } | undefined {
  const m = minuteurs.find((x) => x.jours !== undefined);
  if (!m || m.jours === undefined) return undefined;
  const quand = m.jours < 0 ? 'en retard' : m.jours === 0 ? 'aujourd’hui' : `dans ${m.jours} j`;
  return { texte: `${m.libelle} ${quand}`, route: m.route };
}

/**
 * Les papiers de l'année : ce qui est fait (déclarations validées, documents de circulation envoyés, bilan sanitaire à jour) sur ce qui est
 * à faire. `valides` : les rappels déjà validés ; `restants` : ceux qu'il reste à valider (leurs identifiants portent leur date).
 */
export function progressionPapiers(entree: {
  annee: number;
  valides: readonly string[];
  restants: readonly string[];
  bilan?: BilanDeLAccueil;
}): { faits: number; total: number } {
  const deLAnnee = (id: string) => id.includes(`:${entree.annee}-`);
  const bilanAFaire = !!entree.bilan && entree.bilan.etat !== 'valide';
  const bilanFait = !!entree.bilan && entree.bilan.etat === 'valide';
  const faits = entree.valides.filter(deLAnnee).length + (bilanFait ? 1 : 0);
  const restants = entree.restants.filter(deLAnnee).length + (bilanAFaire ? 1 : 0);
  return { faits, total: faits + restants };
}

/**
 * Le stock d'aliments et, quand l'historique le permet, les jours qu'il tient : le stock en kg divisé par ce qui s'est consommé chaque jour
 * ces 90 derniers jours (les mouvements négatifs). Sans consommation notée, seul le stock est connu.
 */
export function autonomieAliments(
  mouvements: readonly MouvementStock[],
  articles: ReadonlySet<string>,
  aujourdhui: string,
): { kg: number; jours?: number } {
  const dEntre = mouvements.filter((m) => articles.has(m.article));
  const kg = dEntre.reduce((t, m) => t + m.delta, 0);
  const debut = Date.parse(`${aujourdhui}T00:00:00Z`) - 90 * 86_400_000;
  const recents = dEntre.filter((m) => Date.parse(`${m.date}T00:00:00Z`) >= debut);
  const consomme = -recents.filter((m) => m.delta < 0).reduce((t, m) => t + m.delta, 0);
  const premier = recents.length > 0 ? Math.min(...recents.map((m) => Date.parse(`${m.date}T00:00:00Z`))) : undefined;
  const etendue = premier === undefined ? 0 : Math.max(1, Math.round((Date.parse(`${aujourdhui}T00:00:00Z`) - premier) / 86_400_000));
  // Moins d'une semaine d'historique : la moyenne ne veut rien dire.
  if (consomme <= 0 || etendue < 7 || kg <= 0) return { kg: Math.round(kg * 10) / 10 };
  return { kg: Math.round(kg * 10) / 10, jours: Math.floor(kg / (consomme / etendue)) };
}

/**
 * Vrai quand le troupeau est à l'estive à cette date : de la montée à la descente incluses (sans date de descente, il y reste). Sans date
 * de montée, rien n'est décidé : il est à la ferme.
 */
export function enTranshumance(estive: { dateMontee?: string; dateDescente?: string } | undefined, aujourdhui: string): boolean {
  if (!estive?.dateMontee || aujourdhui < estive.dateMontee) return false;
  return !estive.dateDescente || aujourdhui <= estive.dateDescente;
}

/**
 * Les boucles posées sur les animaux vivants, d'après leurs fiches : les boucles d'un côté, les tiptag (numéros de l'inventaire) de l'autre.
 * Un animal sans numéro n'en compte pas ; une boucle d'un animal mort ne compte pas non plus (seuls les vivants sont donnés).
 */
export function compterBouclesPosees(
  vivants: readonly { numeroBoucle?: string }[],
  numerosTiptag: ReadonlySet<string>,
): { boucles: number; tiptag: number } {
  let tiptag = 0;
  let boucles = 0;
  for (const a of vivants) {
    const numero = a.numeroBoucle?.trim();
    if (!numero) continue;
    if (numerosTiptag.has(numero)) tiptag += 1;
    else boucles += 1;
  }
  return { boucles, tiptag };
}

/** Les animaux morts dans l'année de `aujourdhui` (les mort-nés n'en font pas partie) : ceux que l'équarrisseur a pris ou prendra. */
export function compterMortsDeLAnnee(
  animaux: readonly { statut?: string; dateStatut?: string }[],
  aujourdhui: string,
  statutMort: string,
): number {
  const annee = aujourdhui.slice(0, 4);
  return animaux.filter((a) => a.statut === statutMort && a.dateStatut?.startsWith(annee)).length;
}
