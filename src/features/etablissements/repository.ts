import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { ACTIVITE_SOCIETE, TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import {
  CLE_STOCKAGE,
  ID_ETABLISSEMENT_DEFAUT,
  PREFIXE_STOCKAGE,
  SEGMENT_ETABLISSEMENT,
  SEPARATEUR_CLE,
} from '@/shared/constants/stockage';
import { TEXTES } from '@/shared/textes';

export type TypeAnimalEtablissement = ValeurDe<typeof TYPE_ANIMAL_ETABLISSEMENT>;
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

/** Clé AsyncStorage d'une donnée propre à l'établissement actif. */
export function cleStockage(suffixe: string): string {
  return `${prefixePour(idActif)}${suffixe}`;
}

export function getIdEtablissementActif(): string {
  return idActif;
}

export async function listEtablissements(): Promise<Etablissement[]> {
  const raw = await AsyncStorage.getItem(KEY_LISTE);
  if (raw) {
    try {
      const liste = JSON.parse(raw) as Etablissement[];
      if (Array.isArray(liste) && liste.length > 0) return liste;
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

/** À appeler une fois au démarrage : fixe l'établissement actif avant toute lecture de données. */
export async function initialiserEtablissements(): Promise<{ liste: Etablissement[]; actifId: string }> {
  const liste = await listEtablissements();
  const sauvegarde = await AsyncStorage.getItem(KEY_ACTIF);
  idActif = liste.some((e) => e.id === sauvegarde) ? (sauvegarde as string) : liste[0].id;
  return { liste, actifId: idActif };
}

export async function choisirEtablissementActif(id: string): Promise<void> {
  const liste = await listEtablissements();
  if (!liste.some((e) => e.id === id)) return;
  idActif = id;
  await AsyncStorage.setItem(KEY_ACTIF, id);
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
}

/** Supprime l'établissement et toutes ses données locales. L'établissement par défaut ne peut pas être supprimé. */
export async function supprimerEtablissement(id: string): Promise<void> {
  if (id === ID_ETABLISSEMENT_DEFAUT || id === idActif) return;
  const liste = await listEtablissements();
  await ecrireListe(liste.filter((e) => e.id !== id));
  const prefixe = prefixePour(id);
  const cles = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefixe));
  if (cles.length > 0) await AsyncStorage.multiRemove(cles);
}
