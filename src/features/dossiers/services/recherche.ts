import type { Client } from '@/features/clients/types';
import type { Element, SousDossier } from '@/features/dossiers/types';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { dossiersDuSousArbre } from '@/features/dossiers/services/arborescence';
import { FILTRE_DOSSIERS, STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { LABEL_STATUT_ELEMENT } from '@/shared/textes/libelles';
import { nomComplet } from '@/shared/utils/personne';
import type { ValeurDe } from '@/shared/constants/valeurDe';

export type FiltreDossiers = ValeurDe<typeof FILTRE_DOSSIERS>;

/** Minuscules et sans accents, pour qu'on retrouve « echéance » en tapant « echeance ». */
export const normaliser = (texte: string | undefined): string =>
  (texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Vrai si l'échéance est dépassée et que le contenu n'est pas terminé. */
export const estEnRetard = (element: Pick<Element, 'echeance' | 'statut'>, aujourdhui: string): boolean =>
  !!element.echeance && element.echeance < aujourdhui && element.statut !== STATUT_ELEMENT.TERMINE;

/** Un contenu respecte le filtre : tous, un avancement précis, ou « en retard ». */
export const correspondAuFiltre = (element: Element, filtre: FiltreDossiers, aujourdhui: string): boolean => {
  if (filtre === FILTRE_DOSSIERS.TOUT) return true;
  if (filtre === FILTRE_DOSSIERS.EN_RETARD) return estEnRetard(element, aujourdhui);
  return statutEffectif(element) === filtre;
};

/** Les contenus d'une année : ceux dont la date ou l'échéance y tombe ; tous quand « Tout » est choisi (`annee` absente). */
export const contenusDeLAnnee = (elements: Element[], annee?: number): Element[] =>
  annee === undefined
    ? elements
    : elements.filter((e) => e.date.startsWith(String(annee)) || !!e.echeance?.startsWith(String(annee)));

export interface Sources {
  clients: Client[];
  sousDossiers: SousDossier[];
  elements: Element[];
}

export interface ResultatRecherche {
  clients: Client[];
  sousDossiers: SousDossier[];
  elements: Element[];
}

/** Où chercher : partout (par défaut), dans le dossier d'un client, ou dans un dossier et ce qu'il contient. */
export interface PorteeRecherche {
  clientId?: string;
  dossierId?: string;
}

/** Ne garde des sources que ce qui se trouve dans la portée de la recherche. */
function restreindre(sources: Sources, portee: PorteeRecherche | undefined): Sources {
  if (portee?.dossierId) {
    const ids = dossiersDuSousArbre(sources.sousDossiers, portee.dossierId);
    return {
      clients: [],
      sousDossiers: sources.sousDossiers.filter((d) => ids.has(d.id) && d.id !== portee.dossierId),
      elements: sources.elements.filter((e) => ids.has(e.dossierId)),
    };
  }
  if (portee?.clientId) {
    return {
      clients: [],
      sousDossiers: sources.sousDossiers.filter((d) => d.clientId === portee.clientId),
      elements: sources.elements.filter((e) => e.clientId === portee.clientId),
    };
  }
  return sources;
}

/**
 * Cherche « n'importe quel terme » dans les clients (nom, téléphone, e-mail, adresse), les dossiers (nom) et les
 * contenus (titre, notes, étiquettes, avancement, nom du dossier et du client). Un filtre d'avancement ne garde que
 * des contenus. La recherche reste dans la portée donnée (le dossier où l'on se trouve). Renvoie undefined quand il
 * n'y a ni terme ni filtre : on affiche alors le contenu normal de l'écran.
 */
export function rechercherDossiers(
  sources: Sources,
  requete: string,
  filtre: FiltreDossiers,
  aujourdhui: string,
  portee?: PorteeRecherche,
): ResultatRecherche | undefined {
  const termes = normaliser(requete).split(/\s+/).filter(Boolean);
  if (termes.length === 0 && filtre === FILTRE_DOSSIERS.TOUT) return undefined;

  const { clients, sousDossiers, elements } = restreindre(sources, portee);
  const clientParId = new Map(sources.clients.map((c) => [c.id, c]));
  const dossierParId = new Map(sources.sousDossiers.map((d) => [d.id, d]));
  const nomClient = (id: string) => (clientParId.get(id) ? nomComplet(clientParId.get(id)!) : '');
  /** Tous les termes doivent se retrouver quelque part dans le texte. */
  const contientTout = (texte: string) => termes.every((t) => texte.includes(t));

  const elementsTrouves = elements.filter((e) => {
    if (!correspondAuFiltre(e, filtre, aujourdhui)) return false;
    if (termes.length === 0) return true;
    const texte = normaliser(
      [
        e.titre,
        e.texte,
        ...(e.etiquettes ?? []),
        statutEffectif(e) ? LABEL_STATUT_ELEMENT[statutEffectif(e)!] : '',
        dossierParId.get(e.dossierId)?.nom,
        nomClient(e.clientId),
      ].join(' '),
    );
    return contientTout(texte);
  });

  // Avec un filtre d'avancement, on ne cherche que des contenus.
  if (filtre !== FILTRE_DOSSIERS.TOUT) return { clients: [], sousDossiers: [], elements: elementsTrouves };

  return {
    clients: clients.filter((c) =>
      contientTout(normaliser([nomComplet(c), c.telephone, c.email, c.adressePostale].join(' '))),
    ),
    sousDossiers: sousDossiers.filter((d) => contientTout(normaliser(`${d.nom} ${nomClient(d.clientId)}`))),
    elements: elementsTrouves,
  };
}

/** Ce que contient le dossier de chaque client : nombre de contenus et nombre de contenus encore à faire. */
export function resumeParClient(elements: Element[]): Map<string, { total: number; aFaire: number }> {
  const resume = new Map<string, { total: number; aFaire: number }>();
  for (const e of elements) {
    const ligne = resume.get(e.clientId) ?? { total: 0, aFaire: 0 };
    ligne.total += 1;
    if (statutEffectif(e) === STATUT_ELEMENT.A_FAIRE) ligne.aFaire += 1;
    resume.set(e.clientId, ligne);
  }
  return resume;
}
