import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { chargerEspeces } from '@/features/especes/repository';
import { toutesLesEspeces } from '@/features/especes/services/registre';
import { definirModeEntreprise } from '@/shared/dictionnaire/entreprise';
import { estEntreprise } from '@/features/etablissements/utils/typesEtablissement';
import type { ValeurDe } from '@/shared/constants/valeurDe';
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

export type TypeAnimalEtablissement = string;
export type ActiviteSociete = ValeurDe<typeof ACTIVITE_SOCIETE>;

/** Ce que l'utilisateur renseigne pour un établissement (hors identifiant). */
export interface DonneesEtablissement {
  nom: string;
  /** Espèces élevées (choix multiple) — absent pour les établissements créés avant l'ajout du type. */
  animaux?: TypeAnimalEtablissement[];
  /** Activités de la société (choix multiple). */
  activites?: ActiviteSociete[];
}

export interface Etablissement extends DonneesEtablissement {
  id: string;
}

const KEY_LISTE = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.ETABLISSEMENTS}`;
const KEY_ACTIF = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.ETABLISSEMENT_ACTIF}`;

const NOM_DEFAUT = TEXTES.etablissements.repository.monExploitation;

let idActif = ID_ETABLISSEMENT_DEFAUT;

function prefixePour(id: string): string {
  return id === ID_ETABLISSEMENT_DEFAUT
    ? PREFIXE_STOCKAGE
    : `${PREFIXE_STOCKAGE}${SEGMENT_ETABLISSEMENT}${SEPARATEUR_CLE}${id}${SEPARATEUR_CLE}`;
}

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

/** Les établissements autres que l'établissement actif. */
export async function listAutresEtablissements(): Promise<Etablissement[]> {
  return (await listEtablissements()).filter((e) => e.id !== idActif);
}

export async function listEtablissements(): Promise<Etablissement[]> {
  const raw = await AsyncStorage.getItem(KEY_LISTE);
  if (raw) {
    try {
      const liste = JSON.parse(raw) as Etablissement[];
      // Les types disparus (ex. « Vente », retiré) sont ignorés pour les établissements déjà enregistrés.
      const connues: string[] = Object.values(ACTIVITE_SOCIETE);
      if (Array.isArray(liste) && liste.length > 0) {
        return liste.map((e) => ({ ...e, activites: e.activites?.filter((a) => connues.includes(a)) }));
      }
    } catch {
      // liste corrompue : on repart sur l'établissement par défaut
    }
  }
  const initiale = [{ id: ID_ETABLISSEMENT_DEFAUT, nom: NOM_DEFAUT }];
  await AsyncStorage.setItem(KEY_LISTE, JSON.stringify(initiale));
  return initiale;
}

async function ecrireListe(liste: Etablissement[]): Promise<void> {
  await AsyncStorage.setItem(KEY_LISTE, JSON.stringify(liste));
}

/** Choix mémorisé de l'espèce courante de l'établissement actif (undefined s'il n'y en a pas). */
async function lireEspeceMemorisee(): Promise<EspeceAnimale | undefined> {
  const raw = await AsyncStorage.getItem(cleStockage(CLE_STOCKAGE.ESPECE_COURANTE));
  return (raw as EspeceAnimale | null) ?? undefined;
}

/** Fixe l'espèce courante (et la mémorise) : les écrans du cheptel travaillent ensuite sur cette espèce. */
export async function choisirEspeceCourante(espece: EspeceAnimale): Promise<void> {
  definirEspeceCourante(espece);
  await AsyncStorage.setItem(cleStockage(CLE_STOCKAGE.ESPECE_COURANTE), especeCourante());
}

/** À appeler une fois au démarrage : fixe l'établissement actif avant toute lecture de données. */
export async function initialiserEtablissements(): Promise<{ liste: Etablissement[]; actifId: string }> {
  // Les espèces ajoutées ou modifiées par l'utilisateur d'abord : tout ce qui suit lit leurs noms et leurs âges.
  await chargerEspeces();
  const liste = await listEtablissements();
  const sauvegarde = await AsyncStorage.getItem(KEY_ACTIF);
  idActif = liste.some((e) => e.id === sauvegarde) ? (sauvegarde as string) : liste[0].id;
  const actif = liste.find((e) => e.id === idActif);
  definirEspecesActives(actif?.animaux, await lireEspeceMemorisee());
  definirModeEntreprise(!!actif && estEntreprise(actif), actif?.activites);
  return { liste, actifId: idActif };
}

export async function choisirEtablissementActif(id: string): Promise<void> {
  const liste = await listEtablissements();
  const cible = liste.find((e) => e.id === id);
  if (!cible) return;
  idActif = id;
  await AsyncStorage.setItem(KEY_ACTIF, id);
  definirEspecesActives(cible.animaux, await lireEspeceMemorisee());
  definirModeEntreprise(estEntreprise(cible), cible.activites);
}

/** Les types d'un établissement (espèces élevées, activités), sans son nom : ce qui voyage avec ses données. */
export type ProfilEtablissement = Pick<DonneesEtablissement, 'animaux' | 'activites'>;

/** Vrai si aucune espèce ni activité n'est renseignée. */
export const profilEstVide = (profil: ProfilEtablissement): boolean =>
  (profil.animaux?.length ?? 0) === 0 && (profil.activites?.length ?? 0) === 0;

export async function profilEtablissementActif(): Promise<ProfilEtablissement> {
  const actif = (await listEtablissements()).find((e) => e.id === idActif);
  return { animaux: actif?.animaux ?? [], activites: actif?.activites ?? [] };
}

/**
 * Applique à l'établissement actif les types lus dans une sauvegarde ou sur Drive (son nom ne change pas) ;
 * les valeurs inconnues sont ignorées. Un profil vide n'écrase rien : un appareil sans types renseignés ne doit pas
 * effacer ceux d'un autre.
 */
export async function appliquerProfilEtablissementActif(profil: ProfilEtablissement): Promise<void> {
  const actif = (await listEtablissements()).find((e) => e.id === idActif);
  if (!actif || !profil || typeof profil !== 'object' || profilEstVide(profil)) return;
  const garder = <T extends string>(valeurs: unknown, permises: readonly T[]): T[] =>
    Array.isArray(valeurs) ? valeurs.filter((v): v is T => permises.includes(v)) : [];
  await modifierEtablissement(actif.id, {
    nom: actif.nom,
    animaux: garder(profil.animaux, toutesLesEspeces()),
    activites: garder(profil.activites, Object.values(ACTIVITE_SOCIETE)),
  });
}

export async function creerEtablissement(donnees: DonneesEtablissement): Promise<Etablissement> {
  const liste = await listEtablissements();
  const nouveau = { ...donnees, id: generateId(), nom: donnees.nom.trim() };
  await ecrireListe([...liste, nouveau]);
  return nouveau;
}

export async function modifierEtablissement(id: string, donnees: DonneesEtablissement): Promise<void> {
  const liste = await listEtablissements();
  await ecrireListe(liste.map((e) => (e.id === id ? { ...e, ...donnees, nom: donnees.nom.trim() } : e)));
  if (id === idActif) {
    definirEspecesActives(donnees.animaux, especeCourante());
    definirModeEntreprise(estEntreprise(donnees), donnees.activites);
  }
}

/**
 * Supprime l'établissement et toutes ses données locales. Il en faut toujours au moins un : rien n'est supprimé
 * s'il est le dernier. Si c'est l'établissement actif, un autre devient actif. Renvoie l'établissement actif ensuite.
 */
export async function supprimerEtablissement(id: string): Promise<{ supprime: boolean; actifId: string }> {
  const liste = await listEtablissements();
  if (liste.length <= 1 || !liste.some((e) => e.id === id)) return { supprime: false, actifId: idActif };

  const restants = liste.filter((e) => e.id !== id);
  if (id === idActif) await choisirEtablissementActif(restants[0].id);

  // L'établissement historique a pour préfixe celui de toute l'application : on ne touche ni aux autres
  // établissements, ni à la liste, ni au choix de l'établissement actif.
  const prefixe = prefixePour(id);
  const prefixeAutres = `${PREFIXE_STOCKAGE}${SEGMENT_ETABLISSEMENT}${SEPARATEUR_CLE}`;
  const cles = (await AsyncStorage.getAllKeys()).filter(
    (k) =>
      k.startsWith(prefixe) &&
      (id !== ID_ETABLISSEMENT_DEFAUT ||
        (!k.startsWith(prefixeAutres) && k !== KEY_LISTE && k !== KEY_ACTIF)),
  );
  if (cles.length > 0) await AsyncStorage.multiRemove(cles);
  await ecrireListe(restants);
  return { supprime: true, actifId: idActif };
}
