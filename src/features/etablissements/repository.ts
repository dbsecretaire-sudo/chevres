import AsyncStorage from '@react-native-async-storage/async-storage';
import { ecrireDonnee, lireValeurLocale } from '@/shared/storage/depot';
import { chargerEspeces } from '@/features/especes/repository';
import { toutesLesEspeces } from '@/features/especes/services/registre';
import {
  definirEspeceCourante,
  definirEspecesActives,
  especeCourante,
  type EspeceAnimale,
} from '@/shared/dictionnaire/animaux';
import {
  CLE_STOCKAGE,
  ID_ETABLISSEMENT_DEFAUT,
  PREFIXE_STOCKAGE,
  SEGMENT_ETABLISSEMENT,
  SEPARATEUR_CLE,
} from '@/shared/constants/stockage';
import { TEXTES } from '@/shared/textes';
import {
  cleStockage,
  cleStockagePour,
  definirEtablissementActif,
  getIdEtablissementActif,
  prefixeDeStockage,
} from '@/shared/storage/etablissementActif';
import {
  creerExploitationServeur,
  listerExploitationsServeur,
  lireRoleCompte,
  modifierExploitationServeur,
  supprimerExploitationServeur,
} from '@/features/etablissements/services/exploitationsServeur';

export type TypeAnimalEtablissement = string;

/** Ce que l'utilisateur renseigne pour un établissement (hors identifiant). */
export interface DonneesEtablissement {
  nom: string;
  /** Espèces élevées (choix multiple). */
  animaux?: TypeAnimalEtablissement[];
}

export interface Etablissement extends DonneesEtablissement {
  id: string;
}

const KEY_LISTE = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.ETABLISSEMENTS}`;
const KEY_ACTIF = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.ETABLISSEMENT_ACTIF}`;

const NOM_DEFAUT = TEXTES.etablissements.repository.monExploitation;

/** L'ancien identifiant de l'établissement par défaut : il est devenu celui de l'exploitation « exploitation » (ses données ne bougent pas). */
const ANCIEN_ID_DEFAUT = 'defaut';

const normaliserId = (id: string | null | undefined): string | undefined =>
  id === ANCIEN_ID_DEFAUT ? ID_ETABLISSEMENT_DEFAUT : (id ?? undefined);

// L'établissement actif et les clés de stockage sont dans la base du stockage (shared) ; ils restent exportés d'ici pour les fonctionnalités.
export { cleStockage, cleStockagePour, getIdEtablissementActif };

/** Les établissements autres que l'établissement actif. */
export async function listAutresEtablissements(): Promise<Etablissement[]> {
  return (await listEtablissements()).filter((e) => e.id !== getIdEtablissementActif());
}

/**
 * La liste des établissements, telle qu'elle est copiée localement (elle vient du serveur : voir rafraichirEtablissements).
 * Sans copie, l'appareil n'a que l'établissement par défaut, sans nom du serveur.
 */
export async function listEtablissements(): Promise<Etablissement[]> {
  const raw = await AsyncStorage.getItem(KEY_LISTE);
  if (raw) {
    try {
      const liste = JSON.parse(raw) as Etablissement[];
      if (Array.isArray(liste) && liste.length > 0) {
        return liste.map((e) => ({ id: normaliserId(e.id) ?? ID_ETABLISSEMENT_DEFAUT, nom: e.nom, animaux: e.animaux }));
      }
    } catch {
      // copie corrompue : on repart sur l'établissement par défaut
    }
  }
  return [{ id: ID_ETABLISSEMENT_DEFAUT, nom: NOM_DEFAUT }];
}

/** Écrit la copie locale de la liste. Elle ne passe pas par la file d'envoi : elle reflète le serveur, elle ne le modifie pas. */
async function ecrireCopieLocale(liste: Etablissement[]): Promise<void> {
  await AsyncStorage.setItem(KEY_LISTE, JSON.stringify(liste));
}

/**
 * Recopie la liste des établissements depuis le serveur. Sans connexion ou sans réseau, la copie reste telle quelle :
 * l'application fonctionne avec la dernière liste reçue.
 */
export async function rafraichirEtablissements(): Promise<void> {
  try {
    const recus = await listerExploitationsServeur();
    if (!recus || recus.length === 0) return;
    // Un établissement encore sans espèces sur le serveur garde celles de la copie locale : une recopie ne doit pas les effacer.
    const locale = await listEtablissements();
    await ecrireCopieLocale(
      recus.map((e) => ({
        ...e,
        animaux: e.animaux && e.animaux.length > 0 ? e.animaux : (locale.find((l) => l.id === e.id)?.animaux ?? []),
      })),
    );
  } catch {
    // pas de réseau : on garde la copie
  }
}

/** Choix mémorisé de l'espèce courante de l'établissement actif (undefined s'il n'y en a pas). */
async function lireEspeceMemorisee(): Promise<EspeceAnimale | undefined> {
  return ((await lireValeurLocale(cleStockage(CLE_STOCKAGE.ESPECE_COURANTE))) as EspeceAnimale | undefined) ?? undefined;
}

/**
 * Relit les espèces de l'établissement actif et le choix mémorisé : à appeler après une synchronisation, car la liste des espèces
 * arrive du serveur (sur un appareil neuf, elle n'est pas là au démarrage).
 */
export async function reappliquerEspeces(): Promise<void> {
  const actif = (await listEtablissements()).find((e) => e.id === getIdEtablissementActif());
  definirEspecesActives(actif?.animaux, await lireEspeceMemorisee());
}

/** Fixe l'espèce courante (et la mémorise, sur le compte de la ferme) : les écrans du cheptel travaillent ensuite sur cette espèce. */
export async function choisirEspeceCourante(espece: EspeceAnimale): Promise<void> {
  definirEspeceCourante(espece);
  await ecrireDonnee(cleStockage(CLE_STOCKAGE.ESPECE_COURANTE), especeCourante());
}

/**
 * À appeler une fois au démarrage : recopie la liste du serveur, puis fixe l'établissement actif avant toute lecture de données.
 * Un modérateur ou un utilisateur n'a qu'une exploitation : c'est la première de la liste, sans choix mémorisé.
 */
export async function initialiserEtablissements(): Promise<{ liste: Etablissement[]; actifId: string }> {
  // Les espèces ajoutées ou modifiées par l'utilisateur d'abord : tout ce qui suit lit leurs noms et leurs âges.
  await chargerEspeces();
  await rafraichirEtablissements();
  const liste = await listEtablissements();
  const role = await lireRoleCompte();
  const sauvegarde = normaliserId(await AsyncStorage.getItem(KEY_ACTIF));
  const choisi = role === 'moderateur' || role === 'utilisateur' ? undefined : sauvegarde;
  definirEtablissementActif(liste.some((e) => e.id === choisi) ? (choisi as string) : liste[0].id);
  const actif = liste.find((e) => e.id === getIdEtablissementActif());
  definirEspecesActives(actif?.animaux, await lireEspeceMemorisee());
  return { liste, actifId: getIdEtablissementActif() };
}

export async function choisirEtablissementActif(id: string): Promise<void> {
  const liste = await listEtablissements();
  const cible = liste.find((e) => e.id === id);
  if (!cible) return;
  definirEtablissementActif(id);
  await AsyncStorage.setItem(KEY_ACTIF, id);
  definirEspecesActives(cible.animaux, await lireEspeceMemorisee());
}

/** Les espèces élevées par un établissement, sans son nom : ce qui voyage avec ses données. */
export type ProfilEtablissement = Pick<DonneesEtablissement, 'animaux'>;

/** Vrai si aucune espèce n'est renseignée. */
export const profilEstVide = (profil: ProfilEtablissement): boolean => (profil.animaux?.length ?? 0) === 0;

export async function profilEtablissementActif(): Promise<ProfilEtablissement> {
  const actif = (await listEtablissements()).find((e) => e.id === getIdEtablissementActif());
  return { animaux: actif?.animaux ?? [] };
}

/**
 * Applique à l'établissement actif les espèces lues dans une sauvegarde (son nom ne change pas) ; les valeurs inconnues sont ignorées.
 * Un profil vide n'écrase rien. La mise à jour est locale : les espèces du serveur la remplaceront à la prochaine recopie.
 */
export async function appliquerProfilEtablissementActif(profil: ProfilEtablissement): Promise<void> {
  const liste = await listEtablissements();
  const actif = liste.find((e) => e.id === getIdEtablissementActif());
  if (!actif || !profil || typeof profil !== 'object' || profilEstVide(profil)) return;
  const garder = <T extends string>(valeurs: unknown, permises: readonly T[]): T[] =>
    Array.isArray(valeurs) ? valeurs.filter((v): v is T => permises.includes(v)) : [];
  const animaux = garder(profil.animaux, toutesLesEspeces());
  await ecrireCopieLocale(liste.map((e) => (e.id === actif.id ? { ...e, animaux } : e)));
  definirEspecesActives(animaux, especeCourante());
}

/** Crée un établissement sur le serveur (administrateur seul), puis recopie la liste. */
export async function creerEtablissement(donnees: DonneesEtablissement): Promise<Etablissement> {
  const id = await creerExploitationServeur(donnees);
  await rafraichirEtablissements();
  return { id, nom: donnees.nom.trim(), animaux: donnees.animaux };
}

/** Modifie le nom et les espèces d'un établissement sur le serveur (administrateur seul), puis recopie la liste. */
export async function modifierEtablissement(id: string, donnees: DonneesEtablissement): Promise<void> {
  await modifierExploitationServeur(id, donnees);
  await rafraichirEtablissements();
  if (id === getIdEtablissementActif()) definirEspecesActives(donnees.animaux, especeCourante());
}

/**
 * Supprime l'établissement sur le serveur, puis ses données locales. Le serveur refuse s'il contient encore des données ou des comptes.
 * Il en faut toujours au moins un : rien n'est supprimé s'il est le dernier. Si c'est l'établissement actif, un autre devient actif.
 */
export async function supprimerEtablissement(id: string): Promise<{ supprime: boolean; actifId: string }> {
  const liste = await listEtablissements();
  if (liste.length <= 1 || !liste.some((e) => e.id === id)) return { supprime: false, actifId: getIdEtablissementActif() };

  await supprimerExploitationServeur(id);
  const restants = liste.filter((e) => e.id !== id);
  if (id === getIdEtablissementActif()) await choisirEtablissementActif(restants[0].id);

  // L'établissement par défaut a pour préfixe celui de toute l'application : on ne touche ni aux autres
  // établissements, ni à la liste, ni au choix de l'établissement actif.
  const prefixe = prefixeDeStockage(id);
  const prefixeAutres = `${PREFIXE_STOCKAGE}${SEGMENT_ETABLISSEMENT}${SEPARATEUR_CLE}`;
  const cles = (await AsyncStorage.getAllKeys()).filter(
    (k) =>
      k.startsWith(prefixe) &&
      (id !== ID_ETABLISSEMENT_DEFAUT ||
        (!k.startsWith(prefixeAutres) && k !== KEY_LISTE && k !== KEY_ACTIF)),
  );
  if (cles.length > 0) await AsyncStorage.multiRemove(cles);
  await ecrireCopieLocale(restants);
  return { supprime: true, actifId: getIdEtablissementActif() };
}
